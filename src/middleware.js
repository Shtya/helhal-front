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
  '/auth',
  '/explore',
  '/services',
  '/become-seller',
  '/invite',
  '/jobs',
  '/terms',
  '/messagesprivacy-policy',
  'profile/:id',
  '/'
];

// Only buyers
const BUYER_ROUTES = [
  '/share-job-description',
  '/my-jobs',
  '/my-disputes',
  '/my-orders'
];

// Only sellers
const SELLER_ROUTES = [
  '/create-gig',
  '/my-gigs',
  '/jobs/proposals',
  '/my-disputes',
  '/my-orders'
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
  const isPublic =
    PUBLIC_ROUTES.includes(pathWithoutLocale) ||
    /^\/profile\/[^/]+$/.test(pathWithoutLocale); // allow /profile/:id but not /profile

  if (isPublic) {
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
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
    }
  }

  if (SELLER_ROUTES.some((r) => pathWithoutLocale.startsWith(r))) {
    if (role !== 'seller') {
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
    }
  }

  if (ADMIN_ROUTES.some((r) => pathWithoutLocale.startsWith(r))) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
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
