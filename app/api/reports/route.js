import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT qz.quiz_id, qz.title,
              COUNT(a.attempt_id) AS attempts,
              ROUND(AVG(a.percentage), 2) AS avg_percentage,
              MAX(a.percentage) AS highest,
              MIN(a.percentage) AS lowest
       FROM quizzes qz
       LEFT JOIN attempts a ON a.quiz_id = qz.quiz_id
       GROUP BY qz.quiz_id, qz.title
       ORDER BY qz.quiz_id`
    );

    const reports = rows.map((r) => ({
      quiz_id: r.quiz_id,
      title: r.title,
      attempts: Number(r.attempts),
      avg_percentage: r.avg_percentage !== null ? Number(r.avg_percentage) : null,
      highest: r.highest !== null ? Number(r.highest) : null,
      lowest: r.lowest !== null ? Number(r.lowest) : null,
    }));

    return NextResponse.json(reports);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
