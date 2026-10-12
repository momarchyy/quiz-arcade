# Quiz Arcade

A Neo-Brutalist web-based quiz platform backed by MySQL, built with Next.js App Router, React, `mysql2`, and plain CSS.

## Quick Setup

1. **Configure Environment Variables**
   Copy `.env.example` to `.env.local` and fill in your MySQL database credentials and admin password:
   ```bash
   cp .env.example .env.local
   ```

2. **Initialize & Seed the Database**
   Run the setup script (creates the 4 tables and seeds initial quizzes, questions, students, and attempts if empty):
   ```bash
   npm run db:setup
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
