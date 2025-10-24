


export function localImageLoader({ src, width, quality }) {
    if (src.startsWith('uploads/')) {
        return '/' + src;
    }
    return src;
}

