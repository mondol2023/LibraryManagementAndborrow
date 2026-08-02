from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from users.views import RegisterView
from users.tokens import LoginView
from Book.views import (
    AuthorDetailAPIView,
    AuthorListCreateAPIView,
    BookDetailAPIView,
    BookListCreateAPIView,
    CategoryDetailAPIView,
    CategoryListCreateAPIView,
)
from Book.borrow_views import BorrowBookAPIView, BorrowBookVerifyAPIView, ReturnBookView


urlpatterns = [
    # User Module
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Books
    path('books/', BookListCreateAPIView.as_view(), name='book-list-create'),
    path('books/<int:pk>/', BookDetailAPIView.as_view(), name='book-detail'),

    # Authors
    path('authors/', AuthorListCreateAPIView.as_view(), name='author-list-create'),
    path('authors/<int:pk>/', AuthorDetailAPIView.as_view(), name='author-detail'),

    # Categories
    path('categories/', CategoryListCreateAPIView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', CategoryDetailAPIView.as_view(), name='category-detail'),

    # Search
    path('search/', include('search.urls')),

    # Dashboard
    path('dashboard/', include('dashboard.urls')),

    # Borrow
    path('borrow/', BorrowBookAPIView.as_view(), name='borrow-list-create'),
    path('borrow-verify/<int:pk>/', BorrowBookVerifyAPIView.as_view(), name='borrow-verify'),
    path('return/', ReturnBookView.as_view(), name='borrow-return'),

    # Users
    path('users/', include('users.urls')),

]
