"""Searchable resources.

A resource is the single place that answers "what does searching X mean?" --
which index, which fields, how hits are rendered. Everything shared lives on
`BaseSearchResource`, so a new resource is a handful of attributes.
"""

from abc import ABC

from elasticsearch_dsl import Q

from .documents import BookDocument, UserDocument
from .registry import registry
from .serializers import BookHitSerializer, UserHitSerializer


class BaseSearchResource(ABC):
    #: URL segment this resource is reachable at, and the key used by the
    #: access policy. Required.
    name = None

    #: The Document whose index is queried.
    document = None

    #: Serializer used to render each hit.
    serializer_class = None

    #: Fields fed to the query, `field^boost` accepted.
    search_fields = ()

    #: Term filters always applied, e.g. hiding soft-deleted rows.
    base_filters = {}

    def get_search(self, user):
        """Build the base `Search` for this resource before the query is added."""
        search = self.document.search()

        for field, value in self.base_filters.items():
            search = search.filter('term', **{field: value})

        return self.scope_to_user(search, user)

    def scope_to_user(self, search, user):
        """Hook for narrowing results per requester. No narrowing by default."""
        return search

    def build_query(self, term):
        """Typo-tolerant match, plus a prefix match so partial words still hit."""
        fields = list(self.search_fields)
        return Q(
            'bool',
            should=[
                Q('multi_match', query=term, fields=fields, fuzziness='AUTO'),
                Q('multi_match', query=term, fields=fields, type='phrase_prefix'),
            ],
            minimum_should_match=1,
        )

    def serialize(self, hits):
        return self.serializer_class(hits, many=True).data

    def describe(self):
        return {'resource': self.name, 'search_fields': list(self.search_fields)}


@registry.register
class BookSearchResource(BaseSearchResource):
    name = 'books'
    document = BookDocument
    serializer_class = BookHitSerializer
    search_fields = (
        'title^3',
        'author.name^2',
        'category.name',
        'description',
    )
    # Books are soft-deleted, so `is_active` decides visibility.
    base_filters = {'is_active': True}


@registry.register
class UserSearchResource(BaseSearchResource):
    name = 'users'
    document = UserDocument
    serializer_class = UserHitSerializer
    search_fields = (
        'username^3',
        'email^2',
        'reference_number^2',
        'first_name',
        'last_name',
        'phone_number',
        'role',
    )
    base_filters = {'is_active': True}
