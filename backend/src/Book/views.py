"""Catalogue endpoints.

Everyone signed in may read the catalogue. Desk staff and admins maintain it;
removing a record stays with the admin, because a soft delete hides a row from
every other screen in the system.
"""

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response

from core.views import MethodPermissionAPIView
from users.permissions import IsAdmin, IsAll, IsLibrarian

from .models import Author, Book, Category
from .serializers import AuthorSerializer, BookSerializer, CategorySerializer


class SoftDeleteMixin:
    """Shared 'hide the row instead of dropping it' handler.

    Books, authors and categories all deactivate the same way, so the three
    views share one implementation and only name their model.
    """

    #: Set by the concrete view.
    model = None

    def delete(self, request, pk):
        instance = get_object_or_404(self.model, pk=pk, is_active=True)
        instance.is_active = False
        instance.updated_by = request.user
        instance.save()
        return Response({"message": "Data deleted."}, status=status.HTTP_204_NO_CONTENT)


class BookListCreateAPIView(MethodPermissionAPIView):
    permission_classes = [IsAll]
    method_permissions = {'POST': [IsLibrarian]}

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


class BookDetailAPIView(SoftDeleteMixin, MethodPermissionAPIView):
    model = Book
    permission_classes = [IsAll]
    method_permissions = {
        'PUT': [IsLibrarian],
        'PATCH': [IsLibrarian],
        'DELETE': [IsAdmin],
    }

    def get(self, request, pk):
        book = get_object_or_404(Book, pk=pk, is_active=True)
        serializer = BookSerializer(book)
        return Response(serializer.data)

    def put(self, request, pk):
        book = get_object_or_404(Book, pk=pk, is_active=True)
        serializer = BookSerializer(book, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save(
                updated_by=request.user
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AuthorListCreateAPIView(MethodPermissionAPIView):
    permission_classes = [IsAll]
    method_permissions = {'POST': [IsLibrarian]}

    def get(self, request):
        authors = Author.objects.filter(is_active=True)
        serializer = AuthorSerializer(authors, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AuthorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                created_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AuthorDetailAPIView(SoftDeleteMixin, MethodPermissionAPIView):
    """Authors could be created but never corrected or removed until now."""

    model = Author
    permission_classes = [IsAll]
    method_permissions = {
        'PUT': [IsLibrarian],
        'PATCH': [IsLibrarian],
        'DELETE': [IsAdmin],
    }

    def get(self, request, pk):
        author = get_object_or_404(Author, pk=pk, is_active=True)
        return Response(AuthorSerializer(author).data)

    def put(self, request, pk):
        author = get_object_or_404(Author, pk=pk, is_active=True)
        serializer = AuthorSerializer(author, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryListCreateAPIView(MethodPermissionAPIView):
    permission_classes = [IsAll]
    method_permissions = {'POST': [IsLibrarian]}

    def get(self, request):
        categories = Category.objects.filter(is_active=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                created_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryDetailAPIView(SoftDeleteMixin, MethodPermissionAPIView):
    model = Category
    permission_classes = [IsAll]
    method_permissions = {
        'PUT': [IsLibrarian],
        'PATCH': [IsLibrarian],
        'DELETE': [IsAdmin],
    }

    def get(self, request, pk):
        category = get_object_or_404(Category, pk=pk, is_active=True)
        return Response(CategorySerializer(category).data)

    def put(self, request, pk):
        category = get_object_or_404(Category, pk=pk, is_active=True)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
