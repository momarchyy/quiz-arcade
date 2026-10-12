import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const quizId = Number(id);
    if (!Number.isInteger(quizId) || quizId <= 0) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const [quizRows] = await pool.query(
      'SELECT quiz_id, title, subject, description, created_at FROM quizzes WHERE quiz_id = ?',
      [quizId]
    );
    if (quizRows.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const [questions] = await pool.query(
      `SELECT question_id, quiz_id, question_text, option_a, option_b, option_c, option_d, marks
       FROM questions
       WHERE quiz_id = ?
       ORDER BY question_id ASC`,
      [quizId]
    );

    return NextResponse.json({ quiz: quizRows[0], questions });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
