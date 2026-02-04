# CLAUDE.md

Project context and conventions for AI coding assistants.

## Project Overview

OtsemPay is a digital banking PWA built with Next.js 15 (App Router), React 19, Tailwind CSS 4, and Framer Motion. It consists of three main areas:

1. **Customer Portal** — Mobile-first PWA optimized for iOS Safari standalone mode with a **Hyper-Premium "Liquid Glass"** design language. Handles BRL deposits/withdrawals (PIX), BRL-to-USDT conversion, USDT wallet management, and KYC.
2. **Admin Dashboard** — Desktop-first sidebar layout for managing users, KYC applications, PIX keys/transactions, USDT wallets, conversions, affiliates, and bank settings.
3. **Public Landing** — Marketing page with hero, features, pricing, and auth flows (login, register, forgot/reset password).

## Commands

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint only
npm run start        # Start production server
```

**Note:** `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are both `true` in `next.config.ts`, so `npm run build` does **not** fail on type errors or lint warnings. ESLint runs on staged files via **Husky + lint-staged** on `git commit` instead.

## Directory Structure

```
otsem-web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # Public routes (login, register, etc.)
│   │   ├── admin/                # Admin dashboard routes
│   │   ├── customer/             # Customer PWA routes
│   │   ├── layout.tsx            # Root layout (providers, splash, meta)
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css           # Global styles, animations, safe areas
│   ├── components/
│   │   ├── ui/                   # Base design system (Radix primitives)
│   │   ├── layout/               # BottomNav, MobileHeader, ActionSheet, PwaInstallPrompt
│   │   ├── modals/               # Transaction modals (deposit, withdraw, convert, etc.)
│   │   ├── auth/                 # Protected, RoleGuard, RegisterForm, 2FA
│   │   ├── sections/             # Landing page sections (hero, features, pricing, etc.)
│   │   ├── kyc/                  # KYC-related components
│   │   ├── brand/                # Logo variants
│   │   └── [root]                # CookieConsent, SplashDismiss, ServiceWorkerRegistrar, etc.
│   ├── contexts/                 # React Context providers
│   │   ├── auth-context.tsx      # JWT auth (login, 2FA, logout, token refresh)
│   │   └── actions-menu.tsx      # Action sheet state
│   ├── hooks/                    # Custom hooks
│   ├── stores/                   # Zustand stores
│   │   └── ui-modals.ts          # Modal open/close state
│   ├── lib/                      # Utility libraries
│   ├── types/                    # TypeScript types (customer.ts, wallet.ts)
│   └── i18n/                     # next-intl config
├── messages/                     # i18n translations (en, pt-BR, es, ru)
├── public/                       # Static assets, PWA icons, splash screens
├── scripts/                      # Build/utility scripts
└── .github/                      # GitHub Actions workflows
```

## Architecture

- **App Router**: Routes split into `(public)`, `admin`, and `customer` groups
- **Auth**: JWT-based via `AuthContext` (`src/contexts/auth-context.tsx`) with 2FA support (TOTP + backup codes)
- **HTTP**: Centralized Axios instance with interceptors (`src/lib/http.ts`), 30s timeout, auto 401 redirect
- **State**: Zustand for modal state (`src/stores/ui-modals.ts`), Jotai for atoms
- **Forms**: `react-hook-form` + `zod` for validation
- **Data fetching**: `swr` for cached data, Axios for mutations
- **i18n**: `next-intl` with translations in `messages/` (en, pt-BR, es, ru), locale stored in `NEXT_LOCALE` cookie
- **UI primitives**: Radix UI components wrapped in `src/components/ui/`
- **Icons**: `lucide-react`
- **Toasts**: `sonner` via `<Toaster />` in root layout
- **Crypto**: `@solana/web3.js` + `@solana/spl-token` (Solana), `tronweb` (Tron)
- **File upload**: `@uppy/*` (S3 upload for KYC documents)

## Routes

