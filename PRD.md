# Nexio — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-05-16  
**Status:** Active  

---

## 1. Product Overview

Nexio is an AI-powered product kit generator for e-commerce sellers. A seller uploads a product image, optionally adds a description or records a voice note, picks a goal (Full Kit, Photos, Listing, Social), and the system generates professional product images in multiple styles, marketplace-ready listings for Etsy/Amazon/Instagram/TikTok, and social media post copy — all exportable as a ZIP.

**Stack:**
- Mobile: React Native + Expo (`Nexio_Mobile`)
- Backend: Node.js + Express (`Nexio_Backend`)
- AI: Google Gemini 2.5 Flash (text) + Gemini 3.1 Flash Image (images)

---

## 2. Current State — What Works

| Area | Status | Notes |
|---|---|---|
| Image generation (6 variations) | ✅ Working | Hero, Lifestyle, Handheld, Macro, Studio, Scene |
| Text generation (listings) | ✅ Working | Global, Etsy, Amazon, Instagram, TikTok |
| 360° spin generation | ❌ Removed | Replaced by single-image 3D rotation (no generation needed) |
| Voice recording + transcription | ✅ Working | Records audio, transcribes via Gemini |
| Social post generation | ✅ Working | 3 post variations per platform |
| ZIP export | ✅ Working | All images + listing copy bundled |
| Native share (iOS/Android) | ✅ Working | Per-image share sheet |
| Kit history (local) | ✅ Working | Stored in async storage |
| Bulk processing | ✅ Working | CSV + image batch, up to 100 products |
| Store publishing | ✅ Working | Public store page + AI chatbot |
| Analytics event logging | ✅ Working | Events tracked, basic insights |

---

## 3. Current Gaps — Broken or Stubbed

### Critical (blocks user flows)

| Issue | Location | Impact |
|---|---|---|
| `/publish` route missing | `kit.tsx` Publish button | App crashes on tap |
| OAuth (Google/Apple) not implemented | `login.tsx` | Users cannot sign in with social auth |
| Favorite variants not persisted | `kit.tsx` heart button | Lost on app restart |
| A/B Compare winner not saved | `kit.tsx` modal | Feedback loop broken |
| No onboarding flow | App root | New users have no guided entry |

### High (degrades experience)

| Issue | Location | Impact |
|---|---|---|
| Shopify export defined but hidden | `exportService.ts` | Feature exists but unreachable |
| Progress percentage hard-coded (68%) | `index.tsx` | Misleads user on real status |
| Quality score hard-coded (92%) | `kit.tsx` | Not real data |
| Social engagement score hard-coded (96%) | `kit.tsx` | Not real data |
| "Ask AI" buttons have no handler | `kit.tsx`, `listing.tsx` | Dead UI |
| "Generate More" (Social tab) has no handler | `kit.tsx` | Dead UI |
| Account sections (Profile, Billing, etc.) UI-only | `account.tsx` | No backend integration |

### Architecture (blocks scale)

| Issue | Impact |
|---|---|
| No cloud sync — kits stored only on device | Cross-device usage impossible |
| Image session IDs not tied to user ID | Multi-user backend interference |
| Server image cache has no cleanup | Memory leak over time |
| No offline queue | Any network drop fails silently |
| Analytics has no aggregation dashboard | Insights endpoint depends on prior data existing |

---

## 4. Features to Add — Prioritised

### P0 — Onboarding (Blocker for New Users)

**What:** A 3–4 screen onboarding flow shown once on first launch.

**Screens:**
1. Welcome — App name, one-line value proposition, "Get Started" CTA
2. How it works — 3-step visual: Upload → Generate → Export
3. Goal selection — Let user pick their primary goal (Photos / Listings / Social / Full Kit)
4. First create — Deep-link directly into Create wizard with goal pre-selected

**Acceptance criteria:**
- Shown only on first launch (persist `onboarding_complete` flag)
- Skippable at any step
- Goal selection persists as default in adStore
- Back-navigable

---

### P0 — Fix Publish Route

**What:** Create `publish.tsx` screen or redirect Publish button to a working screen.

**Screen layout:**
- Kit thumbnail + name at top
- AI-generated store setup (title, short bio, contact)
- WhatsApp number input + email input
- Preview button → opens store page in WebView
- Publish button → calls `POST /store/publish`
- Success state with shareable store URL

---

### P1 — Voice Input for Prompt (Improve Existing)

**Current state:** Voice recording exists in `create.tsx` but it's embedded only in the creation wizard. There is no voice input on the Home screen's AI query field.

**What to add:**
1. **Home screen mic button** — The mic icon on `index.tsx` currently has no handler. Wire it to record + transcribe, populate the text input field.
2. **Better UX in create.tsx** — After transcription completes, show the transcript clearly with an edit option and a "Re-record" button.
3. **Waveform animation** — Show animated waveform while recording (visual feedback).

