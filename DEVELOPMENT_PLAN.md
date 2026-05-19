# Nexio — Development Plan & Project Documentation

> **Status:** Active Development · Last updated: 2026-05-20
> **Stack:** React Native (Expo) · React (Vite) · Express.js · Google Gemini AI · MongoDB Atlas · Cloudinary
> **Auth:** JWT (bcrypt + 30-day tokens) · persisted via expo-file-system on mobile

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

Nexio is an AI-powered product marketing platform. A seller photographs their product, and Nexio generates professional ad images in multiple styles, writes full marketplace listings (Amazon, Etsy, Instagram, TikTok), scores the images, generates product videos, and lets the seller publish their products to a public storefront — all without needing design or copywriting skills.

**Three components work together:**

| Component | Tech | Role |
|---|---|---|
| `Nexio_Mobile` | React Native + Expo | Seller app — capture, generate, manage, publish |
| `Nexio_Frontend` | React + Vite | Web dashboard + public storefront pages |
| `Nexio_Backend` | Express + TypeScript MVC | AI proxy, image/video generation, store API, analytics |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Nexio_Mobile                           │
│  (Expo Router · Zustand · expo-file-system · NativeWind)    │
│                                                             │
│  Seller Flow:                                               │
│  Create → Generate → Kit (view/edit) → Publish to Store     │
│  Home | AI Tools | Create | Products | Account              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST) + Bearer JWT
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Nexio_Backend  (MVC)                   │
│  (Express · TypeScript · Google Gemini AI · Meshy 3D)       │
│                                                             │
│  Auth:                                                      │
│  POST /api/auth/signup   → register + return JWT            │
│  POST /api/auth/login    → login + return JWT               │
│  GET  /api/auth/me       → validate token, return user      │
│                                                             │
│  Kit Cloud Sync (requires JWT):                             │
│  POST   /api/kits        → save kit to MongoDB              │
│  GET    /api/kits        → list user kits                   │
│  GET    /api/kits/:id    → load full kit                    │
│  DELETE /api/kits/:id    → delete kit                       │
│                                                             │
│  AI Generation:                                             │
│  POST /api/cache-image        → stores base64 (30-min TTL)  │
│  POST /api/generate-image     → Gemini image generation     │
│  POST /api/generate-text      → Gemini text generation      │
│  POST /api/generate-video     → Veo 2 video + Cloudinary    │
│  POST /api/generate-3d        → Meshy 3D model generation   │
│  GET  /api/style-presets      → style library               │
│                                                             │
│  Media:                                                     │
│  POST /api/media/transcribe       → voice → text (Gemini)   │
│  POST /api/media/upload-video     → video analysis          │
│  POST /api/media/analyze-angles   → multi-image analysis    │
│                                                             │
│  Text AI:                                                   │
│  POST /api/generate-listing   → multi-platform listing copy │
│  POST /api/score-variations   → AI image scoring            │
│  POST /api/analyze-product    → quick product analysis      │
│                                                             │
│  Store & Publish:                                           │
│  POST  /api/store/publish         → create/update store+kit │
│  GET   /api/store/manage/:userId  → seller dashboard data   │
│  GET   /api/store/:slug           → public store data       │
│  GET   /api/store/:slug/kit/:id   → public product data     │
│  PATCH /api/store/:slug/kit/:id/toggle → show/hide kit      │
│  POST  /api/store/chat            → AI sales assistant      │
│                                                             │
│  Video History:                                             │
│  POST /api/generate-video     → saves to UserVideo model    │
│  GET  /api/user-videos/:userId → fetch user's video history │
│                                                             │
│  Analytics:                                                 │
│  POST /api/analytics/event    → event logging (MongoDB)     │
│                                                             │
│  Static:                                                    │
│  /store-images/*  → fallback local image serving            │
│  /api/videos/*    → fallback local video serving            │
└────────────────────────┬────────────────────────────────────┘
                         │
                 ┌───────┴────────┐
                 ▼                ▼
        MongoDB Atlas         Cloudinary
        (User, Store,         (images: nexio/images
         Kit, UserKit,         nexio/store-images
         UserVideo,            videos: nexio/videos
         Event)                thumbnails: nexio/thumbnails)
                         │
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

**Storage:**
- **MongoDB Atlas** — all user, auth, kit, store, video, and event data
- **Cloudinary** — all generated images and videos (CDN-served, permanent URLs)
- **Mobile local** — `expo-file-system` in `nexio_kits/` for offline kit cache; JWT token in `nexio_token.txt`

---

## 3. Mobile App — Completed Features

### 3.1 Auth (Real — JWT-based)
- **Login screen** (`app/(auth)/login.tsx`) — username/email + password sign-in
- **Signup** — username, email, name, password (min 8 chars)
- **JWT persistence** — token written to `nexio_token.txt` via expo-file-system; restored on every app launch via `GET /api/auth/me`
- **`AuthContext`** — holds `user`, `token`, `signIn`, `signUp`, `signOut`; token survives app restarts
- **`tokenService.ts`** — helper to read the persisted token for non-context callers
- **Auto-reset stale IP** — `settingsService` detects and resets local IPs silently on mount

### 3.2 Home Tab (`app/(tabs)/index.tsx`)
- Greeting header with user's name
- **Recent Kits** — last 3 kits from local history with real thumbnails and time-ago timestamps
- Tap to restore a kit to Zustand store and open Kit screen
- **Empty state** with "Create First Kit" CTA
- Refreshes on every tab focus via `useFocusEffect`

### 3.3 AI Tools Tab (`app/(tabs)/ai-tools.tsx`)
- Menu of available AI tools: Product Video (New), Product Photos, Listing Copy, Social Content, Full Kit
- Routes to respective screens

### 3.4 Create Tab (`app/(tabs)/create-tab.tsx` → `app/create.tsx`)
- Product category selector (grid with icons)
- Goal picker — Sales, Awareness, Engagement, etc.
- Image picker — camera or photo library
- Style selector for ad variation types
- Navigates to Generate screen

### 3.5 Generation Screen (`app/generate.tsx`)
- Real-time progress bar (0 → 100%)
- Calls backend in parallel: `analyzeService`, `aiService` (image variations), `listingService`
- Saves completed kit to local history (`historyService.saveKit`) and optionally syncs to cloud (`/api/kits`)
- Navigates to Kit screen on success

### 3.6 Kit Screen (`app/kit.tsx`) — Main Feature Screen

**Images Tab**
- 2-column grid of all generated ad variations with status indicators
- AI-scored badges (★ BEST, confidence stars)
- Tap to full-screen `AdPreviewModal` with download + share buttons
- Individual image **save** via `MediaLibrary.createAssetAsync` (iOS-reliable) with `Sharing.shareAsync` fallback
- **Download All** saves all ready images to photo library
- `imageExt()` helper detects correct file extension from Cloudinary URLs
- **A/B Compare** mode — select two images side-by-side with A/B winner picker
- **Favorites** — heart button per card, persisted via `favoritesService`
- **3D View** — tapping RotateCw icon switches card to `Image3DViewer` (interactive 3D rotation)
- **Try More Styles** — style preset cards (per category) to generate extra variations; 2 images per style
- **Intelligence Insights** — AI recommendations panel showing top styles with conversion scores

**Listing Tab**
- Platform switcher: Global · Etsy · Amazon · Instagram · TikTok
- All fields inline-editable; tags add/remove inline
- **Ask AI** — bottom-sheet modal sends questions about the listing to `askAI()` → `/api/generate-text`
- **Improve with AI** — regenerates listing with existing title as context
- **Regenerate** — fresh listing generation from the product image
- Score card showing 92% optimization + platform indicator

**Social Tab**
- Platform pills: Instagram · Facebook · TikTok · All
- Post variation cards with image + caption + copy/edit
- Hashtag section with Copy All
- Post hook ideas (3 variations)
- **Ask AI** modal with social-specific context
- **Regenerate** button

**Export Tab**
- Download Full Kit (ZIP), Export for Amazon, Etsy, Instagram
- Uses `exportService.ts` for ZIP packaging

### 3.7 Publish Screen (`app/publish.tsx`)
- Checks existing store via `getMyStore(userId)` on mount, pre-fills if found
- **AI Store Setup** card — auto-generates store name, URL slug, tagline from product data; editable + regeneratable
- Form fields: Store URL · Display Name · Tagline · WhatsApp · Email
- **Store Preview modal** — full bottom-sheet preview showing store banner, product image (from `pickedImage` or first generated variation), description, keywords, contact buttons
- On publish: uploads images to Cloudinary via backend
- **Success state** — live product URL + store URL with WhatsApp deeplink and native share

### 3.8 Products Tab (`app/(tabs)/products.tsx`)
- Loads kits from local `historyService`
- Category filter chips from actual kit data
- Grid cards with real **product thumbnail images** (using `thumbnailUrl` field)
- Tap → restore kit to Zustand → open Kit screen
- Delete with confirmation
- Refreshes on tab focus

### 3.9 Video Screen (`app/video.tsx`)
- Upload product photo + select style (Studio / Luxury / Lifestyle / Dynamic) or custom prompt
- Generates 15–30 sec video via Veo 2 (`/api/generate-video`)
- Video result displayed with native player (`expo-av`)
- **My Videos history** — loads past videos for the logged-in user from `GET /api/user-videos/:userId`
- History cards show prompt text and time-ago timestamp
- History auto-refreshes after each new generation

### 3.10 Account Tab (`app/(tabs)/account.tsx`)
- Displays user profile (name, email, username)
- Sign out button (clears JWT token file)

### 3.11 Local History (offline)
- **`historyService.ts`** — expo-file-system, `{documentDirectory}nexio_kits/`
- `index.json` — fast-load kit summaries; `{id}/data.json` — full kit; `{id}/{varId}.jpg` — variation images
- Max 50 kits, oldest trimmed automatically

### 3.12 State Management (`src/store/adStore.ts`)
- Zustand: `selectedCategory`, `goal`, `pickedImage`, `variations`, `listingResult`, `productAnalysis`, `imageScores`, `styleImages`, `overallBestType`, `isGenerating`
- `restoreKit(data)` — restores any past kit into the store for re-opening/editing

---

## 4. Web App — Completed Features

### 4.1 Authenticated Dashboard (`src/App.tsx`)
- Drag-and-drop or file picker image upload
- Category + goal selection
- Bulk image generation (all style variations in parallel)
- Listing panel, Insights panel, Bulk/export screen
- Confetti on generation complete

### 4.2 Auth Flow
- `AuthContext.tsx` · `AuthGate.tsx` · `AuthScreen.tsx` · `VerifyEmailScreen.tsx`
- Currently uses **mock auth** (`mockAuth.ts`) — not yet connected to the real JWT backend

### 4.3 Public Storefront (`src/components/store/StoreFront.tsx`)
- Fetches from `GET /api/store/:slug`
- Responsive product grid, contact CTA, AI Chat Widget

### 4.4 Public Product Page (`src/components/store/ProductPage.tsx`)
- Image carousel, Contact to Buy CTA, share actions, bullet highlights, keyword tags
- AI Chat Widget with product-level context

### 4.5 AI Chat Widget (`src/components/store/ChatWidget.tsx`)
- Floating button, 340×420 drawer, dark color scheme
- Posts to `POST /api/store/chat` — rate-limited, Gemini-backed

### 4.6 Routing
- Path-based: `/store/*` → public `<StoreRouter>` · all other paths → auth-gated `<App />`

---

## 5. Backend — Completed Features

### 5.1 Architecture — MVC
Fully refactored from a single `server.ts` into:
- `src/controllers/` — one file per domain (auth, image, text, store, video, media, kits, meshy3d, analytics, bulk, health)
- `src/models/` — Mongoose models (User, Store, Kit, UserKit, UserVideo, Event)
- `src/services/` — AI logic, Cloudinary, media processing, store data
- `src/routes/index.ts` — central router mounting all controllers
- `src/db/connection.ts` — MongoDB Atlas connection
- `src/config.ts` — env-var centralization
- `src/state.ts` — in-memory image cache + rate limiting maps

### 5.2 Real Authentication
- `POST /api/auth/signup` — bcrypt-hashed password, returns 30-day JWT
- `POST /api/auth/login` — username-or-email lookup, bcrypt compare, returns JWT
- `GET  /api/auth/me` — verifies Bearer token, returns user profile
- `requireAuth` middleware — used by kit routes
- `User` model: `username`, `email`, `name`, `password` (hash), `role`

### 5.3 AI Image Generation Pipeline
- `POST /api/cache-image` — base64 → 30-min in-memory session cache → `sessionId`
- `POST /api/generate-image` — accepts `sessionId` or direct base64; Gemini image model; concurrency-limited queue
- `POST /api/generate-text` — Gemini text generation
- `GET  /api/style-presets` — style library

### 5.4 AI Text Services
- `POST /api/generate-listing` — multi-platform listing (Global, Etsy, Amazon, Instagram, TikTok)
- `POST /api/score-variations` — AI image scoring + ranking
- `POST /api/analyze-product` — quick product analysis for category/style suggestions

### 5.5 Video Generation
- `POST /api/generate-video` — Veo 2 via Google AI; video saved locally then uploaded to Cloudinary; falls back to local serving if Cloudinary fails
- Generated video URL saved to `UserVideo` MongoDB collection (linked to `userId`)
- `GET /api/user-videos/:userId` — returns up to 20 past videos (newest first)

### 5.6 3D Model Generation
- `POST /api/generate-3d` — Meshy 3D API; accepts `sessionId` or direct base64
- Returns `thumbnailUrl`, `videoUrl`, `modelUrls` (glb, obj, usdz)

### 5.7 Media Services
- `POST /api/media/transcribe` — base64 audio → text (Gemini)
- `POST /api/media/upload-video` — video file or base64 → AI description
- `POST /api/media/analyze-angles` — array of product images → unified description, features, suggested prompt

### 5.8 Kit Cloud Sync
- `POST   /api/kits` — saves full kit (variations, listing, analysis) to `UserKit` MongoDB; requires JWT
- `GET    /api/kits` — lists user's 50 most recent kits
- `GET    /api/kits/:id` — returns full kit data
- `DELETE /api/kits/:id` — removes kit

### 5.9 Store API
- `POST  /api/store/publish` — upserts Store in MongoDB; uploads images/thumbnails to Cloudinary
- `GET   /api/store/manage/:userId` — seller's store + kit list
- `GET   /api/store/:slug` — public store (kit summaries + Cloudinary thumbnail URLs)
- `GET   /api/store/:slug/kit/:kitId` — full product data
- `PATCH /api/store/:slug/kit/:kitId/toggle` — toggles `isPublished`
- `POST  /api/store/chat` — rate-limited (10 req/min/IP), Gemini-backed sales assistant

### 5.10 Image Storage — Cloudinary
- All store publish images uploaded via `cloudinaryService.ts`
- `uploadImage(base64, mimeType, folder)` — converts to WebP, quality auto:good
- `uploadVideoBuffer(buffer, folder)` — streams video buffer to Cloudinary
- `uploadImageUrl(url, folder)` — re-uploads from existing URL
- Cloud name: `ddkajrinl`; folders: `nexio/images`, `nexio/store-images`, `nexio/videos`, `nexio/thumbnails`

### 5.11 Analytics
- `POST /api/analytics/event` — accepts arbitrary events, stored in `Event` MongoDB collection
- Events include: `generate_start`, `generate_complete`, `copy_listing`, `select_style`, `favorite_variant`, `download_image`, `export_zip`, `view_variant`

---

## 6. What Is Not Done Yet

### 6.1 Web App Auth Migration
- The web app (`Nexio_Frontend`) still uses `mockAuth.ts` — it is not connected to the real JWT backend
- Mobile auth is real and working; web auth is the remaining gap

### 6.2 My Store Management Tab (Mobile)
- Sellers can publish to a store but have **no mobile screen to view or manage published kits**
- No way to toggle kit visibility from mobile after publishing
- No way to revisit the live store URL from within the app after the publish flow closes

### 6.3 SEO for Store Pages
- Public store pages (`/store/:slug`) are client-side rendered — search engines get a blank HTML shell
- No `<meta>` / Open Graph tags for social sharing previews
- **Needed:** SSR (Next.js) or at minimum server-rendered `<head>` injection

### 6.4 Push Notifications
- No notifications when a buyer contacts via chat or WhatsApp
- No in-app notification for new chat messages

### 6.5 Payment Integration
- Intentionally out of scope — buyers contact sellers via WhatsApp/email, no checkout flow

### 6.6 Analytics Dashboard (Mobile)
- Events are logged to MongoDB but there is no UI to view them
- No seller-facing screen showing store views, popular products, or kit performance

### 6.7 Kit Cloud Sync on Mobile (Partial)
- `UserKit` MongoDB model and `/api/kits` endpoints exist and work
- The mobile app still primarily uses local `historyService` for the Products tab
- Syncing to cloud on save is not yet wired into the generation flow

---

## 7. Next Feature Suggestions

Ordered by impact vs. implementation effort:

### Priority 1 — My Store Tab (Mobile)
Add a screen accessible from Account or as a 5th tab:
- Shows live store URL with a "Share" + "Visit" button
- Lists published kits with visibility toggle (Eye/EyeOff)
- Uses existing `getMyStore(userId)` and `toggleKitVisibility()` services
- **Effort:** Low · **Impact:** High (completes the publish → manage loop)

### Priority 2 — Wire Kit Cloud Sync
In `generate.tsx`, after saving locally, call `POST /api/kits` with the JWT token to sync to MongoDB:
- Load from cloud in Products tab as fallback when local is empty
- Enables cross-device kit access
- **Effort:** Low · **Impact:** High

### Priority 3 — Web App Auth Migration
Replace `mockAuth.ts` with calls to `POST /api/auth/login` and `POST /api/auth/signup`:
- Store JWT in `localStorage`
- Pass `Authorization: Bearer <token>` on kit/store requests
- **Effort:** Low · **Impact:** Completes auth parity between web and mobile

### Priority 4 — SEO & Open Graph for Store Pages
Backend serves a thin HTML shell with `<title>`, `<meta name="description">`, `<meta property="og:*">` for `/store/:slug` and `/store/:slug/:kitId`:
- The Vite SPA takes over after hydration
- **Effort:** Medium · **Impact:** High (discoverability + social link previews)

### Priority 5 — Analytics Dashboard (Mobile)
Add an "Insights" section on the Account tab:
- Total kits, total images generated, most-used category
- Query `GET /api/analytics/summary` (new endpoint) that aggregates the Event collection
- **Effort:** Medium · **Impact:** Medium

### Priority 6 — Buyer Notification (WhatsApp Webhook)
When a chat buyer expresses intent to buy, send the seller a WhatsApp notification:
- Use WhatsApp Cloud API (free tier) to send a template message
- **Effort:** Medium · **Impact:** High (closes the sales loop)

### Priority 7 — Multi-Image Upload (Bulk Mode)
Allow uploading multiple product photos to generate a kit for each in a queue:
- Web: `BulkScreen.tsx` skeleton already exists
- Mobile: multi-select in image picker step
- **Effort:** Medium · **Impact:** High for power sellers

### Priority 8 — Watermark / Branding Upsell
Subtle "Made with Nexio" watermark on generated images for free users; removed for paid accounts:
- Applied at image generation time (overlay in Gemini prompt or post-processing)
- **Effort:** Low · **Impact:** Business critical eventually

---

## 8. File Reference

### Mobile (`Nexio_Mobile/`)
| File | Purpose |
|---|---|
| `app/_layout.tsx` | Root navigation layout + AuthProvider |
| `app/(auth)/login.tsx` | Sign in / sign up screen (JWT auth) |
| `app/(auth)/verify.tsx` | Post-signup verification screen |
| `app/(tabs)/_layout.tsx` | Bottom tab bar layout |
| `app/(tabs)/index.tsx` | Home tab with recent kits |
| `app/(tabs)/ai-tools.tsx` | AI Tools menu tab |
| `app/(tabs)/create-tab.tsx` | Entry point for creation flow |
| `app/(tabs)/products.tsx` | Kit history grid (with thumbnails) |
| `app/(tabs)/account.tsx` | User profile and sign out |
| `app/create.tsx` | Category + goal + image picker |
| `app/generate.tsx` | Live generation progress screen |
| `app/kit.tsx` | Kit viewer (Images / Listing / Social / Export tabs) |
| `app/publish.tsx` | Publish to store flow + store preview modal |
| `app/video.tsx` | Product video generation + history |
| `app/preview.tsx` | Full-screen image preview |
| `app/listing.tsx` | Standalone listing display |
| `src/store/adStore.ts` | Zustand global state |
| `src/auth/AuthContext.tsx` | JWT auth context (signIn, signUp, signOut, user) |
| `src/services/aiService.ts` | Image gen, video gen, 3D gen, askAI, transcribe, fetchUserVideos |
| `src/services/listingService.ts` | Multi-platform listing generation |
| `src/services/analyzeService.ts` | Quick product analysis |
| `src/services/scoringService.ts` | Image scoring |
| `src/services/historyService.ts` | Local kit persistence (expo-file-system) |
| `src/services/storeService.ts` | Store publish, manage, toggle APIs |
| `src/services/exportService.ts` | ZIP export |
| `src/services/analyticsService.ts` | Event tracking + recommendations |
| `src/services/favoritesService.ts` | Favorited image persistence |
| `src/services/tokenService.ts` | Read persisted JWT token |
| `src/services/settingsService.ts` | Runtime server URL configuration |
| `src/services/imageService.ts` | Image utilities |
| `src/constants.ts` | Category definitions, ad styles |
| `src/stylePresets.ts` | Style preset library (per-category) |

### Web (`Nexio_Frontend/`)
| File | Purpose |
|---|---|
| `src/main.tsx` | Vite entry — path-based routing |
| `src/App.tsx` | Authenticated seller dashboard |
| `src/auth/AuthContext.tsx` | Auth React context |
| `src/auth/AuthGate.tsx` | Auth protection wrapper |
| `src/auth/AuthScreen.tsx` | Login UI |
| `src/auth/VerifyEmailScreen.tsx` | Verification UI |
| `src/auth/mockAuth.ts` | Mock auth (not yet replaced) |
| `src/components/BulkScreen.tsx` | Bulk generation UI (skeleton) |
| `src/components/InsightsPanel.tsx` | AI scoring display |
| `src/components/ListingPanel.tsx` | Listing copy viewer |
| `src/components/store/StoreFront.tsx` | Public store page |
| `src/components/store/ProductPage.tsx` | Public product page |
| `src/components/store/ChatWidget.tsx` | AI chat widget (floating) |
| `src/services/aiService.ts` | Image generation API calls |
| `src/services/listingService.ts` | Listing API calls |
| `src/services/scoringService.ts` | Scoring API calls |
| `src/services/exportService.ts` | ZIP export |
| `src/services/analyticsService.ts` | Event tracking |

### Backend (`Nexio_Backend/`)
| File | Purpose |
|---|---|
| `src/routes/index.ts` | Central router — mounts all controllers |
| `src/config.ts` | Env-var exports (MONGODB_URI, JWT_SECRET, Cloudinary, etc.) |
| `src/db/connection.ts` | MongoDB Atlas connection |
| `src/state.ts` | In-memory image cache + rate limit maps |
| `src/types.ts` | Shared TypeScript types |
| `src/controllers/authController.ts` | signup, login, /me + requireAuth middleware |
| `src/controllers/imageController.ts` | cache-image, generate-image, style-presets |
| `src/controllers/textController.ts` | generate-text, generate-listing, score-variations, analyze-product |
| `src/controllers/videoController.ts` | generate-video, user-videos/:userId |
| `src/controllers/meshy3dController.ts` | generate-3d (Meshy API) |
| `src/controllers/mediaController.ts` | transcribe, upload-video, analyze-angles |
| `src/controllers/kitsController.ts` | CRUD for UserKit (requires JWT) |
| `src/controllers/storeController.ts` | store publish, manage, public, chat |
| `src/controllers/analyticsController.ts` | event logging |
| `src/controllers/bulkController.ts` | Bulk generation helpers |
| `src/controllers/healthController.ts` | Health check endpoint |
| `src/models/User.ts` | User (username, email, password hash, role) |
| `src/models/Store.ts` | Store (slug, displayName, tagline, contacts) |
| `src/models/Kit.ts` | Published kit (for store pages) |
| `src/models/UserKit.ts` | Private user kit (variations, listing, analysis) |
| `src/models/UserVideo.ts` | Generated video history per user |
| `src/models/Event.ts` | Analytics events |
| `src/services/aiService.ts` | Gemini image/text/video/3D model callers |
| `src/services/cloudinaryService.ts` | uploadImage, uploadVideoBuffer, uploadImageUrl |
| `src/services/storeService.ts` | Store/Kit Mongoose helpers + slugify |
| `src/services/mediaService.ts` | transcribeAudio, analyzeVideo, analyzeMultiAngle |
| `src/services/analyticsService.ts` | Event persistence helpers |
| `.env` | GEMINI_API_KEY, MONGODB_URI, JWT_SECRET, CLOUDINARY_*, MESHY_API_KEY, PORT |

---

*This document covers the current state of Nexio as of 2026-05-20. All major infrastructure gaps from the previous plan (real auth, cloud image storage, MongoDB) have been resolved. Remaining work is focused on UX completeness (My Store tab, kit cloud sync wiring, web auth migration) and growth features (SEO, analytics dashboard, notifications).*
