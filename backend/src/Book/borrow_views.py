from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Book , Author, Category, Borrow
from .serializers import  BorrowSerializer
from users.permissions import IsAdmin , IsAll, IsUser, IsLibrarian, is_librarian
from django.utils import timezone
from django.db import transaction
from django.db.models import F
from datetime import datetime, date, timedelta
from users.throttles import BorrowRateThrottle

from django.contrib.auth import get_user_model

User = get_user_model()

class BorrowBookAPIView(APIView):
    permission_classes = [IsAll]

    def get(self, request):
        filters = {}

        # Borrowers may only see their own records; the desk sees all of them.
        if not is_librarian(request.user):
            filters["user_id"] = request.user.id
        elif request.query_params.get("user"):
            filters["user_id"] = request.query_params.get("user")

        if request.query_params.get("status"):
            filters["status"] = request.query_params.get("status")
        if request.query_params.get("from_date"):
            filters["created_at__date__gte"] = request.query_params.get("from_date")
        if request.query_params.get("to_date"):
            filters["created_at__date__lte"] = request.query_params.get("to_date")
        if request.query_params.get("book"):
            filters["book_id"] = request.query_params.get("book")

        borrows = (Borrow.objects.filter(**filters)
                   .annotate(
                    book_name=F('book__title'),
                    author_name=F('book__author__name'),
                    category_name=F('book__category__name'),
                    user_name=F('user__username'),
                    submitted_by_name=F('submitted_by__username'),
                    verified_by_name=F('verified_by__username'),
                    created_date=F('created_at__date'),
                    updated_date=F('updated_at__date')
                ).values(
                    'id',
                    'book_id',
                    'book_name',
                    'author_name',
                    'category_name',
                    'user_id',
                    'user_name',
                    'status',
                    'is_active',
                    'borrow_date',
                    'due_date',
                    'return_date',
                    'created_date',
                    'submitted_by_id',
                    'submitted_by_name',
                    'verified_by_id',
                    'verified_by_name',
                    'created_at',
                    'updated_at'
                )
            )
        
        return Response({"status": status.HTTP_200_OK, "data": borrows})
    
    def post(self, request):
        book_id = request.data.get('book_id')
        if not book_id:
            return Response({"error": "book_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        borrowed_user = request.user
        # Desk staff and admins issue a book to whoever is standing at the counter.
        borrowing_on_behalf = is_librarian(request.user)

        with transaction.atomic():
            book = Book.objects.select_for_update().filter(id=book_id, is_active=True).first()
            if not book:
                return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

            if borrowing_on_behalf:
                user_id = request.data.get('user_id')
                if not user_id:
                    return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    borrowed_user = User.objects.get(id=user_id, is_active=True)
                except User.DoesNotExist:
                    return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
                
            
            # Pending requests already hold a copy, so they count towards the limit too.
            active_borrows = Borrow.objects.filter(
                user=borrowed_user,
                status__in=["pending", "accepted"],
                return_date__isnull=True
            ).count()
            if active_borrows >= 3:
                return Response({"error": "Borrowing limit reached (max 3 active borrows)"}, status=status.HTTP_400_BAD_REQUEST)

            if book.available_copies <= 0:
                return Response({"error": "No copies available"}, status=status.HTTP_400_BAD_REQUEST)
            
            borrow_data = {
                "user": borrowed_user,
                "book": book,
                "status": "pending",
                "borrow_date": date.today(),
                "due_date": date.today() + timedelta(days=14),
                "submitted_by": request.user,
                "is_active": False
            }

            if borrowing_on_behalf:
                borrow_data["status"] = "accepted"
                borrow_data["verified_by"] = request.user
                borrow_data["is_active"] = True

            # total_copies is the size of the inventory and never changes on borrow.
            book.available_copies -= 1
            book.save(update_fields=["available_copies", "updated_at"])
            borrow = Borrow.objects.create(**borrow_data)

        serializer = BorrowSerializer(borrow)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BorrowBookVerifyAPIView(APIView):
    # Approving a request is desk work, so staff do it as well as admins.
    permission_classes = [IsLibrarian]

    def put(self, request, pk):
        # Update fields for verification
        request_status = request.data.get('status')
        if request_status not in ["accepted", "rejected", "cancelled"]:
            return Response({"error": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            borrow = get_object_or_404(Borrow.objects.select_for_update(), pk=pk)

            # Only a request that is still waiting on an admin can be verified.
            if borrow.status != "pending":
                return Response({"error": f"Borrow already {borrow.status}."}, status=status.HTTP_400_BAD_REQUEST)

            borrow.status = request_status
            borrow.verified_by = request.user

            if request_status == "accepted":
                borrow.is_active = True
            else:
                # Rejected/cancelled: hand the reserved copy back to the shelf.
                borrow.is_active = False
                book = Book.objects.select_for_update().get(id=borrow.book_id)
                book.available_copies += 1
                book.save(update_fields=["available_copies", "updated_at"])

            borrow.save()

        return Response(
            {"status": status.HTTP_200_OK, "message": f"Borrow {borrow.status} successfully."}
        )


class ReturnBookView(APIView):
    permission_classes = [IsAll]

    # def post(self, request, pk):
    #     borrow = get_object_or_404(Borrow, pk=pk, user=request.user, returned=False)
    #     borrow.returned = True
    #     borrow.return_date = timezone.now()
    #     return_date = borrow.return_date
    #     due_date = borrow.due_date
    #     penalty_points = User.penalty_points(request.user)
    #     if return_date > due_date:
    #         borrow.status = "overdue"
    #         penalty_points = (return_date - due_date).days

    #     elif return_date < due_date:
    #         borrow.status = "pending"
    #     else:
    #         borrow.status = "returned"
    #     borrow.save()
    #     book = borrow.book
    #     book.available_copies += 1
    #     book.save()
        

        
    def post(self, request):
        borrow_id = request.data.get("borrow_id")
        if not borrow_id:
            return Response({"error": "borrow_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        lookup = {"id": borrow_id, "status": "accepted", "is_active": True, "return_date__isnull": True}
        # The desk can process a return on behalf of any borrower.
        if not is_librarian(request.user):
            lookup["user"] = request.user

        with transaction.atomic():
            # Lock the row so two concurrent returns can't both restore a copy.
            borrow_record = get_object_or_404(Borrow.objects.select_for_update(), **lookup)

            borrow_record.return_date = date.today()
            borrow_record.status = "returned"
            borrow_record.is_active = False

            # Atomically increment available_copies
            try:
                book = Book.objects.select_for_update().get(id=borrow_record.book_id, is_active=True)
            except Book.DoesNotExist:
                return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

            book.available_copies += 1
            book.save(update_fields=["available_copies", "updated_at"])

            # Late return penalty
            if borrow_record.due_date and borrow_record.return_date > borrow_record.due_date:
                days_late = (borrow_record.return_date - borrow_record.due_date).days
                borrow_record.user.penalty_points += days_late
                borrow_record.user.save()

            borrow_record.save()

        return Response({"message": "Book returned successfully"}, status=status.HTTP_200_OK)
        