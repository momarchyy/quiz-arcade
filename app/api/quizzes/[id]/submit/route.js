import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { computeGrade } from '@/lib/grade';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const quizId = Number(id);
    if (!Number.isInteger(quizId) || quizId <= 0) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const [quizRows] = await pool.query('SELECT quiz_id FROM quizzes WHERE quiz_id = ?', [quizId]);
    if (quizRows.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const [questions] = await pool.query(
      `SELECT question_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks
       FROM questions
       WHERE quiz_id = ?
       ORDER BY question_id ASC`,
      [quizId]
    );

    if (questions.length === 0) {
      return NextResponse.json({ error: 'This quiz has no questions' }, { status: 400 });
    }

    const [studentResult] = await pool.query(
      `INSERT INTO students (name, email) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), student_id = LAST_INSERT_ID(student_id)`,
      [name, email]
    );
    const studentId = studentResult.insertId;

    let score = 0;
    let totalMarks = 0;
    const review = [];

    for (const q of questions) {
      const marks = Number(q.marks) || 1;
      totalMarks += marks;
      const rawChosen = answers[q.question_id] ?? answers[String(q.question_id)];
      const chosen = ['A', 'B', 'C', 'D'].includes(rawChosen) ? rawChosen : null;
      const isCorrect = chosen !== null && chosen === q.correct_option;
      if (isCorrect) {
        score += marks;
      }
      review.push({
        questionId: q.question_id,
        questionText: q.question_text,
        chosen,
        correct: q.correct_option,
        isCorrect,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
      });
    }

    const percentage = Math.round((score / totalMarks) * 10000) / 100;
    const grade = computeGrade(percentage);

    const [attemptResult] = await pool.query(
      `INSERT INTO attempts (student_id, quiz_id, score, total_marks, percentage, grade)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, quizId, score, totalMarks, percentage, grade]
    );

    return NextResponse.json({
      attemptId: attemptResult.insertId,
      score,
      totalMarks,
      percentage,
      grade,
      review,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
