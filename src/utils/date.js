

export function getDateAgo(date) {
    if (!date) return '—';
    const createdTs = new Date(date).getTime();
    const diffMs = Date.now() - createdTs;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}


export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}