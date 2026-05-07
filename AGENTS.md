# AGENTS.md

## Build/Run/Test Commands

### Server (NestJS + TypeScript)

```bash
# Install dependencies
cd server && npm install

# Development (hot-reload on port 3001)
cd server && npm run start:dev

# Production build
cd server && npm run build

# Production start
cd server && npm run start:prod

# Lint
cd server && npm run lint

# Type check
cd server && npm run typecheck

# Tests (E2E only — no unit tests exist yet)
cd server && npm run test:e2e                # SQLite (in-memory)
cd server && npm run test:e2e:mariadb        # Requires MariaDB
cd server && npm run test:e2e:postgres       # Requires PostgreSQL

# Run a specific E2E test file
cd server && npx jest --config test/jest-e2e.json test/<file>.e2e-spec.ts
```

### Client (React + Create-React-App)

```bash
# Install dependencies
cd client && npm install

# Development (port 3000, proxies /api to :3001)
cd client && npm start

# Production build
cd client && npm run build

# Lint
cd client && npx eslint src/

# Type check
cd client && npx tsc --noEmit

# Unit tests (none exist — framework is Jest + Testing Library)
cd client && npm test

# E2E tests (Playwright — multi-browser)
cd client && npx playwright test
cd client && npx playwright test --project=chromium
cd client && npx playwright test --project=firefox
cd client && npx playwright test --project=webkit
```

### Docker (Monolith)

```bash
# Build monolith image (server + client)
docker build -t cabbagemeet .

# Run
docker run -p 3001:3001 --env-file server/.env cabbagemeet
```

### RTK Query Codegen

```bash
# Regenerate client API types from OpenAPI spec (server must be running)
cd client && npm run gen-api
```

## Architecture

```
cabbagemeet/
├── client/                    # React 18 + CRA + Redux Toolkit + RTK Query
│   └── src/
│       ├── App.tsx            # Root routes (react-router-dom v6)
│       ├── slices/            # Redux slices + RTK Query API
│       │   ├── emptyApi.ts    # Base API (baseUrl, JWT header injection)
│       │   ├── api.ts         # AUTO-GENERATED from OpenAPI — DO NOT EDIT
│       │   ├── enhancedApi.ts # Overrides: response transforms, cache invalidation, token management
│       │   ├── authentication.ts  # JWT token in Redux + localStorage
│       │   └── ...
│       └── components/        # React Bootstrap UI components
├── server/                    # NestJS 9 + TypeORM + Passport.js
│   └── src/
│       ├── main.ts            # Bootstrap: NestFactory, Swagger, Helmet, Morgan, CORS
│       ├── app.module.ts      # Root module — imports all feature modules
│       ├── config/            # Env validation (class-validator) + ConfigService
│       ├── auth/              # Local auth + OAuth2/OIDC controller + JWT guards
│       ├── oauth2/            # Google + Microsoft OAuth2 providers + OAuth2Service
│       ├── custom-jwt/        # JWT signing/validation/encryption + Passport strategy
│       ├── users/             # User CRUD + calendar linking/unlinking
│       ├── meetings/          # Meeting CRUD + respondents + scheduling + cleanup
│       ├── mail/              # SMTP + MailerSend email delivery (strategy pattern)
│       ├── rate-limiter/      # In-memory + Redis rate limiters
│       ├── cacher/            # In-memory + Redis cache
│       ├── server-info/       # GET /api/server-info (capabilities endpoint)
│       ├── dbconfig/          # Runtime key-value config in DB (JWT signing key)
│       ├── common-responses/  # Standardized API error response DTOs
│       └── custom-migrations/ # Index creation + cleanup migrations
├── server/migrations/         # DB migrations (sqlite/ mariadb/ postgres/ — keep in sync)
├── Dockerfile                 # Multi-stage monolith build
└── .github/workflows/ci.yml   # CI: server E2E (3 DBs) + client build + Playwright
```

## Key Patterns

