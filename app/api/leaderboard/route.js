import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const quizIdParam = searchParams.get('quizId');
    const sortParam = searchParams.get('sort') || 'score';

    let sql = `
      SELECT a.attempt_id, a.quiz_id, s.name, qz.title, a.score, a.total_marks,
             a.percentage, a.grade, a.taken_at
      FROM attempts a
      JOIN students s ON s.student_id = a.student_id
      JOIN quizzes qz ON qz.quiz_id = a.quiz_id
    `;
    const params = [];

    if (quizIdParam && quizIdParam.trim() !== '') {
      const quizId = Number(quizIdParam);
      if (!Number.isInteger(quizId) || quizId <= 0) {
        return NextResponse.json({ error: 'Invalid quizId filter' }, { status: 400 });
      }
      sql += ' WHERE a.quiz_id = ?';
      params.push(quizId);
    }

    if (sortParam === 'time_desc') {
      sql += ' ORDER BY a.taken_at DESC, a.percentage DESC LIMIT 100';
    } else if (sortParam === 'time_asc') {
      sql += ' ORDER BY a.taken_at ASC, a.percentage DESC LIMIT 100';
    } else {
      sql += ' ORDER BY a.percentage DESC, a.taken_at ASC LIMIT 100';
    }

    const [rows] = await pool.query(sql, params);
    const ranked = rows.map((row, idx) => ({
      ...row,
      percentage: Number(row.percentage),
      rank: idx + 1,
    }));

    return NextResponse.json(ranked);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
