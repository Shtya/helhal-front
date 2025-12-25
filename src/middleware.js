import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { getJwtPayload } from './utils/auth';
import { Permissions } from './constants/permissions';
import { has } from './utils/permissions';



// 1) Initialize next-intl middleware
const intlMiddleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: 'always'
});

// 2) Public (unprotected) routes
const PUBLIC_ROUTES = [
  { path: '/auth', strict: true },
  { path: '/explore', strict: true, notFor: 'seller', relpace: "/jobs" },
  { path: '/services/:categoryId/:serviceId', regex: true, strict: true },
  { path: '/services', strict: false, notFor: 'seller', relpace: "/jobs" },
  { path: '/become-seller' },
  { path: '/invite' },
  { path: '/jobs', strict: true, notFor: 'buyer', relpace: "/services" },
  { path: '/terms', strict: true },
  { path: '/privacy-policy', strict: true },
  { path: '/profile/:id', regex: true, strict: true },
  { path: '/', strict: true, notFor: 'seller', relpace: "/jobs" }
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


const DASHBOARD_ROUTE_PERMISSIONS = {
  '/dashboard/users': { domain: 'users', view: Permissions.Users.View },
  '/dashboard/categories': { domain: 'categories', view: Permissions.Categories.View },
  '/dashboard/services': { domain: 'services', view: Permissions.Services.View },
  '/dashboard/jobs': { domain: 'jobs', view: Permissions.Jobs.View },
  '/dashboard/orders': { domain: 'orders', view: Permissions.Orders.View },
  '/dashboard/invoices': { domain: 'invoices', view: Permissions.Invoices.View },
  '/dashboard/disputes': { domain: 'disputes', view: Permissions.Disputes.View },
  '/dashboard/finance': { domain: 'finance', view: Permissions.Finance.View },
  '/dashboard/settings': { domain: 'settings', view: Permissions.Settings.Update }, // هنا view = Update
  '/dashboard': { domain: 'statistics', view: Permissions.Statistics.View },
};



export async function middleware(request) {

  // Disable automatic browser detection
  request.headers.set('accept-language', '');

  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // Detect locale from URL
  const locale =
    routing.locales.find((l) => pathname.startsWith(`/${l}`)) ??
    routing.defaultLocale;

  // Remove locale prefix to compare route
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  const payload = await getJwtPayload(token);
  const role = payload?.role; // ✅ role now comes from JWT
  const permissions = payload?.permissions; // ✅ permissions now comes from JWT


  // -----------------------------
  // 1) PUBLIC ROUTES → always allowed
  // -----------------------------
  const publicRoute = getPublicRouteMatch(pathWithoutLocale, role);

  if (publicRoute) {
    // Check if the user is restricted from this specific public route
    if (publicRoute.restricted) {
      const redirectPath = publicRoute.relpace || '/'; // Fallback to '/' if replace is missing

      // Create the redirect URL (keeping the current locale/origin)
      const url = request.nextUrl.clone();
      url.pathname = redirectPath;

      return NextResponse.redirect(url);
    }

    // Otherwise, allow access
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

  if (!payload) {
    const url = new URL(`/${locale}/auth`, request.url);
    return NextResponse.redirect(url);
  }


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

  // -----------------------------
  // 3) Dashboard-specific protection
  // -----------------------------
  if (pathWithoutLocale.startsWith('/dashboard')) {
    if (role !== 'admin') {
      // 1. Check current route permission
      const currentRoute = Object.keys(DASHBOARD_ROUTE_PERMISSIONS).find(r => {
        return pathWithoutLocale.startsWith(r)
      });

      let hasAccess = false;
      if (currentRoute) {
        const { domain, view } = DASHBOARD_ROUTE_PERMISSIONS[currentRoute];
        const mask = permissions?.[domain] ?? 0;
        hasAccess = has(mask, view);
      }

      // 2. If access denied OR visiting root '/dashboard' without permission
      if (!hasAccess) {

        // If they were going to root dashboard and failed, or were blocked from a sub-page
        // Find the FIRST route they actually have permission for
        const fallbackRoute = Object.entries(DASHBOARD_ROUTE_PERMISSIONS).find(([route, config]) => {
          const mask = permissions?.[config.domain] ?? 0;
          return has(mask, config.view);
        });

        if (fallbackRoute) {
          // Redirect to the first page they are allowed to see (e.g., /dashboard/users)
          return NextResponse.redirect(new URL(`/${locale}${fallbackRoute[0]}`, request.url));
        }

        // If they have NO permissions for ANY dashboard route, send to auth
        return NextResponse.redirect(new URL(`/${locale}/auth`, request.url));
      }
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


function getPublicRouteMatch(path, userRole) {
  const match = PUBLIC_ROUTES.find(route => {
    if (route.regex) {
      return createPathRegex(route.path, route?.strict).test(path);
    }
    if (route.strict) {
      return path === route.path;
    }
    return path.startsWith(route.path);
  });

  if (!match) return null;

  // If the route has a 'notFor' restriction and it matches the current user's role
  if (match.notFor && match.notFor === userRole) {
    return { ...match, restricted: true };
  }

  return { ...match, restricted: false };
}