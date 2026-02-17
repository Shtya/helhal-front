'use client';

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useTransition, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, usePathname, useRouter } from '@/i18n/navigation'; // if you don't use this alias, swap to next/navigation
import { useLocale, useTranslations } from 'next-intl';
import { Mail, ShieldCheck, User as UserIcon, Menu, X, LogOut, Briefcase, Compass, Store, LayoutGrid, Code2, Palette, FilePlus2, ListTree, ClipboardList, FileText, ChevronDown, Bell, User, Settings, CreditCard, UserPlus, DollarSign, MessageCircle, ShoppingCart, CheckCircle2, AlertCircle, ChevronRight, Check, ListChecks, LucideLayoutDashboard, Globe2, Wrench, Zap, Package, Layers, Banknote } from 'lucide-react';
import GlobalSearch from '../atoms/GlobalSearch';
import { localImageLoader } from '@/utils/helper';
import { useAuth } from '@/context/AuthContext';
import { useValues } from '@/context/GlobalContext';
import Img from '../atoms/Img';
import Logo from '../common/Logo';
import NotificationPopup, { getLink } from '../common/NotificationPopup';
import { useSocket } from '@/context/SocketContext';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useSearchParams } from 'next/navigation';
import { useLangSwitcher } from '@/hooks/useLangSwitcher';
import SmallLanguageSwitcher from './SmallLanguageSwitcher';
import { has } from '@/utils/permissions';
import { PERMISSION_DOMAINS } from '@/constants/permissions';

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



/* =========================================================
   Header
   ========================================================= */