### Public Routes (`(public)` group)

| Path | Purpose |
|------|---------|
| `/` | Landing page |
| `/login` | Customer login |
| `/admin-login` | Admin login |
| `/register` | Customer registration |
| `/forgot` | Forgot password |
| `/reset` | Password reset |
| `/cookies` | Cookie policy |
| `/privacidade` | Privacy policy |

### Customer Routes (`customer` group — PWA)

| Path | Purpose |
|------|---------|
| `/customer/dashboard` | Main dashboard (balance, transactions, quick actions) |
| `/customer/wallet` | USDT wallet management |
| `/customer/transactions` | Transaction history |
| `/customer/pix` | PIX settings/keys |
| `/customer/kyc` | KYC status and upgrade |
| `/customer/settings` | Account settings |
| `/customer/support` | Support/help |
| `/customer/affiliates` | Referral program |
| `/customer/onboarding` | Onboarding flow (redirected to if `onboardingCompleted === false`) |
| `/customer/logout` | Logout |

### Admin Routes (`admin` group)

| Path | Purpose |
|------|---------|
| `/admin/dashboard` | KPIs and metrics |
| `/admin/users` | User management |
| `/admin/users/[id]` | User detail/edit |
| `/admin/clientes` | Customer management |
| `/admin/clientes/[id]/add-pix` | Add PIX key for customer |
| `/admin/kyc` | KYC applications list |
| `/admin/kyc/[id]` | KYC review detail |
| `/admin/kyc/new/pf` | Create KYC (individual - Pessoa Fisica) |
| `/admin/kyc/new/pj` | Create KYC (business - Pessoa Juridica) |
| `/admin/kyc-upgrades` | KYC upgrade requests |
| `/admin/kyc-upgrades/[id]` | Review upgrade request |
| `/admin/pix/keys` | PIX key management |
| `/admin/pix/transactions` | PIX transaction monitoring |
| `/admin/wallets` | USDT wallet management |
| `/admin/conversions` | BRL-to-USDT conversion tracking |
| `/admin/affiliates` | Affiliate management |
| `/admin/affiliates/[id]` | Affiliate detail |
| `/admin/recebidos` | Received transactions |
| `/admin/sell-deposits` | USDT sale management |
| `/admin/settings/bank` | Bank settings |

## API Integration

There is no Next.js API route or middleware. All backend calls are proxied via **Next.js rewrites** in `next.config.ts`:

```
/auth/*       → {API_URL}/auth/*
/pix/*        → {API_URL}/pix/*
/accounts/*   → {API_URL}/accounts/*
/customers/*  → {API_URL}/customers/*
/wallet/*     → {API_URL}/wallet/*
/fdbank/*     → {API_URL}/fdbank/*
/inter/*      → {API_URL}/inter/*
```

Default API base: `https://api.otsembank.com` (overridden by `NEXT_PUBLIC_API_URL` env var).

The HTTP client (`src/lib/http.ts`) adds `Authorization: Bearer {token}` to all requests unless `X-Anonymous` header is set. On 401 response, tokens are cleared and the user is redirected to `/login`.

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://api.otsembank.com       # Backend API endpoint
NEXT_PUBLIC_GATEWAY_URL=https://apisbank.brxbank.com.br  # Banking gateway
NEXT_PUBLIC_VAPID_PUBLIC_KEY=                         # Web Push notifications
```

## State Management

### Auth Context (`src/contexts/auth-context.tsx`)

- JWT tokens stored in localStorage via `src/lib/token.ts`
- User roles: `ADMIN` | `CUSTOMER`
- Supports 2FA: `login()` may return `{ requiresTwoFactor: true, tempToken }`, then call `verifyTwoFactor()`
- Auto-hydrates user from stored token on mount (decodes JWT payload)
- `logout()` clears tokens and redirects to `/login`

### Modal Store (`src/stores/ui-modals.ts` — Zustand)

Modal keys: `pix`, `convertBrlUsdt`, `convertUsdtBrl`, `sellUsdt`, `sendUsdt`, `receiveUsdt`, `deposit`, `withdraw`

Methods: `openModal()`, `closeModal()`, `toggleModal()`, `closeAll()`, `triggerRefresh()`, `triggerDepositBoost()`

The `depositBoostUntil` field enables a 2-minute polling boost after a deposit to detect incoming PIX payments faster.

## Key Conventions

### Design Language — Liquid Glass

The UI follows an Apple-inspired "Liquid Glass" aesthetic with layered glassmorphism, spring physics, and edge-to-edge gradients. **This applies only to the customer portal.** The admin dashboard uses a standard light-themed Radix/shadcn sidebar layout.

#### Background

The app uses a fixed 120dvh vivid purple-to-black gradient (`fintech-bg-layer`) that extends behind the iOS status bar and home indicator for true edge-to-edge fullscreen. The gradient is defined in `globals.css` with 11 stops from `#7B22FF` to `#000000`.

