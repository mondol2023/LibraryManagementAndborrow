"""Query-string validation for the dashboard endpoints."""

from rest_framework import serializers

from .registry import registry

MAX_LIMIT = 50


class CommaSeparatedField(serializers.CharField):
    """`?panels=overview,overdue` -> `['overview', 'overdue']`."""

    def to_internal_value(self, data):
        raw = super().to_internal_value(data)
        return [part.strip() for part in raw.split(',') if part.strip()]


class DashboardQuerySerializer(serializers.Serializer):
    """Options every panel understands."""

    panels = CommaSeparatedField(required=False, allow_blank=True)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=MAX_LIMIT, default=10)

    def validate_panels(self, value):
        unknown = sorted(set(value) - registry.names())
        if unknown:
            raise serializers.ValidationError(
                f"Unknown panel(s): {', '.join(unknown)}."
            )
        return value
