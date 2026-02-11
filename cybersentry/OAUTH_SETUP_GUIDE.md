# OAuth Test Setup Guide

## Backend Configuration

Your Django backend already has OIDC provider configured. The key endpoints are:
- **OpenID Configuration**: `http://localhost:8000/.well-known/openid-configuration`
- **Token Endpoint**: `http://localhost:8000/oauth2/token/`
- **User Info**: `http://localhost:8000/oidc_provider/userinfo`
- **JWKS**: `http://localhost:8000/.well-known/jwks.json`

## Frontend Setup

### 1. Install Dependencies

```bash
cd cybersentry-frontend
npm install
```

This installs:
- `oidc-client-ts`: OIDC client library
- `axios`: HTTP client for API calls

### 2. Environment Configuration

The `.env.local` file is already created with the following settings:

```env
VITE_OIDC_AUTHORITY=http://localhost:8000
VITE_OIDC_CLIENT_ID=cybersentry-frontend
VITE_OIDC_REDIRECT_URI=http://localhost:3000/callback
VITE_OIDC_SCOPES=openid profile email
VITE_API_URL=http://localhost:8000/api
```

**Important**: Update the client ID and redirect URI if you're using different values.

### 3. Backend OAuth Application Setup

You need to register the frontend app in your Django admin:

1. Start your Django backend: `python manage.py runserver`
2. Go to `http://localhost:8000/admin`
3. Navigate to **OAuth2 Provider > Applications**
4. Create a new OAuth2 Application with:
   - **Client type**: Public
   - **Authorization grant type**: Authorization code
   - **Client id**: `cybersentry-frontend`
   - **Redirect uris**: `http://localhost:3000/callback`
   - **Confidential**: Unchecked (for public clients)

### 4. CORS Configuration

Make sure your Django backend has CORS enabled in `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
]
```

### 5. Run the Frontend

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Testing the OAuth Flow

1. **Start Backend**: `python manage.py runserver`
2. **Start Frontend**: `npm run dev`
3. **Open App**: Navigate to `http://localhost:3000`
4. **Login**: Click "Sign In with OIDC"
5. **Authenticate**: You'll be redirected to the backend login page
6. **Success**: After login, user info will be displayed

## What Was Created

### Files Created:

1. **`.env.local`** - Environment configuration
2. **`src/context/AuthContext.tsx`** - OAuth context and provider
3. **`src/components/Login.tsx`** - Login UI component
4. **`src/components/Login.css`** - Styling for login
5. **`src/pages/OAuthCallback.tsx`** - OAuth callback handler
6. **`src/hooks/useNavigate.ts`** - Navigation utility hook

### Files Modified:

1. **`package.json`** - Added OAuth dependencies
2. **`src/App.tsx`** - Integrated OAuth provider and login flow

## Features Implemented

✅ OIDC Authorization Code Flow with PKCE support
✅ Automatic token refresh
✅ User info retrieval
✅ Logout functionality
✅ Protected authentication context
✅ Session persistence
✅ Error handling

## Troubleshooting

### Login redirects but nothing happens
- Check browser console for errors
- Verify the backend OIDC endpoints are accessible
- Ensure the OAuth application is registered in Django admin

### CORS errors
- Add `http://localhost:3000` to `CORS_ALLOWED_ORIGINS` in Django settings.py

### Tokens not being stored
- Check browser's localStorage (React OIDC Client uses it by default)
- Verify cookies are allowed in your browser

### User info not showing
- Ensure the `/oidc_provider/userinfo` endpoint is implemented in your backend
- Check that the token has the required scopes

## Next Steps

1. Implement API calls with the access token
2. Add protected routes for authenticated users
3. Create dedicated pages for different user roles
4. Implement token refresh logic
5. Add logout confirmation dialogs
