from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import SetPasswordForm
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator

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
    
