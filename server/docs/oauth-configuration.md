# OAuth / OIDC Provider Configuration

CabbageMeet supports three OAuth/OIDC providers: Google, Microsoft, and a
configurable generic OIDC provider. All environment variables are set in
`server/.env` (or `server/.development.env` in development).

---

## Redirect URIs

OAuth callbacks use fixed paths under the server's `PUBLIC_URL`. Register
these redirect URIs in each provider's developer console:

| Provider     | Redirect URI                      |
| ------------ | --------------------------------- |
| Google       | `{PUBLIC_URL}/redirect/google`    |
| Microsoft    | `{PUBLIC_URL}/redirect/microsoft` |
| Generic OIDC | `{PUBLIC_URL}/redirect/oidc`      |

Example: if `PUBLIC_URL=https://meet.example.com`, register
`https://meet.example.com/redirect/google` in the Google Cloud Console.

---

## Google OAuth2

Google OAuth2 provides sign-in via Google accounts and Google Calendar
integration.

| Variable                      | Required | Description                                                                                                          |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `OAUTH2_GOOGLE_ENABLED`       | No       | Explicitly enable/disable. If unset, inferred from `OAUTH2_GOOGLE_CLIENT_ID` presence. Set to `"true"` or `"false"`. |
| `OAUTH2_GOOGLE_CLIENT_ID`     | Yes      | OAuth2 client ID from Google Cloud Console                                                                           |
| `OAUTH2_GOOGLE_CLIENT_SECRET` | Yes      | OAuth2 client secret from Google Cloud Console                                                                       |
| `OAUTH2_GOOGLE_REDIRECT_URI`  | Yes      | Must match exactly what is registered in Google Cloud Console (typically `{PUBLIC_URL}/redirect/google`)             |

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add the redirect URI: `{PUBLIC_URL}/redirect/google`
4. Enable the **Google Calendar API** in the API Library
5. Copy the Client ID and Client Secret

### Scopes Used

- `openid` — OIDC authentication
- `https://www.googleapis.com/auth/userinfo.profile` — user name
- `https://www.googleapis.com/auth/userinfo.email` — user email
- `https://www.googleapis.com/auth/calendar.events.owned` — calendar integration

---

## Microsoft OAuth2

Microsoft OAuth2 provides sign-in via Microsoft accounts (personal and
work/school) and Outlook Calendar integration.

| Variable                            | Required | Description                                                                                      |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `OAUTH2_MICROSOFT_ENABLED`          | No       | Explicitly enable/disable. If unset, inferred from `OAUTH2_MICROSOFT_CLIENT_ID` presence.        |
| `OAUTH2_MICROSOFT_CLIENT_ID`        | Yes      | Application (client) ID from Azure AD                                                            |
| `OAUTH2_MICROSOFT_REDIRECT_URI`     | Yes      | Must match exactly what is registered in Azure AD                                                |
| `OAUTH2_MICROSOFT_TENANT_ID`        | No       | `"consumers"` for personal accounts only (default), `"common"` for both work/school and personal |
| `OAUTH2_MICROSOFT_CERTIFICATE`      | Yes\*    | PEM-encoded X.509 certificate for client assertion                                               |
| `OAUTH2_MICROSOFT_CERTIFICATE_PATH` | No       | Path to PEM certificate file (ignored if `OAUTH2_MICROSOFT_CERTIFICATE` is set)                  |
| `OAUTH2_MICROSOFT_PRIVATE_KEY`      | Yes\*    | PEM-encoded RSA private key for client assertion                                                 |
| `OAUTH2_MICROSOFT_PRIVATE_KEY_PATH` | No       | Path to PEM private key file (ignored if `OAUTH2_MICROSOFT_PRIVATE_KEY` is set)                  |

\* At least one source is required. Inline env vars take priority over file paths.

### Azure AD Setup

