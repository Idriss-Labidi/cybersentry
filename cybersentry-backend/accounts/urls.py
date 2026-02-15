from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('activate/<uidb64>/<token>/', views.account_activation_view, name='account_activation'),
]