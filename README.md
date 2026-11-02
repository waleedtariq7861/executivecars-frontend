# Executive Cars: frontend

React 18 and Vite web application for Executive Cars: used-car listings, auction membership and live bidding, seller and booking workflows, the administration area, and the price predictor.

It is one of three separately deployed services:

| Service | Repository | Runs on |
|---|---|---|
| **Web application (this repository)** | executivecars-frontend | Vercel |
| API (Express, MongoDB, Socket.IO) | [executivecars-backend](https://github.com/waleedtariq7861/executivecars-backend) | Railway |
| Valuation service (FastAPI, scikit-learn) | [executivecars-ml-service](https://github.com/waleedtariq7861/executivecars-ml-service) | Railway (private network) |

The browser only ever talks to this site's own origin. `vercel.json` forwards `/api`, `/socket.io` and `/uploads` to the API, which keeps the HttpOnly session cookie first-party.

## Requirements

Node.js 22 or newer (developed and tested on 24) and npm. A running backend for anything that needs data (see the backend repository's README).

## Run locally

```bash
cp .env.example .env.local     # set VITE_DEV_SERVER_TARGET to your local backend
npm ci
npm run dev                    # http://localhost:5173
```

During development Vite forwards `/api`, `/socket.io` and `/uploads` to `VITE_DEV_SERVER_TARGET`. Leave `VITE_API_URL` and `VITE_SOCKET_URL` empty so the browser stays on one origin, as in production.

## Checks

```bash
npm test              # Vitest
npm run lint:a11y     # ESLint with accessibility rules
npm run build         # production build into dist/
```

## Deploy (Vercel)

1. Import the repository into Vercel (framework Vite, build `npm run build`, output `dist`).
2. The three rewrites in `vercel.json` (`/api/:path*`, `/socket.io/:path*`, `/uploads/:path*`) must all point at the public domain of the API on Railway. Changing that address means editing `vercel.json`, committing and deploying again: Vercel does not read it from an environment variable.
3. Set `VITE_APP_MODE=production`. Leave `VITE_API_URL`, `VITE_SOCKET_URL` and `VITE_ENABLE_DEMO_ACCOUNTS` unset.
4. Give the API the exact production origin as `CLIENT_URL`.

The full order of steps for all three services is in the backend repository's `DEPLOYMENT.md`.

## Security headers

`vercel.json` sends a Content-Security-Policy (no inline or third-party script, style or font; images only from this site, `data:`/`blob:` and Cloudinary; `connect-src 'self'`; `frame-ancestors 'none'`), `X-Content-Type-Options`, `X-Frame-Options`, a strict referrer and permissions policy, and HSTS for the pages (not for the proxied API, sockets and images). The typeface is bundled (`@fontsource-variable/inter`) instead of loaded from Google. After a deployment, open the site with the browser console open and check that no policy violation is reported; `src/utils/deployConfig.test.js` guards the policy and `index.html`.