1. Go to [Azure Portal → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application (Web platform)
3. Add the redirect URI: `{PUBLIC_URL}/redirect/microsoft`
4. Under **Certificates & secrets**, upload your X.509 certificate
5. Configure API permissions → Microsoft Graph → Delegated:
   - `openid`, `profile`, `email`, `offline_access`
   - `Calendars.ReadWrite`
6. Copy the Application (client) ID

### Authentication Method

Microsoft uses **certificate-based client assertion** (not client secret).
A self-signed X.509 certificate with an RSA private key is required.

Generate a self-signed certificate:

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem \
  -days 3650 -nodes -subj "/CN=cabbagemeet"
```

Then set either:

```bash
# Inline (recommended for Docker/one-liners):
OAUTH2_MICROSOFT_CERTIFICATE=$(cat cert.pem)
OAUTH2_MICROSOFT_PRIVATE_KEY=$(cat key.pem)
```

Or:

```bash
# File paths:
OAUTH2_MICROSOFT_CERTIFICATE_PATH=/path/to/cert.pem
OAUTH2_MICROSOFT_PRIVATE_KEY_PATH=/path/to/key.pem
```

### Scopes Used

- `openid` `profile` `email` — OIDC authentication
- `offline_access` — refresh tokens
- `https://graph.microsoft.com/Calendars.ReadWrite` — calendar integration

---

## Generic OIDC

The generic OIDC provider connects to any OpenID Connect compliant identity
provider (e.g. Keycloak, Auth0, Okta, Authentik). It supports PKCE and ID
token verification via JWKS. **Calendar integration is not supported** — the
generic provider is authentication-only.

| Variable             | Required | Description                                                                                 |
| -------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `OIDC_ENABLED`       | Yes      | `"true"` to enable                                                                          |
| `OIDC_NAME`          | No       | Display name shown on login/signup buttons. Defaults to `"Generic OIDC"`.                   |
| `OIDC_DISCOVERY_URL` | Yes      | The `/.well-known/openid-configuration` URL of your IdP                                     |
| `OIDC_CLIENT_ID`     | Yes      | OAuth2 client ID registered with the IdP                                                    |
| `OIDC_CLIENT_SECRET` | Yes      | OAuth2 client secret registered with the IdP                                                |
| `OIDC_REDIRECT_URI`  | Yes      | Must match exactly what is registered with the IdP (typically `{PUBLIC_URL}/redirect/oidc`) |

### Example: Keycloak

```bash
OIDC_ENABLED=true
OIDC_NAME="Company SSO"
OIDC_DISCOVERY_URL=https://keycloak.example.com/realms/myrealm/.well-known/openid-configuration
OIDC_CLIENT_ID=cabbagemeet
OIDC_CLIENT_SECRET=abc123secret
OIDC_REDIRECT_URI=https://meet.example.com/redirect/oidc
```

### Example: Auth0

```bash
OIDC_ENABLED=true
OIDC_NAME="Auth0"
OIDC_DISCOVERY_URL=https://your-tenant.auth0.com/.well-known/openid-configuration
OIDC_CLIENT_ID=abc123
OIDC_CLIENT_SECRET=xyz789
OIDC_REDIRECT_URI=https://meet.example.com/redirect/oidc
```

### IdP Requirements

- Must support the **Authorization Code Flow** with PKCE (S256)
- Must publish a `/.well-known/openid-configuration` endpoint
- Must support `client_secret_post` token authentication
- Must expose a JWKS URI (`jwks_uri`) in discovery metadata
- Scopes used: `openid profile email offline_access`

The `sub`, `name`, and `email` claims from the ID token are used to
create or match a user account.

---

## Enable / Disable Toggles

Each provider can be explicitly toggled. When a `*_ENABLED` variable is unset,
the provider is considered enabled if its required credentials are configured:

| Scenario                   | Env vars                                                                           | Result                                      |
| -------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------- |
| Google only                | `OAUTH2_GOOGLE_CLIENT_ID=...`                                                      | Google enabled, others disabled             |
| Google explicitly disabled | `OAUTH2_GOOGLE_ENABLED=false`, `OAUTH2_GOOGLE_CLIENT_ID=...`                       | Google disabled despite credentials present |
| Generic OIDC only          | `OIDC_ENABLED=true`, `OIDC_DISCOVERY_URL=...`, all `OAUTH2_*_CLIENT_ID` vars unset | Only generic OIDC enabled                   |
| All three                  | All configured + enabled                                                           | Google, Microsoft, and generic OIDC         |
| Local auth only            | No provider configured                                                             | Email/password only                         |

---

## Client-Side Behavior

The client fetches `GET /api/server-info` on startup. The response includes
an `oidcProviders` array listing each provider's `type`, `name`, and
`enabled` status. Login and signup pages dynamically render buttons for
each enabled provider.
