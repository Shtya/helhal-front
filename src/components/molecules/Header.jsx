'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, usePathname, useRouter } from '@/i18n/navigation'; // if you don't use this alias, swap to next/navigation
import { useTranslations } from 'next-intl';
import { Mail, ShieldCheck, User as UserIcon, Menu, X, LogOut, Briefcase, Compass, Store, LayoutGrid, Code2, Palette, FilePlus2, ListTree, ClipboardList, FileText, ChevronDown, Bell, User, Settings, CreditCard, UserPlus, DollarSign, MessageCircle, ShoppingCart, CheckCircle2, AlertCircle, ChevronRight, Check, ListChecks, LucideLayoutDashboard } from 'lucide-react';
import GlobalSearch from '../atoms/GlobalSearch';
import api from '@/lib/axios';
import { localImageLoader } from '@/utils/helper';
import { useDropdownPosition } from '@/hooks/useDropdownPosition';
import { useAuth } from '@/context/AuthContext';
import Img from '../atoms/Img';
import Logo from '../common/Logo';

/* =========================================================
   Animations
   ========================================================= */
const springy = { type: 'spring', stiffness: 500, damping: 30, mass: 0.6 };
const fadeDown = { hidden: { opacity: 0, y: -12 }, show: { opacity: 1, y: 0, transition: { ...springy } } };
const stagger = { hidden: { opacity: 1 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const fadeIn = { hidden: { opacity: 0, x: 12 }, show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 360, damping: 30 } } };

/* =========================================================
   Lightweight Helpers (inline so this file is standalone)
   ========================================================= */
export const Divider = ({ className = '' }) => <div className={`my-1 border-t border-slate-200 ${className}`} />;



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

