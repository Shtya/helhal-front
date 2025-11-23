// File: /src/app/api/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });

    // Clear all auth-related cookies

    res.cookies.set('accessToken', '', {
      path: '/',
      maxAge: 0,
    });

    // res.cookies.set('refreshToken', '', {
    //   path: '/',
    //   maxAge: 0,
    // });

    return res;
  } catch (err) {
    console.error('Error clearing cookies:', err);
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
