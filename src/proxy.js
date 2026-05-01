import { NextResponse } from 'next/server';

export function proxy(req) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  // 認証のユーザー名とパスワード
  const USER = 'staff';
  const PASS = '0000'; // ※後で変更できます

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === USER && pwd === PASS) {
      return NextResponse.next();
    }
  }
  
  return new NextResponse('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