**Acceptance criteria:**
- Mic button on Home screen starts recording on tap, transcribes on release
- Transcript populates the text field, is editable
- Re-record button clears and restarts
- Error state if transcription fails (show toast)

---

### P1 — 3D Rotatable Single Image

**What:** A single product image that the user can touch and rotate in 3D space. No additional image generation — the existing generated image gets a real-time 3D tilt/rotation effect driven entirely by touch input.

**How it works:**
- User sees their product image rendered in a 3D perspective plane
- Dragging left/right rotates the image around the Y axis (horizontal spin)
- Dragging up/down tilts it around the X axis (vertical tilt)
- On release, image smoothly springs back to center (or optionally holds the angle)
- Pinch-to-zoom works alongside rotation
- Optional: auto-rotate mode slowly spins without touch

**Implementation (frontend only, no backend needed):**
- Use React Native `Animated` with `PanResponder` to track drag delta (dx, dy)
- Map dx → `rotateY`, dy → `rotateX` using perspective transform
- Spring-back animation on release via `Animated.spring()`
- Wrap in a `TouchableOpacity` to open full-screen from the kit Images tab
- Component: `Image3DViewer.tsx`

**Remove entirely:**
- `spinService.ts` (mobile) — no longer needed
- `SpinViewer.tsx` (mobile) — replaced by `Image3DViewer.tsx`
- `spinController.ts` (backend) — `/api/generate-spin` endpoint removed
- Spin route registration in `routes/index.ts`
- Spin state in `adStore.ts` (spinImages, any spin-related fields)

**Where it appears:**
- Images tab in `kit.tsx` — each generated image card has a "3D" toggle button that switches it into 3D rotation mode
- Full-screen preview (`preview.tsx`) — 3D mode available

**Acceptance criteria:**
- Single image, no network call required
- Rotation feels fluid at 60fps
- Max rotateY ±35°, max rotateX ±25° (prevents full flip)
- Spring-back animates in ~300ms
- Works on both iOS and Android

---

### P1 — Template Placement + Auto Generation

**What:** User picks their product image **or a short video clip**, selects one of three template types, places it on the template, and generation starts automatically a few seconds after placement — no extra button tap needed.

**Three template categories:**

| # | Category | Description |
|---|---|---|
| 1 | **Square / Frame** | Clean square canvas — flat product showcase, white or neutral background. Good for marketplace listings. |
| 2 | **Clothing / Suit** | Clothing mockup template — product image placed on a wearable (shirt, suit, jacket). User drags their design/logo/pattern onto the garment shape. |
| 3 | **Scene / Place** | Real environment background (beach, market stall, living room, outdoor, etc.) — product floated into the scene. |

**User flow:**
1. User taps "Place" from the Create screen or AI Tools tab → opens `compose.tsx`
2. User picks **image or video** from gallery (toggle between the two)
   - Image: shown as a static layer on the template
   - Video: plays inline as a looping preview on the template (short clips only, max 15 seconds)
3. Three template type cards shown — Square, Clothing, Scene
4. User taps a type → sub-templates appear (e.g. for Clothing: T-Shirt, Suit, Hoodie; for Scene: Beach, Market, Living Room, Studio)
5. User drags, pinches, and positions the image/video on the template
6. A **3-second countdown timer** appears after they lift their finger ("Generating in 3… 2… 1…")
7. Generation fires automatically:
   - If **image**: composited image sent to image generation pipeline
   - If **video**: video uploaded to `/api/media/upload-video` → AI analyzes it → description used to drive generation, first frame used as reference image
8. User is taken to the generation progress screen

**Templates — first version (minimum):**

*Square:*
- White clean square
- Dark luxury square
- Gradient pastel square

*Clothing:*
- White T-shirt front
- Business suit front
- Hoodie front

*Scene:*
- Beach / sea (sand + water background)
- Wooden market table (outdoor)
- Modern living room shelf
- Studio white sweep

**Backend changes needed:**
- `POST /api/remove-background` — uses Gemini to extract product cleanly from its background before placement
- Compositing happens client-side (React Native canvas / SVG overlay) — no separate composite endpoint needed

**Mobile implementation:**
- `compose.tsx` — new screen
- Template assets stored locally in `assets/templates/` as PNG files with transparent zones
- Product image rendered as a draggable/scalable layer on top of template using `react-native-gesture-handler` + `Animated`
- On finger-up: start 3-second `Animated.timing` countdown, then call `cacheProductImage()` with the composited result and route to generate screen
- Countdown can be cancelled by tapping the image again

**Acceptance criteria:**
- Image and video both selectable from gallery picker (single picker, toggle mode)
- Video capped at 15 seconds — longer clips show a trim error
- Video plays as a looping preview on the template while the user positions it
- Background removal applies to images only (not video)
- Drag + pinch-to-scale works smoothly on both iOS and Android
- Auto-generation fires 3 seconds after user stops moving the media
- Countdown is cancellable by tapping the media again
- All 3 template categories available at launch with at least 3 sub-templates each
- Image path feeds into existing image generation pipeline unchanged
- Video path uploads via existing `/api/media/upload-video`, first frame extracted as reference image for generation