- `html` background: `#000000` (fallback, matches gradient bottom)
- `body` background: `transparent` (lets gradient show through)
- The gradient layer is placed **outside** the flex layout wrapper in `customer/layout.tsx`
- Customer layout locks body scroll (`position: fixed`) and uses a single `overflow-y-auto` scroll container

#### Glassmorphism Tiers

| Tier | Blur | Saturate | Usage |
|------|------|----------|-------|
| Standard | `blur(20px)` | `180%` | `.ios-glass`, cards |
| Rich | `blur(40px)` | `200%` | `.rich-glass`, `.liquid-glass` |
| Ultra | `blur(64px)` | `200%` | `.liquid-glass-dock`, premium card |

#### Color System

Brand purple is `#6F00FF`. Supporting shades:

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#6F00FF` | Buttons, text, accents |
| Medium | `#8B2FFF` | Gradient endpoints, dark mode |
| Light | `#9B4DFF` | Lighter gradient endpoints |
| Dark | `#5800CC` | Hover states on buttons |

**Do NOT use double-opacity Tailwind classes** like `bg-[#6F00FF]/50/10` — they produce broken output. Use single opacity: `bg-[#6F00FF]/10`.

For button gradients: `from-[#6F00FF] to-[#6F00FF]` with hover `hover:from-[#5800CC] hover:to-[#6F00FF]`.

For text gradients: `from-[#6F00FF] to-[#8B2FFF]` (vibrant, not washed).

#### Typography

- Font stack: SF Pro Display / SF Pro Text via `-apple-system, BlinkMacSystemFont`
- Text rendering: `-webkit-font-smoothing: antialiased`, `font-feature-settings: "kern" 1, "liga" 1, "calt" 1`
- **All customer-facing text is white** — no grey (`#94A3B8`) or low-opacity (`white/40`, `white/35`) text on the purple gradient background
- Inactive navigation labels: `text-white/70` (not dimmer)

#### Animation System

All touch interactions use Framer Motion spring physics:

| Context | Config |
|---------|--------|
| Touch feedback | `whileTap={{ scale: 0.97 }}`, spring `stiffness: 500, damping: 25` |
| Page transitions | spring `stiffness: 380, damping: 30, mass: 0.8` |
| Scroll-hide nav | spring `stiffness: 400, damping: 35, mass: 0.8` |
| Apple easing (CSS) | `cubic-bezier(0.32, 0.72, 0, 1)` |

CSS animations in `globals.css`:
- `shimmer` — sweeping light reflection (`animate-ios-shimmer` class with `::before` pseudo-element)
- `liquid-shimmer` / `liquid-breathe` — dock ambient effects
- `fade-in`, `ios-bounce`, `ios-pulse`, `float`, `ios-scale-in`, `ios-slide-up`, `ios-blur-in`, `subtle-float`, `gradient-shift`
- `glassBreath`, `pulseGlow` — glass morphism effects

### Safari `env()` Bug

