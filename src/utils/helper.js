import { routing } from "@/i18n/routing";
import { baseImg } from "@/lib/axios";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";



export function localImageLoader({ src, width, quality }) {
    if (src.startsWith('uploads/')) {
        return '/' + src;
    }
    return src;
}



export function resolveUrl(u) {
    if (!u) return '';
    if (/^(https?:|blob:|data:)/i.test(u)) return u;
    return (baseImg || '') + u.replace(/^\/+/, '');
}


export function resolveImageUrl(u) {
    if (!u) return '';

    // absolute URLs or blob/data URLs → return as-is
    if (/^(https?:|blob:|data:)/i.test(u)) return u;

    // if it starts with /uploads → prepend baseImg
    if (/^\/uploads/i.test(u)) {
        return (baseImg || '') + u.replace(/^\/+/, '');
    }

    // everything else → return as provided
    return u;
}


export function maskEmail(email) {
    const [user, domain] = email.split('@');
    const maskedUser = user.length <= 3 ? user[0] + '*'.repeat(user.length - 1) : user.slice(0, 2) + '*'.repeat(user.length - 3) + user.slice(-1);
    return `${maskedUser}@${domain}`;
}



export function updateUrlParams(
    pathname,
    params,
    locale
) {
    // Remove existing locale from pathname
    const normalizedPath = pathname.replace(
        new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`),
        ''
    );

    const localizedPath = locale
        ? `/${locale}${normalizedPath}`
        : normalizedPath;

    const newUrl = params.toString()
        ? `${localizedPath}?${params.toString()}`
        : localizedPath;

    window.history.replaceState(null, '', newUrl);
}


export const fmtMoney = n => `${n?.toLocaleString()}`;


export function initialsFromName(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || parts[0]?.[1] || '' || '';
    return (first + second).toUpperCase();
}

export function isErrorAbort(error) {
    const isAbort = error?.name === 'AbortError' || error?.code === 'ERR_CANCELED' || error?.message?.toLowerCase?.().includes('canceled');

    return isAbort;
}


export function cn(...inputs) {
    return twMerge(clsx(inputs))
}
