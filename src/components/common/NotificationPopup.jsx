import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { useDropdownPosition } from '@/hooks/useDropdownPosition';
import { useNotifications } from '@/context/NotificationContext';
import api from '@/lib/axios';
import { Bell, Check, ChevronRight, TypeIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { getNotificationConfig } from '@/app/[locale]/notifications/page';

export const getLink = (relatedEntityType, relatedEntityId, subType) => {
  if (relatedEntityType === 'proposal') {
    return `/my-jobs/${relatedEntityId}/proposals`; // Proposal link
  } else if (relatedEntityType === 'order') {
    if (subType === 'rating') {
      return `/my-orders?orderId=${relatedEntityId}&mode=give-feedback`;
    }
    else if (subType === 'rating_published') {
      return `/my-orders?orderId=${relatedEntityId}&mode=view-feedback`;
    }
    else
      return `/my-orders?orderId=${relatedEntityId}`; // Order link (adjust this route as necessary)
  }
  else if (relatedEntityType === 'transaction') {
    return `/my-billing?tab=transactions`;
  }
  else {
    return null; // Return null if no matching type is found
  }
};


const RowSkeleton = () => (
  <div className='px-4 py-3 flex items-start gap-3'>
    <div className='h-8 w-8 rounded-lg bg-slate-200 animate-pulse' />
    <div className='flex-1 space-y-2'>
      <div className='h-3 w-3/5 rounded bg-slate-200 animate-pulse' />
      <div className='h-3 w-2/5 rounded bg-slate-200 animate-pulse' />
    </div>
  </div>
);



const relTime = iso => {
  if (!iso) return '';
  const now = Date.now();
  const t = new Date(iso).getTime();
  const s = Math.max(1, Math.floor((now - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};


const NotificationPopup = ({ admin = false }) => {
  const t = useTranslations('MyOrders.modals.notifications');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [meta, setMeta] = useState({ total_records: 0, per_page: 10, current_page: 1 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const menuStyle = useDropdownPosition(open, btnRef);
  const [notifications, setNotifications] = useState([]);
  const {
    unreadNotificationCount,
    markOneAsRead,
    markAllAsRead,
    subscribe, } = useNotifications();

  useEffect(() => {
    const unsubscribe = subscribe((action) => {
      switch (action.type) {

        case "NEW_NOTIFICATION":
          setNotifications(prev => {
            const exists = prev.some(n => n.id === action.payload.id);
            if (exists) return prev;
            return [action.payload, ...prev];
          });
          break;

        case "MARK_ONE_AS_READ":
          setNotifications(prev =>
            prev.map(n =>
              n.id === action.payload.id ? { ...n, isRead: true } : n
            )
          );
          break;

        case "REVERT_MARK_ONE":
          setNotifications(prev =>
            prev.map(n =>
              n.id === action.payload.id ? { ...n, isRead: false } : n
            )
          );
          break;

        case "MARK_ALL_AS_READ":
          setNotifications(prev =>
            prev.map(n => ({ ...n, isRead: true }))
          );
          break;

        case "REVERT_MARK_ALL":
          // Simply re-fetch from server
          fetchList();
          break;
      }
    });

    return () => unsubscribe();
  }, []);


  // ---- fetch helpers ----
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const { records = [], total_records, per_page, current_page } = res.data || {};
      setNotifications(records);
      setMeta({ total_records, per_page, current_page });
    } catch {
      setNotifications([]);
      setMeta({ total_records: 0, per_page: 10, current_page: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // initial fetch
    (async () => {
      await fetchList();
      if (!mounted) return;
    })();

    const onClick = e => {
      if (!btnRef.current) return;
      if (!btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => {
      mounted = false;
      document.removeEventListener('mousedown', onClick);
    };
  }, [user?.id]);


  const goToTarget = n => (n.relatedEntityType === 'order' ? `/my-orders/${n.relatedEntityId}` : '/notifications');

  return (
    <div className='' ref={btnRef}>
      <motion.button onClick={() => setOpen(v => !v)} className='relative  inline-grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500' whileTap={{ scale: 0.96 }} aria-label='Notifications'>
        <Bell className='h-5 w-5 text-slate-700' />
        {unreadNotificationCount > 0 && <span className='absolute -top-1 -right-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-main-600 px-1 text-[11px] text-white font-semibold'>{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div ref={menuRef} style={menuStyle} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 12, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className='absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl' role='dialog' aria-label='Notifications menu'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-slate-200 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>{t('title')}</div>
              <div className='flex items-center gap-2'>
                <button onClick={markAllAsRead} className='inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-50' title={t('markAllAsRead')}>
                  <Check className='h-3.5 w-3.5' />
                  {t('markAllAsRead')}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='max-h-72 overflow-auto'>
              {loading ? (
                <>
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </>
              ) : notifications.length === 0 ? (
                <div className='px-6 py-10 text-center text-slate-500'>
                  <div className='mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-slate-100'>
                    <Bell className='h-5 w-5 text-slate-500' />
                  </div>
                  <div className='text-sm'>{t('allCaughtUp')}</div>
                </div>
              ) : (
                notifications.map(n => {
                  const { Icon, color } = getNotificationConfig(n.type, n.relatedEntityType);
                  return (<div
                    key={n.id}
                    data-notification-id={`${n.id}`}
                    className={`px-4 py-3 hover:bg-slate-50 transition ${!n.isRead ? 'bg-main-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">

                      {/* icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                        <Icon className='w-5 h-5' aria-hidden="true" />
                      </div>


                      <div className="min-w-0 flex-1">

                        {/* Title + timestamp + View link */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium text-slate-900">{n.title}</div>

                          <div className="flex items-center gap-3 shrink-0">
                            {getLink(n.relatedEntityType, n.relatedEntityId, n.type) && (
                              <Link
                                href={getLink(n.relatedEntityType, n.relatedEntityId, n.type)}
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {t('view')}
                              </Link>
                            )}
                            <div className="text-[11px] text-slate-500">{relTime(n.created_at)}</div>
                          </div>
                        </div>

                        {/* Message */}
                        <div className="mt-0.5 line-clamp-2 text-sm text-slate-600">
                          {n.message}
                        </div>

                        {/* Bottom actions */}
                        <div className="mt-2 flex items-center gap-2">
                          {!n.isRead && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-main-100 px-2 py-0.5 text-[11px] font-medium text-main-800">
                              {t('new')} <ChevronRight className="h-3 w-3" />
                            </span>
                          )}

                          {!n.isRead && (
                            <button
                              onClick={() => markOneAsRead(n.id)}
                              className="text-[11px] text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
                            >
                              {t('markAsRead')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>)
                }))

              }
            </div>

            {/* Footer */}
            <div className='border-t border-slate-200 px-4 py-2 text-center'>
              <Link href={admin ? `/dashboard/notifications` : `/notifications`} className='text-sm text-main-700 hover:underline' onClick={() => setOpen(false)}>
                {t('viewAll')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPopup;
