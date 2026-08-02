from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .access import SearchAccessPolicy
from .registry import registry
from .serializers import SearchQuerySerializer
from .services import SearchService


class SearchResourceMixin:
    """Resolves the requested resource and enforces the access policy."""

    def get_allowed_resources(self, user):
        return SearchAccessPolicy.allowed_resources(user, registry.names())


class SearchIndexAPIView(SearchResourceMixin, APIView):
    """Lists the resources the caller is allowed to search."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        allowed = self.get_allowed_resources(request.user)
        resources = [registry.get(name).describe() for name in sorted(allowed)]
        return Response({'resources': resources}, status=status.HTTP_200_OK)


class SearchAPIView(SearchResourceMixin, APIView):
    """GET /api/search/<resource>/?q=&page=&page_size="""

    permission_classes = [IsAuthenticated]
    service = SearchService()

    def get(self, request, resource):
        allowed = self.get_allowed_resources(request.user)

        if resource not in allowed:
            # Don't leak whether an unreachable resource exists at all.
            return Response(
                {'detail': 'You are not allowed to search this resource.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        query = SearchQuerySerializer(data=request.query_params)
        if not query.is_valid():
            return Response(query.errors, status=status.HTTP_400_BAD_REQUEST)

        payload = self.service.search(
            registry.get(resource),
            term=query.validated_data['q'],
            user=request.user,
            page=query.validated_data['page'],
            page_size=query.validated_data['page_size'],
        )
        return Response(payload, status=status.HTTP_200_OK)
