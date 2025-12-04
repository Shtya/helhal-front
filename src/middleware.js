import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { getJwtPayload } from './utils/auth';



// 1) Initialize next-intl middleware
const intlMiddleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: 'always'
});

// 2) Public (unprotected) routes
const PUBLIC_ROUTES = [
  { path: '/auth', strict: true },
  { path: '/explore', strict: true },
  { path: '/services' },
  { path: '/become-seller' },
  { path: '/invite' },
  { path: '/jobs', strict: true },
  { path: '/terms', strict: true },
  { path: '/privacy-policy', strict: true },
  { path: '/profile/:id', regex: true, strict: true },
  { path: '/', strict: true }
];


// Only buyers
const BUYER_ROUTES = [
  '/share-job-description',
  '/my-jobs',
];

// Only sellers
const SELLER_ROUTES = [
  '/create-gig',
  '/my-gigs',
  '/jobs/proposals',
];

// Only admins
const ADMIN_ROUTES = [
  '/dashboard',
];

export async function middleware(request) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // Detect locale from URL
  const locale =
    routing.locales.find((l) => pathname.startsWith(`/${l}`)) ??
    routing.defaultLocale;

  // Remove locale prefix to compare route
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // -----------------------------
  // 1) PUBLIC ROUTES → always allowed
  // -----------------------------
  if (isPublicRoute(pathWithoutLocale)) {
    return intlMiddleware(request);
  }

  // -----------------------------
  // 2) Must be authenticated
  // -----------------------------
  if (!token) {
    const url = new URL(`/${locale}/auth`, request.url);
    return NextResponse.redirect(url);
  }

  // -----------------------------
  // 3) Decode JWT and extract role
  // -----------------------------
  const payload = await getJwtPayload(token);
  if (!payload) {
    const url = new URL(`/${locale}/auth`, request.url);
    return NextResponse.redirect(url);
  }

  const role = payload.role; // ✅ role now comes from JWT

  // -----------------------------
  // 3) Role-specific protection
  // -----------------------------
  if (BUYER_ROUTES.some((r) => pathWithoutLocale.startsWith(r))) {
    if (role !== 'buyer') {
      return NextResponse.redirect(new URL(`/${locale}/auth`, request.url));
    }
  }

  if (SELLER_ROUTES.some((r) => pathWithoutLocale.startsWith(r))) {
    if (role !== 'seller') {
      return NextResponse.redirect(new URL(`/${locale}/auth`, request.url));
    }
  }

  if (ADMIN_ROUTES.some((r) => pathWithoutLocale.startsWith(r))) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL(`/${locale}/auth`, request.url));
    }
  }

  // -----------------------------
  // Everything OK → run next-intl
  // -----------------------------
  return intlMiddleware(request);
}

// 3) Required matcher for intl + auth
export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};


function createPathRegex(pattern, exact = true) {
  // Escape regex special chars except ":" and "/"
  let regexStr = pattern.replace(/([.+*?=^!${}()[\]|\\])/g, "\\$1");

  // Replace :param with a capturing group for non-slash segments
  regexStr = regexStr.replace(/:([A-Za-z0-9_]+)/g, "([^/]+)");

  if (exact) {
    // Match the whole string
    regexStr = `^${regexStr}$`;
  } else {
    // Match paths that start with the pattern
    regexStr = `^${regexStr}(?:/.*)?$`;
  }

  return new RegExp(regexStr);
}

function isPublicRoute(path) {
  return PUBLIC_ROUTES.some(route => {
    if (route.regex) {
      return createPathRegex(route.path, route?.strict).test(path);
    }
    if (route.strict) {
      return path === route.path;
    }

    // default: startWith
    return path.startsWith(route.path);
  });
}
