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