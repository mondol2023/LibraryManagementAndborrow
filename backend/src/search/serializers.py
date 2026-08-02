"""Request validation and hit shaping.

Search hits are Elasticsearch documents, not model instances, so they get their
own serializers rather than reusing the write-side ones from Book/users.
"""

from rest_framework import serializers

MAX_PAGE_SIZE = 100


class SearchQuerySerializer(serializers.Serializer):
    """Validates the query string shared by every search resource."""

    q = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True, max_length=255)
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(
        required=False, min_value=1, max_value=MAX_PAGE_SIZE, default=20
    )


class BaseHitSerializer(serializers.Serializer):
    """Common shape for every hit: the model pk and the relevance score."""

    id = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()

    def get_id(self, hit):
        return int(hit.meta.id)

    def get_score(self, hit):
        return getattr(hit.meta, 'score', None)


class BookHitSerializer(BaseHitSerializer):
    title = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True, allow_null=True)
    total_copies = serializers.IntegerField(read_only=True)
    available_copies = serializers.IntegerField(read_only=True)
    author = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    def get_author(self, hit):
        return self._nested(hit, 'author')

    def get_category(self, hit):
        return self._nested(hit, 'category')

    @staticmethod
    def _nested(hit, attname):
        # Both FKs are nullable, so the object may be missing from the document.
        nested = getattr(hit, attname, None)
        if nested is None:
            return None
        return {'id': getattr(nested, 'id', None), 'name': getattr(nested, 'name', None)}


class UserHitSerializer(BaseHitSerializer):
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    phone_number = serializers.CharField(read_only=True, allow_null=True)
    reference_number = serializers.CharField(read_only=True, allow_null=True)
    role = serializers.CharField(read_only=True, allow_null=True)
    penalty_points = serializers.IntegerField(read_only=True)
