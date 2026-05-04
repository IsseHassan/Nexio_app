# Nexio — Development Plan & Project Documentation

> **Status:** Active Development · Last updated: 2026-05-04
> **Stack:** React Native (Expo) · React (Vite) · Express.js · Google Gemini AI
> **Storage:** File-based JSON/JSONL (no database yet — see roadmap)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Mobile App — Completed Features](#3-mobile-app--completed-features)
4. [Web App — Completed Features](#4-web-app--completed-features)
5. [Backend — Completed Features](#5-backend--completed-features)
6. [What Is Not Done Yet](#6-what-is-not-done-yet)
7. [Next Feature Suggestions](#7-next-feature-suggestions)
8. [File Reference](#8-file-reference)

---

## 1. Project Overview

Nexio is an AI-powered product marketing platform. A seller photographs their product, and Nexio generates professional ad images in multiple styles, writes full marketplace listings (Amazon, Etsy, Instagram, TikTok), scores the images, and lets the seller publish their products to a public storefront — all without needing design or copywriting skills.

**Three components work together:**

| Component | Tech | Role |
|---|---|---|
| `Nexio_Mobile` | React Native + Expo | Seller app — capture, generate, manage, publish |
| `Nexio_Frontend` | React + Vite | Web dashboard + public storefront pages |
| `Nexio_Backend` | Express + TypeScript | AI proxy, image generation, store API, analytics |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Nexio_Mobile                           │
│  (Expo Router · Zustand · expo-file-system · NativeWind)    │
│                                                             │
│  Seller Flow:                                               │
│  Create → Generate → Kit (view/edit) → Publish to Store     │
│  Home Tab | Products Tab | Create Tab | Account Tab         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Nexio_Backend                          │
│  (Express · TypeScript · Google Gemini AI)                  │
│                                                             │
│  /api/analyze-product      → quick product read             │
│  /api/cache-image          → stores base64 in memory        │
│  /api/generate-image       → Gemini image generation        │
│  /api/generate-text        → Gemini text generation         │
│  /api/generate-listing     → multi-platform listing         │
│  /api/score-variations     → AI image scoring               │
│  /api/style-presets        → returns style library          │
│  /api/analytics/event      → event logging (JSONL)          │
│  /api/store/publish        → create/update store + kit      │
│  /api/store/manage/:userId → seller dashboard data          │
│  /api/store/:slug          → public store page data         │
│  /api/store/:slug/kit/:id  → public product page data       │
│  /api/store/:slug/kit/:id/toggle → show/hide kit            │
│  /api/store/chat           → AI sales assistant (Gemini)    │
│  /store-images/*           → static file serving            │
│                                                             │
│  Storage: data/stores.json · data/published_kits.json       │
│           data/events.jsonl · data/store-images/            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (proxy via Vite)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Nexio_Frontend                          │
│  (React 19 · Vite · Tailwind v4 · Lucide)                   │
│                                                             │
│  /             → Authenticated seller dashboard (App.tsx)   │
│  /store/:slug  → Public storefront (no auth)                │
│  /store/:slug/:kitId → Public product page (no auth)        │
└─────────────────────────────────────────────────────────────┘
```

**No traditional database.** All persistence is currently:
- Backend: JSON files in `data/` directory
- Mobile: `expo-file-system` local files in `nexio_kits/` directory

---

## 3. Mobile App — Completed Features

### 3.1 Onboarding & Auth
- **Login screen** (`app/(auth)/login.tsx`) — email input, sends magic link
- **Email verification screen** (`app/(auth)/verify.tsx`) — confirms the magic link flow
- Auth is currently **mock/placeholder** — no real token or session is enforced beyond the screen flow

### 3.2 Home Tab (`app/(tabs)/index.tsx`)
- Shows a greeting header with the user's name
- **Recent Kits** section — loads the last 3 generated kits from local history using `historyService`
- Displays real thumbnail images, product name, time-ago timestamps
- Tapping a recent kit restores it to the Zustand store and opens the Kit screen
- **Empty state** when no kits exist, with a "Create First Kit" CTA
- Refreshes on every tab focus via `useFocusEffect`

### 3.3 Create Tab (`app/(tabs)/create-tab.tsx` → `app/create.tsx`)
- Product category selector (grid of categories with icons)
- Goal picker — choose between Sales, Awareness, Engagement, etc.
- Image picker — camera or photo library
- Style selector — choose which ad style variations to generate
- Navigates to the Generate screen when ready

### 3.4 Generation Screen (`app/generate.tsx`)
- Shows a real-time progress bar (0 → 100%)
- Calls backend in parallel:
  - `analyzeService` — quick product analysis
  - `aiService` — generates each ad variation image (concurrent, rate-limited)
  - `listingService` — generates full multi-platform listing copy
- After completion, **saves the kit to local history** (`historyService.saveKit`) fire-and-forget
- Navigates to the Kit screen on success

### 3.5 Kit Screen (`app/kit.tsx`) — Main Feature Screen
This is the primary output screen. It has three tabs:

**Images Tab**
- Horizontal scrollable carousel of all generated ad variations
- Each card shows the image with its style type label (main shot, lifestyle, macro, etc.)
- AI-scored badge showing which image is "Best" based on scoring
- Status indicators: generating / completed / error
- Tap to expand to full-screen preview

**Listing Tab**
- Platform switcher: Global · Etsy · Amazon · Instagram · TikTok
- Inline editable text fields for all listing fields (title, descriptions, bullets, etc.)
- `EditableTags` component for keywords and hashtags (add/remove tags inline)
- One-tap copy button per content card
- "Copy All" button at the bottom for the current platform
- Changes persist in Zustand state

**Insights Tab** (via `InsightsPanel`)
- Shows AI-generated performance scores per image variation
- Top recommendations ranked by predicted performance
- Category-specific tips

**Header actions:**
- Globe button → navigates to Publish screen
- Download button → exports the kit as a ZIP file

### 3.6 Publish Screen (`app/publish.tsx`)
- On mount, checks if this device already has a store via `getMyStore(userId)`
- Pre-fills existing store settings if found
- Form fields: Store URL slug · Display name · Tagline · WhatsApp number · Email
- Validation: slug + name required, at least one contact method
- On publish: sends all variation images (as base64 data URIs) + listing data to backend
- **Success state:** shows live product URL + store URL
- Share buttons: WhatsApp deeplink + native Share sheet for both URLs

### 3.7 Products Tab (`app/(tabs)/products.tsx`)
- Loads all locally-saved kits from `historyService`
- Category filter chips generated dynamically from actual kit data
- Grid of product cards with real thumbnail images, image count, listing/social badges
- Tap a kit → restores it to Zustand store → opens Kit screen
- Swipe or long-press to delete with confirmation alert
- Empty state with "Create First Kit" CTA
- Refreshes on tab focus

### 3.8 Account Tab (`app/(tabs)/account.tsx`)
- Displays user profile info
- Settings placeholders (notifications, theme, etc.)
- Sign out button

### 3.9 Local History (no internet required)
- **`historyService.ts`** — fully offline, uses `expo-file-system/legacy`
- Directory: `{documentDirectory}nexio_kits/`
- `index.json` — fast-loading kit summaries (thumbnail URI, name, counts)
- `{id}/data.json` — full kit data per kit
- `{id}/{varId}.jpg` — variation images saved as real files (not stored as data URIs in JSON)
- Max 50 kits retained; oldest are trimmed automatically
- `saveKit` · `loadHistory` · `loadKitFull` · `deleteKit`

### 3.10 State Management (`src/store/adStore.ts`)
- Zustand store for the full in-progress generation session
- Fields: `selectedCategory`, `goal`, `pickedImage`, `variations`, `listingResult`, `productAnalysis`, `imageScores`, `overallBestType`, `isGenerating`
- `restoreKit(data)` — restores a full kit from history into the store so the user can re-open and edit any past kit

---

## 4. Web App — Completed Features

### 4.1 Authenticated Dashboard (`src/App.tsx`)
The web app's primary screen for sellers accessing via desktop browser.

- **Image upload** — drag-and-drop or file picker (react-dropzone)
- **Category + goal selection** — same taxonomy as mobile
- **Bulk image generation** — generates all ad style variations in parallel
  - Uses `/api/cache-image` (session) + `/api/generate-image` per variation
  - Real-time status per variation card
- **Listing panel** (`ListingPanel.tsx`) — view and copy AI-generated listing copy per platform
- **Insights panel** (`InsightsPanel.tsx`) — AI performance scores and recommendations
- **Bulk operations** (`BulkScreen.tsx`) — export all images or selected subset
- **Export** — download all images as ZIP (`exportService.ts`)
- Confetti celebration on generation complete

### 4.2 Auth Flow
- `AuthContext.tsx` — React context holding user state
- `AuthGate.tsx` — wraps the app; redirects unauthenticated users
- `AuthScreen.tsx` — email-based magic link login UI
- `VerifyEmailScreen.tsx` — post-login verification screen
- Currently uses **mock auth** (`mockAuth.ts`) — not connected to a real auth provider

### 4.3 Public Storefront (`src/components/store/StoreFront.tsx`)
Accessible at `/store/:slug` — no login required.

- Fetches store data from `GET /api/store/:slug`
- Sticky header: store name, tagline, "Share Store" button
- Responsive 2–3 column product grid with lazy-loaded images
- Each product card shows thumbnail, product name, image count
- Clicking a product navigates to `/store/:slug/:kitId`
- Contact CTA section: WhatsApp deeplink + mailto link
- AI Chat Widget embedded at the store level

### 4.4 Public Product Page (`src/components/store/ProductPage.tsx`)
Accessible at `/store/:slug/:kitId` — no login required.

- Fetches full product data from `GET /api/store/:slug/kit/:kitId`
- **Image carousel** — prev/next arrows, dot indicators, thumbnail strip
- "Contact to Buy" primary CTA — opens WhatsApp deeplink or mailto
- **Share actions** — WhatsApp share + copy link
- Bullet point highlights list
- Collapsible long description
- Keyword tags
- AI Chat Widget embedded with product-level context

### 4.5 AI Chat Widget (`src/components/store/ChatWidget.tsx`)
Floats on both storefront and product pages.

- Fixed-position floating button (bottom-right)
- Opens a 340×420 chat drawer
- Dark indigo/zinc color scheme
- Message history with role-based bubble alignment (user right, AI left)
- Posts to `POST /api/store/chat` with `storeSlug` + optional `kitId`
- Enter key submits, loading spinner while waiting
- Auto-scrolls to latest message

### 4.6 Routing (no react-router-dom)
`main.tsx` uses `window.location.pathname` detection:
- Path starts with `/store/` → render public `<StoreRouter>` (no auth)
- Any other path → render `<AuthProvider><AuthGate><App /></AuthGate></AuthProvider>`

---

## 5. Backend — Completed Features

### 5.1 AI Image Generation Pipeline
- **`POST /api/cache-image`** — stores base64 image in memory cache (30-min TTL) and returns a `sessionId`
- **`POST /api/generate-image`** — accepts `sessionId` OR `base64`+`mimeType` directly; uses Gemini image model (`gemini-2.5-flash-preview-image-generation`); concurrency-limited queue
- **`POST /api/generate-text`** — Gemini text generation (used for listing, scoring, analysis)
- **`GET /api/style-presets`** — returns all available ad style definitions

### 5.2 AI Text Services
- **`POST /api/generate-listing`** — builds a multi-platform listing (Global, Etsy, Amazon, Instagram, TikTok) using Gemini text model
- **`POST /api/score-variations`** — AI scores each image variation and ranks them by predicted performance for the category
- **`POST /api/analyze-product`** — quick product analysis from image for category confirmation and style suggestions

### 5.3 Store API
- **`POST /api/store/publish`** — creates or updates a user's store, saves images as static files, upserts kit data; validates slug uniqueness
- **`GET /api/store/manage/:userId`** — returns the seller's store info + full kit list for the mobile dashboard
- **`GET /api/store/:slug`** — public store data (kit summaries + thumbnail URLs)
- **`GET /api/store/:slug/kit/:kitId`** — full product data (all images, listing copy, contact info)
- **`PATCH /api/store/:slug/kit/:kitId/toggle`** — toggles a kit's `isPublished` flag
- **`/store-images/*`** — serves saved product images as static files

### 5.4 AI Sales Assistant (Chat)
- **`POST /api/store/chat`** — rate-limited (10 requests/min per IP using in-memory Map)
- Loads store and product context from JSON files
- Builds a system prompt with product name, description, bullets, price range, contact info
- Calls Gemini text model to answer buyer questions
- Logs every exchange to `data/chatlogs.jsonl`

### 5.5 Analytics
- **`POST /api/analytics/event`** — accepts arbitrary event objects, appends to `data/events.jsonl`
- Events include: `generate_start`, `generate_complete`, `copy_listing`, `image_score`, platform-specific copies

### 5.6 Storage (File-based)
| File | Contents |
|---|---|
| `data/stores.json` | Array of store objects (slug, displayName, contactWhatsapp, contactEmail, etc.) |
| `data/published_kits.json` | Array of kit records (storeSlug, kitId, productName, imageUrls, listing data) |
| `data/events.jsonl` | One JSON object per line, analytics events |
| `data/store-images/` | Saved product images as `.jpg` files, served statically |

---

## 6. What Is Not Done Yet

### 6.1 Database (Critical Gap)
**Current state:** All data lives in flat JSON files on disk. This will not scale and is not safe for production.

| What needs a DB | Why it matters |
|---|---|
| Stores and kits | JSON files have race conditions on concurrent writes; no indexing or querying |
| User accounts | No real user identity — mobile uses a random in-memory ID per session; web uses mock auth |
| Chat logs | JSONL append-only — cannot query or moderate |
| Analytics events | JSONL — cannot aggregate or query without reading the full file |

**Recommended DB:** PostgreSQL (via Supabase for hosted, or local `pg` for self-hosted)
**Tables needed:** `users`, `stores`, `kits`, `kit_images`, `chat_logs`, `events`

### 6.2 Real Authentication
- Mobile app: `getDeviceUserId()` returns a random in-memory ID — lost on app restart
- Web app: `mockAuth.ts` is used — no real token, no session persistence
- No JWT, no OAuth, no magic link backend implementation

**What's needed:** Supabase Auth or a custom JWT flow; store `userId` in SecureStore on mobile

### 6.3 My Store Management Tab (Mobile)
- Sellers can publish to a store but have **no mobile screen to view or manage published kits**
- No way to toggle kit visibility from mobile
- No way to view the live store URL from the app after the publish flow closes

### 6.4 Image Storage
- Product images are stored as `.jpg` files in `data/store-images/` on the backend server's local disk
- This is not suitable for production — images will be lost if the server restarts or redeploys
- **Needed:** Cloud object storage (AWS S3, Cloudflare R2, or Supabase Storage)

### 6.5 Error Recovery in Generation
- If image generation fails mid-way, there is no retry UI — the user must restart the entire flow
- Failed variations show an error badge but cannot be individually re-generated

### 6.6 Push Notifications
- No notifications when a buyer contacts via chat or WhatsApp

### 6.7 SEO for Store Pages
- Public store pages (`/store/:slug`) are rendered client-side — search engines get a blank HTML shell
- No `<meta>` tags, no Open Graph tags for social sharing previews
- **Needed:** SSR (Next.js) or pre-rendering, or at minimum a server-rendered `<head>` injection

### 6.8 Payment Integration
- Intentionally excluded from scope so far
- Buyers contact the seller via WhatsApp/email — no checkout or cart

### 6.9 Mobile Auth Persistence
- `(auth)/login.tsx` and `(auth)/verify.tsx` screens exist but the auth flow does not persist a real session across restarts

---

## 7. Next Feature Suggestions

Ordered by impact vs. implementation effort:

### Priority 1 — Fix User Identity (Blocker for everything else)
Integrate Supabase Auth (free tier) for both web and mobile.
- Mobile: use `supabase-js` + `expo-secure-store` for session persistence
- Web: replace `mockAuth.ts` with Supabase client
- Backend: validate JWT on store publish and manage routes
- **Effort:** Medium · **Impact:** Critical

### Priority 2 — My Store Tab (Mobile)
Add a 5th tab or a screen accessible from the Account tab:
- Shows the seller's live store URL with a "Share" button
- Lists all published kits with visibility toggle (Eye/EyeOff)
- "Visit Store" button opens the web storefront in the in-app browser
- Uses the existing `getMyStore(userId)` and `toggleKitVisibility()` services
- **Effort:** Low · **Impact:** High (completes the Block 7 store flow)

### Priority 3 — Database Migration
Replace JSON files with PostgreSQL (Supabase):
- Schema: `users`, `stores`, `kits`, `kit_images`
- Migrate `publishKit` route to upsert rows
- Add proper slug uniqueness constraint at DB level
- **Effort:** High · **Impact:** Required for production

### Priority 4 — Cloud Image Storage
Replace `data/store-images/` local disk with Supabase Storage or Cloudflare R2:
- On publish, upload each image to the bucket and store the public URL in the DB
- Update the `GET /api/store/:slug` and product routes to return bucket URLs directly
- Remove the `express.static` image serving
- **Effort:** Medium · **Impact:** Required for production

### Priority 5 — Individual Image Retry
In the Kit screen and generation screen, add a "Retry" button on failed variations:
- Calls the single-image generation endpoint again for only that variation
- Replaces the error state in the Zustand `variations` array
- **Effort:** Low · **Impact:** Medium (improves core UX)

### Priority 6 — SEO & Open Graph for Store Pages
Add server-rendered meta tags for public store/product pages:
- Backend serves a thin HTML shell with `<title>`, `<meta name="description">`, and `<meta property="og:*">` for each store/product URL
- The Vite SPA handles the rest client-side after hydration
- **Effort:** Medium · **Impact:** High (discoverability and social sharing)

### Priority 7 — Buyer Notification (WhatsApp Webhook)
When a buyer uses the chat widget to express intent to buy, send the seller a WhatsApp notification:
- Capture seller's WhatsApp from the store record
- Use WhatsApp Cloud API (free tier) to send a notification template
- **Effort:** Medium · **Impact:** High (closes the sales loop)

### Priority 8 — Analytics Dashboard
Build a simple analytics view for sellers:
- Mobile: "Insights" section on the Account tab
- Shows: store views (approximated from chat logs), most popular product, kit count
- Backend: aggregate `events.jsonl` (later: SQL queries after DB migration)
- **Effort:** Medium · **Impact:** Medium

### Priority 9 — Multi-Image Upload (Bulk Mode)
Allow sellers to upload multiple product photos and generate a kit for each one in a queue:
- Web app already has a `BulkScreen.tsx` skeleton
- Mobile: add a multi-select mode in the image picker step
- Backend: no changes needed (generate-image is already stateless per image)
- **Effort:** Medium · **Impact:** High for power sellers

### Priority 10 — Watermark / Branding Removal Upsell
Add a subtle "Made with Nexio" watermark to generated images for free users:
- Remove watermark for paid accounts
- This is the natural monetization hook
- **Effort:** Low (image overlay at generation time) · **Impact:** Business critical eventually

---

## 8. File Reference

### Mobile (`Nexio_Mobile/`)
| File | Purpose |
|---|---|
| `app/_layout.tsx` | Root navigation layout |
| `app/(auth)/login.tsx` | Magic link login screen |
| `app/(auth)/verify.tsx` | Email verification screen |
| `app/(tabs)/_layout.tsx` | Bottom tab bar layout |
| `app/(tabs)/index.tsx` | Home tab with recent kits |
| `app/(tabs)/create-tab.tsx` | Entry point for creation flow |
| `app/(tabs)/products.tsx` | Kit history grid |
| `app/(tabs)/account.tsx` | User profile and settings |
| `app/create.tsx` | Category + goal + image picker |
| `app/generate.tsx` | Live generation progress screen |
| `app/kit.tsx` | Kit viewer (Images / Listing / Insights tabs) |
| `app/publish.tsx` | Publish to store flow |
| `app/preview.tsx` | Full-screen image preview |
| `app/listing.tsx` | Standalone listing display |
| `src/store/adStore.ts` | Zustand global state |
| `src/services/aiService.ts` | Gemini image generation calls |
| `src/services/listingService.ts` | Listing generation (with timeout + retry) |
| `src/services/analyzeService.ts` | Quick product analysis |
| `src/services/scoringService.ts` | Image scoring |
| `src/services/historyService.ts` | Local kit persistence (expo-file-system) |
| `src/services/storeService.ts` | Store publish, manage, toggle APIs |
| `src/services/exportService.ts` | ZIP export |
| `src/services/analyticsService.ts` | Event tracking |
| `src/constants.ts` | Category definitions, ad styles |
| `src/stylePresets.ts` | Style preset library |

### Web (`Nexio_Frontend/`)
| File | Purpose |
|---|---|
| `src/main.tsx` | Vite entry — path-based routing (store vs auth app) |
| `src/App.tsx` | Authenticated seller dashboard |
| `src/auth/AuthContext.tsx` | Auth React context |
| `src/auth/AuthGate.tsx` | Auth protection wrapper |
| `src/auth/AuthScreen.tsx` | Login UI |
| `src/auth/VerifyEmailScreen.tsx` | Verification UI |
| `src/auth/mockAuth.ts` | Mock auth (placeholder) |
| `src/components/BulkScreen.tsx` | Bulk generation UI |
| `src/components/InsightsPanel.tsx` | AI scoring display |
| `src/components/ListingPanel.tsx` | Listing copy viewer |
| `src/components/store/StoreFront.tsx` | Public store page |
| `src/components/store/ProductPage.tsx` | Public product page |
| `src/components/store/ChatWidget.tsx` | AI chat widget |
| `src/services/aiService.ts` | Image generation API calls |
| `src/services/listingService.ts` | Listing API calls |
| `src/services/scoringService.ts` | Scoring API calls |
| `src/services/exportService.ts` | ZIP export |
| `src/services/analyticsService.ts` | Event tracking |

### Backend (`Nexio_Backend/`)
| File | Purpose |
|---|---|
| `server.ts` | All routes, AI integration, store API, analytics |
| `data/stores.json` | Store records |
| `data/published_kits.json` | Published kit records |
| `data/events.jsonl` | Analytics event log |
| `data/store-images/` | Saved product images (static served) |
| `.env` | `GEMINI_API_KEY`, `PORT` |

---

*This document covers Blocks 1–7 of the Nexio build. Block 8 and beyond are captured in the Next Feature Suggestions above.*
