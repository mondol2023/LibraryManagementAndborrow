"""View helpers shared by the API apps."""

from rest_framework.views import APIView


class MethodPermissionAPIView(APIView):
    """An APIView whose permissions can differ per HTTP method.

    Reading a book list and deleting a book are not the same privilege, but a
    single `permission_classes` list cannot say so -- which is why the views used
    to re-check `IsAdmin().has_permission(...)` by hand inside every write
    method. Declaring the map instead keeps the rule next to the route and out of
    the handler bodies.

        class BookDetailAPIView(MethodPermissionAPIView):
            permission_classes = [IsAll]                 # fallback (GET)
            method_permissions = {'DELETE': [IsAdmin]}
    """

    #: {'POST': [PermissionClass, ...]}. Methods absent here fall back to
    #: `permission_classes`.
    method_permissions = {}

    def get_permissions(self):
        classes = self.method_permissions.get(self.request.method, self.permission_classes)
        return [permission() for permission in classes]
