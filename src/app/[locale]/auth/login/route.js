import { NextResponse } from 'next/server';
export async function POST(req) {
  try {
    const { accessToken, refreshToken,user } = await req.json();
  
    if (!user) {
      return NextResponse.json({ message: 'Missing user' }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true, user });
    const twoDays = 60 * 60 * 24 * 2;

    res.cookies.set('accessToken', accessToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: twoDays,
    });

    // res.cookies.set('refreshToken', refreshToken, {
    //   httpOnly: false,
    //   secure: false,
    //   sameSite: 'lax',
    //   path: '/',
    //   maxAge: twoDays,
    // });

    return res;
  } catch (err) {
    console.error('Error setting cookie:', err);
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}

