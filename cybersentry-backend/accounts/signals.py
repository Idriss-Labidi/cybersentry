from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import LoginHistory, User, UserSettings
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


@receiver(post_save, sender=User)
def ensure_user_settings(sender, instance, created, **kwargs):
    if created:
        UserSettings.objects.get_or_create(user=instance)


