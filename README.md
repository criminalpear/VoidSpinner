# VoidSpinner

Small dev README with instructions to run the app locally.

Requirements
- Node.js (v18+ recommended)
- npm

Development
1. Install dependencies:
```bash
npm ci
```

2. Create `.env` (optional but recommended):
```text
DATABASE_URL="file:./database.sqlite"
SESSION_SECRET="a-secure-secret-for-dev"
PORT=5000
```

3. Start dev server (server + Vite client with HMR):
```bash
npm run dev
```

Production
1. Build:
```bash
npm run build
```

2. Start production bundle:
```bash
npm start
```

Notes
- In dev mode the server uses Vite middleware so client changes hot-reload.
- If DATABASE_URL is a SQLite file (or not set), the server uses an in-memory storage (no external DB required).

Troubleshooting
- If build fails, check console output. Common fixes:
  - Run `npm ci` to ensure exact deps are installed.
  - For browserslist warnings, run `npx update-browserslist-db@latest`.

Files of interest
- `server/` — server code and routes
- `client/` — React app
- `attached_assets/` — static assets
