import { UserManager } from 'oidc-client-ts';
import type { UserManagerSettings } from 'oidc-client-ts';

const settings: UserManagerSettings = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI,
  response_type: 'code',
  response_mode: 'query',
  scope: import.meta.env.VITE_OIDC_SCOPES,
  post_logout_redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI,
  automaticSilentRenew: true,
  loadUserInfo: true,
  monitorSession: false,
};

const userManager = new UserManager(settings);

export default userManager;
