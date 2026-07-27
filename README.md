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

## Firebase authentication

Sign-in is delegated to Firebase Auth (phone OTP, and email/password linked to
the same account). Firebase only proves the user controls the identifier; the
API still issues the tokens the app runs on, via `POST /api/v1/auth/firebase`.

### Local setup

1. Copy `.env.local.example` to `.env.local` and fill the `NEXT_PUBLIC_FIREBASE_*`
   values from Firebase console → Project settings → Your apps → Web app.
2. Set `FIREBASE_PROJECT_ID` in the **API**'s `.env` to the same project id.

Leave the Firebase vars blank to fall back to the legacy backend OTP flow
(fixed code `123456`, no SMS sent). That is the recommended local default —
every real send is billed.

### Firebase console requirements

- **Authorized domains** must list every origin the app is served from
  (`localhost` is present by default; production hostnames must be added by
  hand, or phone sign-in fails there only).
- **Test phone numbers** (Authentication → Sign-in method → Phone) give a fixed
  number/code pair that never sends an SMS and never consumes quota — use these
  for staging and demo accounts.
- **SMS region policy** is restricted to India. Numbers outside +91 are rejected
  by Firebase, not by us.

### Things that bite

- Phone sign-in on web **requires reCAPTCHA**. It is invisible in the happy
  path, but the container div must exist before sign-in is called — both login
  pages render one (`RECAPTCHA_CONTAINER_ID`).
- The verifier is a module-level singleton in `src/lib/firebase.ts` so React
  StrictMode's double-invoked effects do not render two widgets into one
  container. Any failed send calls `resetRecaptcha()`; a spent verifier cannot
  be reused, so skipping that makes every retry fail.
- `NEXT_PUBLIC_*` are inlined at build time. The machine running `next build`
  needs them — setting them on the deployed environment is too late.
