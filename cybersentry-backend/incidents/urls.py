from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import IncidentTicketViewSet

app_name = 'incidents'

router = DefaultRouter()
router.register(r'api/incidents', IncidentTicketViewSet, basename='incident-ticket')

urlpatterns = [
    path('', include(router.urls)),
]

