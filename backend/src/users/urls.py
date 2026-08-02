"""Account routes, mounted at `api/users/`."""

from django.urls import path

from .views import (
    CurrentUserAPIView,
    UserApproveAPIView,
    UserAPIView,
    UserDetailAPIView,
    UserListCreateAPIView,
)

urlpatterns = [
    path('', UserListCreateAPIView.as_view(), name='user-list-create'),
    path('me/', CurrentUserAPIView.as_view(), name='user-me'),
    path('<int:pk>/', UserDetailAPIView.as_view(), name='user-detail'),
    path('<int:pk>/approve/', UserApproveAPIView.as_view(), name='user-approve'),
    path('<int:pk>/penalties/', UserAPIView.as_view(), {"action": "penalties"}, name='user-penalties'),
]