Safari ignores `env(safe-area-inset-*)` in React inline `style` props. Always use CSS classes from `globals.css`:

- `.pwa-header-premium` — Header safe area: `calc(env(safe-area-inset-top) + 2rem)` top, `1.5rem` bottom
- `.pwa-dock-safe-bottom` — Content padding above floating dock: `calc(1.5rem + env(safe-area-inset-bottom))`
- `.pwa-sheet-safe-bottom` — Bottom sheet padding
- `.pwa-install-prompt-bottom` — PWA install prompt positioning

### Modals = BottomSheet (not Dialog)

All customer-facing modals use `BottomSheet` (`src/components/ui/bottom-sheet.tsx`), not `Dialog`. This component:

- Uses `visualViewport` API to resize when iOS keyboard opens
- Has spring animation (stiffness: 420, damping: 36)
- Supports drag-to-dismiss
- Auto-scrolls focused inputs into view
- Uses `max-h-[92dvh]` (not `vh`) for keyboard awareness
- Shadow: `0 -20px 40px -10px rgba(0,0,0,0.5)`

### Page Transitions

Customer layout (`src/app/customer/layout.tsx`) uses Framer Motion spring transitions:

```
initial: { opacity: 0, y: 6, scale: 0.97 }
animate: { opacity: 1, y: 0, scale: 1 }
exit:    { opacity: 0, scale: 0.97 }
spring:  { stiffness: 380, damping: 30, mass: 0.8 }
```

The scroll container resets to top on pathname change. The `AnimatePresence` is inside the scroll container (header + content scroll together, no fixed header).

### Customer Layout Scroll Model

The customer layout uses a **single scroll container** pattern to avoid iOS double-scroll bugs:

1. Body is locked (`position: fixed`, `overflow: hidden`, `height: 100dvh`)
2. A single `div[data-scroll-container]` with `overflow-y-auto` owns all scrolling
3. Header (`MobileHeader`) scrolls with content (collapses naturally)
4. `BottomNav` floats above via `position: fixed`
5. Scroll position resets on page navigation via `scrollRef`

### Bottom Nav — Floating Liquid Glass Dock

`BottomNav` (`src/components/layout/BottomNav.tsx`) is a floating pill-shaped dock:

- 72px height, `rounded-full`, 92% viewport width, max 400px
- Positioned `fixed bottom-8` centered with `left-1/2 -translate-x-1/2`
- Uses `.liquid-glass-dock` CSS class: `blur(64px) saturate(200%)`, gradient border via `mask-composite` pseudo-element
- Animated glow orb (`layoutId="active-pill"`) slides behind active tab
- Scroll-aware auto-hide with spring-animated translateY
- Center FAB opens `ActionSheet` for quick actions (deposit, withdraw, convert, send, sell)

### Header

`MobileHeader` (`src/components/layout/MobileHeader.tsx`):

- Uses `.pwa-header-premium` for safe area padding
- 48px logo (`object-contain`, no frame/border-radius)
- Greeting: `text-[17px] font-semibold text-white`
- Name: `text-[22px] font-bold text-white tracking-tight`
- Bell/User icons: `text-white/90`, `w-10 h-10` circular buttons with `whileTap={{ scale: 0.97 }}`

### Admin Layout

`src/app/admin/layout.tsx`:

- Wrapped in `Protected` + `RoleGuard` (only `ADMIN` role allowed)
- Uses `SidebarProvider` with 19rem sidebar (`AppSidebar` component)
- Auto-generated breadcrumbs from URL segments
- Header with `SidebarTrigger`, `LanguageSwitcher`, `HeaderUserChip`, logout button

### Theme

Default theme is `light` (set in `ThemeProvider` in `src/app/layout.tsx`). The PWA theme color is `#6F00FF`.

## Utility Libraries

