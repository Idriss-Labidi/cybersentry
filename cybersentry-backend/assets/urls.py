from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AssetViewSet

app_name = 'assets'

router = DefaultRouter()
router.register(r'api/assets', AssetViewSet, basename='asset')

urlpatterns = [
    path('', include(router.urls)),
]

