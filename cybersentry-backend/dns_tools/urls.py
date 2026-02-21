from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

app_name = 'dns_tools'

urlpatterns = [
    path('protected/', views.protected_resource, name='protected'),
    path('lookup/',views.dns_lookup, name='dns lookup'),
    path('propagation/', views.dns_propagation, name='dns propagation'),
    path('health/', views.dns_health_check_, name='dns health check'),
    path('dns-server/<int:pk>/', views.DnsServerDetails.as_view(), name='dns server details'),
    path('dns-servers/', views.DnsServerList.as_view(), name='dns servers list'),
]

urlpatterns = format_suffix_patterns(urlpatterns)