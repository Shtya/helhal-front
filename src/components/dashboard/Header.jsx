'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import { usePathname } from '@/i18n/navigation';
import { getMenuItems } from './Sidebar';
import { Menu, X, Bell, Check } from 'lucide-react';
import api from '@/lib/axios';
import NotificationPopup from '../common/NotificationPopup';
import { useTranslations } from 'next-intl';

/* --------------------------------- Header --------------------------------- */

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const [computedMeta, setComputedMeta] = useState({ title: '', desc: '' });

  const t = useTranslations();
  const menuItems = getMenuItems(t);

  useEffect(() => {
    if (!pathname) return;
    const index = menuItems?.find(e => e.href === pathname) ?? { title: '', desc: '' };
    setComputedMeta(index);
  }, [pathname]);

  return (
    <header
      className='
        sticky top-0 z-40
        bg-transparent backdrop-blur-xl
        supports-[backdrop-filter]:bg-white/40
      '
      aria-label='Page header'>
      <div className='flex flex-col gap-1  py-2'>
        <div className='flex items-center justify-between gap-3'>
          {/* Left: hamburger + titles */}
          <div className='flex items-center gap-3'>
            <HamburgerButton open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className='flex items-start flex-col'>
              <motion.h1
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className='
                  text-xl sm:text-xl font-semibold tracking-tight
                  bg-clip-text text-transparent
                  bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900
                '>
                {computedMeta.title}
              </motion.h1>
              <motion.p initial={{ y: 4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }} className='text-sm text-slate-600'>
                {computedMeta.desc}
              </motion.p>
            </div>
          </div>

          {/* Right: actions */}
          <div className='flex items-center gap-2'>
            <NotificationPopup admin />
          </div>
        </div>
      </div>

      <div className='h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent' />
    </header>
  );
}

