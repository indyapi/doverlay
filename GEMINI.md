# Doverlay

A Next.js application for overlays, likely for streaming or alerts, integrated with Firebase and OCR capabilities.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Radix UI, Framer Motion
- **Backend:** Firebase (Realtime Database, Auth)
- **OCR:** Tesseract.js
- **Deployment:** Netlify

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
  - `(main)`: Main application routes (Home, Admin).
  - `(overlay)`: Streaming overlay routes (Alert, Top Donate).
- `src/components`: Reusable React components.
  - `/admin`: Components specific to the admin dashboard.
- `src/contexts`: React context providers (e.g., AuthContext).
- `src/lib`: Utility functions and service initializations (Firebase, OCR, TTS).
- `src/types`: TypeScript type definitions.

## Core Workflows

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Environment Variables
The project uses environment variables for Firebase and ImgBB.
Required variables (to be set in Netlify):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_IMGBB_API_KEY`

## Netlify Deployment
The project is configured with `netlify.toml` and `.nvmrc`.
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** 20+

