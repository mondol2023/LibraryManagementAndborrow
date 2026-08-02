from django.urls import path

from .views import DashboardAPIView, DashboardIndexAPIView, DashboardPanelAPIView

urlpatterns = [
    path('', DashboardAPIView.as_view(), name='dashboard'),
    path('panels/', DashboardIndexAPIView.as_view(), name='dashboard-panels'),
    path('<str:panel>/', DashboardPanelAPIView.as_view(), name='dashboard-panel'),
]