---

### P1 — Social Sharing (Improve Existing)

**Current state:** ZIP export and native share sheet work. No direct platform posting or structured WhatsApp share.

**What to add:**

1. **WhatsApp share** — "Share on WhatsApp" button on the kit Social tab sends a pre-formatted message with the product title, short description, and an image. Uses `whatsapp://send?text=...` deep link.
2. **Direct image + caption share** — Single-tap to share one image + its generated caption to any installed app (Instagram, Facebook, etc.) using React Native Share with `url` (image) + `message` (caption).
3. **Copy-ready kit summary** — A "Copy Summary" button generates a single shareable block of text (title + bullets + 3 hashtags) for pasting anywhere.
4. **Store URL sharing** — After publishing, the store URL is shown with a one-tap copy button and share button.

---

### P2 — Real Auth + User Accounts

**What:** Replace mock auth with a real auth backend.

**Minimum viable:**
- Email + password sign-up / sign-in
- Email verification
- Password reset (real email, not mock)
- Session token stored securely (not in plain async storage)

**Deferred (P3):**
- Google OAuth
- Apple Sign-In
- Subscription management / billing

**Backend changes:**
- `POST /auth/register` — create user
- `POST /auth/login` — return JWT
- `POST /auth/verify-email` — confirm token
- `POST /auth/reset-password` — send reset link
- `GET /auth/me` — current user profile

---

### P2 — Cloud Sync for Kits

**What:** Kits currently live only on-device. Sync them to the backend so users access their kits on any device.

**Backend changes:**
- `POST /kits` — save kit (metadata + image refs + listing JSON)
- `GET /kits` — list user's kits (paginated)
- `GET /kits/:id` — fetch single kit
- `DELETE /kits/:id` — delete kit
- Image storage: save generated images to a persistent store (S3 or disk with stable paths)

**Mobile changes:**
- On generation complete, auto-save kit to cloud if user is logged in
- Kit library fetches from cloud (with local cache fallback)
- Conflict resolution: local-first, cloud wins on re-login

---

### P2 — Fix Scores (Replace Hard-coded Values)

| Hard-coded value | Replace with |
|---|---|
| 68% progress on Home screen | Real progress from adStore generation steps |
| 92% quality score in Images tab | Score from `/api/intelligence/recommend` (conversion_score) |
| 96% social engagement in Social tab | Calculated from hashtag count, caption length, platform fit |

---

### P3 — Shopify Export (Complete Existing Stub)

`buildShopifyTxt()` already exists in `exportService.ts`. Add Shopify to the EXPORT_OPTIONS array in `kit.tsx` Export tab. Format: title, body HTML, vendor, product type, tags.

---

### P3 — Ask AI Chat (Wire Existing Stubs)

The "Ask AI" buttons in the Images and Listing tabs are currently dead. Connect them to a floating chat modal that calls `POST /store/chat` (already implemented). Contextual: in Images tab, AI answers questions about image style; in Listing tab, AI suggests listing improvements.

---

## 5. Architecture Requirements for Scale

| Requirement | Current State | Target |
|---|---|---|
| User authentication | Mock only | JWT-based, real email |
| Kit storage | Device-only | Cloud-synced, user-scoped |
| Image storage | In-memory session cache | Persistent, cleanup on expiry |
| Session isolation | Shared server cache | Per-user session IDs |
| Rate limiting | Incomplete stub | Per-user limits on generation endpoints |
| Error recovery | 2 client retries | Retry with exponential backoff + user-visible retry button |
| Offline support | None | Queue requests, execute when reconnected |

---

## 6. Feature Delivery Phases

### Phase 1 — Stability (2–3 weeks)
- Fix `/publish` crash
- Wire mic button on Home screen
- Fix hard-coded scores with real data
- Persist favorite variants and A/B winner
- Basic onboarding (3 screens)

### Phase 2 — New Core Features (4–6 weeks)
- WhatsApp + direct social share
- Multiple image upload (8 slots, reorder)
- Single-image 3D viewer (`Image3DViewer.tsx`) — touch to rotate, no generation
- Remove spin generation backend + mobile service
- Image placement / compose tool (5 templates, background removal)

### Phase 3 — Platform Readiness (6–8 weeks)
- Real email/password auth
- Cloud kit sync
- Fix all hard-coded scores
- Wire "Ask AI" chat
- Shopify export

### Phase 4 — Scale & Growth (8+ weeks)
- Google + Apple OAuth
- Subscription + billing
- Cross-device sync
- Offline queue
- Analytics dashboard for seller insights

---

## 7. Out of Scope (This Document)

- Web app (separate product surface)
- Video generation beyond AI analysis
- Automated social posting (requires platform API keys + OAuth per platform)
- Inventory management
- Order management
- Multi-language UI (app UI strings; listing copy already multi-language)
