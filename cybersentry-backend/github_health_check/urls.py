"""
URL configuration for GitHub health check feature
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GitHubRepositoryCheckViewSet

router = DefaultRouter()
router.register(r'', GitHubRepositoryCheckViewSet, basename='github-health')

urlpatterns = [
    path('', include(router.urls)),
]

