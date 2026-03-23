from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import SetPasswordForm
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import LoginHistory
from .serializers import LoginHistorySerializer, PasswordChangeSerializer, ProfileSerializer
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
        validate_password(new_password, request.user)
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
    

