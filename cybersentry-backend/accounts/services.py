from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.db import transaction
from django.http import HttpRequest
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mass_mail
from .models import Organization, User

user_model = get_user_model()
token_generator = PasswordResetTokenGenerator()


def get_client_ip(request: HttpRequest) -> str | None:
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def ensure_user_organization(user: User) -> Organization:
    if user.organization_id:
        return user.organization

    email_domain = user.email.split('@', 1)[1] if '@' in user.email else f'{user.username}.local'
    workspace_label = user.get_full_name().strip() or user.username or user.email.split('@', 1)[0]
    base_name = f'{workspace_label} Personal Workspace'
    organization_name = base_name
    suffix = 2

    while Organization.objects.filter(name=organization_name).exists():
        organization_name = f'{base_name} {suffix}'
        suffix += 1

    with transaction.atomic():
        locked_user = user_model.objects.select_for_update().get(pk=user.pk)
        if locked_user.organization_id:
            user.organization = locked_user.organization
            return locked_user.organization

        organization = Organization.objects.create(
            name=organization_name,
            contact_email=locked_user.email,
            allowed_domains=email_domain,
        )
        locked_user.organization = organization
        locked_user.save(update_fields=['organization'])
        user.organization = organization
        return organization

def create_organization_admins_and_notify(organization: Organization, admin_emails: list[str], request: HttpRequest) -> None:
    '''
        Create admin users for the organization
        and send notification email to the admins.
    '''
    
    with transaction.atomic():
        
        created_users = []
        
        for email in admin_emails:
            user , created = user_model.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'role': user_model.Roles.ADMIN,
                    'is_active': False,
                    'organization': organization
                }
            )
            if created:
                created_users.append(user)
                
        transaction.on_commit(lambda: send_mass_mail(generate_activation_emails(created_users, request), fail_silently=True))
        
def generate_activation_link(user: User, request: HttpRequest) -> str:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = token_generator.make_token(user)

    return request.build_absolute_uri(
        f"/activate/{uid}/{token}/"
    )
    
def generate_activation_emails(users: list[User], request: HttpRequest):
    email_set = []
    for user in users:
        activation_link = generate_activation_link(user, request)
        
        email_set.append((
            "Activate Your Account",
            f"Please click the following link to activate your account: {activation_link}",
            "noreply@cybersentry.com",
            [user.email],
        ))
    return tuple(email_set)
