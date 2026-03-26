from django.urls import path
from . import views

app_name = 'ip_tools'

urlpatterns = [
    # Public endpoints (no authentication required)
    path('whois/', views.whois_lookup, name='whois-lookup'),
    path('reputation/', views.ip_reputation, name='ip-reputation'),
    path('reverse/', views.reverse_ip, name='reverse-ip'),
    path('typosquatting/', views.typosquatting_detection, name='typosquatting-detection'),

    # Advanced endpoints (authentication required)
    path('advanced/reputation/', views.advanced_ip_reputation, name='advanced-ip-reputation'),
    path('history/', views.scan_history, name='scan-history'),
    path('history/<int:scan_id>/', views.delete_scan_history_entry, name='scan-history-delete'),
]
