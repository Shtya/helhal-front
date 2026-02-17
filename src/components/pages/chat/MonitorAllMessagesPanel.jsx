import { AccessibleButton } from './ChatThread';
import Img from '@/components/atoms/Img';
import { X, Search } from 'lucide-react';
import { Shimmer } from './ChatApp';
import { useLocale, useTranslations } from 'next-intl';

/**
 * Admin monitor panel: shows buyer + seller name, image, role for each conversation.
 * No archive, favorite, tabs, or contact admin.
 */
export function MonitorAllMessagesPanel({
  items,
  onSearch,
  query,
  onSelect,
  t: tProp,
  userPagination,
  setUserPagination,
  loading,
  onRefresh,
}) {
  const t = tProp || useTranslations('Dashboard.monitor');
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const p = userPagination?.page ?? 1;
  const pages = userPagination?.pages ?? 1;

  return (
    <div className="flex flex-col h-full">
      <div className="w-full relative pt-6">
        <div className="px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold tracking-tight">{t('allConversations')}</h2>
            <button
              disabled={loading}
              onClick={onRefresh}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label={t('refresh')}
              title={t('refresh')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
          </div>

          <div className="relative rounded-lg bg-white px-3 py-2 mb-4 ring-1 ring-inset ring-slate-200">
            <div className="flex items-center" disabled={loading}>
              <Search size={18} className="text-gray-500 mr-2" />
              <input
                value={query}
                onChange={(e) => onSearch(e.target.value?.trim())}
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
                placeholder={t('searchConversations')}
                aria-label={t('searchConversations')}
              />
              {query && (
                <AccessibleButton
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title={t('clear')}
                  type="button"
                  onClick={() => onSearch('')}
                  ariaLabel={t('clear')}
                >
                  <X size={18} />
                </AccessibleButton>
              )}
            </div>
          </div>
        </div>

        <div className="my-4 h-px w-full bg-slate-200" />
        <div className="px-6">
          {loading ? (
            <div className="py-2 h-[320px] w-[calc(100%+44px)] ltr:ml-[-22px] rtl:mr-[-22px] px-4 overflow-auto">
              {[...Array(4)].map((_, i) => (
                <MonitorThreadSkeletonItem key={i} />
              ))}
            </div>
          ) : (
            <div className="py-2 h-[320px] w-[calc(100%+44px)] ltr:ml-[-22px] rtl:mr-[-22px] px-4 overflow-auto">
              <ul className="space-y-2" aria-label="Conversation list">
                {items.map((it) => (
                  <li key={it.id}>
                    <MonitorThreadItem
                      {...it}
                      onClick={() => onSelect(it.id)}
                      t={t}
                    />
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="text-sm text-slate-500 p-4 text-center" aria-live="polite">
                    {t('noConversations')}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between p-3 border-t border-t-gray-200 bg-white rounded-b-xl">
        <button
          onClick={() => setUserPagination((uP) => ({ ...uP, page: Math.max(1, p - 1) }))}
          disabled={p <= 1}
          className="w-[35px] h-[35px] flex items-center justify-center p-2 disabled:opacity-30 hover:bg-gray-100 rounded-full"
        >
          {isArabic ? '▶' : '◀'}
        </button>
        <span className="text-sm font-medium">
          {t('page', { current: p, total: pages })}
        </span>
        <button
          onClick={() => setUserPagination((uP) => ({ ...uP, page: Math.min(pages, p + 1) }))}
          disabled={p >= pages}
          className="w-[35px] h-[35px] flex items-center justify-center p-2 disabled:opacity-30 hover:bg-gray-100 rounded-full"
        >
          {isArabic ? '◀' : '▶'}
        </button>
      </div>
    </div>
  );
}

function MonitorThreadItem({
  id,
  buyer,
  seller,
  time,
  active,
  onClick,
  t,
}) {
  const buyerName = buyer?.username || buyer?.person?.username || t('unknown');
  const sellerName = seller?.username || seller?.person?.username || t('unknown');
  const buyerRole = buyer?.role || 'buyer';
  const sellerRole = seller?.role || 'seller';
  const buyerAvatar = buyer?.profileImage || '/no-user.png';
  const sellerAvatar = seller?.profileImage || '/no-user.png';

  return (
    <div
      onClick={onClick}
      data-conversation-id={id}
      aria-label={`${t('conversation')}: ${buyerName} & ${sellerName}`}
      aria-pressed={active}
      className={[
        'cursor-pointer group w-full text-left rounded-xl p-3',
        'ring-1 ring-transparent transition-all duration-200',
        'hover:ring-slate-200 hover:bg-slate-50/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-500/50',
        active ? 'gradient' : 'bg-transparent text-slate-900',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative">
            <Img altSrc="/no-user.png" src={buyerAvatar} alt={buyerName} className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow" />
            <span className={['absolute -bottom-1 -right-1 text-[9px] px-1 rounded bg-emerald-100 text-emerald-800 font-medium', active && '!bg-white/20 !text-white'].join(' ')}>
              {t('buyer')}
            </span>
          </div>
          <div className="relative">
            <Img altSrc="/no-user.png" src={sellerAvatar} alt={sellerName} className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow" />
            <span className={['absolute -bottom-1 -right-1 text-[9px] px-1 rounded bg-main-100 text-main-800 font-medium', active && '!bg-white/20 !text-white'].join(' ')}>
              {t('seller')}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="space-y-1">
            <p className={['truncate font-medium text-sm', active && 'text-white'].join(' ')} title={buyerName}>
              <span className={['font-semibold', active ? 'text-white/90' : 'text-emerald-600'].join(' ')}>{t('buyer')}:</span> {buyerName}
            </p>
            <p className={['truncate font-medium text-sm', active && 'text-white'].join(' ')} title={sellerName}>
              <span className={['font-semibold', active ? 'text-white/90' : 'text-main-600'].join(' ')}>{t('seller')}:</span> {sellerName}
            </p>
          </div>
          <p className={['truncate text-xs mt-1', active ? 'text-white/90' : 'text-gray-500'].join(' ')}>{time}</p>
        </div>
      </div>
    </div>
  );
}

function MonitorThreadSkeletonItem() {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="flex flex-col gap-2">
        <Shimmer className="h-8 w-8 rounded-full" animated />
        <Shimmer className="h-8 w-8 rounded-full" animated />
      </div>
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3 w-2/3" animated />
        <Shimmer className="h-3 w-1/2" animated />
        <Shimmer className="h-2 w-1/4" animated />
      </div>
    </div>
  );
}
