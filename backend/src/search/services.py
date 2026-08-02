"""Query execution.

Knows about Elasticsearch and paging; knows nothing about HTTP or roles. The
view depends on this abstraction rather than on elasticsearch-dsl directly, so
swapping the backend later would not touch the API layer.
"""

from elasticsearch.exceptions import ConnectionError as ESConnectionError
from elasticsearch.exceptions import NotFoundError, TransportError

from .exceptions import SearchBackendUnavailable


class SearchService:
    """Runs a resource's query and returns a paginated, serialized result."""

    def search(self, resource, *, term, user, page=1, page_size=20):
        offset = (page - 1) * page_size

        search = resource.get_search(user).query(resource.build_query(term))
        search = search[offset:offset + page_size]

        try:
            response = search.execute()
        except (ESConnectionError, NotFoundError, TransportError) as exc:
            # A missing index means `search_index --rebuild` has not been run.
            raise SearchBackendUnavailable() from exc

        return {
            'resource': resource.name,
            'query': term,
            'page': page,
            'page_size': page_size,
            'total': response.hits.total.value,
            'results': resource.serialize(response.hits),
        }
