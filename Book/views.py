from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import Book , Author, Category
from .serializers import BookSerializer , AuthorSerializer, CategorySerializer, BorrowSerializer
from users.permissions import IsAdmin , IsAll, IsUser



class BookListCreateAPIView(APIView):
    permission_classes = [IsAll]

    def get(self, request):
        author = request.GET.get('author')
        category = request.GET.get('category')
        books = Book.objects.filter(is_active=True)

        if author:
            books = books.filter(author_id=author)
        if category:
            books = books.filter(category_id=category)

        serializer = BookSerializer(books, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save(
                created_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookDetailAPIView(APIView):
    permission_classes = [IsAll]

    def get(self, request, pk):
        book = get_object_or_404(Book, pk=pk, is_active=True)
        serializer = BookSerializer(book)
        return Response(serializer.data)
    

    def put(self, request, pk): 
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        book = get_object_or_404(Book, pk=pk, is_active=True)
        serializer = BookSerializer(book, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save(
                updated_by=request.user
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        book = get_object_or_404(Book, pk=pk, is_active=True)
        book.is_active = False
        book.updated_by = request.user
        book.save()

        return Response({"message": "Data deleted."}, status=status.HTTP_204_NO_CONTENT)


class AuthorListCreateAPIView(APIView):
    permission_classes = [IsAll]

    def get(self, request):
        authors = Author.objects.filter(is_active=True)
        serializer = AuthorSerializer(authors, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = AuthorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                created_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryListCreateAPIView(APIView):
    permission_classes = [IsAll]

    def get(self, request):
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                created_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



