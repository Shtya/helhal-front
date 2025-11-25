
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });

    // Clear all auth-related cookies

    console.log('Clearing cookies...');
    res.cookies.delete('accessToken');

    res.cookies.delete('refreshToken');

    console.log('Cookies cleared successfully.');
    return res;
  } catch (err) {
    console.error('Error clearing cookies:', err);
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
