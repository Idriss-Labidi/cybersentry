# oidc_provider/views.py
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.urls import reverse
from jwcrypto import jwk
import json
import hashlib
import base64
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
def openid_configuration(request):
    """
    OIDC Discovery endpoint (.well-known/openid-configuration)
    Returns the OpenID Connect configuration for this provider.
    """
    base_url = request.build_absolute_uri('/')[:-1]
    
    config = {
        "issuer": base_url,
        "authorization_endpoint": f"{base_url}{reverse('oauth2_provider:authorize')}",
        "token_endpoint": f"{base_url}{reverse('oauth2_provider:token')}",
        "userinfo_endpoint": f"{base_url}{reverse('oidc_provider:userinfo')}",
        "jwks_uri": f"{base_url}{reverse('oidc_provider:jwks')}",
        "end_session_endpoint": f"{base_url}{reverse('oidc_provider:logout')}",
        
        # Supported features
        "scopes_supported": ["openid", "profile", "email", "read", "write"],
        "response_types_supported": ["code", "token", "id_token", "code token", "code id_token", "token id_token", "code token id_token"],
        "response_modes_supported": ["query", "fragment"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
        "claims_supported": [
            "sub", "iss", "aud", "exp", "iat", "name", "given_name", 
            "family_name", "email", "email_verified", "preferred_username"
        ],
        "code_challenge_methods_supported": ["S256"],  # PKCE support
    }
    
    return JsonResponse(config)


@csrf_exempt
def jwks(request):
    """
    JSON Web Key Set (JWKS) endpoint.
    Returns the public keys used to verify JWT signatures.
    """
    from django.core.cache import cache
    
    # Try to get from cache first
    cache_key = 'oidc_jwks'
    jwks_dict = cache.get(cache_key)
    
    if jwks_dict is None:
        # Generate JWKS from the private key
        private_key_pem = settings.OAUTH2_PROVIDER.get('OIDC_RSA_PRIVATE_KEY')
        
        if not private_key_pem:
            return JsonResponse(
                {'error': 'JWKS not configured'},
                status=500
            )
        
        # Load private key and extract public key
        key = jwk.JWK.from_pem(private_key_pem.encode('utf-8'))
        
        # Export public key
        public_key = key.export_public()
        public_key_dict = json.loads(public_key)
        
        # Add key ID (kid) - use thumbprint
        public_key_dict['kid'] = generate_key_id(public_key_dict)
        public_key_dict['use'] = 'sig'
        public_key_dict['alg'] = 'RS256'
        
        jwks_dict = {
            'keys': [public_key_dict]
        }
        
        # Cache for 1 hour
        cache.set(cache_key, jwks_dict, 3600)
    
    return JsonResponse(jwks_dict)
    """
    Override the default DOT discovery to advertise end_session_endpoint.
    """
    base_o = request.build_absolute_uri('/o').rstrip('/')
    base_oidc = request.build_absolute_uri('/oidc').rstrip('/')

    config = {
        "issuer": base_o,
        "authorization_endpoint": f"{base_o}/authorize",
        "token_endpoint": f"{base_o}/token",
        "userinfo_endpoint": f"{base_oidc}/userinfo",
        "jwks_uri": f"{base_oidc}/.well-known/jwks.json",
        "end_session_endpoint": f"{base_oidc}/logout",
        "scopes_supported": ["openid", "profile", "email", "read", "write"],
        "response_types_supported": ["code"],
        "response_modes_supported": ["query", "fragment"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
        "claims_supported": [
            "sub", "iss", "aud", "exp", "iat", "name", "given_name",
            "family_name", "email", "email_verified", "preferred_username"
        ],
        "code_challenge_methods_supported": ["S256"],
    }
    return JsonResponse(config)


@csrf_exempt
def userinfo(request):
    """
    UserInfo endpoint - returns user information based on access token.
    Requires valid access token in Authorization header.
    """
    from oauth2_provider.models import get_access_token_model
    from oauth2_provider.views.mixins import ProtectedResourceMixin
    
    # Validate the access token
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return JsonResponse(
            {'error': 'invalid_token', 'error_description': 'Missing or invalid authorization header'},
            status=401
        )
    
    token = auth_header.split(' ')[1]
    
    try:
        AccessToken = get_access_token_model()
        access_token = AccessToken.objects.select_related('user').get(token=token)
        
        # Check if token is expired
        if not access_token.is_valid():
            return JsonResponse(
                {'error': 'invalid_token', 'error_description': 'Token has expired'},
                status=401
            )
        
        user = access_token.user
        scopes = access_token.scope.split()
        
        # Build userinfo response based on scopes
        userinfo = {
            'sub': str(user.id),
        }
        
        if 'email' in scopes:
            userinfo['email'] = user.email
            userinfo['email_verified'] = True
        
        if 'profile' in scopes:
            userinfo['name'] = user.get_full_name()
            userinfo['given_name'] = user.first_name
            userinfo['family_name'] = user.last_name
            userinfo['preferred_username'] = user.username
        
        return JsonResponse(userinfo)
        
    except AccessToken.DoesNotExist:
        return JsonResponse(
            {'error': 'invalid_token', 'error_description': 'Token not found'},
            status=401
        )


@csrf_exempt
def logout(request):
    """OIDC end session endpoint.

    Behavior:
    - If the caller is authenticated via session, it will log out the Django session.
    - If an access token is presented (Authorization: Bearer ...), it will revoke that
      access token and any associated refresh tokens for the same user and client.
    - Supports optional ``post_logout_redirect_uri`` for RP-initiated logout.
    """
    from django.contrib.auth import logout as django_logout
    from oauth2_provider.models import get_access_token_model, RefreshToken
    
    print("Logout endpoint called")

    redirect_uri = request.GET.get('post_logout_redirect_uri') or request.POST.get('post_logout_redirect_uri')
    state = request.GET.get('state') or request.POST.get('state')

    # Try to identify user/application from bearer token (if provided)
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    token_str = None
    if auth_header.startswith('Bearer '):
        token_str = auth_header.split(' ', 1)[1]

    user = None
    application = None

    AccessToken = get_access_token_model()
    if token_str:
        try:
            access_token = AccessToken.objects.select_related('application', 'user').get(token=token_str)
            user = access_token.user
            application = access_token.application
            # revoke the access token
            access_token.expires = timezone.now()
            access_token.save(update_fields=['expires'])
            # revoke related refresh tokens for this app/user
            RefreshToken.objects.filter(user=user, application=application).delete()
            logger.info("Logout: revoked access/refresh for user %s app %s", user, application)
        except AccessToken.DoesNotExist:
            # ignore silently; still proceed to session logout if any
            pass

    # Logout session user if present
    if request.user.is_authenticated:
        user = user or request.user
        django_logout(request)
        logger.info("Logout: cleared session for user %s", user)

    # If redirect requested, perform 302
    if redirect_uri:
        if state:
            sep = '&' if '?' in redirect_uri else '?'
            redirect_uri = f"{redirect_uri}{sep}state={state}"
        return HttpResponseRedirect(redirect_uri)

    return JsonResponse({
        'message': 'Logged out successfully',
    })


def generate_key_id(key_dict):
    """
    Generate a key ID (kid) from the key using SHA-256 thumbprint.
    """
    # Create thumbprint according to RFC 7638
    required_members = {
        'kty': key_dict['kty'],
        'n': key_dict['n'],
        'e': key_dict['e'],
    }
    
    # Sort keys and create JSON
    json_str = json.dumps(required_members, sort_keys=True, separators=(',', ':'))
    
    # SHA-256 hash
    hash_bytes = hashlib.sha256(json_str.encode('utf-8')).digest()
    
    # Base64url encode
    kid = base64.urlsafe_b64encode(hash_bytes).decode('utf-8').rstrip('=')
    
    return kid

