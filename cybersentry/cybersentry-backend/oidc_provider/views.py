# oidc_provider/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.urls import reverse
from jwcrypto import jwk
import json
import hashlib
import base64


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
    """
    End session endpoint (logout).
    """
    from django.contrib.auth import logout as django_logout
    
    # Get post_logout_redirect_uri if provided
    redirect_uri = request.GET.get('post_logout_redirect_uri', '/')
    
    # Logout the user
    django_logout(request)
    
    return JsonResponse({
        'message': 'Logged out successfully',
        'redirect_uri': redirect_uri
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

