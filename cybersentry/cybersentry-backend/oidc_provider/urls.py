from django.urls import path
from . import views

app_name = 'oidc_provider'

urlpatterns = [
    # OIDC Discovery
    path('.well-known/openid-configuration', views.openid_configuration, name='openid-configuration'),
    
    # JWKS endpoint
    path('.well-known/jwks.json', views.jwks, name='jwks'),
    
    # UserInfo endpoint
    path('userinfo', views.userinfo, name='userinfo'),
    
    # Logout endpoint
    path('logout', views.logout, name='logout'),
]