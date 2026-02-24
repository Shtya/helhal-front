


export default function DisputeStatusPill({ status }) {
  const map = {
    open: 'bg-yellow-50 text-yellow-800 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-600/40',
    in_review: 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-600/40',
    resolved: 'bg-main-50 text-main-800 ring-main-200 dark:bg-main-900/30 dark:text-main-400 dark:ring-main-600/40',
    rejected: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-600/40',
  };

  const defaultClass =
    'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-dark-bg-card dark:text-dark-text-primary dark:ring-dark-border';

  return (
    <span
      className={`text-nowrap inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 capitalize ${map[status] || defaultClass
        }`}
    >
      {String(status || '—').replace('_', ' ')}
    </span>
  );
}