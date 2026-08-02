"""Elasticsearch index definitions.

Only the mapping lives here -- what a role is allowed to search is decided in
`access.py`, and how a query is built is decided in `resources.py`.

django-elasticsearch-dsl autodiscovers this module and keeps the indices in
sync through model signals, so no view ever has to write to Elasticsearch.
"""

from django.contrib.auth import get_user_model
from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry

from Book.models import Author, Book, Category

User = get_user_model()


# Small indices -- one shard is plenty and a replica would stay unassigned on a
# single-node development cluster.
INDEX_SETTINGS = {
    'number_of_shards': 1,
    'number_of_replicas': 0,
}


@registry.register_document
class BookDocument(Document):
    author = fields.ObjectField(properties={
        'id': fields.IntegerField(),
        'name': fields.TextField(fields={'raw': fields.KeywordField()}),
    })
    category = fields.ObjectField(properties={
        'id': fields.IntegerField(),
        'name': fields.TextField(fields={'raw': fields.KeywordField()}),
    })

    class Index:
        name = 'library_books'
        settings = INDEX_SETTINGS

    class Django:
        model = Book
        fields = [
            'title',
            'description',
            'total_copies',
            'available_copies',
            'is_active',
        ]
        # Re-index a book when the author or category it points at is renamed.
        related_models = [Author, Category]

    def get_queryset(self):
        return super().get_queryset().select_related('author', 'category')

    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, Author):
            return related_instance.books_author.all()
        if isinstance(related_instance, Category):
            return related_instance.books_category.all()
        return None


@registry.register_document
class UserDocument(Document):
    class Index:
        name = 'library_users'
        settings = INDEX_SETTINGS

    class Django:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'reference_number',
            'role',
            'penalty_points',
            'is_active',
        ]
