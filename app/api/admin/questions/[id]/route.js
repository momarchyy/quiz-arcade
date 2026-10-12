import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { isAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const questionId = Number(id);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

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
      `UPDATE questions
       SET quiz_id = ?, question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?, marks = ?
       WHERE question_id = ?`,
      [quizId, questionText, optionA, optionB, optionC, optionD, correctOption, marks, questionId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({
      question_id: questionId,
      quiz_id: quizId,
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
      marks,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const questionId = Number(id);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const [result] = await pool.query('DELETE FROM questions WHERE question_id = ?', [questionId]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
