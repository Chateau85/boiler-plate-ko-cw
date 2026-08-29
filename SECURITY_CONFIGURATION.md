# Security configuration

The server reads configuration from environment variables and fails before opening a port when required values are missing.

## Required variables

- `MONGO_URI`: MongoDB connection URI. Do not commit credentials.
- `JWT_SECRET`: Random JWT signing secret of at least 32 bytes. Use a secret manager in production.

## Optional variables

- `NODE_ENV`: Set to `production` to require HTTPS-only authentication cookies.
- `PORT`: HTTP port. Defaults to `5000`.
- `JWT_EXPIRES_IN`: JWT lifetime accepted by `jsonwebtoken`. Defaults to `1h`.
- `AUTH_COOKIE_MAX_AGE_MS`: Authentication cookie lifetime in milliseconds. Defaults to one hour.

Copy `.env.example` only as a reference. The application does not load `.env` files automatically; inject the variables through the shell, deployment platform, or secret manager.

MongoDB is not required for unit tests. `npm test` creates an in-memory HTTP server with a test double for the user model.

Authentication cookies are `HttpOnly` and `SameSite=Strict`; production cookies are also `Secure`. Configure login rate limiting at the reverse proxy or API gateway because the application does not contain a distributed rate limiter.