function HamburgerButton({ open, onToggle, className = '' }) {
  return (
    <motion.button type='button' onClick={onToggle} aria-label={open ? 'Close sidebar' : 'Open sidebar'} aria-pressed={open} aria-expanded={open} className={`  relative inline-flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 transition cursor-pointer ${className}`} whileTap={{ scale: 0.96 }}>
      {/* hover sheen */}
      <motion.span
        className='absolute inset-0 rounded-xl bg-white/55'
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        style={{
          boxShadow: '0 6px 24px rgba(16,24,40,0.06)',
          border: '1px solid rgba(15,23,42,0.08)',
        }}
      />

      {/* Hamburger/X lines */}
      <span className='relative z-10 block h-5 w-5'>
        {/* top */}
        <motion.span className='absolute left-1/2 top-1/2 block h-[2px] !w-4 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-800' initial={false} animate={open ? { rotate: 45, y: 0, width: 20 } : { rotate: 0, y: -6, width: 20 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
        {/* middle */}
        <motion.span className='absolute left-1/2 top-1/2 block h-[2px] !w-4 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-800' initial={false} animate={open ? { opacity: 0, scaleX: 0.3 } : { opacity: 1, scaleX: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
        {/* bottom */}
        <motion.span className='absolute left-1/2 top-1/2 block h-[2px] !w-4 -translate-x-1/2 -translate-y-1/2 rounded bg-slate-800' initial={false} animate={open ? { rotate: -45, y: 0, width: 20 } : { rotate: 0, y: 6, width: 20 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
      </span>
    </motion.button>
  );
}

function Notifications() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const listUrl = '/notifications/admin';
  const countUrl = '/notifications/admin/unread-count';

  const unreadCount = useMemo(() => items.filter(i => !i.isRead).length, [items]);

  const toggleOpen = useCallback(() => setOpen(v => !v), []);
  const close = useCallback(() => setOpen(false), []);
  useEscapeToClose(open, close);
  const popRef = useClickOutside(close);

  // fetch first page on open
  useEffect(() => {
    setPage(1);
    fetchNotifications(1, true).catch(() => { });
  }, []);

  async function fetchNotifications(targetPage, replace = false) {
    try {
      setLoading(true);
      const res = await api.get(listUrl, {
        params: { page: targetPage, limit: 20, sortBy: 'created_at', sortOrder: 'DESC' },
      });
      // Support both shapes: {data:[...], meta:{...}} (admin) or CRUD.findAll response
      const data = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];

      const next = replace ? data : [...items, ...data];
      setItems(next);
      // meta.total optional
      const total = res.data?.meta?.total ?? (next.length >= targetPage * 20 ? next.length + 1 : next.length);
      setHasMore(next.length < total);
      setPage(targetPage);
    } catch (e) {
      console.error('Fetch notifications error', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMore() {
    if (loading || !hasMore) return;
    await fetchNotifications(page + 1);
  }

  async function fetchUnreadCount() {
    try {
      const res = await api.get(countUrl);
      // If you want to trust server count instead of local calc:
      // setServerUnread(res.data?.unread ?? 0);
      return res.data?.unread ?? 0;
    } catch (e) {
      return 0;
    }
  }

  async function markOneRead(id) {
    try {
      await api.put(`/notifications/read/${id}`);
      setItems(prev => prev.map(i => (i.id === id ? { ...i, isRead: true } : i)));
    } catch (e) {
      console.error('Mark read error', e);
    }
  }

  async function markAllRead() {
    try {
      setMarkingAll(true);
      await api.put('/notifications/read-all');
      setItems(prev => prev.map(i => ({ ...i, isRead: true })));
    } catch (e) {
      console.error('Mark all read error', e);
    } finally {
      setMarkingAll(false);
    }
  }

  const relativeTime = useCallback(iso => {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return 'now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    const days = Math.floor(diff / 86_400_000);
    if (days === 1) return 'Yesterday';
    return `${days}d`;
  }, []);

  return (
    <div className='relative'>
      {/* Bell button */}
      <motion.button type='button' onClick={toggleOpen} aria-haspopup='dialog' aria-expanded={open} className='relative h-10 w-10 rounded-xl border border-slate-300 bg-white text-slate-700 grid place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60' whileTap={{ scale: 0.96 }}>
        <Bell className='h-5 w-5' />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span key='badge' initial={{ scale: 0, opacity: 0, y: -2 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }} className='absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[11px] leading-[18px] grid place-items-center shadow-sm'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={popRef}
            role='dialog'
            aria-label='Notifications'
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className='
      absolute right-0 mt-2 w-[360px] max-w-[90vw]
      rounded-lg border border-slate-200 bg-white shadow-lg
      will-change-transform overflow-hidden
    '>
            {/* Header */}
            <div className='flex items-center justify-between px-4 py-3 bg-slate-50/70 border-b border-slate-200'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-semibold text-slate-800'>{t('Dashboard.header.adminNotifications')}</span>
                {unreadCount > 0 && <span className='text-xs text-slate-500'>({unreadCount} {t('Dashboard.header.new')})</span>}
              </div>
              <button onClick={markAllRead} disabled={markingAll || unreadCount === 0} className=' cursor-pointer inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50'>
                <Check className='h-3.5 w-3.5' />
                {t('Dashboard.header.markAllRead')}
              </button>
            </div>

            {/* List */}
            <ul className='max-h-[360px] overflow-y-auto'>
              {items.map(item => {
                const unread = !item.isRead;
                return (
                  <motion.li key={item.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className={['group relative flex items-start gap-3 px-4 py-3', unread ? 'bg-emerald-50/60 hover:bg-emerald-50 ring-1 ring-emerald-200/40' : 'hover:bg-slate-50/80'].join(' ')}>
                    {/* left accent when unread */}
                    {unread && <span className='absolute left-0 top-0 h-full w-1 bg-emerald-400/80' aria-hidden='true' />}

                    {/* Unread dot */}
                    <div className='pt-1'>
                      <motion.span initial={false} animate={unread ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0.25 }} className={`inline-block h-2.5 w-2.5 rounded-full ${unread ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                    </div>

                    {/* Content */}
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-medium text-slate-800 truncate'>{item.title}</p>
                        <span className='ml-3 shrink-0 text-[11px] text-slate-500'>{relativeTime(item.created_at)}</span>
                      </div>
                      <p className='mt-0.5 text-sm text-slate-600 line-clamp-2'>{item.message}</p>

                      {/* Item actions */}
                      {unread && (
                        <div className='mt-2'>
                          <button onClick={() => markOneRead(item.id)} className='cursor-pointer text-xs text-emerald-700 hover:text-emerald-800'>
                            {t('Dashboard.header.markAsRead')}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.li>
                );
              })}

              {/* Load more */}
              {hasMore && (
                <li className='px-4 py-2'>
                  <button disabled={loading} onClick={fetchMore} className='w-full rounded-lg border border-slate-200 bg-white py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50'>
                    {loading ? t('Dashboard.header.loading') : t('Dashboard.header.loadMore')}
                  </button>
                </li>
              )}

              {!loading && items.length === 0 && <li className='px-4 py-10 text-center text-sm text-slate-500'>{t('Dashboard.header.noNotifications')}</li>}
            </ul>

            {/* Footer */}
            <div className='border-t border-slate-200 bg-white/60 px-4 py-2'>
              <button onClick={close} className='w-full rounded-xl border border-slate-200 bg-white py-2 text-sm text-slate-700 hover:bg-slate-50'>
                {t('Dashboard.header.close')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function useClickOutside(onOutside) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onOutside?.();
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [onOutside]);
  return ref;
}

function useEscapeToClose(active, onClose) {
  useEffect(() => {
    if (!active) return;
    const onKey = e => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}
