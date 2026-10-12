# Quiz Arcade: Architecture & Build Spec

> **Instructions for the AI agent:** Read this whole file, then build the complete project exactly as specified.
> Keep everything SIMPLE. Do NOT add features, libraries, or pages that are not listed here.
> Follow the "Build order" in section 12 and the "Definition of done" in section 13.

---

## AI Agent Instructions — Project Map and Code Inspection

### Mandatory Project Map Instructions

1. **At the beginning of every coding task or new coding session, read `PROJECT_MAP.md` first**, if it exists. This is mandatory even for small bug fixes, minor UI changes, and simple feature requests.
2. Use `PROJECT_MAP.md` to identify the relevant files, components, API routes, database tables, and shared logic before inspecting source code.
3. For simple, narrowly scoped tasks, inspect only the files necessary to complete the task. Do not automatically read the entire codebase or the entire `ARCHITECTURE.md`.
4. Read additional source files only when needed to understand dependencies, existing behaviour, or the requested change. Never modify code based on assumptions about files that have not been inspected.
5. Read `ARCHITECTURE.md` when the task involves major architectural changes, affects multiple major components, requires verification against the original specification, or cannot be completed confidently using `PROJECT_MAP.md`.
6. `ARCHITECTURE.md` remains the authoritative specification. `PROJECT_MAP.md` is a concise navigation reference and must never override the architecture requirements.
7. Whenever a task changes file structure, API routes, database schema, shared logic, component responsibilities, or implementation status, update the relevant entries in `PROJECT_MAP.md` during the same task.
8. If `PROJECT_MAP.md` does not exist, create it by inspecting the actual project and documenting the current implementation. Do not assume that planned files already exist.
9. Keep `PROJECT_MAP.md` concise. Do not copy entire source files or duplicate the architecture specification into it.
10. Do not modify `ARCHITECTURE.md` again unless a future task explicitly requires an architecture change.

---

## 1. Purpose

A small college DBMS assignment: a web-based quiz platform backed by a MySQL database.
It must demonstrate exactly three things:

1. **Viewing records:** list all records, First / Previous / Next / Last navigation, and search.
2. **DML from the front end:** INSERT, UPDATE and DELETE through the UI.
3. **Processing:** quiz scoring, percentage and grade computation, a leaderboard and a report.

## 2. Tech stack (fixed)

- **Next.js** (latest stable, App Router), **JavaScript only** (`.js` files, no TypeScript)
- **React** (comes with Next.js)
- **mysql2** (promise API) with raw SQL, no ORM
- **Plain CSS** in `app/globals.css`. No Tailwind, no UI libraries
- Only these dependencies: `next`, `react`, `react-dom`, `mysql2`
- Deployment target: **Vercel** (app) + **Aiven free MySQL** (database)

Create the project with:
`npx create-next-app@latest . --js --app --no-tailwind --no-eslint --no-src-dir --import-alias "@/*"`
then `npm install mysql2`. (If the folder is not empty, scaffold manually with the same layout.)

## 3. Environment variables

`.env.example` (commit this) and `.env.local` (the user fills it in, never commit):

```
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=defaultdb
DB_SSL=true
ADMIN_PASSWORD=changeme
```

`.gitignore` must contain: `node_modules`, `.next`, `.env*.local`.

## 4. Folder structure

```
/
├─ ARCHITECTURE.md
├─ package.json
├─ .env.example
├─ .gitignore
├─ db/
│  ├─ schema.sql
│  └─ seed.sql
├─ scripts/
│  └─ setup-db.js
├─ lib/
│  ├─ db.js            (mysql2 pool)
│  ├─ grade.js         (grade computation)
│  ├─ adminAuth.js     (server-side admin check)
│  └─ adminClient.js   (client helper: adminFetch)
├─ components/
│  ├─ Navbar.js
│  └─ AdminGate.js
└─ app/
   ├─ layout.js
   ├─ globals.css
   ├─ page.js                      (Home: quiz cards)
   ├─ quiz/[id]/page.js            (take quiz + result)
   ├─ leaderboard/page.js          (leaderboard + report)
   ├─ admin/login/page.js
   ├─ admin/quizzes/page.js        (CRUD quizzes)
   ├─ admin/questions/page.js      (CRUD questions + First/Prev/Next/Last + search)
   └─ api/ ...                     (see section 7)
```

