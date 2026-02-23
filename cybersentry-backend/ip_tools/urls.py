from django.urls import path
from . import views

app_name = 'ip_tools'

urlpatterns = [
    path('whois/', views.whois_lookup, name='whois-lookup'),
    path('reputation/', views.ip_reputation, name='ip-reputation'),
    path('reverse/', views.reverse_ip, name='reverse-ip'),
]
