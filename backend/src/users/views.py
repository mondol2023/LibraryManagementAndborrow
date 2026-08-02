"""Account endpoints.

Registration is public; everything else is account administration. Admins reach
every account and every field, desk staff get read-only visibility of borrowers,
and a borrower can only ever see and edit themselves.
"""

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.pagination import paginate, read_page_params
from core.views import MethodPermissionAPIView

from .permissions import IsAdmin, IsAll, IsLibrarian, is_admin, is_librarian
from .serializers import (
    PenaltyAdjustSerializer,
    PenaltySerializer,
    RegisterSerializer,
    UserAdminUpdateSerializer,
    UserSelfUpdateSerializer,
    UserSerializer,
)

User = get_user_model()


def visible_users(requester):
    """The accounts `requester` is allowed to see.

    Admins see everyone. Desk staff see the people they serve, but not other
    administrators -- staff must not be able to enumerate the admin accounts.
    """
    queryset = User.objects.all()
    if is_admin(requester):
        return queryset
    return queryset.exclude(role=User.ROLE_ADMIN)


def filter_users(queryset, query_params):
    """Apply the `q` / `role` / `is_active` list filters."""
    term = (query_params.get('q') or '').strip()
    if term:
        queryset = queryset.filter(
            Q(username__icontains=term)
            | Q(email__icontains=term)
            | Q(first_name__icontains=term)
            | Q(last_name__icontains=term)
            | Q(reference_number__icontains=term)
        )

    role = query_params.get('role')
    if role:
        queryset = queryset.filter(role=role)

    is_active = query_params.get('is_active')
    if is_active is not None and is_active != '':
        queryset = queryset.filter(is_active=is_active.lower() in ('1', 'true', 'yes'))

    return queryset


def deny(message):
    return Response({"detail": message}, status=status.HTTP_403_FORBIDDEN)


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
                    "role": user.role,
                    "is_active": user.is_active,
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListCreateAPIView(MethodPermissionAPIView):
    """`GET /api/users/` -- browse accounts. `POST` -- an admin creates one."""

    permission_classes = [IsLibrarian]
    method_permissions = {'POST': [IsAdmin]}

    def get(self, request):
        queryset = filter_users(visible_users(request.user), request.query_params)
        queryset = queryset.order_by('-date_joined')

        page, page_size = read_page_params(request.query_params)
        return Response(paginate(queryset, page, page_size, UserSerializer))

    def post(self, request):
        # `RegisterSerializer` already knows that an admin-created account is
        # active immediately, so creation stays in one place.
        serializer = RegisterSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class CurrentUserAPIView(APIView):
    """`/api/users/me/` -- the signed-in account's own profile."""

    permission_classes = [IsAll]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSelfUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class UserDetailAPIView(APIView):
    """One account: read, edit, deactivate.

    Permissions vary by *who the target is*, not just by method, so the checks
    live in the handlers rather than in a `method_permissions` map.
    """

    permission_classes = [IsAll]

    def get_target(self, pk):
        return get_object_or_404(User, pk=pk)

    def get(self, request, pk):
        user = self.get_target(pk)
        if request.user.id != user.id:
            if not is_librarian(request.user):
                return deny('You may only view your own account.')
            if not is_admin(request.user) and user.role == User.ROLE_ADMIN:
                return deny('Staff may not view administrator accounts.')

        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        user = self.get_target(pk)

        if is_admin(request.user):
            serializer_class = UserAdminUpdateSerializer
        elif request.user.id == user.id:
            # Self-edit is limited to the harmless fields; role, activation and
            # penalties are not in `UserSelfUpdateSerializer`.
            serializer_class = UserSelfUpdateSerializer
        else:
            return deny('Only an administrator may edit another account.')

        serializer = serializer_class(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data)

    def delete(self, request, pk):
        if not is_admin(request.user):
            return deny('Administrator access required.')

        user = self.get_target(pk)
        if user.id == request.user.id:
            # Otherwise an admin can lock themselves -- and possibly the last
            # admin account -- out of the system.
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Soft delete, matching how books, authors and categories are removed.
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({"detail": "Account deactivated."}, status=status.HTTP_200_OK)


class UserApproveAPIView(APIView):
    """Activate an admin/staff signup that registered in the pending state.

    Without this, `RegisterSerializer`'s `is_active = False` for those roles was
    a dead end -- nothing could ever switch it back on.
    """

    permission_classes = [IsAdmin]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user.is_active:
            return Response({"detail": "Account is already active."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class UserAPIView(APIView):
    """Penalty points for one account.

    Kept under its original name and route so existing clients are unaffected.
    """

    permission_classes = [IsAll]

    def get(self, request, pk=None, action=None):
        if action == "penalties":
            return self.get_penalties(request, pk)
        return Response({"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, pk=None, action=None):
        """Set or adjust penalty points. Admin only."""
        if action != "penalties":
            return Response({"detail": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

        if not is_admin(request.user):
            return deny('Only an administrator may change penalty points.')

        user = get_object_or_404(User, pk=pk)
        serializer = PenaltyAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.apply(user)
        return Response(PenaltySerializer(user).data, status=status.HTTP_200_OK)

    # PATCH does the same thing as POST here; both read naturally for this route.
    patch = post

    def get_penalties(self, request, pk):
        # Was admin-only; desk staff need to quote a borrower's fine as well.
        if not is_librarian(request.user) and request.user.id != pk:
            return deny('Access denied.')

        user = get_object_or_404(User, pk=pk)
        serializer = PenaltySerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