**Important rules:**
- Every page is a **client component** (`'use client'`) that fetches data from `/api/...`. Do NOT query the database from server components (the build would try to connect to the DB).
- Every API route file must start with `export const dynamic = 'force-dynamic';`
- In route handlers with dynamic segments, params may be a Promise in newer Next.js: use `const { id } = await params;`
- Use **parameterized queries only** (`?` placeholders). Never concatenate user input into SQL.

## 5. Database schema (MySQL 8)

Do NOT include `CREATE DATABASE`. Tables are created inside the existing database (`defaultdb` on Aiven).

### `db/schema.sql`

```sql
CREATE TABLE IF NOT EXISTS quizzes (
  quiz_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  subject VARCHAR(60) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  question_id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text VARCHAR(500) NOT NULL,
  option_a VARCHAR(200) NOT NULL,
  option_b VARCHAR(200) NOT NULL,
  option_c VARCHAR(200) NOT NULL,
  option_d VARCHAR(200) NOT NULL,
  correct_option CHAR(1) NOT NULL,
  marks INT NOT NULL DEFAULT 1,
  CONSTRAINT chk_correct_option CHECK (correct_option IN ('A','B','C','D')),
  CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id)
    REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS attempts (
  attempt_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  quiz_id INT NOT NULL,
  score INT NOT NULL,
  total_marks INT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  grade VARCHAR(2) NOT NULL,
  taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_student FOREIGN KEY (student_id)
    REFERENCES students(student_id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id)
    REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);
```

Relationships: `quizzes 1──* questions`, `quizzes 1──* attempts`, `students 1──* attempts`.

### `db/seed.sql`

```sql
INSERT INTO quizzes (title, subject, description)
VALUES ('Web Basics', 'Web Development', 'HTML, CSS and JavaScript fundamentals');
SET @q1 = LAST_INSERT_ID();

INSERT INTO quizzes (title, subject, description)
VALUES ('Database Basics', 'DBMS', 'SQL and relational database concepts');
SET @q2 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks) VALUES
(@q1, 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'Hyperlinks and Text Markup Language', 'Home Tool Markup Language', 'A', 1),
(@q1, 'Which CSS property changes the text color?', 'font-color', 'color', 'text-style', 'fgcolor', 'B', 1),
(@q1, 'Which keyword declares a constant in JavaScript?', 'var', 'let', 'const', 'static', 'C', 1),
(@q1, 'Which HTML tag creates the largest heading?', '<h6>', '<head>', '<heading>', '<h1>', 'D', 1),
(@q1, 'What does CSS stand for?', 'Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets', 'B', 1),
(@q2, 'Which SQL statement retrieves data from a table?', 'GET', 'SELECT', 'FETCH', 'OPEN', 'B', 1),
(@q2, 'A primary key must be:', 'Unique and not null', 'Allowed to repeat', 'Always text', 'Optional', 'A', 1),
(@q2, 'Which SQL command adds a new row to a table?', 'ADD ROW', 'INSERT INTO', 'UPDATE', 'CREATE', 'B', 1),
(@q2, 'What does a foreign key do?', 'Encrypts data', 'Links two tables', 'Deletes rows', 'Sorts rows', 'B', 1),
(@q2, 'Which clause filters rows in a SELECT query?', 'ORDER BY', 'GROUP BY', 'WHERE', 'LIMIT', 'C', 1);

INSERT INTO students (name, email) VALUES
('Asha', 'asha@example.com'),
('Ravi', 'ravi@example.com'),
('Meena', 'meena@example.com');

INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q1, 5, 5, 100.00, 'A+' FROM students s WHERE s.email = 'asha@example.com';
INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q1, 4, 5, 80.00, 'A' FROM students s WHERE s.email = 'ravi@example.com';
INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q1, 3, 5, 60.00, 'C' FROM students s WHERE s.email = 'meena@example.com';
INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q2, 4, 5, 80.00, 'A' FROM students s WHERE s.email = 'asha@example.com';
INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
SELECT s.student_id, @q2, 2, 5, 40.00, 'F' FROM students s WHERE s.email = 'ravi@example.com';
```

