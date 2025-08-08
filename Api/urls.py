from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    # TokenRefreshView,
)


from users.views import RegisterView


urlpatterns = [
    # User Module
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    # path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # User Module
    # path('register/', RegisterView.as_view(), name='register'),
]
