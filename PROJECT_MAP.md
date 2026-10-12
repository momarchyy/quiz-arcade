# Quiz Arcade — Project Map

Concise navigation reference for AI coding sessions. Read this file first before inspecting the repository.

---

## 1. Project Overview

**Quiz Arcade** is a neo-brutalist web-based quiz platform built for a college DBMS assignment. It demonstrates record viewing (single-record First/Previous/Next/Last navigation, table view, and keyword search), front-end DML (`INSERT`, `UPDATE`, `DELETE`), and server-side quiz processing (scoring, percentage/grade calculation, leaderboard, and per-quiz aggregate reports).

- **Tech Stack:** Next.js (App Router, JavaScript `.js` only), React, `mysql2/promise` (raw parameterized SQL, no ORM), plain CSS (`app/globals.css`).
- **Dependencies:** `next`, `react`, `react-dom`, `mysql2`.

---

## 2. File Map

| File | Responsibility | When to Inspect |
|---|---|---|
| `ARCHITECTURE.md` | Authoritative project specification | Architectural changes, multi-component changes, or spec verification |
| `PROJECT_MAP.md` | Quick navigation index of the codebase | Start of every coding session/task |
| `package.json` | Scripts (`dev`, `build`, `start`, `db:setup`) and dependencies | Modifying scripts or checking dependencies |
| `jsconfig.json` | Path alias `@/*` mapped to `./*` | Resolving module import paths |
| `.env.example` | Template for required environment variables | Checking required env var names |
| `.gitignore` | Ignores `node_modules`, `.next`, `.env*.local`, `.vercel` | Git ignore rules |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD workflow that auto-deploys to Vercel on every push to `master`/`main` | Modifying CI/CD deployment pipeline |
| `README.md` | Quick setup instructions | Updating user documentation |
| `db/schema.sql` | DDL for `quizzes`, `questions`, `students`, `attempts` | Schema changes or inspecting column constraints |
| `db/seed.sql` | Initial seed data (2 quizzes, 10 questions, 3 students, 5 attempts) | Modifying initial seed records |
| `scripts/setup-db.js` | Node script that runs `schema.sql` and conditionally `seed.sql` | Debugging or changing DB initialization |
| `lib/db.js` | Singleton `mysql2/promise` connection pool (`pool`) | Changing DB pool config or SSL handling |
| `lib/grade.js` | `computeGrade(percentage)` helper (`A+`, `A`, `B`, `C`, `D`, `F`) | Changing grade thresholds |
| `lib/adminAuth.js` | `isAdmin(request)` checking `x-admin-password` against `ADMIN_PASSWORD` | Modifying server-side admin auth logic |
| `lib/adminClient.js` | `adminFetch(url, options)` client wrapper injecting `x-admin-password` and handling `401` redirects | Modifying client-side authenticated admin API requests |
| `components/Navbar.js` | Top navigation bar and persistent light/dark theme toggle | Changing header links or theme toggle logic |
| `components/AdminGate.js` | Client wrapper redirecting to `/admin/login` if `sessionStorage.adminPw` is missing | Changing client-side route protection for admin pages |
| `app/layout.js` | Root layout loading `Space Grotesk` font, `globals.css`, and `Navbar` | Global layout or font changes |
| `app/globals.css` | Complete Neo-brutalist arcade stylesheet and light/dark CSS variables | Any styling, theme color, card, table, or button changes |

---

## 3. API Map

All API routes export `dynamic = 'force-dynamic'`, use parameterized SQL queries (`?`), and return JSON (`{ error: "message" }` on errors).

