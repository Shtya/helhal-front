import { baseImg } from "@/lib/axios";



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

export function maskEmail(email) {
    const [user, domain] = email.split('@');
    const maskedUser = user.length <= 3 ? user[0] + '*'.repeat(user.length - 1) : user.slice(0, 2) + '*'.repeat(user.length - 3) + user.slice(-1);
    return `${maskedUser}@${domain}`;
}


//pathname: string, params: URLSearchParams
export function updateUrlParams(pathname, params) {
    const newUrl = `${pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
}
