"""Building blocks shared by the feature apps.

Nothing in here knows about books, users or Elasticsearch -- it only holds the
patterns that would otherwise be copy-pasted into every app (a name registry, a
role-to-capability policy, and a per-method permission view).
"""