| File | Purpose |
|------|---------|
| `src/lib/http.ts` | Axios client with auth interceptors, 30s timeout |
| `src/lib/token.ts` | localStorage management for JWT access/refresh tokens |
| `src/lib/env.ts` | Environment variable loading with fallbacks |
| `src/lib/formatters.ts` | Phone, CEP (ZIP), date, currency formatting |
| `src/lib/pix.ts` | PIX API wrappers (`pixPost()`, `pixGet()`) |
| `src/lib/2fa.ts` | TOTP/backup code generation (`otplib`) |
| `src/lib/haptics.ts` | Haptic feedback for mobile devices |
| `src/lib/utils.ts` | `cn()` class merge utility (clsx + tailwind-merge) |
| `src/lib/cep.ts` | ZIP code validation and lookup |
| `src/lib/viacep.ts` | ViaCEP API client for Brazilian address lookup |
| `src/lib/error-utils.ts` | Error handling and formatting utilities |
| `src/lib/push-notifications.ts` | Web Push notification setup (VAPID) |
| `src/lib/useUsdtRate.ts` | Hook for USDT/BRL exchange rate |

## Custom Hooks

| File | Purpose |
|------|---------|
| `src/hooks/use-health-check.ts` | API health status checking |
| `src/hooks/use-mobile.ts` | Mobile device detection |

## TypeScript Types

### Customer (`src/types/customer.ts`)

```typescript
type CustomerResponse = {
    id: string;
    type: "PF" | "PJ";     // Pessoa Fisica (individual) | Pessoa Juridica (business)
    accountStatus: string;
    onboardingCompleted: boolean;
    phoneVerified: boolean;
    cpfVerificationStatus: "not_started" | "pending" | "verified" | "failed";
    name?: string;
    cpf?: string;            // Brazilian individual tax ID
    cnpj?: string;           // Brazilian business tax ID
    email: string;
    phone?: string;
    birthday?: string;
    address?: CustomerAddress;
    createdAt: string;
}
```

### Wallet (`src/types/wallet.ts`)

```typescript
type Fiat = "BRL";
type Crypto = "USDT";
type ConvertDirection = "BRL_TO_USDT" | "USDT_TO_BRL";
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout with providers (Auth, Theme, i18n, Toaster, Splash) |
| `src/app/customer/layout.tsx` | Customer layout: single-scroll container, header, transitions, dock, modals |
| `src/app/admin/layout.tsx` | Admin layout: sidebar, breadcrumbs, role guard |
| `src/app/customer/dashboard/page.tsx` | Main customer dashboard |
| `src/app/globals.css` | CSS variables, safe area classes, liquid glass styles, keyframes |
| `src/contexts/auth-context.tsx` | JWT auth context with 2FA support |
| `src/stores/ui-modals.ts` | Zustand store for modal open/close state |
| `src/lib/http.ts` | Axios client with auth interceptors |
| `src/components/layout/MobileHeader.tsx` | Premium header with safe area, greeting, icons |
| `src/components/layout/BottomNav.tsx` | Floating liquid glass dock with glow orb |
| `src/components/layout/ActionSheet.tsx` | Quick actions (deposit, withdraw, convert, send, sell) |
| `src/components/ui/bottom-sheet.tsx` | Base bottom sheet with iOS keyboard handling |
| `src/components/modals/deposit-modal.tsx` | PIX deposit flow with QR code and polling |
| `src/components/modals/withdraw-modal.tsx` | PIX withdrawal to external account |
| `src/components/modals/convert-modal.tsx` | BRL to USDT conversion |
| `src/components/modals/sell-usdt-modal.tsx` | USDT to BRL sale |
| `src/components/modals/send-usdt-modal.tsx` | USDT external transfer |
| `src/components/modals/ReceiveUsdtModal.tsx` | Receive USDT instructions |
| `src/components/modals/kyc-upgrade-modal.tsx` | KYC document upload |
| `src/components/layout/PwaInstallPrompt.tsx` | iOS "Add to Home Screen" prompt |
| `src/components/app-sidebar.tsx` | Admin sidebar navigation |
| `src/components/auth/Protected.tsx` | Route protection wrapper |
| `src/components/auth/RoleGuard.tsx` | Admin/Customer role enforcement |
| `public/manifest.json` | PWA manifest (standalone, shortcuts, icons) |
| `public/sw.js` | Service worker |
| `next.config.ts` | API rewrites, standalone output, next-intl plugin |

## PWA Configuration

- `public/manifest.json` — name: "Otsem Pay", display: standalone, start_url: `/customer/dashboard`, theme_color: `#6F00FF`, background_color: `#0a0118`
- PWA shortcuts: Depositar (deposit), Transacoes (transactions), Carteira (wallet)
- `public/apple-touch-icon.png` (180x180), `icon-192.png`, `icon-512.png`, `icon-1024.png` — with maskable variants
- `public/splash/` — 11 iOS splash screens for different device sizes
- `src/app/layout.tsx` — meta tags: `apple-mobile-web-app-capable`, viewport-fit cover, `statusBarStyle: "black-translucent"`
- Splash screen: inline `#splash-screen` div with matching purple gradient, dismissed by `SplashDismiss` component on hydration
- `src/components/ServiceWorkerRegistrar.tsx` — registers `sw.js`
- `src/components/CookieConsent.tsx` — hidden in PWA standalone mode
- `src/components/layout/PwaInstallPrompt.tsx` — iOS Safari detection, localStorage persistence

