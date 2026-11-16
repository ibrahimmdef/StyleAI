# StyleAI

**Your day, styled.** A personal wardrobe app: add photos of your clothes (the background is removed automatically), and every day you get an outfit from the pieces you actually own, picked for the weather and your style. Stella, the built-in stylist, can put together a look for a plan ("dinner tonight, something chill") or answer questions about your wardrobe.

Built with React 19, Vite, Tailwind CSS 4 and an Express backend.

## Running it

There are two npm projects, the backend and the frontend. Run each in its own terminal.

```bash
# Backend: http://localhost:5000
cd src/backend
npm install
npm run dev

# Frontend: http://127.0.0.1:5173
cd src/frontend
npm install
npm run dev
```

Run the backend from inside `src/backend`, it keeps the uploaded photos there. Everything else is in the database.

The first time, create the database tables (safe to run again):

```bash
cd src/backend
npm run db:setup
```

Tests: `cd src/frontend && npm test`

## Settings

**Backend** (`src/backend/.env`, see `.env.example`):

| Name | What it's for |
|---|---|
| `GEMINI_API_KEY` | Stella's outfit suggestions. A free key from [Google AI Studio](https://aistudio.google.com) is enough. Without it, outfits are picked by the built-in rules. |
| `DATABASE_URL` | Your Postgres, for example `postgresql://styleai:password@localhost:5432/styleai`. |
| `RESEND_API_KEY` | Sends "forgot password" emails through [Resend](https://resend.com). Without it, the email is printed in the backend terminal. |
| `MAIL_FROM` | Sender of those emails, on a domain verified in Resend. |
| `APP_URL` | The app's address, used in the reset link. Defaults to `http://127.0.0.1:5173`. |

**Frontend** (`src/frontend/.env`, see `.env.example`):

| Name | What it's for |
|---|---|
| `VITE_API_URL` | Leave it empty. The app calls `/api` on its own address: in development Vite passes those calls to the backend, on the server the backend serves the app itself. That keeps the login cookie on one site. |

## Running it on your own server

You need Node.js and PostgreSQL on the server.

```bash
# 1. A database and a user for the app (once)
sudo -u postgres psql -c "create user styleai with password 'pick-a-password'"
sudo -u postgres psql -c "create database styleai owner styleai"

# 2. The tables (safe to run again)
psql "postgresql://styleai:pick-a-password@localhost:5432/styleai" -f src/backend/schema.sql

# 3. Build the app once, the backend serves it
cd src/frontend && npm install && npm run build

# 4. Settings: copy src/backend/.env.example to src/backend/.env and fill it in,
#    with DATABASE_URL pointing at the database from step 1

# 5. Start
cd src/backend && npm install && NODE_ENV=production node server.js
```

The app is then on port 5000 (or `PORT`). A few things worth knowing:

- Put it behind HTTPS (for example Caddy or nginx in front of port 5000). With `NODE_ENV=production` the login cookie is only sent over HTTPS, so logging in won't work on plain http.
- Run Caddy or nginx on the same machine. The backend only trusts the visitor's address from a proxy on the same machine (`trust proxy` in `server.js`), and the login limits count by that address.
- Keep it running after you log out of the server with pm2 or a systemd service.
- Background removal runs on the server and needs about 1–2 GB of free memory.
- Back up the database with `pg_dump` and the `src/backend/uploads` folder, the photos aren't in the database.

## Editor setup

The project is set up for VS Code with two extensions:

- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) formats the code on save.
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) completes class names, including the app's own colors (`bg-surface`, `text-muted`...).

Add these to your VS Code settings. The last two lines stop the built-in CSS checker from flagging Tailwind's `@theme` and `@apply` as errors:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.associations": { "*.css": "tailwindcss" },
  "css.lint.unknownAtRules": "ignore"
}
```

## How it's laid out

```
src/shared/     catalog (categories, colors, styles) and outfit rules, used by both sides
src/backend/    Express API: items, outfits, preferences, profile, weather, photos, Stella
src/frontend/   React app: pages/, components/, data.js, index.css (theme colors)
```

Colors come from theme tokens in `src/frontend/index.css`. Use those (`bg-surface`, `text-ink`, `border-line`...) instead of fixed colors, and dark mode works without extra classes.
