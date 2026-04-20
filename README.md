# Jami Masjid Noori & Madrasa

Production-ready bilingual Next.js 15 application for the masjid and madrasa in Korangi No. 1, Karachi.

## Stack

- Next.js 15 App Router
- Node.js + Express.js backend
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui style component setup
- next-intl v3 for English/Urdu and RTL switching
- MongoDB + Mongoose
- JWT + bcryptjs auth
- Redux Toolkit, framer-motion, lucide-react, zod, react-hook-form, TanStack Table, Recharts, next-themes

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values.
2. Install dependencies with `npm install`.
3. Start frontend + backend together:
   - `npm run dev:full`

Backend startup automatically creates one admin if it does not exist.

## Admin Login

- Email: value of `ADMIN_SEED_EMAIL` (default: `admin@masjid.com`)
- Password: value of `ADMIN_SEED_PASSWORD` (default: `admin123`)

## Language Routes

- English site: `/en`
- Urdu site: `/ur`

## Important Paths

- Root app shell: `src/app/layout.tsx`
- Locale layout: `src/app/[locale]/layout.tsx`
- Public home page: `src/app/[locale]/page.tsx`
- Gallery page: `src/app/[locale]/gallery/page.tsx`
- Projects page: `src/app/[locale]/projects/page.tsx`
- Admin login: `src/app/[locale]/admin/login/page.tsx`
- Protected admin dashboard: `src/app/[locale]/admin/(protected)/page.tsx`
- Generic admin CRUD page: `src/app/[locale]/admin/(protected)/[resource]/page.tsx`
- Express server entry: `backend/server.ts`
- Express models map: `backend/models.ts`
- Express auth helper: `backend/auth.ts`
- Models: `src/models/*`
- Translation files: `messages/en.json`, `messages/ur.json`

## Notes

- Public routes include Home, Income, Expense, Shop, Donations, Fitrah, Projects, Gallery.
- Prayer names are displayed in Urdu across locales.
- Admin changes update MongoDB and appear on the website automatically.
