from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('activate/<uidb64>/<token>/', views.account_activation_view, name='account_activation'),
    path('api/profile/', views.profile_info, name='profile-info'),
    path('api/profile/change-password/', views.change_password, name='profile-change-password'),
    path('api/profile/session-info/', views.session_info, name='profile-session-info'),
    path('api/profile/login-history/', views.login_history, name='profile-login-history'),
    path('api/profile/security-status/', views.security_status, name='profile-security-status'),
]