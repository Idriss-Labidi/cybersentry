# api/urls.py
from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    path('profile/', views.user_profile, name='profile'),
    path('protected/', views.protected_resource, name='protected'),
    path('create/', views.create_resource, name='create'),
    path('public/', views.public_endpoint, name='public'),
    path('lookup/',views.dns_lookup, name='dns lookup')
]