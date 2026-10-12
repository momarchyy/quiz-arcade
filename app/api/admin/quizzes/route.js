import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { isAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    if (!title || !subject) {
      return NextResponse.json({ error: 'Title and subject are required' }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO quizzes (title, subject, description) VALUES (?, ?, ?)',
      [title, subject, description || null]
    );

    return NextResponse.json(
      { quiz_id: result.insertId, title, subject, description: description || null },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
