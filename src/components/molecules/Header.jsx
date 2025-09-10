'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, ShoppingCart, CompassIcon, StoreIcon, Briefcase, Compass, Store, LayoutGrid, Code2, Palette, FilePlus2, ListTree, Search, ClipboardList, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Divider } from '@/app/[locale]/services/[category]/[service]/page';
import { FiBell, FiBriefcase, FiSettings, FiShare2, FiShoppingCart, FiTrendingUp, FiUser, FiGrid, FiDollarSign, FiPackage } from 'react-icons/fi';
import { useRouter } from '@/i18n/navigation';
import { getUserInfo } from '@/hooks/useUser';
import NotificationPopup from '../common/NotificationPopup';
import api from '@/lib/axios';
import GlobalSearch from '../atoms/GlobalSearch';
import { ChevronDown } from 'lucide-react';

const springy = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.6,
};

const fadeDown = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: { ...springy } },
};

const stagger = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const fadeIn = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 360, damping: 30 } },
};

export default function Header() {
  const t = useTranslations('layout');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [user, setUser] = useState(null);
  const headerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const userData = getUserInfo();
    setUser(userData);
    const handleStorageChange = () => setUser(getUserInfo());
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const toggleMobileNav = () => setIsMobileNavOpen(s => !s);

  /* ---------------- Primary top-level nav ---------------- */

  const buildNavLinks = user => {
    const base = [
      { href: '/explore', label: 'Explore', icon: <Compass className='h-5 w-5' /> },
      {
        label: 'Services',
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          { href: '/services', label: 'All Services', icon: <LayoutGrid className='h-4 w-4' /> },
          { href: '/services/web-development', label: 'Web Development', icon: <Code2 className='h-4 w-4' /> },
          { href: '/services/design', label: 'Design', icon: <Palette className='h-4 w-4' /> },
        ],
      },

      {
        label: 'Jobs',
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          { href: '/share-job-description', label: 'Create Job', icon: <FilePlus2 className='h-4 w-4' /> },
          { href: '/jobs', label: 'Browse Jobs', icon: <ListTree className='h-4 w-4' /> },
          // { href: '/seller/jobs', label: 'Find Work', icon: <Search className='h-4 w-4' /> },
          { href: '/my-jobs', label: 'My Jobs (Buyer)', icon: <ClipboardList className='h-4 w-4' /> },
          { href: '/jobs/proposals', label: 'My Proposals', icon: <FileText className='h-4 w-4' /> },
        ],
      },
    ];

    const sellerQuick = [{ href: '/become-seller', label: 'Become Seller', icon: <Store className='h-5 w-5' /> }];

    return [...base, ...sellerQuick];
  };
  const navLinks = buildNavLinks(user?.role);

  /* ---------------- Role-based dropdown items ---------------- */
  const getNavItemsByRole = role => {
    const commonItems = [
      {
        href: '/my-profile',
        label: 'My Profile',
        icon: <FiUser size={18} className='text-gray-500' />,
        active: pathname === '/my-profile',
      },
      {
        href: '/orders',
        label: 'My Orders',
        icon: <FiShoppingCart size={18} className='text-gray-500' />,
        active: pathname.includes('/orders'),
      },
      { divider: true },
      {
        href: '/activity-log',
        label: 'Activity Log',
        icon: <FiBell size={18} className='text-gray-500' />,
        active: pathname.includes('/activity-log'),
      },
      {
        href: '/settings',
        label: 'Settings',
        icon: <FiSettings size={18} className='text-gray-500' />,
        active: pathname.includes('/settings'),
      },
      {
        href: '/my-billing',
        label: 'My Billing',
        icon: <FiSettings size={18} className='text-gray-500' />,
        active: pathname.includes('/my-billing'),
      },
      {
        href: '/invite',
        label: 'Invite new user',
        icon: <FiSettings size={18} className='text-gray-500' />,
        active: pathname.includes('/invite'),
      },
      { divider: true },
    ];

    const buyerItems = [
      ...commonItems,
      {
        href: '/share-job-description',
        label: 'Share Your Job',
        icon: <FiShare2 size={18} className='text-gray-500' />,
        active: pathname.includes('/share-job-description'),
      },
      {
        href: '/my-jobs',
        label: 'My Jobs',
        icon: <FiBriefcase size={18} className='text-gray-500' />,
        active: pathname.includes('/my-jobs'),
      },
      {
        href: '/become-seller',
        label: 'Become a Seller',
        icon: <FiTrendingUp size={18} className='text-gray-500' />,
        active: pathname.includes('/become-seller'),
      },
    ];

    const sellerItems = [
      ...commonItems,
      {
        href: '/my-gigs',
        label: 'My Gigs',
        icon: <FiGrid size={18} className='text-gray-500' />,
        active: pathname.includes('/my-gigs'),
      },
      {
        href: '/create-gig',
        label: 'Create a Gig',
        icon: <FiGrid size={18} className='text-gray-500' />,
        active: pathname.includes('/create-gig'),
      },
      {
        href: '/seller/services',
        label: 'My Services',
        icon: <FiPackage size={18} className='text-gray-500' />,
        active: pathname.includes('/seller/services'),
      },
      {
        href: '/seller/earnings',
        label: 'Earnings',
        icon: <FiDollarSign size={18} className='text-gray-500' />,
        active: pathname.includes('/seller/earnings'),
      },
      {
        href: '/seller/orders',
        label: 'Order Requests',
        icon: <FiBriefcase size={18} className='text-gray-500' />,
        active: pathname.includes('/seller/orders'),
      },
    ];

    switch (role) {
      case 'buyer':
        return buyerItems;
      case 'seller':
        return sellerItems;
      default:
        return commonItems;
    }
  };

  const navItems = user ? getNavItemsByRole(user.role) : [];

  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const handleLogout = async () => {
    setIsLogoutLoading(true);
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentDeviceId');
    router.push('/auth');
    setIsLogoutLoading(false);
    await api.post('/auth/logout');
  };

  return (
    <header ref={headerRef} className={`sticky  top-0 z-40 transition-all duration-300 ${scrolled ? 'backdrop-blur-md bg-white/70 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]' : 'bg-slate-50/50'}`} data-aos='fade-down' data-aos-duration='500'>
      <div className='container h-16 md:h-[88px] flex items-center justify-between gap-3'>
        {/* Left: Mobile menu + Logo */}
        <div className='flex items-center gap-2'>
          <Link href='/' className='flex items-center group'>
            <motion.div whileHover={{ rotate: -4, scale: 1.05 }} transition={springy}>
              <Image src='/images/helhal-logo.png' alt='Helhal Logo' width={42} height={42} priority className='rounded-xl shadow-sm' />
            </motion.div>
            <span className='ml-2 text-slate-900 hidden sm:block font-semibold tracking-tight'>Helhal</span>
          </Link>
          <NavLinks links={navLinks} />
        </div>

        <GlobalSearch />

        {/* Right: Actions */}
        <div className='flex items-center gap-2 md:gap-3' data-aos='fade-left' data-aos-delay='100'>
          {user ? (
            <>
              <div className='flex items-center space-x-3.5'>
                <div className='relative'>
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className='ring-[3px] right-white flex items-center justify-center text-[14px] text-white z-[10] absolute bg-[#D81F22] rounded-full w-5 h-5 top-[-11px] right-[-8px]'>
                    2
                  </motion.span>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Link href='/chat' aria-label={t('ordersLinkAriaLabel')}>
                      <Image src='/icons/chat.png' className='duration-300' alt='chat' width={33} height={33} priority />
                    </Link>
                  </motion.div>
                </div>

                <NotificationPopup />

                <div className='relative'>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Link href='/cart' aria-label={t('ordersLinkAriaLabel')}>
                      <Image src='/icons/cart.svg' className='duration-300' alt='cart' width={33} height={33} priority />
                    </Link>
                  </motion.div>
                </div>

                <motion.button onClick={toggleMobileNav} className='md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none mx-0 ' aria-label={t('mobileMenuButtonAriaLabel')} whileTap={{ scale: 0.95 }}>
                  {isMobileNavOpen ? <X className='w-7 h-7' strokeWidth={1.25} /> : <Menu className='w-7 h-7' />}
                </motion.button>
                <AvatarDropdown user={user} navItems={navItems} onLogout={handleLogout} />
              </div>
            </>
          ) : (
            <div className='flex items-center gap-2 md:gap-3'>
              <Link href='/auth?tab=login' className='px-3 md:px-4 py-2 text-sm font-medium text-slate-700 hover:text-emerald-700 transition-colors rounded-xl'>
                Sign In
              </Link>
              <Link href='/auth?tab=register' className='px-3 md:px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors'>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Sheet */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            {/* Overlay */}
            <motion.button type='button' onClick={() => setIsMobileNavOpen(false)} className='fixed h-screen inset-0 z-30 md:hidden bg-slate-900/60 backdrop-blur-[20px] ' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

            {/* Drawer */}
            <motion.div key='mobile-nav' role='dialog' aria-modal='true' aria-label='Mobile navigation' initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }} className='fixed inset-y-0 right-0 z-40 md:hidden h-screen'>
              <motion.div drag='x' dragConstraints={{ left: -80, right: 0 }} dragElastic={0.04} onDragEnd={(_, info) => info.offset.x > 80 && setIsMobileNavOpen(false)} className='h-full w-[min(92vw,520px)] overflow-y-auto border-l border-slate-200 bg-white/90 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/70'>
                {/* Header */}
                <div className='relative px-4 pt-4 pb-3'>
                  <div className='absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-50/70 to-transparent pointer-events-none' />
                  <div className='relative flex items-center justify-between'>
                    <span className='text-sm font-semibold text-slate-700'>Menu</span>
                    <button onClick={() => setIsMobileNavOpen(false)} className='inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 active:scale-[0.98] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400' aria-label='Close' autoFocus>
                      <svg viewBox='0 0 24 24' className='h-5 w-5 text-slate-600'>
                        <path stroke='currentColor' strokeWidth='2' strokeLinecap='round' d='M6 6l12 12M18 6l-12 12' />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick profile */}
                <div className='px-4 pe-6 pb-3 flex items-center gap-3'>
                  <motion.div whileHover={{ rotate: 4 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
                    <Image src={user.profilePictureUrl || '/images/placeholder-avatar.png'} alt={t('userAvatarAlt')} width={44} height={44} className='rounded-full object-cover border border-slate-200 shadow-sm' />
                  </motion.div>
                  <div className='min-w-0'>
                    <p className='text-sm text-slate-500 truncate'>{user.email}</p>
                    <span className='text-[11px] mt-1 inline-block px-2 py-0.5 !bg-emerald-100 card-glow text-emerald-800 rounded-full capitalize'>{user.role}</span>
                  </div>
                </div>

                <div className='border-t mt-2 border-slate-200' />

                {/* Primary links */}
                <motion.nav variants={stagger} initial='hidden' animate='show' className='flex flex-col px-2 py-2 '>
                  {navLinks.map(link => (
                    <motion.div key={link.href} variants={fadeIn}>
                      <Link href={link.href} onClick={() => setIsMobileNavOpen(false)} className={`group flex items-center gap-2 px-2 py-2 text-[16px] font-medium transition  ${pathname.startsWith(link.href) ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-800 hover:bg-gray-200  active:bg-slate-100'}`}>
                        {link.icon}
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </motion.nav>

                <div className='border-t border-slate-200' />

                {/* Secondary / structured nav */}
                <nav className='py-1 !mx-2'>
                  {navItems.map((item, index) => {
                    if (item.divider) return <Divider key={`divider-${index}`} className='!my-0 ' />;
                    return (
                      <motion.div key={index} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.05 }}>
                        <Link href={item.href} onClick={() => setIsMobileNavOpen(false)} className={`group flex items-center gap-2 px-2 py-2 text-[16px] font-medium transition  ${pathname.startsWith(item.href) ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-800 hover:bg-gray-200  active:bg-slate-100'}`}>
                          {item.icon}
                          <span className='truncate'>{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <div className='border-t border-slate-200' />

                {/* Logout */}
                <motion.button onClick={handleLogout} className='flex items-center gap-2 w-full px-2 mx-2 py-2 text-sm text-slate-800 hover:text-red-600 hover:bg-red-50 transition-colors' disabled={isLogoutLoading} whileTap={{ scale: 0.98 }}>
                  <LogOut size={16} className='text-current' />
                  {isLogoutLoading ? t('loggingOut') : t('logoutLink')}
                </motion.button>

                {/* Safe-area padding */}
                <div className='h-[max(12px,env(safe-area-inset-bottom))]' />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ===================== Dropdown Wrapper ===================== */
export const DropdownWrapper = ({ iconSrc, title, children, setOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setOpen?.(isOpen);
  }, [isOpen, setOpen]);

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='relative' ref={dropdownRef}>
      <motion.button onClick={() => setIsOpen(prev => !prev)} className='cursor-pointer transition-transform duration-200' aria-label={title} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
        <Image src={iconSrc} alt='' width={30} height={30} priority />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className='absolute right-0 mt-3 w-[350px] rounded-2xl shadow-xl bg-white ring-1 ring-black/5 z-50'>
            <div className='relative px-4 py-4'>
              <div className='absolute -top-2 right-4 w-4 h-4 rotate-45 bg-white border-t border-l border-gray-200' />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ===================== Avatar Dropdown ===================== */
const AvatarDropdown = ({ user, navItems, onLogout }) => {
  const t = useTranslations('layout');
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
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
      <motion.button onClick={() => setIsOpen(prev => !prev)} className=' flex-none max-md:hidden cursor-pointer m-0 transition-transform duration-200' aria-label={t('userMenuAriaLabel')} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
        <Image src={user.profilePictureUrl || '/images/placeholder-avatar.png'} alt={t('userAvatarAlt')} width={37} height={37} className=' w-[45px] h-[45px] rounded-full overflow-hidden border-2 border-emerald-600 object-cover shadow-sm' />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className='absolute right-0 mt-3 w-64 rounded-2xl shadow-xl bg-white ring-1 ring-black/5 z-50'>
            <div className='relative'>
              <div className='absolute -top-2 right-6 w-4 h-4 rotate-45 bg-white border-t border-l border-gray-200' />

              <div className='px-4 pe-6 py-4 flex items-center gap-3'>
                <motion.div whileHover={{ rotate: 5 }} transition={{ type: 'spring' }}>
                  <Image src={user.profilePictureUrl || '/images/placeholder-avatar.png'} alt={t('userAvatarAlt')} width={42} height={42} className='rounded-full object-cover border border-gray-200' />
                </motion.div>
                <div>
                  <p className='font-semibold text-gray-900'>{user.username}</p>
                  <p className='text-sm text-gray-500'>{user.email}</p>
                  <span className='text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full capitalize'>{user.role}</span>
                </div>
              </div>

              <div className='border-t border-gray-200' />

              <nav className='py-2'>
                {navItems.map((item, index) => {
                  if (item.divider) return <Divider key={`divider-${index}`} className='!my-0' />;
                  return (
                    <motion.div onClick={() => setIsOpen(false)} key={index} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.05 }}>
                      <Link href={item.href} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${item.active ? 'text-emerald-700 bg-emerald-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                        {item.icon}
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className='border-t border-gray-200' />

              <motion.button onClick={handleLogout} className='flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors' disabled={isLogoutLoading}>
                <LogOut size={16} className='text-current' />
                {isLogoutLoading ? t('loggingOut') : t('logoutLink')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ===================== NavLinks ===================== */

function NavLinks({ links }) {
  const pathname = usePathname();

  return (
    <motion.ul className='hidden md:flex items-center gap-2 ltr:!ml-8 rtl:mr-8' variants={stagger} initial='hidden' animate='show' data-aos='fade-up'>
      {links.map(link => {
        const isActive = link.href ? pathname === link.href || pathname.startsWith(link.href + '/') : (link.children || []).some(c => pathname === c.href || pathname.startsWith(c.href + '/'));

        return (
          <motion.li key={link.label + (link.href || '')} variants={fadeDown} className=' relative'>
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
    <Link href={href} className={`relative px-3 py-2 text-[15px] font-medium rounded-xl transition-colors inline-flex items-center gap-2 ${active ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'}`}>
      {icon} {label}
      <motion.span layoutId='nav-underline' className={`absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full ${active ? 'bg-emerald-600' : 'bg-transparent'}`} transition={springy} />
    </Link>
  );
}

function DropdownItem({ label, icon, active, children }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Close on outside / ESC
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
      <button type='button' aria-expanded={open} onClick={() => setOpen(v => !v)} className={`relative px-3 py-2 text-[15px] font-medium rounded-xl inline-flex items-center gap-2 transition-colors ${active ? 'text-emerald-700' : 'text-slate-700 hover:text-emerald-700'}`}>
        {icon} {label}
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        <motion.span layoutId='nav-underline' className={`absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full ${active || open ? 'bg-emerald-600' : 'bg-transparent'}`} transition={springy} />
      </button>

      {/* Panel */}
      <span className='w-full h-full inset-0 absolute left-0 top-[30px] pointer-events-auto '></span>
      <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={open ? { opacity: 1, y: 8, scale: 1 } : { opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.16 }} className={` absolute left-0 mt-2 w-[220px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {children}
      </motion.div>
    </div>
  );
}

function DropdownPanel({ items = [] }) {
  return (
    <ul className='py-2'>
      {items.map(it => (
        <li key={it.href}>
          <Link href={it.href} className='flex items-center gap-2 px-3 py-2 text-[14px] text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'>
            <span className='scale-125   ' > {it?.icon}</span>
            {it.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
