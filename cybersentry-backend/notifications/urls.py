from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import NotificationEventViewSet

app_name = 'notifications'

router = DefaultRouter()
router.register(r'api/notifications', NotificationEventViewSet, basename='notification-event')

urlpatterns = [
    path('', include(router.urls)),
]