### `scripts/setup-db.js`

A Node script (ES module or CommonJS, agent's choice) that:
1. Connects with `mysql2/promise` using the env vars, with `multipleStatements: true`, and SSL `{ rejectUnauthorized: false }` unless `DB_SSL === 'false'`.
2. Runs `db/schema.sql`.
3. Runs `SELECT COUNT(*) AS c FROM quizzes`; **only if it is 0**, runs `db/seed.sql`.
4. Prints a clear success message and closes the connection. On error, print the message and exit with code 1.

`package.json` scripts:
```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"db:setup": "node --env-file=.env.local scripts/setup-db.js"
```
(`--env-file` needs Node 20.6 or newer.)

## 6. Shared library code

### `lib/db.js`

```js
import mysql from 'mysql2/promise';

const g = globalThis;

export const pool =
  g._quizPool ??
  (g._quizPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    connectionLimit: 2,        // the free DB allows few connections
    waitForConnections: true,
    queueLimit: 0,
  }));
```

### `lib/grade.js`

```js
export function computeGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}
```

### `lib/adminAuth.js`
Export `isAdmin(request)`: returns true if header `x-admin-password` equals `process.env.ADMIN_PASSWORD`. Admin routes return `401 { error: 'Unauthorized' }` otherwise.

### `lib/adminClient.js`
Export `adminFetch(url, options)`: wraps `fetch`, adds header `x-admin-password` read from `sessionStorage.getItem('adminPw')`, and sets `Content-Type: application/json` when a body is present. On a 401 response it clears the stored password and redirects to `/admin/login`.

### `components/AdminGate.js`
Wrapper for admin pages: on mount, if `sessionStorage` has no `adminPw`, redirect to `/admin/login`; otherwise render children.

## 7. API routes

All return JSON. On error: `{ error: "message" }` with a proper status (400 validation, 401 unauthorized, 404 not found, 500 server). Validate required fields on the server.

### Public

| Method & path | Purpose | Notes |
|---|---|---|
| `GET /api/quizzes` | List quizzes | Include `question_count` (LEFT JOIN + COUNT + GROUP BY) |
| `GET /api/quizzes/[id]/questions` | Questions for taking a quiz | Return `{ quiz, questions }`. **Never include `correct_option`.** |
| `POST /api/quizzes/[id]/submit` | Submit answers and compute result | See processing logic below |
| `GET /api/leaderboard?quizId=` | Ranked attempts | `quizId` optional filter. Top 50. |
| `GET /api/reports` | Per-quiz statistics | attempts count, average %, highest %, lowest % |

### Admin (all require `isAdmin`)

| Method & path | Purpose |
|---|---|
| `POST /api/admin/login` | Returns 200 `{ ok: true }` if password matches, else 401 |
| `POST /api/admin/quizzes` | INSERT quiz (`title`, `subject`, `description`) |
| `PUT /api/admin/quizzes/[id]` | UPDATE quiz |
| `DELETE /api/admin/quizzes/[id]` | DELETE quiz (cascades to questions and attempts) |
| `GET /api/admin/questions?quizId=&q=` | List questions **including `correct_option`**. `quizId` optional filter, `q` optional keyword matched with `question_text LIKE ?` using `%q%`. Order by `question_id`. |
| `POST /api/admin/questions` | INSERT question |
| `PUT /api/admin/questions/[id]` | UPDATE question |
| `DELETE /api/admin/questions/[id]` | DELETE question |

### Key SQL

Leaderboard (add `WHERE a.quiz_id = ?` when filtered). Compute `rank` in JavaScript as index + 1:
```sql
SELECT a.attempt_id, s.name, qz.title, a.score, a.total_marks,
       a.percentage, a.grade, a.taken_at
FROM attempts a
JOIN students s ON s.student_id = a.student_id
JOIN quizzes qz ON qz.quiz_id = a.quiz_id
ORDER BY a.percentage DESC, a.taken_at ASC
LIMIT 50;
```

Report:
```sql
SELECT qz.quiz_id, qz.title,
       COUNT(a.attempt_id) AS attempts,
       ROUND(AVG(a.percentage), 2) AS avg_percentage,
       MAX(a.percentage) AS highest,
       MIN(a.percentage) AS lowest
FROM quizzes qz
LEFT JOIN attempts a ON a.quiz_id = qz.quiz_id
GROUP BY qz.quiz_id, qz.title
ORDER BY qz.quiz_id;
```

### Processing logic for `POST /api/quizzes/[id]/submit` (the "processing" requirement)

Request body: `{ name, email, answers: { "<question_id>": "A" | "B" | "C" | "D" } }`

1. Validate: `name` non-empty, `email` looks like an email, quiz exists and has at least 1 question.
2. Upsert the student:
   `INSERT INTO students (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), student_id = LAST_INSERT_ID(student_id)` then use `insertId` as `student_id`.
3. Load all questions of the quiz (with `correct_option` and `marks`).
4. For each question: if `answers[question_id] === correct_option` then `score += marks`. `total_marks` is the sum of all `marks`.
5. `percentage = Math.round((score / total_marks) * 10000) / 100`, then `grade = computeGrade(percentage)`.
6. `INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade) VALUES (...)`.
7. Respond with:
```json
{
  "attemptId": 7, "score": 4, "totalMarks": 5, "percentage": 80, "grade": "A",
  "review": [
    { "questionId": 1, "questionText": "...", "chosen": "A", "correct": "A", "isCorrect": true,
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." } }
  ]
}
```
An unanswered question has `chosen: null` and counts as wrong.

## 8. Pages and behaviour

### Navbar (all pages)
Logo "QUIZ ARCADE" plus links: Home, Leaderboard, Admin, and a light/dark theme toggle button (sets `data-theme` on `<html>`, remembered in `localStorage`).

### `/` Home
Hero title and tagline ("Pick a quiz. Beat the clock. Get graded."). Grid of quiz cards, each showing title, subject, description, a "N questions" badge and a **PLAY** button linking to `/quiz/[id]`. The button is disabled if the quiz has 0 questions. Cycle card accent colors (yellow, pink, blue, green).

### `/quiz/[id]` Take quiz
Three states on one page:
1. **Details:** form with Name and Email, "Start" button.
2. **Questions:** all questions listed, each with 4 radio options (A to D). Show "Answered X / N". "Submit" button.
3. **Result:** big grade badge, "score / total", percentage bar, then a review list that marks each question green (correct) or red (wrong, showing the correct answer). Buttons: "Play again" and "View leaderboard".

### `/leaderboard`
Quiz filter dropdown ("All quizzes" plus each quiz). Table with columns Rank, Name, Quiz, Score, %, Grade, Date. Top 3 rows show 🥇🥈🥉. Below it, a "Quiz Report" table (attempts, average %, highest, lowest per quiz).

### `/admin/login`
Password input. On submit call `POST /api/admin/login`. On success store the password in `sessionStorage` as `adminPw` and go to `/admin/quizzes`. Otherwise show an error.

### `/admin/quizzes` (inside AdminGate)
- Table of all quizzes (ID, title, subject, description, question count) with **Edit** and **Delete** buttons per row.
- Form above or beside the table to **Add** a quiz; clicking Edit fills the form and the button becomes **Update**.
- Delete asks `confirm()` and warns that its questions and attempts are also deleted.
- Link to the Questions page.

### `/admin/questions` (inside AdminGate). Main demo page for the assignment
- **Filters:** quiz dropdown ("All quizzes" or one quiz) and a **search box** (keyword in question text) with a Search button. Fetch all matching records once and keep them in state.
- **Single-record view with navigation:** shows ONE question at a time (text, options A to D, correct answer, marks) with the label "Record 3 of 12" and four buttons: **⏮ First**, **◀ Previous**, **Next ▶**, **Last ⏭**. Navigation is by index in the fetched array and buttons disable at the edges.
- **Table view:** below it, a table listing ALL matching questions. Clicking a row jumps the single-record view to it.
- **Add / Edit form:** quiz select, question text, options A to D, correct option (A to D select), marks. "Add question" inserts; "Edit" on the current record fills the form and the button becomes "Update"; **Delete** (with `confirm()`) removes the current record.
- After any insert, update or delete, re-fetch the list and keep a sensible current index.

All pages show a clear error banner if an API call fails and a simple "Loading..." state.

## 9. Visual design: "Neo-brutalist arcade"

Make it look unique and playful, not like a default template.

- **Style:** neo-brutalism: thick **3px solid** borders, **hard offset shadows** (`6px 6px 0 var(--ink)`, no blur), rounded corners (12px), flat bright colors, chunky uppercase headings.
- **Font:** `Space Grotesk` via `next/font/google` (weights 400, 500, 700) with a system sans-serif fallback.
- **CSS variables** (define in `:root` and override under `[data-theme="dark"]`):

```css
:root {
  --bg: #fff7e6;      --card: #ffffff;   --ink: #111111;
  --yellow: #ffd23f;  --pink: #ff6b9d;   --blue: #4d96ff;  --green: #3ddc97;  --red: #ff5a5f;
  --on-accent: #111111;
}
[data-theme="dark"] {
  --bg: #15131f;      --card: #221f33;   --ink: #ffffff;
}
```
  Text on colored backgrounds always uses `--on-accent` (dark) so it stays readable in both themes.
- **Buttons:** colored fill, 3px border, hard shadow; on hover translate (-2px, -2px) and grow the shadow; on active translate (4px, 4px) and remove the shadow. Disabled buttons are greyed out.
- **Cards and tables:** white (`--card`) with the same border and shadow. Table header row in `--yellow`.
- **Grade badge:** circular badge, color by grade (A+/A green, B blue, C yellow, D pink, F red).
- **Layout:** centered container, `max-width: 1000px`, responsive (cards in a CSS grid with `auto-fill, minmax(260px, 1fr)`; tables wrapped in `overflow-x: auto`).

## 10. Security (keep it minimal but correct)

- Parameterized SQL everywhere.
- `correct_option` is never sent to students before submission.
- Admin protected by the `ADMIN_PASSWORD` env var (header check). This is intentionally simple for a class project.

## 11. Deployment notes (Vercel + Aiven)

- No `vercel.json` needed. Vercel auto-detects Next.js.
- The same variables from section 3 must be added in Vercel → Project Settings → Environment Variables.
- The Aiven database allows connections from anywhere by default; leave it that way (Vercel IPs change).

## 12. Build order

Complete each stage before the next:
1. Scaffold the project, install `mysql2`, create `.gitignore`, `.env.example`, `package.json` scripts.
2. Create `db/schema.sql`, `db/seed.sql`, `scripts/setup-db.js`.
3. Create `lib/*` files.
4. Create all API routes (section 7).
5. Create `globals.css`, `layout.js`, `Navbar`, `AdminGate`.
6. Create public pages: Home, Quiz, Leaderboard.
7. Create admin pages: Login, Quizzes, Questions.
8. Run `npm install` and `npm run build`, and fix every error. (The build does not need a database connection.)
9. Write a short `README.md` explaining: set up `.env.local`, run `npm run db:setup`, run `npm run dev`.

## 13. Definition of done

- [ ] `npm run build` succeeds.
- [ ] `npm run db:setup` creates 4 tables and seeds 2 quizzes with 5 questions each.
- [ ] Home shows quiz cards; a quiz can be played and shows score, percentage, grade and a per-question review.
- [ ] Leaderboard and report show data and the quiz filter works.
- [ ] Admin can log in, add/edit/delete quizzes, and add/edit/delete questions.
- [ ] Admin Questions page has First / Previous / Next / Last navigation and keyword search.
- [ ] Dark/light toggle works.

## 14. Out of scope (do NOT build)

User accounts with passwords, OAuth, timers, image uploads, rich-text editors, ORMs (Prisma etc.), TypeScript, Tailwind, tests, Docker, state-management libraries, or any extra pages.
