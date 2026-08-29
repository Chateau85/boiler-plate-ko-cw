# MERN authentication study

An authentication study application with an Express/MongoDB API and a React client.

## Requirements

- Node.js 22.22.2 or later
- MongoDB for manual integration testing

## Setup

Install both dependency trees:

```powershell
npm ci
npm ci --prefix client
```

Set `MONGO_URI` and a random `JWT_SECRET` of at least 32 bytes. See [SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md) and `.env.example` for the remaining options.

Start the API and Vite development server together:

```powershell
npm run dev
```

## Validation

The automated tests do not require MongoDB.

```powershell
npm test
npm run test:client
npm run build
npm audit
npm audit --prefix client
```

The server tests exercise registration input boundaries, generic login failures, secure cookie attributes, authentication, logout token revocation, configuration validation, password comparison, and JWT signing.
