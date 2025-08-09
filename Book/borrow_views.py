from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Book , Author, Category, Borrow
from .serializers import  BorrowSerializer
from users.permissions import IsAdmin , IsAll, IsUser
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

        if request.query_params.get("status"):
            filters["status"] = request.query_params.get("status")
        if request.query_params.get("from_date"):
            filters["created_at__date__gte"] = request.query_params.get("from_date")
        if request.query_params.get("to_date"):
            filters["created_at__date__lte"] = request.query_params.get("to_date")
        if request.query_params.get("user"):
            filters["user_id"] = request.query_params.get("user")
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
            return Response({"error": "book_id is required."}, status=status.HTTP_404_NOT_FOUND)

        borrowed_user = request.user

        with transaction.atomic():
            book = Book.objects.select_for_update().filter(id=book_id, is_active=True).first()
            if not book or book is None:
                return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

            if request.user.role == "admin":
                user_id = request.data.get('user_id')
                if not user_id:
                    return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    borrowed_user = User.objects.get(id=user_id, is_active=True)
                except User.DoesNotExist:
                    return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
                
            
            active_borrows = Borrow.objects.filter(user=borrowed_user, status="accepted", is_active=True, return_date__isnull=True).count()
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

            if request.user.role == "admin":
                borrow_data["status"] = "accepted"
                borrow_data["verified_by"] = request.user
                borrow_data["is_active"] = True

            book.available_copies -= 1
            book.total_copies -= 1
            book.save()
            borrow = Borrow.objects.create(**borrow_data)

        serializer = BorrowSerializer(borrow)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # throttle_classes = [BorrowRateThrottle]


class BorrowBookVerifyAPIView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, pk):
        borrow = get_object_or_404(Borrow, pk=pk, is_active=False)

        if borrow.status in ["accepted", "returned"]:
            return Response({"error": f"Borrow already {borrow.status}."}, status=status.HTTP_400_BAD_REQUEST)

        # Update fields for verification
        request_status = request.data.get('status')
        if request_status and request_status not in ["accepted", "rejected", "cancelled"]:
            return Response({"error": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        borrow.status = request_status if request_status else borrow.status
        borrow.verified_by = request.user

        if request_status == "accepted":
            borrow.is_active = True

        borrow.save()

        return Response(
            {"status": status.HTTP_200_OK, "message": f"Borrow {borrow.status} successfully."}
        )


class ReturnBookView(APIView):
    permission_classes = [IsUser]

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

        borrow_record = get_object_or_404(Borrow, id=borrow_id, user=request.user, status="accepted", is_active=True, return_date__isnull=True)

        with transaction.atomic():  
            borrow_record.return_date = date.today()
            borrow_record.status = "returned"
            borrow_record.is_active = False

            # Atomically increment available_copies
            book = borrow_record.book
            try:
                book = Book.objects.select_for_update().get(id=book.id, is_active=True)
            except Book.DoesNotExist:
                return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
            
            book.available_copies += 1
            book.total_copies += 1
            book.save()

            # Late return penalty
            if borrow_record.return_date > borrow_record.due_date:
                days_late = (borrow_record.return_date - borrow_record.due_date).days
                borrow_record.user.penalty_points += days_late  
                borrow_record.user.save()

            borrow_record.save()

        return Response({"message": "Book returned successfully"}, status=status.HTTP_200_OK)
        