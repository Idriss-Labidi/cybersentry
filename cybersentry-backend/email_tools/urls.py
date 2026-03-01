from django.urls import path
from . import views

app_name = "email_tools"

urlpatterns = [
    path("analyze/", views.email_security_analysis, name="email-security-analysis"),
    path("spf/", views.spf_analysis, name="spf-analysis"),
    path("dkim/", views.dkim_analysis, name="dkim-analysis"),
    path("dmarc/", views.dmarc_analysis, name="dmarc-analysis"),
]