### Authentication
- JWT Bearer tokens (HS256). Signed with `JWT_SIGNING_KEY` env var or auto-generated in DB `Config` table.
- Passport.js JWT strategy (`server/src/custom-jwt/jwt.strategy.ts`).
- `JwtAuthGuard` enforces authentication. `OptionalJwtAuthGuard` runs validation but allows unauthenticated access (populates `req.user` or `null`).
- Custom decorators: `@AuthUser()` returns `User`, `@MaybeAuthUser()` returns `User | null`.
- Token invalidation: `TimestampOfEarliestValidToken` on User entity — tokens with `iat` older than this are rejected ("logout everywhere").

### OAuth2 / OIDC
- Provider interface `IOAuth2Provider` defined in `oauth2-common.ts`.
- `OAuth2Service` manages the OAuth2 flow: `getRequestURL()` → redirect → `handleLogin()`.
- Redirect endpoints: `GET /redirect/google`, `GET /redirect/microsoft` (not under `/api/`).
- Account linking: `POST /confirm-link-{provider}-account` (guarded by `JwtAuthGuard`).
- **Known bug**: ID tokens are decoded with `jwt.decode()` without cryptographic verification (TODOne in code).

### Database
- TypeORM with 3 parallel backends: SQLite, MariaDB 10.5+, PostgreSQL.
- All 3 DBs have separate migration directories — keep them in sync.
- Entity name casing differs: PascalCase in code, bare table names in SQLite/Postgres.
- Cross-DB compatibility: `normalizeDBError()` in `database.utils.ts` maps driver-specific error codes.

### API Conventions
- All API routes under `/api/` (except OAuth2 redirects at `/redirect/*`).
- Swagger at `/swagger` in development. Used to generate client RTK Query hooks via `@rtk-query/codegen-openapi`.
- `server-info` endpoint controls client feature-gating (which OAuth2 providers are available, etc.).
- Rate limiting on auth endpoints and meeting creation.

### Client Data Flow
1. RTK Query `fetchBaseQuery` injects JWT Bearer token from Redux `authentication` slice.
2. Auto-generated hooks (`api.ts`) provide query/mutation hooks with full TypeScript types.
3. `enhancedApi.ts` overrides them with response transforms and cache invalidation.
4. On login/signup, token is stored in both Redux and `localStorage`.

## Common Pitfalls

- **DO NOT edit `client/src/slices/api.ts`** — it's auto-generated. Edit `enhancedApi.ts` instead.
- **Migrations must be added to all 3 DB directories** (sqlite/, mariadb/, postgres/).
- **`strictNullChecks` is `false`** in server `tsconfig.json` — explicit null guards are in the code but the compiler won't enforce them.
- **Circular dependencies** between `UsersService`, `MeetingsService`, and `OAuth2Service` are resolved via `ModuleRef` lazy injection in `onModuleInit()`.
- **Raw SQL queries** in `oauth2.service.ts` have DB-specific branches (`if mariadb` / `if postgres`). New raw SQL must handle all 3 DB types.
- **Email sending is fire-and-forget** (not awaited) in most places.
- **`class-transformer` boolean bug**: boolean env vars must be passed as strings `'true'`/`'false'`, not actual booleans.

## Env Variables (Key Ones)

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_TYPE` | required | `sqlite` / `mariadb` / `postgres` |
| `PUBLIC_URL` | required | Public-facing URL for redirects |
| `JWT_SIGNING_KEY` | auto-generated | JWT signing + encryption key |
| `OAUTH2_GOOGLE_CLIENT_ID` | — | Google OAuth2 |
| `OAUTH2_MICROSOFT_CLIENT_ID` | — | Microsoft OAuth2 |
| `VERIFY_SIGNUP_EMAIL_ADDRESS` | `true` | Email verification toggle |
| `ALLOW_ANONYMOUS_MEETING_CREATION` | `true` | Feature flag |
| `HOURLY_MEETING_CREATION_LIMIT_PER_IP` | `100` | Rate limit |
| `DELETE_MEETINGS_OLDER_THAN_NUM_DAYS` | `60` | Auto-cleanup |
| `EMAIL_DAILY_LIMIT` | `100` | Daily email cap |
| `REDIS_HOST` | — | Optional Redis for multi-instance |
| `TRUST_PROXY` | `false` | Behind reverse proxy |
