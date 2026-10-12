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
    const quizId = Number(id);
    if (!Number.isInteger(quizId) || quizId <= 0) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    if (!title || !subject) {
      return NextResponse.json({ error: 'Title and subject are required' }, { status: 400 });
    }

    const [result] = await pool.query(
      'UPDATE quizzes SET title = ?, subject = ?, description = ? WHERE quiz_id = ?',
      [title, subject, description || null, quizId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ quiz_id: quizId, title, subject, description: description || null });
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
    const quizId = Number(id);
    if (!Number.isInteger(quizId) || quizId <= 0) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    const [result] = await pool.query('DELETE FROM quizzes WHERE quiz_id = ?', [quizId]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
