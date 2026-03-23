from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver

from .models import LoginHistory
from .services import get_client_ip


@receiver(user_logged_in)
def record_login_event(sender, request, user, **kwargs):
    if request is None or user is None:
        return

    LoginHistory.objects.create(
        user=user,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:512],
    )

