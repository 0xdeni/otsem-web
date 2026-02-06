# Test Coverage Analysis

## Current State

**Test coverage: 0%.** The codebase has **187 source files** and **zero test files**. No test framework is installed — there are no test dependencies in `package.json`, no test scripts, no configuration files (Jest, Vitest, Playwright, Cypress), and no test utility/mock files.

The `.gitignore` includes a `# testing` section with `/coverage`, indicating testing was planned but never implemented.

---

## Recommended Test Framework Setup

For a Next.js 15 + React 19 project, the recommended stack is:

| Layer | Tool | Why |
|-------|------|-----|
| **Unit / Integration** | **Vitest** | Native ESM, fast, compatible with Next.js App Router |
| **Component** | **@testing-library/react** | Standard React component testing |
| **E2E** | **Playwright** | Cross-browser, handles PWA/mobile viewports well |

### Required Dependencies

```bash
# Unit + Integration
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# E2E
npm install -D @playwright/test
```

### Required Config Files

- `vitest.config.ts` — Vitest config with React plugin, jsdom environment, path aliases
- `vitest.setup.ts` — Setup for @testing-library/jest-dom matchers
- `playwright.config.ts` — Playwright config for E2E tests

### Required Scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test"
}
```

---

## Priority 1 — Pure Utility Functions (Highest ROI)

These modules contain pure logic with no React/browser dependencies. They are the easiest to test and carry the highest risk if broken.

### `src/lib/formatters.ts` (35 lines)

Exports `formatPhone`, `formatCep`, `formatDate`, `parseDateBR`.

**What to test:**
- Correct formatting with valid inputs (phone: `11999990000` → `(11) 99999-0000`)
- Partial inputs (typing in progress)
- Empty strings and null-ish values
- `parseDateBR` with invalid dates (Feb 30, month 13, etc.)
- `parseDateBR` boundary cases (leap years)

### `src/lib/2fa.ts` (106 lines)

Exports `generateSecret`, `generateOtpAuthUrl`, `generateQRCode`, `verifyToken`, `generateBackupCodes`, `formatBackupCode`, `isValidTotpFormat`, `isValidBackupCodeFormat`, `normalizeBackupCode`, `getCurrentToken`.

**What to test:**
- `isValidTotpFormat`: 6-digit strings only, reject letters/short/long
- `isValidBackupCodeFormat`: 8-char with/without hyphen
- `normalizeBackupCode`: strips hyphens correctly
- `formatBackupCode`: formats as XXXX-XXXX
- `generateBackupCodes`: returns correct count, each code is 8 chars
- `verifyToken`: valid token passes, expired/wrong token fails
- `generateOtpAuthUrl`: correct URI format with encoding

### `src/lib/cep.ts` (108 lines)

Exports `onlyDigits`, `isValidCep`, `isViaCepError`, `isValidViaCepResponse`, `fetchCep`, `formatCep`.

**What to test:**
- `onlyDigits`: strips non-numeric chars
- `isValidCep`: exactly 8 digits, rejects short/long/alpha
- `isViaCepError` / `isValidViaCepResponse`: type guard correctness
- `fetchCep`: mocked API success, error, abort signal cancellation
- `formatCep`: correct XXXXX-XXX format

### `src/lib/error-utils.ts` (25 lines)

Exports `toErrorMessage`.

**What to test:**
- Axios-style errors (`error.response.data.message`)
- Error objects with `message` string vs `message` array
- Special HTTP status codes (401 → session expired, 429 → rate limit)
- Fallback to default message when unrecognized error shape
- Non-Error inputs (strings, null, undefined)

### `src/lib/token.ts` (31 lines)

Exports `getAccessToken`, `getRefreshToken`, `setTokens`, `clearTokens`, `hasValidToken`.

**What to test:**
- Store and retrieve tokens from localStorage (mocked)
- `hasValidToken` returns true/false correctly
- `clearTokens` removes both access and refresh tokens
- SSR safety (no window object)

---

## Priority 2 — Auth & State Management (High Business Impact)

### `src/contexts/auth-context.tsx` (289 lines)

The core authentication context. Contains critical business logic.

**What to test:**
- `decodeJwt`: extracts payload from valid JWT, returns null for malformed tokens
- `login` flow: successful login sets user + tokens
- `login` flow: 2FA required returns `{ requiresTwoFactor: true, tempToken }`
- `verifyTwoFactor`: success sets user, failure preserves state
- `logout`: clears tokens, resets user to null
- Token hydration on mount: valid stored token → logged in, no token → null
- Error handling: network failure during login

**Testing approach:** Extract `decodeJwt` as a standalone pure function for unit testing. Test the context with `@testing-library/react` `renderHook` and mocked HTTP client.

### `src/stores/ui-modals.ts` (59 lines)

Zustand store for modal state.

**What to test:**
- `openModal('pix')` sets `pix: true`, others remain `false`
- `closeModal` / `toggleModal` work correctly
- `closeAll` resets all modal keys
- `triggerRefresh` increments counter
- `triggerDepositBoost` sets `depositBoostUntil` to ~2 minutes in future

**Testing approach:** Zustand stores are trivial to test — just call actions and assert state.

### `src/lib/http.ts` (91 lines)

Axios instance with auth interceptors.

**What to test:**
- Request interceptor adds `Authorization: Bearer {token}` header
- `X-Anonymous` header skips token injection
- Response interceptor on 401: clears tokens, redirects to `/login`
- Response interceptor ignores 401 on public routes (`/login`, `/register`)
- Timeout is configured to 30s
- Helper methods (`get`, `post`, `put`, `del`) delegate correctly

**Testing approach:** Use Vitest's mock capabilities or `msw` (Mock Service Worker) for HTTP mocking.

---

## Priority 3 — Custom Hooks (Polling, Side Effects)

### `src/hooks/use-health-check.ts` (35 lines)

**What to test:**
- Returns `isHealthy: true` on successful fetch
- Returns `isHealthy: false` on fetch failure
- Polling fires at correct interval
- Cleanup cancels interval on unmount

### `src/hooks/use-top-tokens.ts` (93 lines)

**What to test:**
- Fetches from CoinGecko, returns token data
- Handles 429 rate limiting gracefully
- AbortController cancels in-flight requests on unmount
- Polling interval respects `refreshInterval` parameter

### `src/lib/useUsdtRate.ts` (58 lines)

**What to test:**
- Fetches buy/sell rates on mount
- Pauses polling when tab is hidden (visibility API)
- Resumes polling when tab becomes visible
- Keeps previous rate values on fetch error

### `src/hooks/use-mobile.ts` (19 lines)

**What to test:**
- Returns `true` below 768px, `false` above
- Handles SSR (returns `undefined` initially)
- Cleans up event listener on unmount

**Testing approach for all hooks:** `@testing-library/react` `renderHook`, with `vi.useFakeTimers()` for polling tests and `vi.fn()` mocks for fetch/APIs.

---

## Priority 4 — Auth Components (Route Protection)

### `src/components/auth/Protected.tsx` (33 lines)

**What to test:**
- Renders children when user is authenticated
- Redirects to `/login?next={currentPath}` when not authenticated
- Shows loading state while auth is hydrating

### `src/components/auth/RoleGuard.tsx` (38 lines)

**What to test:**
- Renders children when user has correct role
- Redirects when role doesn't match
- Custom redirect path works

### `src/components/auth/RegisterForm.tsx`

Contains `validateCPF` and `validateCNPJ` — Brazilian tax ID validation with checksum algorithms.

**What to test:**
- Valid CPF passes (use known valid test CPFs)
- Invalid checksum digits fail
- All-same-digit CPFs fail (e.g., 111.111.111-11)
- Same patterns for CNPJ
- Zod schema validation for the full form

---

## Priority 5 — E2E Tests (Critical User Flows)

These should be implemented with Playwright once unit/integration tests are in place.

| Flow | What to verify |
|------|---------------|
| **Login** | Email/password → dashboard redirect, error on bad credentials |
| **Login + 2FA** | TOTP prompt appears, backup code entry works |
| **Registration** | Form validation, CPF/CNPJ check, API submission |
| **Protected routes** | Unauthenticated → redirect to login with `?next=` |
| **Admin login** | Separate admin flow, role guard enforcement |
| **Customer dashboard** | Balance display, transaction list loads, quick actions work |
| **Deposit flow** | Open modal → PIX QR code appears → polling detects payment |
| **PWA behavior** | Standalone mode detection, install prompt, safe areas |

---

## Summary — Where to Start

| Step | Action | Files |
|------|--------|-------|
| **1** | Install Vitest + testing-library, create config | `package.json`, `vitest.config.ts` |
| **2** | Unit test pure utilities | `formatters.ts`, `2fa.ts`, `cep.ts`, `error-utils.ts`, `token.ts` |
| **3** | Test auth context + HTTP interceptors | `auth-context.tsx`, `http.ts` |
| **4** | Test Zustand store | `ui-modals.ts` |
| **5** | Test custom hooks | `use-health-check.ts`, `useUsdtRate.ts`, `use-top-tokens.ts` |
| **6** | Test auth components | `Protected.tsx`, `RoleGuard.tsx`, `RegisterForm.tsx` |
| **7** | Install Playwright, write E2E tests | Login, registration, dashboard, deposit flows |

Steps 1-2 provide the highest ROI with the least setup effort. The pure utility functions in `src/lib/` are self-contained, have clear inputs/outputs, and contain logic that directly affects money formatting, authentication, and data validation — all areas where bugs have real consequences.
