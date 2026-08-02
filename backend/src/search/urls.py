from django.urls import path

from .views import SearchAPIView, SearchIndexAPIView

urlpatterns = [
    path('', SearchIndexAPIView.as_view(), name='search-index'),
    path('<str:resource>/', SearchAPIView.as_view(), name='search'),
]
