'use client';

import { Link } from '@/i18n/navigation';

/**
 * BuyerMiniCard.jsx
 * Ultra-compact service-style card.
 * Shows: letter avatar (no real image), name (link), email, tiny role/status chips.
 * Tailwind + JS (Next.js App Router friendly)
 */
export default function UserAvatar({ buyer, href }) {
  const name = buyer?.username || buyer?.email || 'Unknown';
  const email = buyer?.email || '—';
  const role = buyer?.role || 'buyer';
  const initials = getInitials(name);
  const profileHref = href || `/profile/${buyer?.id || ''}`;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Letter avatar - Gradient remains fine as it's on a base color */}
        <div className="h-10 w-10 grid place-items-center rounded-full gradient text-white font-semibold flex-shrink-0 shadow-sm">
          {initials}
        </div>

        <div className="flex flex-col justify-center min-w-0"
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}>
          <Link
            href={profileHref}
            className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 dark:text-dark-text-primary hover:text-main-600 dark:hover:text-main-400 transition-colors truncate"
            title={name}
          >
            <span className="truncate max-w-[140px] sm:max-w-none">{toTitle(name)}</span>

            {/* Role Badge */}
            <span
              className={`inline-flex items-center text-[11px] gap-1 px-2 py-0.5 rounded-full border 
                ${roleTone(role)} 
                dark:bg-dark-bg-card dark:border-dark-border dark:text-dark-text-secondary`}
            >
              {role}
            </span>
          </Link>

          {/* Email Text */}
          <div className="text-xs mt-1 text-slate-500 dark:text-dark-text-secondary truncate max-w-[180px] sm:max-w-none" title={email}>
            {email}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- helpers ------------------------------- */
function getInitials(s) {
  if (!s) return '?';
  const str = String(s).trim();
  if (!str) return '?';
  const parts = str
    .replace(/[_.-]+/g, ' ')
    .split(' ')
    .filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function toTitle(s) {
  if (!s) return s;
  return String(s)
    .split(' ')
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}

function roleTone(role) {
  const r = String(role || '').toLowerCase();

  if (r === 'buyer') {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30';
  }

  if (r === 'seller') {
    return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';
  }

  if (r === 'admin') {
    // Admin is already dark, so we make it pop slightly against the #1e1e24 background
    return 'bg-slate-800 text-white border-slate-700 dark:bg-dark-bg-card dark:border-dark-border';
  }

  // Default / Other
  return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-dark-bg-input dark:text-dark-text-secondary dark:border-dark-border';
}