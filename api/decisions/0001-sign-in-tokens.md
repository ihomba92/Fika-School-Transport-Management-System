# 0001 · Where the sign-in tokens live

- **Status:** decided, 27 November 2026
- **Affects:** Flask (`/auth/*`, cookies, CORS), the front end's
  `src/lib/api-client.js` and `src/auth/`

## The question

Fika signs people in with JWTs (Flask-JWT-Extended): a short-lived
**access token** sent with every request, and a long-lived **refresh
token** that gets new access tokens. Where should the browser keep them?

1. **Both in `localStorage`**, as the front end did with the mock.
2. **Access token in memory, refresh token in an `HttpOnly` cookie.**

## Decision

**Option 2.**

| | What | Where | Lifetime |
|---|---|---|---|
| Access token | JWT with the user's id and role | A variable inside `api-client.js` (gone when the tab closes) | 15 minutes |
| Refresh token | Random, stored hashed in the `refresh_tokens` table | Cookie `fika_refresh`: `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth` | 30 days, rotated on every use |

How it works:

1. **Log in** (`POST /auth/login`, or Google): the answer's body has the
   user and the access token; the `Set-Cookie` header has the refresh
   token.
2. **Every request** sends `Authorization: Bearer <access token>`.
3. **The access token expires** (`401 TOKEN_EXPIRED`): `api-client.js`
   calls `POST /auth/refresh` once, even when several requests failed at
   the same time, then repeats them. The cookie goes with it; the answer
   is a new access token and a new cookie.
4. **Opening the app or reloading the page**: memory is empty, so the
   app calls `POST /auth/refresh` before showing any signed-in page. A
   working cookie signs the person straight back in; otherwise they see
   the log in page. While this runs (one request), the app shows a
   spinner.
5. **Log out** (`POST /auth/logout`): the server revokes the refresh
   token and clears the cookie.

## Why

- **A stolen refresh token is a stolen account for 30 days.** Anything in
  `localStorage` can be read by any script on the page: a compromised
  npm package, a browser extension, or an XSS bug. An `HttpOnly` cookie
  can't be read by scripts at all. Fika holds children's photos, home
  locations and live bus positions, so this matters more than usual.
- **A stolen access token is worth 15 minutes**, and only while the page
  is open. That's the cost of an XSS bug in option 2, instead of 30 days.
- **It stays easy for parents**: they are still signed in for 30 days
  on their phone, and the installed app (PWA) uses cookies like the
  browser does.
- Flask-JWT-Extended supports it directly
  (`JWT_TOKEN_LOCATION = ["headers", "cookies"]`, refresh routes with
  `@jwt_required(refresh=True, locations=["cookies"])`).

## What it costs, and how we handle it

- **CSRF.** A cookie is sent automatically, so another site could try to
  make the browser call `/auth/refresh` or `/auth/logout`. Three things
  stop it:
  - `SameSite=Strict`: the browser doesn't send the cookie from other
    sites;
  - those two requests must carry the header `X-Fika-Client: web`; a
    page on another site can't add a custom header unless CORS allows
    it, and the API's CORS only allows Fika's own address;
  - `Path=/api/v1/auth`: the cookie goes only to the auth routes, never
    with data requests (which use the `Authorization` header instead).

  So Flask-JWT-Extended's own double-submit CSRF cookie isn't needed:
  `JWT_COOKIE_CSRF_PROTECT = False`, and a small `before_request` check
  for the header on the two cookie routes.
- **Same site.** `SameSite=Strict` cookies only work when the front end
  and the API are on the same site: `fika.co.ke` and `api.fika.co.ke`, or
  one address with `/api` passed to Flask. In development, `vite.config.js`
  proxies `/api` to `http://localhost:5000`, so both are on
  `localhost:5173`.
- **Two tabs opening at once** both refresh with the same cookie. The
  first rotates it; the second would look like a stolen token being
  reused. The server accepts the previous token for 30 seconds after a
  rotation. After that, reuse of an old token revokes all of that
  person's refresh tokens (they log in again everywhere).
- **One extra request when the app opens.** Small, and it also checks
  the account still exists and has the same role.

## Flask settings

```python
JWT_TOKEN_LOCATION = ["headers", "cookies"]
JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
JWT_REFRESH_COOKIE_NAME = "fika_refresh"
JWT_REFRESH_COOKIE_PATH = "/api/v1/auth"
JWT_COOKIE_SECURE = True            # False only on http://localhost
JWT_COOKIE_SAMESITE = "Strict"
JWT_COOKIE_CSRF_PROTECT = False     # replaced by X-Fika-Client + SameSite
CORS(app, origins=[FRONTEND_ORIGIN], supports_credentials=True)
```

## Not chosen

- **Both tokens in `localStorage`**: simplest, and fine for the mock, but
  any script on the page could take a 30-day token.
- **Both tokens in cookies** (no `Authorization` header): every data
  request would then need CSRF protection too, and the driver's
  location updates would carry the cookie on every call.
