import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const submitted = body.password ?? request.headers.get('x-admin-password') ?? '';

    if (process.env.ADMIN_PASSWORD && submitted === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