const TypeIcon = ({ type }) => {
  if (type === 'payment') return <CreditCard className='h-4 w-4 text-emerald-700' />;
  if (type === 'success') return <CheckCircle2 className='h-4 w-4 text-emerald-700' />;
  return <AlertCircle className='h-4 w-4 text-slate-600' />;
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

const NotificationPopup = () => {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badge, setBadge] = useState(0); // unread count from /unread-count
  const [meta, setMeta] = useState({ total_records: 0, per_page: 10, current_page: 1 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const menuStyle = useDropdownPosition(open, btnRef);

  // ---- fetch helpers ----
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      // endpoint returns CRUD.findAll style payload
      const count = Number(res?.data?.total_records ?? 0);
      setBadge(count);
    } catch {
      // keep existing badge on error
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const { records = [], total_records, per_page, current_page } = res.data || {};
      setRecords(records);
      setMeta({ total_records, per_page, current_page });
    } catch {
      setRecords([]);
      setMeta({ total_records: 0, per_page: 10, current_page: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // initial fetches
    (async () => {
      await Promise.all([fetchUnreadCount(), fetchList()]);
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
  }, []);

  // ---- actions ----
  const markOneAsRead = async id => {
    // optimistic UI
    setRecords(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    setBadge(b => Math.max(0, b - 1));
    try {
      await api.put(`/notifications/read/${id}`);
    } catch {
      // revert on error
      setRecords(prev => prev.map(n => (n.id === id ? { ...n, isRead: false } : n)));
      setBadge(b => b + 1);
    }
  };

  const markAllAsRead = async () => {
    // optimistic UI
    const unread = records.some(n => !n.isRead);
    if (!unread && badge === 0) return;
    setRecords(prev => prev.map(n => ({ ...n, isRead: true })));
    const prevBadge = badge;
    setBadge(0);
    try {
      await api.put('/notifications/read-all');
    } catch {
      // revert on error
      setBadge(prevBadge);
      setRecords(prev => prev); // we can't easily restore previous flags → refetch
      fetchList();
      fetchUnreadCount();
    }
  };

  const goToTarget = n => (n.relatedEntityType === 'order' ? `/my-orders/${n.relatedEntityId}` : '/notifications');

  return (
    <div className='' ref={btnRef}>
      <motion.button onClick={() => setOpen(v => !v)} className='relative  inline-grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500' whileTap={{ scale: 0.96 }} aria-label='Notifications'>
        <Bell className='h-5 w-5 text-slate-700' />
        {badge > 0 && <span className='absolute -top-1 -right-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-emerald-600 px-1 text-[11px] text-white'>{badge > 99 ? '99+' : badge}</span>}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div ref={menuRef} style={menuStyle} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 12, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className='absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl' role='dialog' aria-label='Notifications menu'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-slate-200 px-4 py-3'>
              <div className='text-sm font-semibold text-slate-900'>Notifications</div>
              <div className='flex items-center gap-2'>
                <button onClick={markAllAsRead} className='inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-50' title='Mark all as read'>
                  <Check className='h-3.5 w-3.5' />
                  Read all
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
              ) : records.length === 0 ? (
                <div className='px-6 py-10 text-center text-slate-500'>
                  <div className='mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-slate-100'>
                    <Bell className='h-5 w-5 text-slate-500' />
                  </div>
                  <div className='text-sm'>You’re all caught up!</div>
                </div>
              ) : (
                records.map(n => (
                  <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 ${!n.isRead ? 'bg-emerald-50/30' : ''}`}>
                    <div className='flex items-start gap-3'>
                      <div className='grid h-8 w-8 place-items-center rounded-lg bg-emerald-50'>
                        <TypeIcon type={n.type} />
                      </div>

                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center justify-between gap-2'>
                          <div className='truncate text-sm font-medium text-slate-900'>{n.title}</div>
                          <div className='shrink-0 text-[11px] text-slate-500'>{relTime(n.created_at)}</div>
                        </div>

                        <div className='mt-0.5 line-clamp-2 text-sm text-slate-600'>{n.message}</div>

                        <div className='mt-2 flex items-center gap-2'>
                          {!n.isRead && (
                            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800'>
                              New <ChevronRight className='h-3 w-3' />
                            </span>
                          )}

                          {/* actions */}
                          {!n.isRead && (
                            <button onClick={() => markOneAsRead(n.id)} className='text-[11px] text-slate-600 underline-offset-2 hover:underline'>
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className='border-t border-slate-200 px-4 py-2 text-center'>
              <Link href='/notifications' className='text-sm text-emerald-700 hover:underline' onClick={() => setOpen(false)}>
                View all
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =========================================================
   Header
   ========================================================= */
export default function Header() {
  const t = useTranslations('layout');
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user, logout, role } = useAuth();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const isGuest = role === 'guest';
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const toggleMobileNav = () => setIsMobileNavOpen(s => !s);

  const buildNavLinks = u => {
    const common = [
      { href: '/explore', label: 'Explore', icon: <Compass className='h-5 w-5' /> },
      {
        label: 'Services',
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          {
            href: '/services',
            label: 'Services',
            icon: <Briefcase className='h-4 w-4' />,
          },
          {
            href: '/services/all',
            label: 'All Services',
            icon: <ListChecks className='h-4 w-4' />,
          },
        ],
      },
    ];

    //guest

    const guest = [
      {
        label: 'Jobs',
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          { href: '/jobs', label: 'Browse Jobs', icon: <ListTree className='h-4 w-4' /> },
        ],
      },
    ]
    // Buyer-only
    const buyer = [
      {
        label: 'Jobs',
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          { href: '/share-job-description', label: 'Create Job', icon: <FilePlus2 className='h-4 w-4' /> },
          { href: '/jobs', label: 'Browse Jobs', icon: <ListTree className='h-4 w-4' /> },
          { href: '/my-jobs', label: 'My Jobs (Buyer)', icon: <ClipboardList className='h-4 w-4' /> },
        ],
      },
    ];

    // Seller-only
    const seller = [
      {
        label: 'Jobs',
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          { href: '/jobs', label: 'Browse Jobs', icon: <ListTree className='h-4 w-4' /> },
          { href: '/jobs/proposals', label: 'My Proposals', icon: <FileText className='h-4 w-4' /> },
        ],
      },
    ];

    // Seller-only
    const admin = [
      {
        label: 'Jobs',
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          { href: '/jobs', label: 'Browse Jobs', icon: <ListTree className='h-4 w-4' /> },
        ],
      },
      { href: '/dashboard', label: 'Dashboard', icon: <LucideLayoutDashboard className='h-4 w-4' /> },
    ];


    // Conditional + common
    if (isGuest) return [...common, ...guest, { href: '/become-seller', label: 'Become Seller', icon: <Store className='h-5 w-5' /> }]
    if (u?.role === 'buyer') return [...common, ...buyer, { href: '/become-seller', label: 'Become Seller', icon: <Store className='h-5 w-5' /> }];
    if (u?.role === 'seller') return [...common, ...seller];
    if (u?.role === 'admin') return [...common, ...admin];
    return [...common]; // fallback if no role
  };

  const navLinks = buildNavLinks(user);
  const getNavItemsByRole = role => {
    const byOrder = (a, b) => (a.order ?? 99999) - (b.order ?? 99999);

    if (role === 'guest') return [];

    const common = [
      { href: '/profile', label: 'My Profile', icon: <User size={18} className='text-gray-500' />, active: pathname === '/profile', order: 1 },
      { href: '/my-orders', label: 'My Orders', icon: <ClipboardList size={18} className='text-gray-500' />, active: pathname.startsWith('/my-orders'), order: 2 },
      { href: '/my-disputes', label: 'My Disputes', icon: <Bell size={18} className='text-gray-500' />, active: pathname.startsWith('/my-disputes'), order: 4 },
      { href: '/my-billing', label: 'My Billing', icon: <CreditCard size={18} className='text-gray-500' />, active: pathname.startsWith('/my-billing'), order: 5 },
      { href: '/settings', label: 'Settings', icon: <Settings size={18} className='text-gray-500' />, active: pathname.startsWith('/settings'), order: 16 },
      { href: '/invite', label: 'Invite New User', icon: <UserPlus size={18} className='text-gray-500' />, active: pathname.startsWith('/invite'), order: 17 },
      { divider: true, order: 8 },
    ];

    const buyer = [
      { href: '/share-job-description', label: 'Share Your Job', icon: <FilePlus2 size={18} className='text-gray-500' />, active: pathname.startsWith('/share-job-description'), order: 10 },
      { href: '/my-jobs', label: 'My Jobs', icon: <Briefcase size={18} className='text-gray-500' />, active: pathname.startsWith('/my-jobs'), order: 11 },
      { href: '/become-seller', label: 'Become a Seller', icon: <DollarSign size={18} className='text-gray-500' />, active: pathname.startsWith('/become-seller'), order: 12 },
    ];

    const seller = [
      { href: '/my-gigs', label: 'My Services', icon: <LayoutGrid size={18} className='text-gray-500' />, active: pathname.startsWith('/my-gigs'), order: 14 },
      { href: '/create-gig', label: 'Create a Service', icon: <FilePlus2 size={18} className='text-gray-500' />, active: pathname.startsWith('/create-gig'), order: 15 },
    ];

    const items = [...common];
    if (role === 'buyer') items.push(...buyer);
    if (role === 'seller') items.push(...seller);
    items.sort(byOrder);

    // tidy dividers
    const out = [];
    for (const it of items) {
      const prev = out[out.length - 1];
      if (it.divider) {
        if (!prev || prev.divider) continue;
        out.push(it);
      } else out.push(it);
    }
    if (out[out.length - 1]?.divider) out.pop();
    return out;
  };

  const navItems = user ? getNavItemsByRole(user.role) : [];

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
      // purge local
      logout();
      // optional: hit your API (swap to your endpoint)
      await fetch('/api/logout', { method: 'POST' }).catch(() => { });
    } finally {
      setIsLogoutLoading(false);
      router.push('/');
    }
  };

  return (
    <header className='sticky top-0 z-40 transition-all duration-300 backdrop-blur-md bg-white/70 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]'>
      <div className='container h-16 md:h-[88px] flex items-center justify-between gap-3'>
        {/* Left: Logo + nav */}
        <div className='flex items-center gap-1 md:gap-3 shrink-0'>
          <Logo />
          <NavLinks links={navLinks} />
        </div>

        {/* Middle: Search */}
        <GlobalSearch isMobileNavOpen={isMobileNavOpen} />

        {/* Right: Actions */}
        <div className='flex items-center gap-1 md:gap-1.5 lg:gap-2 shrink-0'>
          {user ? (
            <>
              <Link href='/chat' aria-label='Go to chat' className='shrink-0 relative inline-grid place-items-center h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50'>
                <MessageCircle className='h-5 w-5 text-slate-600' />
                <span className='absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-emerald-600 text-white text-[11px] grid place-items-center'>2</span>
              </Link>

              <NotificationPopup />

              <Link href='/cart' aria-label='Cart' className='shrink-0  relative inline-grid place-items-center h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50'>
                <ShoppingCart className='h-5 w-5 text-slate-600 ' />
              </Link>

              {/* Mobile toggle */}
              <MobileToggle toggleMobileNav={toggleMobileNav} isMobileNavOpen={isMobileNavOpen} />
              <AvatarDropdown user={user} navItems={navItems} onLogout={handleLogout} />
            </>
          ) : (
            <div className='flex items-center gap-2 md:gap-3'>
              <Link href='/auth?tab=login' className='px-3 md:px-4 py-2 text-sm font-medium text-slate-700 hover:text-emerald-700 transition-colors rounded-xl'>
                Sign In
              </Link>
              <Link href='/auth?tab=register' className='px-3 md:px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors'>
                Sign Up
              </Link>
              <MobileToggle toggleMobileNav={toggleMobileNav} isMobileNavOpen={isMobileNavOpen} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer open={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} user={user} navLinks={navLinks} navItems={navItems} pathname={pathname} onLogout={handleLogout} isLogoutLoading={isLogoutLoading} />
    </header>
  );
}

const MobileToggle = ({ toggleMobileNav, isMobileNavOpen }) => {
  return (
    <motion.button onClick={toggleMobileNav} className='lg:hidden p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50' aria-label='Open menu' whileTap={{ scale: 0.95 }}>
      {isMobileNavOpen ? <X className='w-6 h-6' strokeWidth={1.5} /> : <Menu className='w-6 h-6' />}
    </motion.button>

  )
}
/* =========================================================
   Avatar Dropdown
   ========================================================= */
const AvatarDropdown = ({ user, navItems, onLogout }) => {
  const t = useTranslations('layout');
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    await onLogout?.();
    setIsLogoutLoading(false);
    setIsOpen(false);
  };



  return (
    <div className='relative' ref={dropdownRef}>
      <motion.button onClick={() => setIsOpen(v => !v)} className='hidden lg:inline-flex items-center justify-center' whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} aria-label={t('userMenuAriaLabel') || 'User menu'}>

        <Img src={user?.profileImage || '/images/placeholder-avatar.png'} altSrc='/images/placeholder-avatar.png' loader={localImageLoader} alt='Avatar' width={45} height={45} className='h-[45px] w-[45px] rounded-full object-cover border-2 border-emerald-600 shadow-sm' />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 12, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className='absolute right-0 mt-0 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl z-50'>
            <UserMiniCard user={user} />

            <Divider className='!my-0' />

            <nav className='py-1'>
              {navItems.map((item, index) => {
                if (item.divider) return <Divider key={`div-${index}`} className='!my-0' />;
                return (
                  <motion.div key={index} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.04 }}>
                    <Link href={item.href} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${item.active ? 'text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setIsOpen(false)}>
                      {item.icon}
                      <span className='truncate'>{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <Divider className='!my-0' />

            <motion.button onClick={handleLogout} className='flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors' disabled={isLogoutLoading}>
              <LogOut size={16} />
              {isLogoutLoading ? t('loggingOut') || 'Logging out…' : t('logoutLink') || 'Logout'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =========================================================
   Top Navbar (Desktop)
   ========================================================= */
function NavLinks({ links }) {
  const pathname = usePathname();

  return (
    <motion.ul className='hidden lg:flex  items-center gap-1  ' variants={stagger} initial='hidden' animate='show'>
      {links.map(link => {
        const isActive = link.href ? pathname === link.href || pathname.startsWith(link.href + '/') : (link.children || []).some(c => pathname === c.href || pathname.startsWith(c.href + '/'));

        return (
          <motion.li key={link.label + (link.href || '')} variants={fadeDown} className='relative'>
            {link.children?.length ? (
              <DropdownItem label={link.label} icon={link.icon} active={isActive}>
                <DropdownPanel items={link.children} />
              </DropdownItem>
            ) : (
              <TopLink href={link.href} label={link.label} icon={link.icon} active={isActive} />
            )}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

function TopLink({ href, label, icon, active }) {
  return (
    <Link href={href} className={`  relative px-2 py-2 text-[15px] font-medium rounded-xl inline-flex items-center gap-2 transition-colors ${active ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'}`}>
      {icon} {label}
      <motion.span layoutId='nav-underline' className={`absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full ${active ? 'bg-emerald-600' : 'bg-transparent'}`} transition={springy} />
    </Link>
  );
}

export function DropdownItem({ label, icon, active, children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDoc = e => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = e => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className='relative' onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type='button' aria-expanded={open} onClick={() => setOpen(v => !v)} className={`relative px-3 py-2 text-[15px] font-medium rounded-xl inline-flex items-center gap-1.5 lg:gap-2 transition-colors ${active ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'}`}>
        {icon} {label}
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        <motion.span layoutId='nav-underline' className={`absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full ${active || open ? 'bg-emerald-600' : 'bg-transparent'}`} transition={springy} />
      </button>

      <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={open ? { opacity: 1, y: 8, scale: 1 } : { opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.16 }} className={`z-[2] absolute left-0 mt-2 w-[240px] rounded-xl border border-slate-200 bg-white shadow-xl ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {children}
      </motion.div>
    </div>
  );
}

function DropdownPanel({ items = [] }) {
  return (
    <ul className='py-2 '>
      <span className='bg-red-500 opacity-0 w-full  h-[20px] top-[-20px] block absolute inset-0'></span>
      {items.map(it => (
        <li key={it.href}>
          <Link href={it.href} className='flex items-center gap-2 px-3 py-2 text-[14px] text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'>
            <span className='scale-125'>{it.icon}</span>
            {it.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* =========================================================
   Mobile Drawer
   ========================================================= */
function MobileDrawer({ open, onClose, user, navLinks, navItems, pathname, onLogout, isLogoutLoading }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.button type='button' onClick={onClose} className='fixed inset-0 z-30 lg:hidden bg-slate-900/60 backdrop-blur-[12px]' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

          {/* Drawer */}
          <motion.div role='dialog' aria-modal='true' aria-label='Mobile navigation' initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }} className='fixed inset-y-0 right-0 z-40 lg:hidden h-screen'>
            <motion.div drag='x' dragConstraints={{ left: -80, right: 0 }} dragElastic={0.04} onDragEnd={(_, info) => info.offset.x > 80 && onClose()} className='h-full w-[min(92vw,520px)] overflow-y-auto border-l border-slate-200 bg-white/90 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/100'>
              {/* Header */}
              <div className='relative px-4 pt-4 pb-3'>
                <div className='absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-50/70 to-transparent pointer-events-none' />
                <div className='relative flex items-center justify-between'>
                  <span className='text-sm font-semibold text-slate-700'>Menu</span>
                  <button onClick={onClose} className='inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400' aria-label='Close' autoFocus>
                    <X className='h-5 w-5 text-slate-600' />
                  </button>
                </div>
              </div>

              {/* Quick profile */}

              {user && (
                <div className='px-4 pe-6 pb-3 flex items-center gap-3'>
                  <motion.div whileHover={{ rotate: 4 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
                    <Img src={user.profileImage} altSrc={'/images/placeholder-avatar.png'} alt={`avatar`} width={44} height={44} className='rounded-full object-cover border border-slate-200 shadow-sm h-11 w-11' />
                  </motion.div>
                  <div className='min-w-0'>
                    <p className='text-sm text-slate-900 font-medium truncate'>{user.username || 'User'}</p>
                    <p className='text-xs text-slate-500 truncate'>{user.email}</p>
                    <span className='text-[11px] mt-1 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full capitalize'>{user.role || 'member'}</span>
                  </div>
                </div>
              )}

              <Divider className='!my-0' />

              {/* Primary links */}
              <motion.nav variants={stagger} initial='hidden' animate='show' className='flex flex-col px-2 py-2'>
                {navLinks.map(link => {
                  const active = link.href ? pathname === link.href || pathname.startsWith(link.href + '/') : (link.children || []).some(c => pathname === c.href || pathname.startsWith(c.href + '/'));
                  return (
                    <motion.div key={link.label + (link.href || '')} variants={fadeIn}>
                      {link.children?.length ? (
                        <MobileCollapsible label={link.label} icon={link.icon}>
                          <div className='py-1'>
                            {link.children.map(c => (
                              <Link key={c.href} href={c.href} onClick={onClose} className='flex items-center gap-2 px-3 py-2 rounded-lg text-[15px] text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'>
                                {c.icon}
                                {c.label}
                              </Link>
                            ))}
                          </div>
                        </MobileCollapsible>
                      ) : (
                        <Link href={link.href} onClick={onClose} className={`group flex items-center gap-2 px-2 py-2 text-[16px] font-medium rounded-lg transition ${active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-800 hover:bg-slate-100'}`}>
                          {link.icon}
                          {link.label}
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </motion.nav>

              <Divider className='!my-0' />

              {/* Secondary (role) */}
              {user && (
                <nav className='py-1 mx-2'>
                  {navItems.map((item, index) => {
                    if (item.divider) return <Divider key={`divider-${index}`} className='!my-0' />;
                    return (
                      <motion.div key={index} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.05 }}>
                        <Link href={item.href} onClick={onClose} className={`group flex items-center gap-2 px-2 py-2 text-[16px] font-medium rounded-lg transition ${pathname.startsWith(item.href) ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-800 hover:bg-slate-100'}`}>
                          {item.icon}
                          <span className='truncate'>{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              )}

              <Divider className='!my-0' />

              {/* Logout */}
              {user && (
                <div className='mx-2'>
                  <motion.button onClick={onLogout} className='flex items-center gap-2 w-full px-2 my-2 py-2 text-sm text-slate-800 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors' disabled={isLogoutLoading} whileTap={{ scale: 0.98 }}>
                    <LogOut size={16} />
                    {isLogoutLoading ? 'Logging out…' : 'Logout'}
                  </motion.button>
                </div>
              )}

              <div className='h-[max(12px,env(safe-area-inset-bottom))]' />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MobileCollapsible({ label, icon, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className='px-1'>
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-[16px] font-medium ${open ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-800 hover:bg-slate-100'}`}>
        <span className='inline-flex items-center gap-2'>
          {icon}
          {label}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-hidden px-1'>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const roleStyles = {
  seller: { chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  buyer: { chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  admin: { chip: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  member: { chip: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
};

export const getInitials = name =>
  (name || 'User')
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'U';

function UserMiniCard({ user }) {
  const name = user?.username || 'User';
  const email = user?.email || '';
  const role = (user?.role || 'member').toLowerCase();
  const { chip } = roleStyles[role] || roleStyles.member;

  return (
    <div className='px-2 pe-6 pb-3 pt-3 flex items-center gap-3  '>
      {/* Avatar + ring */}
      <motion.div whileHover={{ rotate: 2, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className='relative' aria-label={`${name} avatar`}>
        <div className='relative'>
          {/* animated conic ring */}
          <span className='absolute -inset-0.5 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-emerald-400 via-sky-400 to-violet-400 blur opacity-30 group-hover:opacity-60 transition' />
          <div className='relative size-12 rounded-full border border-slate-200 shadow-sm overflow-hidden bg-white flex items-center justify-center'>
            <Img src={user.profileImage} alt={`${name} avatar`} width={48} height={48} className='rounded-full object-cover size-12' textFallback={getInitials(name)} />
          </div>
        </div>
      </motion.div>

      {/* Texts */}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-1.5'>
          <p className='text-sm text-slate-900 font-medium truncate' title={name}>
            {name}
          </p>
          {user?.isVerified && <ShieldCheck className='h-4 w-4 shrink-0 text-sky-600' aria-label='Verified' title='Verified' />}
        </div>

        <div className='flex items-center gap-2'>
          <p className='text-xs text-slate-500 truncate' title={email} aria-label='Email'>
            {email || '—'}
          </p>
        </div>

        <div className='mt-1 flex items-center gap-2'>
          <span className={`text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full capitalize ${chip}`} title={`Role: ${role}`}>
            <UserIcon className='h-3.5 w-3.5' />
            {role}
          </span>
          {/* quick email action */}
          {email && (
            <a href={`mailto:${email}`} className='inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition' title='Send email'>
              <Mail className='h-3.5 w-3.5' />
              Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
