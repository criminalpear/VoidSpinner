## VoidSpinner

Small dev README with instructions to run the app locally.

Requirements
- Node.js (v18+ recommended)
- npm

## Installation:
# Easy Installation:
1. Open CodeSpace on main
2. Open a terminal in the CodeSpace
3. run:
```bash
npm run codespace
```
# Hard Installation 
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

Automatic local setup
- There's a helper script at `./scripts/setup-local-db.sh` that will create a `.env` file and a local `database.sqlite` file with sensible defaults. It will generate a random `SESSION_SECRET` for you.

Usage:
```bash
./scripts/setup-local-db.sh
```

After running that script, you can start the dev server with:
```bash
npm run dev
```

Files of interest
- `server/` — server code and routes
- `client/` — React app
- `attached_assets/` — static assets
