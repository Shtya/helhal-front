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
        {/* Letter avatar only */}
        <div className="h-10 w-10 grid place-items-center rounded-full gradient text-white font-semibold flex-shrink-0">
          {initials}
        </div>

        <div className="flex flex-col justify-center min-w-0"
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}>
          <Link
            href={profileHref}
            className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 hover:text-indigo-600 truncate"
            title={name}
          >
            <span className="truncate max-w-[140px] sm:max-w-none">{toTitle(name)}</span>
            <span
              className={`inline-flex items-center text-[11px] gap-1 px-2 py-0.5 rounded-full border ${roleTone(role)}`}
            >
              {role}
            </span>
          </Link>
          <div className="text-xs mt-1 text-slate-500 truncate max-w-[180px] sm:max-w-none" title={email}>
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
  if (r === 'buyer') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (r === 'seller') return 'bg-amber-50 text-amber-800 border-amber-200';
  if (r === 'admin') return 'bg-slate-800 text-white border-slate-700';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}
