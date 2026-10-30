import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_ADMIN_PATH = '/ngd-control-8421';

function adminPath() {
  const raw = (process.env.ADMIN_PATH || DEFAULT_ADMIN_PATH).trim();
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const normalized = withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
  return normalized === '/admin' ? DEFAULT_ADMIN_PATH : normalized;
}

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const secretPath = adminPath();

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });
  }

  if (secretPath !== DEFAULT_ADMIN_PATH && (pathname === DEFAULT_ADMIN_PATH || pathname.startsWith(`${DEFAULT_ADMIN_PATH}/`))) {
    return new NextResponse('Not found', { status: 404 });
  }

  if (pathname === secretPath || pathname.startsWith(`${secretPath}/`)) {
    const suffix = pathname.slice(secretPath.length);
    let response: NextResponse;
    if (suffix === '/' || suffix === '') {
      response = NextResponse.rewrite(new URL(`${DEFAULT_ADMIN_PATH}/index.html`, request.url));
    } else if (secretPath !== DEFAULT_ADMIN_PATH) {
      response = NextResponse.rewrite(new URL(`${DEFAULT_ADMIN_PATH}${suffix}`, request.url));
    } else {
      response = NextResponse.next();
    }
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
