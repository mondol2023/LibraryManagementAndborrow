"""Minimal page/page_size helper.

The project answers with plain `Response` bodies rather than DRF's paginator, so
list endpoints share this one function instead of slicing by hand.
"""

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


def read_page_params(query_params, default_page_size=DEFAULT_PAGE_SIZE):
    """Pull `page` / `page_size` off a querydict, clamped and never invalid."""

    def _positive_int(value, fallback, maximum=None):
        try:
            number = int(value)
        except (TypeError, ValueError):
            return fallback
        if number < 1:
            return fallback
        return min(number, maximum) if maximum else number

    page = _positive_int(query_params.get('page'), 1)
    page_size = _positive_int(query_params.get('page_size'), default_page_size, MAX_PAGE_SIZE)
    return page, page_size


def paginate(queryset, page, page_size, serializer_class=None, context=None):
    """Slice `queryset` and wrap it with the usual counters."""
    total = queryset.count()
    start = (page - 1) * page_size
    window = queryset[start:start + page_size]

    if serializer_class is not None:
        results = serializer_class(window, many=True, context=context or {}).data
    else:
        results = list(window)

    return {
        'count': total,
        'page': page,
        'page_size': page_size,
        'num_pages': (total + page_size - 1) // page_size if page_size else 0,
        'results': results,
    }
