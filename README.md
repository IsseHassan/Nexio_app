# Nexio — AI-Powered Product Marketing Platform

Nexio helps sellers generate professional ad images, write marketplace listings, and publish products to a public storefront — all powered by Google Gemini AI.

---

## What It Does

1. **Photograph your product** — upload a photo from your phone or desktop
2. **Generate ad images** — AI creates 6 styled variations (lifestyle, studio, macro, etc.)
3. **Get listing copy** — full listings for Amazon, Etsy, Instagram, TikTok, and more
4. **Publish to your store** — share a public product page with a WhatsApp contact button
5. **AI sales assistant** — buyers can chat with an AI that knows your product

---

## Project Structure

```
Project_Final/
├── Nexio_Mobile/        # React Native (Expo) seller app
├── Nexio_Frontend/      # React (Vite) web dashboard + public storefront
├── Nexio_Backend/       # Express.js API server + Gemini AI
└── DEVELOPMENT_PLAN.md  # Full feature docs and roadmap
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native, Expo Router, Zustand, NativeWind |
| Web | React 19, Vite, Tailwind CSS v4 |
| Backend | Express.js, TypeScript |
| AI | Google Gemini (`gemini-2.5-flash`) |
| Storage | File-based JSON (no DB yet — see roadmap) |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/IsseHassan/Nexio_app.git
cd Nexio_app
```

### 2. Backend

```bash
cd Nexio_Backend
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm run dev
# Runs on http://localhost:8080
```

### 3. Web Frontend

```bash
cd Nexio_Frontend
npm install
npm run dev
# Runs on http://localhost:3000
# Proxies /api and /store-images to the backend
```

### 4. Mobile App

```bash
cd Nexio_Mobile
npm install
# Set API_URL in .env to your backend IP (e.g. http://192.168.x.x:8080)
npx expo start
# Scan QR code with Expo Go or a development build
```

---

## Environment Variables

**`Nexio_Backend/.env`**
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8080
APP_URL=http://localhost:3000
```

**`Nexio_Mobile/.env`**
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:8080
```

---

## Key Features

### Mobile App
- Camera / photo library image picker
- AI generates 6 ad image variations in parallel
- Editable multi-platform listing copy (Amazon · Etsy · Instagram · TikTok)
- AI performance scores per image
- Local kit history (offline, no account required)
- Publish to a public storefront with one tap
- WhatsApp and email share buttons

### Web Dashboard
- Drag-and-drop image upload
- Bulk ad generation with real-time progress
- Listing panel with copy-to-clipboard per platform
- Export all images as ZIP

### Public Storefront (no login required)
- `/store/:slug` — seller's product grid
- `/store/:slug/:kitId` — product detail page with image carousel
- WhatsApp "Contact to Buy" button
- AI chat widget powered by Gemini

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/cache-image` | Store image in memory, get sessionId |
| POST | `/api/generate-image` | Generate ad image via Gemini |
| POST | `/api/generate-listing` | Generate full multi-platform listing |
| POST | `/api/score-variations` | AI score and rank image variations |
| POST | `/api/analyze-product` | Quick product analysis from image |
| GET | `/api/style-presets` | Available ad style definitions |
| POST | `/api/store/publish` | Create or update store + publish kit |
| GET | `/api/store/manage/:userId` | Seller's store dashboard data |
| GET | `/api/store/:slug` | Public store data |
| GET | `/api/store/:slug/kit/:kitId` | Public product page data |
| PATCH | `/api/store/:slug/kit/:kitId/toggle` | Toggle kit visibility |
| POST | `/api/store/chat` | AI sales assistant (rate-limited) |
| POST | `/api/analytics/event` | Log analytics event |

---

## Roadmap

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for the full feature list and what's planned next. Key upcoming items:

- [ ] Real authentication (Supabase Auth)
- [ ] PostgreSQL database (replacing JSON files)
- [ ] Cloud image storage (S3 / Supabase Storage)
- [ ] My Store management tab in mobile
- [ ] SEO / Open Graph for store pages
- [ ] Push notifications for buyer contact

---

## License

MIT
