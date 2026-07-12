# Islamic Institute — Report Card App

Next.js 16 (App Router, TS, Tailwind v4) · Mongoose · Auth.js v5 · @react-pdf · csv

## Progress

- [x] Scaffold Next.js app (TS, App Router, Tailwind)
- [x] Install deps: mongoose, next-auth, bcryptjs, zod, @react-pdf/renderer, csv
- [x] Set up Mongoose connection + models (User, Student, Teacher, Term, Report)
      - `lib/db/mongoose.ts` cached `connectDB()` (reads MONGODB_URI at call time)
      - `lib/models/*` — User(role+passwordHash), Student, Teacher, Term, Report
        (unique compound index student+term+template)
- [x] Create report template registry (hifz + islamic)
      - `lib/reports/*` — types, shared 4-pt grade scale, two templates,
        `getTemplate()` + `computeResult()` (weighted % + letter grade)
- [x] Set up Auth.js credentials auth with roles
      - `auth.ts` Credentials provider (bcrypt verify, role in JWT/session)
      - `proxy.ts` role-based route guard (/admin, /teacher, /student)
      - Login page + server action
- [x] Seed script (admin/teacher/student)
      - `scripts/seed.ts` (idempotent) + `npm run seed`; creates admin, 2
        teachers, 6 students, a Term, and 2 sample published reports
- [x] Teacher mark-entry UI (draft/publish)
      - Dashboard → student → term/template picker → dynamic form from registry
      - Live score preview; Save Draft / Publish server action w/ authz + zod
- [x] Student view (HTML, printable) + PDF download
      - `app/student/*` listing + printable HTML report (`@media print` hides nav)
      - `app/api/reports/[id]/pdf` (@react-pdf, node runtime) + Download button
- [x] CSV backup script + admin UI
      - `scripts/backup.ts` (`npm run backup`) + `app/api/admin/backup` route
      - `lib/reports/exportCsv.ts` flattens all reports (shared by both)
      - Admin dashboard / students / teachers / backup pages

## Run it

1. Set the real password in `.env.local`:
   `MONGODB_URI="mongodb+srv://mots_comp:<REAL_PASSWORD>@jameah.iuyqjmz.mongodb.net/?appName=jameah"`
   (AUTH_SECRET is already generated.)
2. `npm run seed`   → populates accounts + sample data
3. `npm run dev`    → http://localhost:3000
   - Login: admin@jameah.edu / hifz@jameah.edu / s-001@jameah.edu
   - Default password for all seeded accounts: **Password123!**

## Verified
- `npx tsc --noEmit` clean
- `npx next build` clean (all 13 routes)
- Prod server smoke test: `/login` 200, `/`→/login redirect, `/teacher`→
  /login?redirectTo (proxy guard), `/api/auth/providers` 200
- DB-backed flows (seed/mark-entry/PDF/CSV) compile + typecheck but need the
  real Mongo password to run end-to-end.
