# Keg Tracker

A standalone Vite + React app for tracking kegs, connected to Supabase.

## Stack
- Vite + React
- Tailwind CSS
- Supabase (`kegs` table)

## Local Dev

```bash
npm install
npm run dev
```

The `.env` file is already pre-configured with your Supabase credentials.

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (values are in your `.env` file)
4. Deploy — done!

## Deploy to Railway

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add the same environment variables listed above
4. Set the build command: `npm run build`
5. Set the start command: `npx serve dist`

## Supabase Table: `kegs`

| Column         | Type    |
|----------------|---------|
| id             | uuid PK |
| keg_id         | text    |
| location       | text    |
| status         | text    |
| date           | date    |
| beer           | text    |
| batch_number   | text    |
| invoice_number | text    |

## Features
- **Keg Tracker tab** — Full CRUD: add, edit, delete, bulk edit multiple kegs
- **Inventory tab** — Read-only view with status summary cards at the top
- Search/filter by any field or date range
- Color-coded status badges
- Toast notifications for all actions
