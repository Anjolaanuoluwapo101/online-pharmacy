# prescilly

**Prescription to doorstep.** Scan a prescription, compare nearby pharmacies, pay
securely and never miss a dose.

A frontend-only React app. Medicines are read from a photo with Gemini vision,
matched across two pharmacy inventories, ordered, delivered with live tracking,
and followed by a per-dose reminder schedule.

## Stack
- React 19 + Vite
- Gemini (vision extraction) · Groq (text structuring)
- GitHub Gists as the read/write data layer (patients, orders, pharmacy inventory, ops)
- Leaflet for live delivery tracking
- Herbold design system (`src/design/`) — tokens, components and hand-drawn Art scenes

## Getting started

```bash
npm install
cp .env.example .env    # add your API keys
npm run dev             # http://localhost:5173
```

The dev server binds to the LAN, so you can open it on a phone at
`http://<your-ip>:5173`.

## Environment

| Variable | Purpose |
|---|---|
| `VITE_GROQ_API_KEY` | Groq API key |
| `VITE_GEMINI_API_KEY` | Google Gemini API key |
| `VITE_GITHUB_PAT` | GitHub PAT with `gist` read/write scope |
| `VITE_GIST_MEDPLUS` / `VITE_GIST_ALPHA` | Pharmacy inventory gist ids |
| `VITE_GIST_PATIENTS` / `VITE_GIST_ORDERS` | Patient + order gist ids |

Secrets live in `.env` (git-ignored) and are injected at build time through
Vite's `define` in `vite.config.js`. `.env.example` is the committed template.

## Scripts
```bash
npm run dev       # dev server (LAN enabled)
npm run build     # production build -> dist/
npm run preview   # serve the production build
npm run lint      # oxlint
```

## Routes
| Route | Screen |
|---|---|
| `/` | Landing + role journeys |
| `/patient` | Scan → match → cart → checkout → pay → reminders |
| `/extract` | AI extraction result |
| `/track` | Live delivery map, timeline, order history |
| `/profile` | Patient details and orders |
| `/medplus`, `/alpha-pharmacy` | Pharmacy dashboards (inventory, staff, sales) |
