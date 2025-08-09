from rest_framework.views import APIView
from .serializers import RegisterSerializer, PenaltySerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .permissions import IsAll, IsUser


from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "User registered successfully",
                    "username": user.username,
                    "email": user.email,
                    "role": user.role
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
   

class UserAPIView(APIView):
    permission_classes = [IsAll]

    def get(self, request, pk=None, action=None):
        if action == "penalties":
            return self.get_penalties( request, pk)
        return Response({"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
    
        # elif pk:s
        #     user = get_object_or_404(User, pk=pk)
        #     return Response({"id": user.id, "username": user.username})
        # else:
        #     users = User.objects.all().values("id", "username")
        #     return Response(list(users))

    def get_penalties(self, request, pk):
        if request.user.role != 'admin' and request.user.id != pk:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        user = get_object_or_404(User, pk=pk)
        penalty_points = getattr(user, 'penalty_points', 0)
        serializer = PenaltySerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

