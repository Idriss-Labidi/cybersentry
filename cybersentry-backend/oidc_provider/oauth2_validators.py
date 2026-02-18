# oidc_provider/oauth2_validators.py
from oauth2_provider.oauth2_validators import OAuth2Validator
import json
import logging
import time
import uuid
from django.conf import settings
from jwcrypto import jwk, jws

logger = logging.getLogger(__name__)


class OIDCValidator(OAuth2Validator):
    """OIDC validator that signs ID tokens using the configured RSA key."""

    def _get_signing_key(self):
        """Load RSA private key from settings (OIDC_RSA_PRIVATE_KEY)."""
        private_key_pem = settings.OAUTH2_PROVIDER.get('OIDC_RSA_PRIVATE_KEY', '')
        if not private_key_pem:
            raise ValueError('OIDC_RSA_PRIVATE_KEY is not configured')
        try:
            return jwk.JWK.from_pem(private_key_pem.encode('utf-8'))
        except Exception as exc:
            logger.error(f'Failed to load signing key: {exc}')
            raise

    def get_additional_claims(self, request):
        return {
            "given_name": request.user.first_name,
            "family_name": request.user.last_name,
            "name": ' '.join([request.user.first_name, request.user.last_name]).strip(),
            "preferred_username": request.user.username,
            "email": request.user.email,
            "role": getattr(request.user, 'role', 'user'),
            "is_staff": request.user.is_staff,
        }

    def get_id_token(self, token, token_handler, request):
        """Generate, sign, and serialize an ID token (compact JWS)."""

        now = int(time.time())
        id_token_claims = {
            'iss': settings.OAUTH2_PROVIDER.get('OIDC_ISSUER', 'http://localhost:8000'),
            'sub': str(request.user.id),
            'aud': request.client.client_id,
            'exp': now + 3600,
            'iat': now,
            'jti': str(uuid.uuid4()),
        }

        if getattr(request, 'nonce', None):
            id_token_claims['nonce'] = request.nonce

        scopes = request.scopes if hasattr(request, 'scopes') else []
        if 'email' in scopes:
            id_token_claims['email'] = request.user.email
            id_token_claims['email_verified'] = bool(request.user.email)
        if 'profile' in scopes:
            id_token_claims['name'] = request.user.get_full_name() or request.user.username
            id_token_claims['given_name'] = request.user.first_name or ''
            id_token_claims['family_name'] = request.user.last_name or ''
            id_token_claims['preferred_username'] = request.user.username

        try:
            key = self._get_signing_key()
            protected_header = json.dumps({'alg': 'RS256', 'typ': 'JWT'})
            token_obj = jws.JWS(json.dumps(id_token_claims).encode('utf-8'))
            token_obj.add_signature(key, alg='RS256', protected=protected_header)
            return token_obj.serialize(compact=True)
        except Exception as exc:
            logger.error(f'Failed to sign ID token: {exc}')
            raise