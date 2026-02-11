# oidc_provider/oauth2_validators.py
from oauth2_provider.oauth2_validators import OAuth2Validator
from oauth2_provider.models import get_application_model
import logging

logger = logging.getLogger(__name__)


class OIDCValidator(OAuth2Validator):
    """
    Extended OAuth2 validator that adds OIDC claims to tokens.
    """
    
    def get_additional_claims(self, request):
        """
        Add OIDC claims to the ID token.
        These claims are returned when 'openid' scope is requested.
        """
        claims = {}
        
        # Add user info claims based on requested scopes
        if request.user and hasattr(request, 'scopes'):
            scopes = request.scopes
            
            # OpenID Connect standard claims
            if 'openid' in scopes:
                claims['sub'] = str(request.user.id)
            
            if 'email' in scopes:
                claims['email'] = request.user.email
                claims['email_verified'] = True  # Set based on your logic
            
            if 'profile' in scopes:
                claims['name'] = request.user.get_full_name()
                claims['given_name'] = request.user.first_name
                claims['family_name'] = request.user.last_name
                claims['preferred_username'] = request.user.username
                # Add more profile claims as needed
                # claims['picture'] = request.user.profile.avatar_url
                # claims['locale'] = request.user.profile.locale
        
        return claims
    
    def get_id_token(self, token, token_handler, request):
        """
        Generate the ID token for OIDC.
        Called when 'openid' scope is requested.
        """
        from oauth2_provider.models import get_access_token_model
        import time
        
        AccessToken = get_access_token_model()
        
        # Get the access token object
        try:
            access_token = AccessToken.objects.get(token=token['access_token'])
        except AccessToken.DoesNotExist:
            logger.error(f"Access token not found: {token['access_token']}")
            return None
        
        # Build ID token claims
        id_token = {
            'iss': request.build_absolute_uri('/'),  # Issuer
            'sub': str(access_token.user.id),  # Subject (user ID)
            'aud': access_token.application.client_id,  # Audience
            'exp': int(access_token.expires.timestamp()),  # Expiration time
            'iat': int(time.time()),  # Issued at
        }
        
        # Add additional claims based on scopes
        scopes = access_token.scope.split()
        
        if 'email' in scopes:
            id_token['email'] = access_token.user.email
            id_token['email_verified'] = True
        
        if 'profile' in scopes:
            id_token['name'] = access_token.user.get_full_name()
            id_token['given_name'] = access_token.user.first_name
            id_token['family_name'] = access_token.user.last_name
            id_token['preferred_username'] = access_token.user.username
        
        return id_token
    
    def finalize_id_token(self, id_token, token, token_handler, request):
        """
        Final processing of ID token before signing.
        Add nonce if present in the authorization request.
        """
        if hasattr(request, 'nonce') and request.nonce:
            id_token['nonce'] = request.nonce
        
        return id_token
