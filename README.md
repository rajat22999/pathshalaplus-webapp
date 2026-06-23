# Pathshala Plus — Web App

Next.js (App Router) + TypeScript + Tailwind CSS frontend for Pathshala Plus.
Implements **mobile + OTP** sign-in against the backend API, with JWT access /
refresh tokens and transparent token refresh.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **axios** API client with auto-refresh-on-401 interceptor

## Project layout

```
src/
├── app/
│   ├── layout.tsx          # wraps the app in <AuthProvider>
│   ├── page.tsx            # redirects to /login or /dashboard
│   ├── login/page.tsx      # two-step mobile → OTP form
│   └── dashboard/page.tsx  # protected; shows the user + logout
├── components/ui/          # Button, Input, Card, Spinner
├── config/env.ts           # NEXT_PUBLIC_API_BASE_URL
├── hooks/use-auth.ts
├── lib/
│   ├── api/client.ts       # axios instance + refresh interceptor
│   ├── api/auth.ts         # requestOtp / verifyOtp / refresh / me / logout
│   └── tokens.ts           # localStorage token store
├── providers/auth-provider.tsx
└── types/auth.ts
```

## Quickstart

```bash
cd pathshalaplus-webapp
npm install
cp .env.local.example .env.local   # already present by default
npm run dev                        # http://localhost:3000
```

> The backend must be running on **http://localhost:8000** (see
> `../pathshalaplus-api`). Start it with `uv run uvicorn app.main:app --reload`.

### Sign-in flow

1. Open http://localhost:3000 → redirected to **/login**.
2. Enter any mobile number → **Send OTP**.
3. The dev OTP `123456` is prefilled (the API returns it while `DEBUG=true`).
4. **Verify & continue** → redirected to **/dashboard**.

## Configuration

| Variable                   | Default                 | Purpose                          |
| -------------------------- | ----------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend base URL (no `/api/v1`). |

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

## Notes

Tokens are stored in `localStorage` and refreshed automatically when the access
token expires (the axios interceptor calls `/auth/refresh` and retries). For
production hardening, consider moving the refresh token to an httpOnly cookie —
only `src/lib/tokens.ts` and the interceptor would need to change.
