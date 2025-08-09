from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    # TokenRefreshView,
)

from users.views import RegisterView, UserAPIView
from book.views import BookListCreateAPIView, BookDetailAPIView , AuthorListCreateAPIView, CategoryListCreateAPIView
from book.borrow_views import BorrowBookAPIView, BorrowBookVerifyAPIView, ReturnBookView


urlpatterns = [
    # User Module
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    # path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Books
    path('books/', BookListCreateAPIView.as_view(), name='book-list-create'),
    path('books/<int:pk>/', BookDetailAPIView.as_view(), name='book-detail'),

    # Authors
    path('authors/', AuthorListCreateAPIView.as_view(), name='author-list-create'),

    # Categories
    path('categories/', CategoryListCreateAPIView.as_view(), name='category-list-create'),

    # Borrow
    path('borrow/', BorrowBookAPIView.as_view(), name='borrow-list-create'),
    path('borrow-verify/<int:pk>/', BorrowBookVerifyAPIView.as_view(), name='borrow-verify'),
    path('return/', ReturnBookView.as_view(), name='borrow-return'),

    # Users
    # path('users/', UserAPIView.as_view(), name='user-list-create'),
    # path('/users/<int:pk>/', UserAPIView.as_view(), name='user-details-update-delete'),
    path('users/<int:pk>/penalties/', UserAPIView.as_view(), {"action": "penalties"}, name='user-penalties'),

]
