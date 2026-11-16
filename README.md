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

Run the backend from inside `src/backend`, it keeps its data files and uploaded photos there.

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
| `DATABASE_URL` | Postgres connection, for example a free [Neon](https://neon.com) database. |
| `DATABASE_URL_UNPOOLED` | The direct (unpooled) address of the same database, used to set up tables and for backups. |

**Frontend** (`src/frontend/.env`, see `.env.example`):

| Name | What it's for |
|---|---|
| `VITE_API_URL` | Where the backend runs. Defaults to `http://localhost:5000`. |

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
