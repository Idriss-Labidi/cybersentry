from celery import shared_task
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.conf import settings

user_model = get_user_model()
token_generator = PasswordResetTokenGenerator()


@shared_task(bind=True, max_retries=3)
def send_activation_email(self, user_id: int, activation_url: str):
    """
    Send activation email to a newly created user.
    This task is executed asynchronously using Celery.
    """
    try:
        user = user_model.objects.get(pk=user_id)

        # Generate activation token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        # Build full activation link
        full_activation_url = f"{activation_url}activate/{uid}/{token}/"

        # Prepare email context
        context = {
            'user': user,
            'activation_url': full_activation_url,
            'email': user.email,
        }

        # Render email subject and body
        subject = 'Activate Your CyberSentry Account'
        html_message = render_to_string('accounts/email/activation_email.html', context)
        plain_message = render_to_string('accounts/email/activation_email.txt', context)

        # Send email
        send_mail(
            subject=subject,
            message=plain_message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

    except user_model.DoesNotExist:
        # User isn't found, no need to retry
        pass
    except Exception as exc:
        # Retry task with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

