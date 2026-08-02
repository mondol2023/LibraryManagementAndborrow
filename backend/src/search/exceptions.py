from rest_framework import status
from rest_framework.exceptions import APIException


class SearchBackendUnavailable(APIException):
    """Raised when Elasticsearch cannot be reached or the index is missing."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Search is temporarily unavailable. Please try again later.'
    default_code = 'search_unavailable'