export default function Header() {
  const t = useTranslations('layout');
  const tHeader = useTranslations('Header');
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user, logout, role } = useAuth();
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const { cart, topCategories, loadingTopCategories } = useValues();
  const { unreadChatCount } = useSocket()

  const cartTotal = cart?.total || 0;
  const hasTopCategories = topCategories?.length > 0;
  const isGuest = role === 'guest';
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const toggleMobileNav = () => setIsMobileNavOpen(s => !s);

  const buildNavLinks = useCallback((u) => {
    const permissions = u?.permissions;

    const common = [
      // ...(u?.role !== 'seller' ? [{ href: '/explore', label: tHeader('navigation.explore'), icon: <Compass className='h-5 w-5' /> }] : []),
      {
        label: u?.role === 'seller' ? tHeader('navigation.myServices') : tHeader('navigation.services'),
        icon: u?.role === 'seller' ? <LayoutGrid className="h-5 w-5" /> : <Package className="h-5 w-5" />,
        href: u?.role === 'seller' ? '/my-gigs' : '/services',
        useMegaMenu: u?.role !== 'seller',
        // Only add children if the user is NOT a seller
        ...(u?.role !== 'seller' ? {
          children: [
            /* your buyer/guest children here */
          ]
        } : {})
      },

    ];

    //guest
    const guest = [
      // {
      //   label: tHeader('navigation.jobs'),
      //   icon: <Briefcase className='h-5 w-5' />,
      //   children: [
      //     { href: '/jobs', label: tHeader('navigation.browseJobs'), icon: <ListTree className='h-4 w-4' /> },
      //   ],
      // },
    ]
    // Buyer-only
    const buyer = [
      {
        label: tHeader('navigation.jobs'),
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          { href: '/share-job-description', label: tHeader('navigation.createJob'), icon: <FilePlus2 className='h-4 w-4' /> },
          // { href: '/jobs', label: tHeader('navigation.browseJobs'), icon: <ListTree className='h-4 w-4' /> },
          { href: '/my-jobs', label: tHeader('navigation.myJobsBuyer'), icon: <ClipboardList className='h-4 w-4' /> },
        ],
      },
    ];

    // Seller-only
    const seller = [
      {
        label: tHeader('navigation.jobs'),
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          { href: '/jobs', label: tHeader('navigation.browseJobs'), icon: <ListTree className='h-4 w-4' /> },
          { href: '/jobs/proposals', label: tHeader('navigation.myProposals'), icon: <FileText className='h-4 w-4' /> },
        ],
      },

      // Withdraw My Money - Direct to tab
      {
        href: '/my-billing', // Direct link to withdrawal tab
        query: "tab=available-balances",
        label: tHeader('userMenu.withdrawMoney'),
        icon: <Banknote className='h-5 w-5' />,
      },
    ];

    let hasAnyViewPermission = false;
    if (permissions) {
      hasAnyViewPermission = PERMISSION_DOMAINS.some(domain => {
        return has(permissions?.[domain.key], domain.viewValue)
      })

    }
    // Seller-only
    const admin = [
      {
        label: tHeader('navigation.jobs'),
        icon: <Briefcase className='h-5 w-5' />,
        children: [
          { href: '/jobs', label: tHeader('navigation.browseJobs'), icon: <ListTree className='h-4 w-4' /> },
        ],
      },

    ];

    let message = []
    if (u) {
      message = [
        // My Billing - Main Item
        {
          href: '/my-billing',
          query: "tab=billing-history",
          label: tHeader('userMenu.myBilling'),
          icon: <CreditCard className='h-5 w-5' />,
        },
        {
          href: '/my-orders',
          label: tHeader('userMenu.myOrders'),
          icon: <ClipboardList className='h-5 w-5' />,
        },
        ...(u ? [{
          href: '/chat', label: <div>
            {tHeader('navigation.messages')}
            {unreadChatCount > 0 && (
              <span className='absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-main-600 text-white text-[11px] grid place-items-center font-semibold'>
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </div>, icon: <MessageCircle className='h-5 w-5 ' />
        }] : []),

      ]
    }

    let dashboard = []
    // Determine if buyer already has related seller users
    const hasRelatedSeller = u?.relatedUsers?.some(r => r.role === 'seller');

    if (u?.role === 'admin' || hasAnyViewPermission) {
      dashboard = [
        { href: '/dashboard', label: tHeader('navigation.dashboard'), icon: <LucideLayoutDashboard className='h-4 w-4' /> },
      ]
    }
    // Conditional + common
    if (isGuest) return [...common, ...guest]

    if (u?.role === 'buyer') {
      const links = [...common, ...buyer, ...message];
      if (!hasRelatedSeller) {
        links.push({ href: '/become-seller', label: tHeader('navigation.becomeSeller'), icon: <Store className='h-5 w-5' /> });
      }

      links.push(...dashboard)
      return links;
    }


    if (u?.role === 'seller') return [...common, ...seller, ...message, ...dashboard];
    if (u?.role === 'admin') return [...common, ...admin, ...message, ...dashboard];

    return [...common]; // fallback if no role

  }, [isGuest, unreadChatCount, tHeader]);

  const navLinks = buildNavLinks(user);
  const getNavItemsByRole = (role, user) => {
    const byOrder = (a, b) => (a.order ?? 99999) - (b.order ?? 99999);

    const hasRelatedSeller = user?.relatedUsers?.some(r => r.role === 'seller');


    if (role === 'guest') return [];

    const common = [
      { href: '/profile', label: tHeader('userMenu.myProfile'), icon: <User size={18} className='text-gray-500' />, active: pathname === '/profile', order: 1 },
      // { href: '/my-orders', label: tHeader('userMenu.myOrders'), icon: <ClipboardList size={18} className='text-gray-500' />, active: pathname.startsWith('/my-orders'), order: 2 },
      { href: '/my-disputes', label: tHeader('userMenu.myDisputes'), icon: <Bell size={18} className='text-gray-500' />, active: pathname.startsWith('/my-disputes'), order: 4 },
      // { href: '/my-billing', label: tHeader('userMenu.myBilling'), icon: <CreditCard size={18} className='text-gray-500' />, active: pathname.startsWith('/my-billing'), order: 5 },
      { href: '/settings', label: tHeader('userMenu.settings'), icon: <Settings size={18} className='text-gray-500' />, active: pathname.startsWith('/settings'), order: 16 },
      { href: '/invite', label: tHeader('userMenu.inviteNewUser'), icon: <UserPlus size={18} className='text-gray-500' />, active: pathname.startsWith('/invite'), order: 17 },
      { divider: true, order: 8 },
    ];


    const buyer = [
      { href: '/share-job-description', label: tHeader('userMenu.shareYourJob'), icon: <FilePlus2 size={18} className='text-gray-500' />, active: pathname.startsWith('/share-job-description'), order: 10 },
      { href: '/my-jobs', label: tHeader('userMenu.myJobs'), icon: <Briefcase size={18} className='text-gray-500' />, active: pathname.startsWith('/my-jobs'), order: 11 },
      ...(!hasRelatedSeller
        ? [
          {
            href: '/become-seller',
            label: tHeader('userMenu.becomeASeller'),
            icon: <DollarSign size={18} className='text-gray-500' />,
            active: pathname.startsWith('/become-seller'),
            order: 12,
          },
        ]
        : []),
    ];

    const seller = [
      {
        href: '/my-gigs',
        label: tHeader('userMenu.myServices'),
        icon: <LayoutGrid size={18} className='text-gray-500' />,
        active: pathname.startsWith('/my-gigs'),
        order: 14,
        mobile: false
      },
      { href: '/create-gig', label: tHeader('userMenu.createAService'), icon: <FilePlus2 size={18} className='text-gray-500' />, active: pathname.startsWith('/create-gig'), order: 15 },
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

  const navItems = user ? getNavItemsByRole(user.role, user) : [];

  const handleLogout = async () => {
    try {
      setIsLogoutLoading(true);
      // purge local
      await logout();
      // optional: hit your API (swap to your endpoint)
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
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
          <NavLinks links={navLinks} topCategories={topCategories} loadingTopCategories={loadingTopCategories} />
        </div>

        {/* Middle: Search */}

        {/* Right: Actions */}
        <div className='flex-1 flex items-center gap-1 md:gap-1.5 lg:gap-2 shrink-0 justify-end'>
          <div className={`${user ? "max-xl:order-0" : "max-xl:order-1"}  xl:flex-1 xl:flex justify-center items-center`}>
            <GlobalSearch isMobileNavOpen={isMobileNavOpen} />
          </div>
          {user ? (
            <>
              <div className='max-lg:hidden '>
                <SmallLanguageSwitcher />
              </div>
              {/* <Link href='/chat' aria-label='Go to chat' className='shrink-0 relative inline-grid place-items-center h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50'>
                <MessageCircle className='h-5 w-5 text-slate-600' />
                {unreadChatCount > 0 && (
                  <span className='absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-main-600 text-white text-[11px] grid place-items-center font-semibold'>
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </Link> */}

              <NotificationPopup />

              <Link href='/cart' aria-label='Cart' className='shrink-0  relative inline-grid place-items-center h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50'>
                <ShoppingCart className='h-5 w-5 text-slate-600 ' />
                {cartTotal > 0 && (
                  <span className='absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-main-600 text-white text-[11px] grid place-items-center font-semibold'>
                    {cartTotal > 99 ? '99+' : cartTotal}
                  </span>
                )}
              </Link>

              {/* Mobile toggle */}
              <MobileToggle toggleMobileNav={toggleMobileNav} isMobileNavOpen={isMobileNavOpen} />
              <AvatarDropdown user={user} navItems={navItems} onLogout={handleLogout} />
            </>
          ) : (
            <>
              {/* <Link href='/auth?tab=register' className='px-3 md:px-4 py-2 text-sm font-medium text-slate-700 hover:text-main-700 transition-colors rounded-xl'>
                {tHeader('auth.signUp')}
              </Link> */}
              <Link href='/auth?tab=login' className='order-2 px-3 md:px-4 py-2 text-sm font-medium bg-main-600 text-white rounded-xl hover:bg-main-700 transition-colors'>
                {tHeader('auth.signIn')}
              </Link>
              <div className=' max-lg:hidden'>
                <SmallLanguageSwitcher />
              </div>
              <div className='order-3'>
                <MobileToggle toggleMobileNav={toggleMobileNav} isMobileNavOpen={isMobileNavOpen} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer open={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} user={user} navLinks={navLinks} navItems={navItems} pathname={pathname} onLogout={handleLogout} isLogoutLoading={isLogoutLoading} topCategories={topCategories} loadingTopCategories={loadingTopCategories} />
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
  const tHeader = useTranslations('Header');
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
      <motion.button onClick={() => setIsOpen(v => !v)} className='hidden lg:inline-flex items-center justify-center' whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>

        <Img src={user?.profileImage || '/images/placeholder-avatar.png'} altSrc='/images/placeholder-avatar.png' loader={localImageLoader} alt='Avatar' width={45} height={45} className='h-[45px] w-[45px] rounded-full object-cover border-2 border-main-600 shadow-sm' />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 12, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className='absolute end-0 mt-0 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl z-50'>
            <UserMiniCard user={user} />

            <Divider className='!my-0' />
            <RelatedUsers onClose={() => setIsOpen(false)} user={user} />


            <nav className='py-1'>
              {navItems.map((item, index) => {
                if (item.divider) return <Divider key={`div-${index}`} className='!my-0' />;
                return (
                  <motion.div key={index} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.04 }}>
                    <Link href={item.href} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${item.active ? 'text-main-700 bg-main-50' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setIsOpen(false)}>
                      {item.icon}
                      <span className='truncate'>{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <Divider className='!my-0' />

            <motion.button onClick={handleLogout} className='flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 bg-red-50 transition-colors' disabled={isLogoutLoading}>
              <LogOut size={16} />
              {isLogoutLoading ? tHeader('userMenu.loggingOut') : tHeader('userMenu.logout')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* =========================================================
   Services Mega Menu
   ========================================================= */
function ServicesMegaMenu({ label, icon, active, topCategories, loadingTopCategories }) {
  const t = useTranslations('Header');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const pathname = usePathname();

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

  // Get localized name helper
  const getCategoryName = (category) => {
    return locale === 'ar' ? (category?.name_ar || category?.name_en || '') : (category?.name_en || category?.name_ar || '');
  };

  const getSubcategoryName = (subcategory) => {
    return locale === 'ar' ? (subcategory?.name_ar || subcategory?.name_en || '') : (subcategory?.name_en || subcategory?.name_ar || '');
  };

  // Distribute categories into columns (up to 4 columns)
  const categoriesToShow = topCategories || [];
  const columns = Math.min(Math.ceil(categoriesToShow.length / Math.ceil(categoriesToShow.length / 4)), 4) || 1;
  const itemsPerColumn = Math.ceil(categoriesToShow.length / columns);



  const columnData = useMemo(() => {
    const data = [];

    // Safety check to prevent infinite loops if itemsPerColumn is 0
    if (itemsPerColumn <= 0 || !categoriesToShow) return [];

    for (let i = 0; i < columns; i++) {
      data.push(
        categoriesToShow.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
      );
    }

    return data;
  }, [categoriesToShow, columns, itemsPerColumn]);

  return (
    <div ref={rootRef} className='relative' onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type='button' aria-expanded={open} onClick={() => setOpen(v => !v)} className={`relative px-3 py-2 text-[15px] font-medium rounded-xl inline-flex items-center gap-1.5 lg:gap-2 transition-colors ${active ? 'text-main-700' : 'text-slate-700 hover:text-main-700'}`}>
        {icon} {label}
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        <motion.span layoutId='nav-underline' className={`absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full ${active || open ? 'bg-main-600' : 'bg-transparent'}`} transition={springy} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`z-[100] absolute start-0 mt-1 max-w-[calc(100vw-2rem)] w-[95vw] md:w-[700px] lg:w-[max(800px,70vw)] xl:w-[max(1000px,70vw)] border border-slate-200 bg-white shadow-xl rounded-xl overflow-hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            <div className='px-4 py-5'>
              {loadingTopCategories ? (
                <div className='grid grid-cols-4 gap-4'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className='space-y-3'>
                      <div className='h-6 bg-slate-200 rounded animate-pulse' />
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className='h-4 bg-slate-100 rounded animate-pulse' />
                      ))}
                    </div>
                  ))}
                </div>
              ) : !categoriesToShow || categoriesToShow.length === 0 ? (
                <div className='py-8 text-center text-slate-500'>
                  <Package className='h-12 w-12 mx-auto mb-2 text-slate-300' />
                  <p>{t('navigation.noCategories')}</p>
                </div>
              ) : (
                <div className={`grid gap-6 ${columnData.length === 1 ? 'grid-cols-1' : columnData.length === 2 ? 'grid-cols-2' : columnData.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {columnData.map((columnCategories, colIndex) => (
                    <ul key={colIndex} className='space-y-4'>
                      {columnCategories.map(category => {
                        const categoryName = getCategoryName(category);
                        const children = category?.children || [];
                        const hasChildren = children.length > 0;

                        return (
                          <li key={category?.id || category?.slug}>
                            <Link
                              href={`/services/${encodeURIComponent(category?.slug || '')}`}
                              className={`block mb-2 text-sm font-semibold text-slate-900 hover:text-main-700 transition-colors ${pathname === `/services/${category?.slug}` || pathname.startsWith(`/services/${category?.slug}/`) ? 'text-main-700' : ''}`}
                            >
                              {categoryName || 'Unnamed Category'}
                            </Link>
                            {hasChildren && (
                              <ul className='space-y-2 ml-0'>
                                {children.map(subcategory => {
                                  const subcategoryName = getSubcategoryName(subcategory);
                                  return (
                                    <li key={subcategory?.id || subcategory?.slug}>
                                      <Link
                                        href={`/services/${encodeURIComponent(subcategory?.slug || '')}`}
                                        className='block text-sm text-slate-600 hover:text-main-600 hover:underline transition-colors'
                                      >
                                        {subcategoryName || 'Unnamed Subcategory'}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   Top Navbar (Desktop)
   ========================================================= */
function NavLinks({ links, topCategories, loadingTopCategories }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();


  return (
    <motion.ul className='hidden lg:flex  items-center gap-1  ' variants={stagger} initial='hidden' animate='show'>
      {links.map(link => {
        let isActive = link.href ? pathname === link.href || pathname.startsWith(link.href + '/') : (link.children || []).some(c => pathname === c.href || pathname.startsWith(c.href + '/'));

        if (link.query) {
          const [key, value] = link.query.split('='); // split "tab=value"
          const currentParamValue = searchParams.get(key); // get actual URL value
          isActive = isActive && currentParamValue === value;
        }
        const fullHref = link.query ? `${link.href}?${link.query}` : link.href;
        return (
          <motion.li key={link.label + (fullHref || '')} variants={fadeDown} className='relative'>
            {link.useMegaMenu ? (
              <ServicesMegaMenu label={link.label} icon={link.icon} active={isActive} topCategories={topCategories} loadingTopCategories={loadingTopCategories} />
            ) : link.children?.length ? (
              <DropdownItem label={link.label} icon={link.icon} active={isActive}>
                <DropdownPanel items={link.children} />
              </DropdownItem>
            ) : (
              <TopLink href={fullHref} label={link.label} icon={link.icon} active={isActive} />
            )}
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

function TopLink({ href, label, icon, active }) {
  return (
    <Link href={href} className={`  relative px-2 py-2 text-[15px] font-medium rounded-xl inline-flex items-center gap-2 transition-colors ${active ? 'text-main-700' : 'text-slate-700 hover:text-main-700'}`}>
      {icon} {label}
      <motion.span layoutId='nav-underline' className={`absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full ${active ? 'bg-main-600' : 'bg-transparent'}`} transition={springy} />
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
      <button type='button' aria-expanded={open} onClick={() => setOpen(v => !v)} className={`relative px-3 py-2 text-[15px] font-medium rounded-xl inline-flex items-center gap-1.5 lg:gap-2 transition-colors ${active ? 'text-main-700' : 'text-slate-700 hover:text-main-700'}`}>
        {icon} {label}
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        <motion.span layoutId='nav-underline' className={`absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full ${active || open ? 'bg-main-600' : 'bg-transparent'}`} transition={springy} />
      </button>

      <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={open ? { opacity: 1, y: 8, scale: 1 } : { opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.16 }} className={`z-[2] absolute start-0  w-[240px] rounded-xl border border-slate-200 bg-white shadow-xl ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {children}
      </motion.div>
    </div>
  );
}

function DropdownPanel({ items = [] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <ul className='p-2 relative'>
      {/* Invisible bridge to maintain hover state between button and panel */}
      <span className='opacity-0 w-full h-[20px] top-[-20px] block absolute inset-x-0 pointer-events-none'></span>

      {items.map((it) => {
        // 1. Construct the full URL
        const fullHref = it.query ? `${it.href}?${it.query}` : it.href;

        // 2. Calculate Active State
        let isActive = false;
        if (it.query) {
          const [key, value] = it.query.split('=');
          isActive = pathname === it.href && searchParams.get(key) === value;
        } else {
          isActive = pathname === it.href || pathname.startsWith(it.href + '/');
        }

        return (
          <li key={fullHref}>
            <Link
              href={fullHref}
              className={`flex items-center gap-2 px-3 py-2 text-[14px] rounded-md transition-all ${isActive
                ? 'bg-main-50 text-main-700 font-semibold'
                : 'text-slate-700 hover:text-main-700 hover:bg-main-50'
                }`}
            >
              <span className={`scale-125 ${isActive ? 'text-main-600' : 'text-slate-400'}`}>
                {it.icon}
              </span>
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* =========================================================
   Mobile Drawer
   ========================================================= */
function MobileDrawer({ open, onClose, user, navLinks, navItems, pathname, onLogout, isLogoutLoading, topCategories, loadingTopCategories }) {
  const tHeader = useTranslations('Header');
  const role = (user?.role || 'member').toLowerCase();
  const { chip } = roleStyles[role] || roleStyles.member;
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { isPending, toggleLocale } = useLangSwitcher()

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
                <div className='absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-main-50/70 to-transparent pointer-events-none' />
                <div className='relative flex items-center justify-between'>
                  <span className='text-sm font-semibold text-slate-700'>{tHeader('userMenu.menu')}</span>
                  <button onClick={onClose} className='inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-main-400' aria-label='Close' autoFocus>
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
                    <p className='text-sm text-slate-900 font-medium truncate'>{user.username || tHeader('userMenu.user')}</p>
                    <p className='text-xs text-slate-500 truncate'>{user.email}</p>
                    {/* <span className='text-[11px] mt-1 inline-block px-2 py-0.5 bg-main-100 text-main-800 rounded-full capitalize'>{user.role || tHeader('userMenu.member')}</span> */}
                    <span className={`text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full capitalize ${chip}`} title={`Role: ${role}`}>
                      <UserIcon className='h-3.5 w-3.5' />
                      {role}
                    </span>
                  </div>
                </div>
              )}

              <Divider className='!my-0' />
              <RelatedUsers onClose={onClose} user={user} />
              {/* Primary links */}
              <motion.nav variants={stagger} initial='hidden' animate='show' className='flex flex-col px-2 py-2'>
                {navLinks.map(link => {
                  // Check if we should use the Accordion/Dropdown style
                  const showAsDropdown = link.useMegaMenu || (link.children && link.children.length > 0);

                  return (
                    <motion.div key={link.label + (link.href || '')} variants={fadeIn}>
                      {showAsDropdown ? (
                        // --- CASE 1: Mega Menu or Dropdown Children ---
                        <MobileServicesMenu
                          label={link.label}
                          icon={link.icon}
                          // Pass global categories if it's a mega menu, otherwise pass the specific link's children
                          topCategories={link.useMegaMenu ? topCategories : link.children}
                          loadingTopCategories={link.useMegaMenu ? loadingTopCategories : false}
                          locale={locale}
                          onClose={onClose}
                          pathname={pathname}
                        />
                      ) : (
                        // --- CASE 2: Single Direct Link ---
                        (() => {
                          // We alias 'link' to 'c' to match your provided snippet perfectly
                          const c = link;

                          // 1. Construct the full URL for the child
                          const fullChildHref = c.query ? `${c.href}?${c.query}` : c.href;

                          // 2. Determine if the child is active
                          let isChildActive = false;
                          if (c.query) {
                            const [key, value] = c.query.split('=');
                            isChildActive = pathname === c.href && searchParams.get(key) === value;
                          } else {
                            isChildActive = pathname === c.href || pathname.startsWith(c.href + '/');
                          }

                          return (
                            <Link
                              key={c.label + fullChildHref}
                              href={fullChildHref}
                              onClick={onClose}
                              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-[15px] transition-colors ${isChildActive
                                ? 'bg-main-50 text-main-700 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 '
                                }`}
                            >
                              <span className={isChildActive ? 'text-main-700' : 'text-slate-700'}>
                                {c.icon}
                              </span>
                              {c.label}
                            </Link>
                          );
                        })()
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
                    if (item.mobile != undefined && !item.mobile) return null;
                    return (
                      <motion.div key={index} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.05 }}>
                        <Link href={item.href} onClick={onClose} className={`group flex items-center gap-2 px-2 py-2 text-[16px] font-medium rounded-lg transition ${pathname.startsWith(item.href) ? 'bg-main-50 text-main-700 ring-1 ring-main-200' : 'text-slate-800 hover:bg-slate-100'}`}>
                          {item.icon}
                          <span className='truncate'>{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              )}

              <Divider className='!my-0' />
              {/* Language Switcher */}
              <div className='mx-2'>
                <motion.button
                  onClick={toggleLocale}
                  disabled={isPending}
                  className='flex items-center gap-2 w-full px-2 my-2 py-2 text-sm text-slate-800 hover:text-main-700 hover:bg-main-50 rounded-lg transition-colors'
                  whileTap={{ scale: 0.98 }}
                  aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
                >
                  <Globe2 size={16} />
                  <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
                </motion.button>
              </div>

              {/* Logout */}
              {user && (
                <div className='mx-2'>
                  <motion.button onClick={onLogout} className='flex items-center gap-2 w-full px-2 my-2 py-2 text-sm text-red-600 bg-red-50 rounded-lg transition-colors' disabled={isLogoutLoading} whileTap={{ scale: 0.98 }}>
                    <LogOut size={16} />
                    {isLogoutLoading ? tHeader('userMenu.loggingOut') : tHeader('userMenu.logout')}
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
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-[16px] font-medium ${open ? 'bg-main-50 text-main-700 ring-1 ring-main-200' : 'text-slate-800 hover:bg-slate-100'}`}>
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

function MobileServicesMenu({ label, icon, topCategories, loadingTopCategories, locale, onClose, pathname }) {
  const [open, setOpen] = useState(false);

  const getCategoryName = (category) => {
    // Fallback to 'label' if name_ar/en are missing (handling standard links)
    if (category.label) return category.label;
    return locale === 'ar' ? (category?.name_ar || category?.name_en || '') : (category?.name_en || category?.name_ar || '');
  };

  const getSubcategoryName = (subcategory) => {
    if (subcategory.label) return subcategory.label;
    return locale === 'ar' ? (subcategory?.name_ar || subcategory?.name_en || '') : (subcategory?.name_en || subcategory?.name_ar || '');
  };

  const categoriesToShow = topCategories || [];

  return (
    <div className='px-1'>
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-[16px] font-medium ${open ? 'bg-main-50 text-main-700 ring-1 ring-main-200' : 'text-slate-700 hover:bg-slate-100'}`}>
        <span className='inline-flex items-center gap-2'>
          {icon}
          {label}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-hidden px-1'>
            <div className='py-1 space-y-1'>
              {loadingTopCategories ? (
                <div className='space-y-2 px-3'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className='h-4 bg-slate-200 rounded animate-pulse' />
                  ))}
                </div>
              ) : !categoriesToShow || categoriesToShow.length === 0 ? (
                <div className='px-3 py-2 text-sm text-slate-500'>No categories available</div>
              ) : (
                categoriesToShow.map(category => {
                  const categoryName = getCategoryName(category);
                  const children = category?.children || [];
                  const hasChildren = children.length > 0;

                  return (
                    <MobileCategoryItem
                      key={category?.id || category?.slug || category?.label}
                      category={category}
                      categoryName={categoryName}
                      children={children}
                      hasChildren={hasChildren}
                      getSubcategoryName={getSubcategoryName}
                      onClose={onClose}
                      pathname={pathname}
                    />
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileCategoryItem({ category, categoryName, children, hasChildren, getSubcategoryName, onClose, pathname }) {
  const [open, setOpen] = useState(false);

  // Update logic: Handle both 'slug' (services) and direct 'href' (standard links)
  const categoryLink = category.href ? category.href : `/services/${encodeURIComponent(category?.slug || '')}`;
  const isActive = pathname === categoryLink || pathname.startsWith(categoryLink + '/');

  return (
    <div>
      <div className='flex items-center justify-between gap-2'>
        <Link
          href={categoryLink}
          onClick={onClose}
          className={`flex-1 px-3 py-2 rounded-lg text-[15px] transition ${isActive ? 'bg-main-50 text-main-700 font-medium' : 'text-slate-700 hover:bg-main-50 hover:text-main-700'}`}
        >
          {categoryName || 'Unnamed Category'}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setOpen(o => !o)}
            className='px-2 py-2 text-slate-600 hover:text-main-700'
          >
            <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {hasChildren && (
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='overflow-hidden'>
              <ul className='pl-4 space-y-1'>
                {children.map(subcategory => {
                  const subcategoryName = getSubcategoryName(subcategory);
                  // Update logic: Handle both 'slug' and direct 'href'
                  const subLink = subcategory.href ? subcategory.href : `/services/${encodeURIComponent(subcategory?.slug || '')}`;
                  const isSubActive = pathname === subLink || pathname.startsWith(subLink + '/');

                  return (
                    <li key={subcategory?.id || subcategory?.slug || subcategory?.label}>
                      <Link
                        href={subLink}
                        onClick={onClose}
                        className={`block px-3 py-2 rounded-lg text-[14px] transition ${isSubActive ? 'bg-main-50 text-main-700 font-medium' : 'text-slate-600 hover:bg-main-50 hover:text-main-700'}`}
                      >
                        {subcategoryName || 'Unnamed Subcategory'}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

const roleStyles = {
  seller: { chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  buyer: { chip: 'bg-main-100 text-main-800', dot: 'bg-main-500' },
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
  const tHeader = useTranslations('Header');
  const name = user?.username || tHeader('userMenu.user');
  const email = user?.email || '';
  const role = (user?.role || 'member').toLowerCase();
  const { chip } = roleStyles[role] || roleStyles.member;

  return (
    <div className='px-2 pe-6 pb-3 pt-3 flex items-center gap-3  '>
      {/* Avatar + ring */}
      <motion.div whileHover={{ rotate: 2, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className='relative' aria-label={`${name} avatar`}>
        <div className='relative'>
          {/* animated conic ring */}
          <span className='absolute -inset-0.5 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-main-400 via-sky-400 to-violet-400 blur opacity-30 group-hover:opacity-60 transition' />
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
              {tHeader('userMenu.email')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}


function RelatedUsers({ user, onClose }) {
  const [loadingId, setLoadingId] = useState(null);
  const { setCurrentUser, updateTokens } = useAuth();
  const router = useRouter();



  const onSwitchUser = async (relatedUserId) => {
    setLoadingId(relatedUserId);
    try {
      const res = await api.post(`/auth/login-as-related/${relatedUserId}`);
      const { accessToken, refreshToken, user: switchedUser } = res.data;

      // Optionally show toast
      toast.success('Switched successfully');

      // Store login tokens and current user
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, refreshToken, user: switchedUser }),
      });

      // Keep previous relatedUsers in state
      setCurrentUser(switchedUser);
      updateTokens({ accessToken, refreshToken });

      // Close dropdown and navigate
      const loginUserRole = res.data?.user?.role
      onClose();
      router.push(loginUserRole === 'seller' ? '/jobs' : '/services');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to switch user';
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  if (!user?.relatedUsers?.length) return null;

  return (
    <>

      <nav className="py-1 flex flex-col">
        {user?.relatedUsers?.map(relUser => (
          <motion.div
            key={relUser.id}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.02 }}
          >
            <button
              disabled={loadingId === relUser.id}
              onClick={() => onSwitchUser(relUser.id)}
              className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${loadingId === relUser.id
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Img
                src={relUser.profileImage || '/images/placeholder-avatar.png'}
                alt={relUser.username}
                width={28}
                height={28}
                className="w-7 h-7 rounded-full shrink-0 object-cover"
              />
              <div className='flex flex-col'>
                <span className="truncate">{relUser.username}</span>
                <span className={`w-fit text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full capitalize ${roleStyles[relUser.role]?.chip || roleStyles.member}`} title={`Role: ${relUser.role}`}>
                  <UserIcon className='h-2.5 w-2.5' />
                  {relUser.role}
                </span>
              </div>
            </button>
          </motion.div>
        ))}
      </nav>
      <Divider className='!my-0' />
    </>
  );
}




