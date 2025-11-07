


export default function DisputeStatusPill({ status }) {
  const map = {
    open: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
    in_review: 'bg-blue-50 text-blue-800 ring-blue-200',
    resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  };
  return <span className={` text-nowrap inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 capitalize ${map[status] || 'bg-gray-50 text-gray-700 ring-gray-200'}`}>{String(status || '—').replace('_', ' ')}</span>;
}