| Method & Endpoint | Purpose | Route Handler File | Auth |
|---|---|---|---|
| `GET /api/quizzes` | List all quizzes with `question_count` | `app/api/quizzes/route.js` | Public |
| `GET /api/quizzes/[id]/questions` | Fetch quiz metadata and questions (omits `correct_option`) | `app/api/quizzes/[id]/questions/route.js` | Public |
| `POST /api/quizzes/[id]/submit` | Upsert student, grade answers, record attempt, return score & review | `app/api/quizzes/[id]/submit/route.js` | Public |
| `GET /api/leaderboard?quizId=&sort=` | Top attempts ordered by score (`percentage DESC, taken_at ASC`) or completion time (`time_desc` / `time_asc`) with `quiz_id` and rank | `app/api/leaderboard/route.js` | Public |
| `GET /api/reports` | Per-quiz aggregate stats (attempts count, avg %, highest %, lowest %) | `app/api/reports/route.js` | Public |
| `POST /api/admin/login` | Validate admin password against `process.env.ADMIN_PASSWORD` | `app/api/admin/login/route.js` | Password body |
| `POST /api/admin/quizzes` | `INSERT` a new quiz (`title`, `subject`, `description`) | `app/api/admin/quizzes/route.js` | `isAdmin` |
| `PUT /api/admin/quizzes/[id]` | `UPDATE` an existing quiz by ID | `app/api/admin/quizzes/[id]/route.js` | `isAdmin` |
| `DELETE /api/admin/quizzes/[id]` | `DELETE` a quiz by ID (cascades to questions & attempts) | `app/api/admin/quizzes/[id]/route.js` | `isAdmin` |
| `GET /api/admin/questions?quizId=&q=` | List questions (includes `correct_option`), optional quiz & keyword filter | `app/api/admin/questions/route.js` | `isAdmin` |
| `POST /api/admin/questions` | `INSERT` a new question | `app/api/admin/questions/route.js` | `isAdmin` |
| `PUT /api/admin/questions/[id]` | `UPDATE` a question by ID | `app/api/admin/questions/[id]/route.js` | `isAdmin` |
| `DELETE /api/admin/questions/[id]` | `DELETE` a question by ID | `app/api/admin/questions/[id]/route.js` | `isAdmin` |

---

## 4. Database Map

- **Schema:** `db/schema.sql`
- **Seed Data:** `db/seed.sql`
- **Connection Pool:** `lib/db.js`
- **Setup Script:** `scripts/setup-db.js`

| Table | Primary Key | Foreign Keys & Constraints | Purpose |
|---|---|---|---|
| `quizzes` | `quiz_id` | — | Stores quiz `title`, `subject`, `description`, `created_at` |
| `questions` | `question_id` | `quiz_id` → `quizzes(quiz_id) ON DELETE CASCADE`; `CHECK (correct_option IN ('A','B','C','D'))` | Stores 4-option multiple-choice questions, `correct_option`, and `marks` |
| `students` | `student_id` | `UNIQUE(email)` | Stores student `name` and unique `email` |
| `attempts` | `attempt_id` | `student_id` → `students(student_id) ON DELETE CASCADE`; `quiz_id` → `quizzes(quiz_id) ON DELETE CASCADE` | Records `score`, `total_marks`, `percentage`, `grade`, `taken_at` |

**Relationships:** `quizzes 1──* questions`, `quizzes 1──* attempts`, `students 1──* attempts`.

---

## 5. Component Map

| Component | File | Used By | Purpose |
|---|---|---|---|
| `Navbar` | `components/Navbar.js` | `app/layout.js` (all pages) | Displays "QUIZ ARCADE" logo, navigation links (Home, Leaderboard, Admin), a conditional "Logout Admin" button when an admin session is active, and light/dark theme toggle (`data-theme` on `<html>`, persisted in `localStorage`) |
| `AdminGate` | `components/AdminGate.js` | `app/admin/quizzes/page.js`, `app/admin/questions/page.js` | Checks `sessionStorage.getItem('adminPw')` on mount; redirects to `/admin/login` if absent |

---

## 6. Page Map

Every page is a client component (`'use client'`).

| Route | File | Purpose & Key Features |
|---|---|---|
| `/` | `app/page.js` | **Home:** Hero banner, grid of quiz cards with cycling accent colors (yellow, pink, blue, green), question count badge, and PLAY button (disabled if 0 questions). |
| `/quiz/[id]` | `app/quiz/[id]/page.js` | **Take Quiz:** 3-step flow: (1) Student Name & Email form (automatically clears any active admin session on submit), (2) Questions list with radio options A–D and "Answered X / N" counter, (3) Results view with circular grade badge, score, percentage progress bar, and per-question green/red review. |
| `/leaderboard` | `app/leaderboard/page.js` | **Leaderboard & Report:** Quiz filter dropdown, Sort dropdown (`Highest Score %`, `Completion Time Newest First`, `Completion Time Oldest First`), separate leaderboard sections for each quiz (each with its own Attempt Record Browser with ⏮ First, ◀ Previous, Next ▶, Last ⏭ navigation and clickable ranked table with 🥇🥈🥉 medals & full timestamps), and "Quiz Report" aggregate table below. |
| `/admin/login` | `app/admin/login/page.js` | **Admin Login:** Password form calling `POST /api/admin/login`; stores password in `sessionStorage` (`adminPw`) and redirects to `/admin/quizzes`. |
| `/admin/quizzes` | `app/admin/quizzes/page.js` | **Admin Quizzes CRUD:** Protected by `AdminGate`. Add/Update quiz form, table of all quizzes with Edit and Delete (with cascade confirmation warning), link to Questions page. |
| `/admin/questions` | `app/admin/questions/page.js` | **Admin Questions CRUD & Browser:** Protected by `AdminGate`. Quiz filter dropdown + keyword search box, Single-Record Browser ("Record X of Y" with ⏮ First, ◀ Previous, Next ▶, Last ⏭ buttons), Add/Update/Delete question form, and clickable table of all matching questions. |

