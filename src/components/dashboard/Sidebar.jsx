'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { LayoutGroup, motion } from 'framer-motion';
import { useMemo } from 'react';
import { LayoutDashboard, Users, FolderTree, ShoppingBag, TrendingUp, Package, Wallet, FileText, HelpCircle, Newspaper, BookOpen, Scale, Settings, MessageSquare, BarChart3, Bell } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export const getMenuItems = (t) => [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, title: t('Dashboard.sidebar.menuItems.dashboard'), desc: t('Dashboard.sidebar.descriptions.dashboard') },
  { name: 'Users', href: '/dashboard/users', icon: Users, title: t('Dashboard.sidebar.menuItems.users'), desc: t('Dashboard.sidebar.descriptions.users') },
  { name: 'Categories', href: '/dashboard/categories', icon: FolderTree, title: t('Dashboard.sidebar.menuItems.categories'), desc: t('Dashboard.sidebar.descriptions.categories') },
  { name: 'Services', href: '/dashboard/services', icon: ShoppingBag, title: t('Dashboard.sidebar.menuItems.services'), desc: t('Dashboard.sidebar.descriptions.services') },
  { name: 'Jobs', href: '/dashboard/jobs', icon: ShoppingBag, title: t('Dashboard.sidebar.menuItems.jobs'), desc: t('Dashboard.sidebar.descriptions.jobs') },
  { name: 'Orders', href: '/dashboard/orders', icon: Package, title: t('Dashboard.sidebar.menuItems.orders'), desc: t('Dashboard.sidebar.descriptions.orders') },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, title: t('Dashboard.sidebar.menuItems.invoices'), desc: t('Dashboard.sidebar.descriptions.invoices') },
  { name: 'Disputes', href: '/dashboard/disputes', icon: Wallet, title: t('Dashboard.sidebar.menuItems.disputes'), desc: t('Dashboard.sidebar.descriptions.disputes') },
  { name: 'Finance', href: '/dashboard/finance', icon: Wallet, title: t('Dashboard.sidebar.menuItems.finance'), desc: t('Dashboard.sidebar.descriptions.finance') },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare, title: t('Dashboard.sidebar.menuItems.chat'), desc: t('Dashboard.sidebar.descriptions.chat') },
  { name: 'notifications', href: '/dashboard/notifications', icon: Bell, title: t('Dashboard.sidebar.menuItems.notifications'), desc: t('Dashboard.sidebar.descriptions.notifications') },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, title: t('Dashboard.sidebar.menuItems.settings'), desc: t('Dashboard.sidebar.descriptions.settings') },
];

const listVariants = {
  hidden: { opacity: 0 },
  visible: (delayBase = 0) => ({
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: delayBase },
  }),
};

const itemVariants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.6 } },
};

export default function Sidebar({ open, isMobile = false, setOpen }) {
  const t = useTranslations();
  const pathname = usePathname();
  const menuItems = getMenuItems(t);

  const activeHref = useMemo(() => {
    if (!pathname) return menuItems[0].href;
    const match = [...menuItems].sort((a, b) => b.href.length - a.href.length).find(i => pathname.startsWith(i.href));
    return match?.href ?? menuItems[0].href;
  }, [pathname, menuItems]);

  const closeOnMobile = () => isMobile && setOpen?.(false);

  return (
    <aside role='navigation' aria-label='Dashboard sidebar' className='h-full flex flex-col'>
      {/* Brand / Toggle strip */}
      <div className='h-16 px-3 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/65'>
        <div className={`flex  ${!open && "!w-full flex-none justify-center"} items-center gap-3 overflow-hidden`}>
          <Link href='/' >
            <motion.div whileHover={{ rotate: -4, scale: 1.05 }} transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }}
              className='p-1'>
              <Image src='/images/helhal-logo.png' alt='Logo' width={38} height={48} priority className='rounded-xl shadow-sm' />
            </motion.div>
          </Link>
          <div className={`leading-tight whitespace-nowrap ${!open && '!hidden '}`}>
            <div className={`text-slate-900 font-semibold transition-[opacity,transform,width] `}>{t('Dashboard.sidebar.adminDashboard')}</div>
            <div className={`text-xs text-slate-500 transition-[opacity,transform,width]`}>{t('Dashboard.sidebar.controlCenter')}</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={closeOnMobile} className='lg:hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100' aria-label={t('Dashboard.sidebar.close')}>
            ✕
          </button>
        )}
      </div>

      {/* Menu */}
      <LayoutGroup id='sidebar-menu'>
        <div className='flex-1 overflow-y-auto px-2 py-3'>
          <motion.ul variants={listVariants} initial='hidden' animate='visible' custom={0.06} className={`space-y-1 relative ${!open && "overflow-hidden"} `} role='list'>
            {menuItems.map(item => {
              const isActive = activeHref === item.href;
              const Icon = item.icon;
              return (
                <motion.li key={item.href} variants={itemVariants} className='relative'>
                  <Link href={item.href} prefetch className='group relative z-10 flex items-center gap-3 h-11 px-2 rounded-xl text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70' aria-current={isActive ? 'page' : undefined} onClick={closeOnMobile}>
                    {/* Active background */}
                    {isActive && <motion.span layoutId='active-row-bg' className='absolute inset-0 rounded-xl bg-emerald-50 border border-emerald-100' transition={{ type: 'spring', stiffness: 420, damping: 35 }} />}

                    {/* Left accent when active */}
                    <motion.span className='absolute left-0 top-1/2 -translate-y-1/2 h-[calc(100%-10px)] w-1.5 rounded-r bg-emerald-500' initial={{ opacity: 0, scaleY: 0.2 }} animate={isActive ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} />

                    <span className={`relative  ${!open && " w-full"} z-10 shrink-0`}>
                      <Icon className={`h-5 w-5  mx-auto ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                    </span>

                    {/* Label (hide when collapsed) */}
                    <span className={`relative z-10 text-sm font-medium transition-all duration-200 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} `}>{item.title}</span>

                    {/* Badge stays aligned to the right only when expanded */}
                    {item.badge != null && open && <span className='ml-auto relative z-10 rounded-full bg-slate-100 text-slate-700 text-xs px-2 py-0.5'>{item.badge}</span>}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
      </LayoutGroup>
    </aside>
  );
}
