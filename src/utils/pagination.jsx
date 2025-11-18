



export function buildPageTokens({ page, totalPages, siblingCount = 1, boundaryCount = 1 }) {
    if (totalPages <= 1) return [1];

    // 1) Collect pages we always want to show:
    const pages = new Set();

    // left boundary
    for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) pages.add(i);

    // siblings around current page
    const left = Math.max(1, page - siblingCount);
    const right = Math.min(totalPages, page + siblingCount);
    for (let i = left; i <= right; i++) pages.add(i);

    // right boundary
    for (let i = Math.max(totalPages - boundaryCount + 1, 1); i <= totalPages; i++) pages.add(i);

    // 2) Sort the pages we chose
    const sorted = Array.from(pages).sort((a, b) => a - b);

    // 3) Build tokens with smart gaps:
    // - if gap === 2, insert the missing page (e.g., show 1 2 3 instead of 1 … 3)
    // - if gap  >  2, use ellipsis
    const tokens = [];
    for (let i = 0; i < sorted.length; i++) {
        const curr = sorted[i];
        const prev = sorted[i - 1];

        if (i === 0) {
            tokens.push(curr);
            continue;
        }

        if (curr - prev === 1) {
            tokens.push(curr);
        } else if (curr - prev === 2) {
            tokens.push(prev + 1, curr); // fill single hole (fixes the “2 after 1” case)
        } else {
            tokens.push('right-ellipsis', curr); // generic gap
        }
    }

    // Normalize: turn the first gap token into 'left-ellipsis'
    if (tokens.includes('right-ellipsis')) {
        const idx = tokens.indexOf('right-ellipsis');
        tokens[idx] = 'left-ellipsis';
    }

    return tokens;
}