from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import SetPasswordForm
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from typing import cast
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response

from .models import LoginHistory, User, UserSettings
from .serializers import (
    OrganizationUserSerializer,
    LoginHistorySerializer,
    PasswordChangeSerializer,
    ProfileSerializer,
    UserSettingsUpdateSerializer,
    mask_github_token,
)
from .permissions import IsOrganizationAdmin
from .services import get_client_ip

user_model = get_user_model()
token_generator = PasswordResetTokenGenerator()

def account_activation_view(request, uidb64, token):
    """
        This view will handle account activation logic
        It will decode the uidb64 to get the user ID, verify the token,
        and activate the user's account if everything is valid.
     """
    try:
        user_id = force_str(urlsafe_base64_decode(uidb64))
        user = user_model.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, user_model.DoesNotExist):
        return render(request, 'accounts/activation_invalid.html')
    
    if not token_generator.check_token(user, token):
        return render(request, 'accounts/activation_invalid.html')
    
    if request.method == 'POST':
        form = SetPasswordForm(user, data=request.POST)
        if form.is_valid():
            form.save()
            user.is_active = True
            user.save()
            return render(request, "accounts/activation_success.html")
    else:
        form = SetPasswordForm(user)
    
    return render(request, "accounts/account_activation.html", {"form": form, "uidb64": uidb64, "token": token})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_info(request):
    serializer = ProfileSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = PasswordChangeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    old_password = serializer.validated_data['old_password']
    new_password = serializer.validated_data['new_password']

    if not request.user.check_password(old_password):
        return Response({'old_password': ['Current password is incorrect.']}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(new_password, cast(User, request.user))
    except ValidationError as exc:
        return Response({'new_password': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(new_password)
    request.user.password_changed_at = timezone.now()
    request.user.save(update_fields=['password', 'password_changed_at'])

    return Response(
        {
            'message': 'Password changed successfully.',
            'password_changed_at': request.user.password_changed_at,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_info(request):
    return Response(
        {
            'last_login': request.user.last_login,
            'current_session': {
                'ip_address': get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def login_history(request):
    history = LoginHistory.objects.filter(user=request.user)[:5]
    serializer = LoginHistorySerializer(history, many=True)
    return Response({'entries': serializer.data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def security_status(request):
    recent_logins = LoginHistory.objects.filter(user=request.user)[:5]
    ip_count = len({entry.ip_address for entry in recent_logins if entry.ip_address})
    suspicious = ip_count > 1

    return Response(
        {
            'suspicious': suspicious,
            'message': (
                'Multiple IPs detected recently'
                if suspicious
                else 'No suspicious activity detected'
            ),
            'recent_ip_count': ip_count,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)

    if request.method == 'PUT':
        serializer = UserSettingsUpdateSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        settings_obj.refresh_from_db()

    return Response(
        {
            'github_token': mask_github_token(settings_obj.github_token),
            'use_cache': settings_obj.use_cache,
            'cache_duration': settings_obj.cache_duration,
            'notifications_email_enabled': settings_obj.notifications_email_enabled,
            'notifications_webhook_enabled': settings_obj.notifications_webhook_enabled,
            'slack_webhook_url': settings_obj.slack_webhook_url,
            'teams_webhook_url': settings_obj.teams_webhook_url,
            'preferred_theme': settings_obj.preferred_theme,
        },
        status=status.HTTP_200_OK,
    )


class OrganizationUserViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationUserSerializer
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def _organization_user_queryset(self, include_request_user: bool = True):
        organization = self.request.user.organization

        if not organization:
            return user_model.objects.none()

        queryset = user_model.objects.filter(organization=organization).select_related('organization').order_by('email')

        if not include_request_user:
            queryset = queryset.exclude(pk=self.request.user.pk)

        return queryset

    def get_queryset(self):
        return self._organization_user_queryset(include_request_user=False)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        if user.pk == request.user.pk:
            return Response(
                {'detail': 'You cannot delete your own account from this screen.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.role == User.Roles.ADMIN:
            admin_count = self._organization_user_queryset(include_request_user=True).filter(role=User.Roles.ADMIN).count()
            if admin_count <= 1:
                return Response(
                    {'detail': 'Each organization must keep at least one admin.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return super().destroy(request, *args, **kwargs)

    def perform_update(self, serializer):
        existing_user = serializer.instance
        proposed_is_active = serializer.validated_data.get('is_active', existing_user.is_active)

        if existing_user.role == User.Roles.ADMIN and existing_user.is_active and not proposed_is_active:
            active_admins = (
                self._organization_user_queryset(include_request_user=True)
                .filter(role=User.Roles.ADMIN, is_active=True)
                .exclude(pk=existing_user.pk)
            )
            if not active_admins.exists():
                raise DRFValidationError({'is_active': 'Each organization must keep at least one active admin.'})

        serializer.save()



