# oidc_provider/oauth2_backends.py
from oauth2_provider.oauth2_backends import OAuthLibCore
from oauthlib.oauth2.rfc6749.endpoints.pre_configured import Server
from .oauth2_validators import OIDCValidator


class OIDCBackend(OAuthLibCore):
    """
    Custom OAuth2 backend that supports OIDC.
    """
    def __init__(self, server=None):
        if server is None:
            validator = OIDCValidator()
            server = Server(validator)
        self.server = server
        
    def _get_token_handler(self, token_type):
        """
        Get the appropriate token handler.
        """
        return self.server.token_endpoint
