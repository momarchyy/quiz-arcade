import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { isAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const quizIdParam = searchParams.get('quizId');
    const qParam = searchParams.get('q');

    let sql = `
      SELECT q.question_id, q.quiz_id, qz.title AS quiz_title, q.question_text,
             q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.marks
      FROM questions q
      JOIN quizzes qz ON qz.quiz_id = q.quiz_id
    `;
    const conditions = [];
    const params = [];

    if (quizIdParam && quizIdParam.trim() !== '') {
      const quizId = Number(quizIdParam);
      if (!Number.isInteger(quizId) || quizId <= 0) {
        return NextResponse.json({ error: 'Invalid quizId filter' }, { status: 400 });
      }
      conditions.push('q.quiz_id = ?');
      params.push(quizId);
    }

    if (qParam && qParam.trim() !== '') {
      conditions.push('q.question_text LIKE ?');
      params.push(`%${qParam.trim()}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY q.question_id ASC';

    const [rows] = await pool.query(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const quizId = Number(body.quiz_id);
    const questionText = typeof body.question_text === 'string' ? body.question_text.trim() : '';
    const optionA = typeof body.option_a === 'string' ? body.option_a.trim() : '';
    const optionB = typeof body.option_b === 'string' ? body.option_b.trim() : '';
    const optionC = typeof body.option_c === 'string' ? body.option_c.trim() : '';
    const optionD = typeof body.option_d === 'string' ? body.option_d.trim() : '';
    const correctOption = typeof body.correct_option === 'string' ? body.correct_option.trim().toUpperCase() : '';
    const marks = body.marks !== undefined ? Number(body.marks) : 1;

    if (!Number.isInteger(quizId) || quizId <= 0) {
      return NextResponse.json({ error: 'Valid quiz_id is required' }, { status: 400 });
    }
    if (!questionText || !optionA || !optionB || !optionC || !optionD) {
      return NextResponse.json({ error: 'Question text and all 4 options are required' }, { status: 400 });
    }
    if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
      return NextResponse.json({ error: 'correct_option must be A, B, C, or D' }, { status: 400 });
    }
    if (!Number.isInteger(marks) || marks <= 0) {
      return NextResponse.json({ error: 'marks must be a positive integer' }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [quizId, questionText, optionA, optionB, optionC, optionD, correctOption, marks]
    );

    return NextResponse.json(
      {
        question_id: result.insertId,
        quiz_id: quizId,
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption,
        marks,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
