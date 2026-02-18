# api/urls.py
from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    path('protected/', views.protected_resource, name='protected'),
    path('lookup/',views.dns_lookup, name='dns lookup'),
    path('propagation/', views.dns_propagation, name='dns propagation')
]