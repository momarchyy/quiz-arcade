import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT qz.quiz_id, qz.title, qz.subject, qz.description, qz.created_at,
              COUNT(q.question_id) AS question_count
       FROM quizzes qz
       LEFT JOIN questions q ON q.quiz_id = qz.quiz_id
       GROUP BY qz.quiz_id, qz.title, qz.subject, qz.description, qz.created_at
       ORDER BY qz.quiz_id ASC`
    );
    const quizzes = rows.map((r) => ({
      ...r,
      question_count: Number(r.question_count),
    }));
    return NextResponse.json(quizzes);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
