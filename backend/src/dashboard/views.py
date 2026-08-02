"""Dashboard endpoints.

    GET /api/dashboard/                  every panel the caller may see
    GET /api/dashboard/?panels=a,b       just those, still filtered by role
    GET /api/dashboard/panels/           what the caller may see, without the data
    GET /api/dashboard/<panel>/          one panel on its own
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import DashboardQuerySerializer
from .services import DashboardService


class DashboardBaseAPIView(APIView):
    """Shared wiring: authentication, the service and the query options."""

    permission_classes = [IsAuthenticated]
    service = DashboardService()

    def read_options(self, request):
        """Validated `?panels=` / `?limit=`, or a 400 response."""
        query = DashboardQuerySerializer(data=request.query_params)
        if not query.is_valid():
            return None, Response(query.errors, status=status.HTTP_400_BAD_REQUEST)
        return query.validated_data, None


class DashboardAPIView(DashboardBaseAPIView):
    """The whole dashboard, tailored to the caller's role."""

    def get(self, request):
        options, error = self.read_options(request)
        if error:
            return error

        names = self.service.resolve(request.user, options.get('panels'))
        return Response(
            {
                'role': getattr(request.user, 'role', None),
                'panels': self.service.build(request.user, names, options['limit']),
            },
            status=status.HTTP_200_OK,
        )


class DashboardIndexAPIView(DashboardBaseAPIView):
    """Lists the panels the caller may load, so a client can build its own layout."""

    def get(self, request):
        allowed = self.service.allowed_names(request.user)
        return Response({'panels': self.service.describe(allowed)}, status=status.HTTP_200_OK)


class DashboardPanelAPIView(DashboardBaseAPIView):
    """One panel, for a widget that refreshes on its own."""

    def get(self, request, panel):
        options, error = self.read_options(request)
        if error:
            return error

        if panel not in self.service.allowed_names(request.user):
            # Don't reveal whether an off-limits panel exists at all.
            return Response(
                {'detail': 'You are not allowed to view this panel.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        built = self.service.build(request.user, [panel], options['limit'])
        return Response(built[panel], status=status.HTTP_200_OK)