## i18n

- **Supported locales**: `pt-BR` (default), `en`, `es`, `ru`
- **Config**: `src/i18n/request.ts` using `next-intl/server`
- **Locale source**: `NEXT_LOCALE` cookie, falls back to `pt-BR`
- **Message files**: `messages/{locale}.json` with keys: `common`, `nav`, `sidebar`, `userMenu`, `auth`, etc.
- **Admin UI**: Uses `LanguageSwitcher` component in header
- **Usage**: `useTranslations()` hook in client components, `getTranslations()` in server components

## Linting

ESLint runs via **Husky pre-commit hook** + **lint-staged** (not during build). Key rules:

- `@typescript-eslint/no-explicit-any` — **error**: use `unknown` instead of `any`
- `@typescript-eslint/no-unused-vars` — **warn**: unused vars must be prefixed with `_` (also ignores rest siblings)
- `no-console` — **warn**: only `console.warn` and `console.error` allowed
- `react/no-unescaped-entities` — use `&ldquo;` / `&rdquo;` for quotes in JSX

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.5.11 | Framework (App Router, standalone output) |
| `react` / `react-dom` | 19.0.0 | UI library |
| `tailwindcss` | ^4.1.13 | Utility-first CSS |
| `framer-motion` | ^12.23.24 | Spring physics animations |
| `zustand` | ^5.0.8 | Global state (modals) |
| `jotai` | ^2.13.1 | Atomic state |
| `axios` | ^1.11.0 | HTTP client |
| `swr` | ^2.3.6 | Data fetching with caching |
| `next-intl` | ^4.8.0 | Internationalization |
| `react-hook-form` | ^7.63.0 | Form state management |
| `zod` | ^4.1.11 | Schema validation |
| `@radix-ui/*` | various | Accessible UI primitives |
| `lucide-react` | ^0.542.0 | Icon library |
| `sonner` | ^2.0.7 | Toast notifications |
| `@solana/web3.js` | ^1.98.4 | Solana blockchain |
| `tronweb` | ^6.1.1 | Tron blockchain |
| `@uppy/*` | ^5.x | File upload (S3) |
| `otplib` | ^13.2.1 | TOTP 2FA |
| `qrcode` / `qrcode.react` | various | QR code generation |
| `date-fns` / `dayjs` | various | Date utilities |
| `husky` | ^9.1.7 | Git hooks |
| `lint-staged` | ^16.2.7 | Pre-commit lint |

## Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`). Always use `@/` imports.