---

## 7. Shared Logic

- **Database Access:** `lib/db.js` exports `pool` (cached on `globalThis._quizPool`, `connectionLimit: 2`).
- **Grade Calculation:** `lib/grade.js` exports `computeGrade(percentage)` (`>=90` A+, `>=80` A, `>=70` B, `>=60` C, `>=50` D, `<50` F).
- **Server Admin Auth:** `lib/adminAuth.js` exports `isAdmin(request)` comparing `x-admin-password` request header to `process.env.ADMIN_PASSWORD`.
- **Client Admin Fetch:** `lib/adminClient.js` exports `adminFetch(url, options)` attaching `x-admin-password` from `sessionStorage` and redirecting to `/admin/login` on HTTP 401.

---

## 8. Commands

- `npm run dev` — Start Next.js development server (`next dev`)
- `npm run build` — Create production build (`next build`)
- `npm run start` — Start Next.js production server (`next start`)
- `npm run db:setup` — Initialize schema and seed database using `.env.local` (`node --env-file=.env.local scripts/setup-db.js`)

---

## 9. Environment Variables

Defined in `.env.example` and configured locally in `.env.local` (never committed):

| Variable | Purpose |
|---|---|
| `DB_HOST` | MySQL server hostname |
| `DB_PORT` | MySQL server port (default `3306`) |
| `DB_USER` | MySQL database username |
| `DB_PASSWORD` | MySQL database password |
| `DB_NAME` | MySQL database name (e.g., `defaultdb`) |
| `DB_SSL` | Enable SSL connection (`true` uses `{ rejectUnauthorized: false }`, `false` disables SSL) |
| `ADMIN_PASSWORD` | Password required for admin login and `x-admin-password` header verification |

---

## 10. Current Implementation Status

- **Completed:**
  - Project configuration (`package.json`, `jsconfig.json`, `.gitignore`, `.env.example`, `README.md`).
  - Database schema (`db/schema.sql`), seed data (`db/seed.sql`), and setup script (`scripts/setup-db.js`).
  - Shared libraries (`lib/db.js`, `lib/grade.js`, `lib/adminAuth.js`, `lib/adminClient.js`).
  - All 5 public API routes and all 8 admin API routes/methods with `dynamic = 'force-dynamic'` and parameterized SQL.
  - Reusable components (`Navbar.js`, `AdminGate.js`), root layout (`app/layout.js`), and Neo-brutalist CSS (`app/globals.css`).
  - All 6 client pages (`/`, `/quiz/[id]`, `/leaderboard`, `/admin/login`, `/admin/quizzes`, `/admin/questions`).
  - Production build (`npm run build`) verified and passing.
  - `.env.local` configured and `npm run db:setup` executed against the live Aiven MySQL database (schema created and initial data seeded).
- **Incomplete / Known Issues:**
  - None. All specification items are complete and verified.

---

## 11. Rules for Future AI Coding Sessions

1. For a simple, narrowly scoped request, read `PROJECT_MAP.md` first and inspect only the specific files needed to complete that request.
2. Do not automatically read `ARCHITECTURE.md` or scan the entire repository for every small change.
3. Read additional files only when necessary to understand a dependency, API contract, shared component, or affected behaviour.
4. Read `ARCHITECTURE.md` when a task affects multiple major components, involves an architectural decision, requires verification against the original requirements, or cannot be resolved confidently using the project map.
5. Never guess about code you have not inspected. Open the relevant implementation before editing it.
6. If the project map is missing information or appears outdated, inspect the relevant files and correct the map.
7. Whenever a task changes the file structure, API routes, database schema, component responsibilities, shared logic, or implementation status, update `PROJECT_MAP.md` in the same task.
8. Do not rewrite the entire map after every minor change. Update only the affected entries.
9. Do not modify `ARCHITECTURE.md` unless explicitly requested. It remains the authoritative project specification; `PROJECT_MAP.md` is only a navigation aid.
