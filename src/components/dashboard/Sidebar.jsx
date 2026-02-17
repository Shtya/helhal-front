'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { LayoutGroup, motion } from 'framer-motion';
import { useMemo } from 'react';
import { LayoutDashboard, Users, FolderTree, ShoppingBag, Package, Wallet, FileText, Settings, MessageSquare, Bell, Layers, Activity } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Permissions } from '@/constants/permissions';
import { useAuth } from '@/context/AuthContext';
import { has } from '@/utils/permissions';

export const getMenuItems = (t) => [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, title: t('Dashboard.sidebar.menuItems.dashboard'), desc: t('Dashboard.sidebar.descriptions.dashboard'), domain: 'statistics', view: Permissions.Statistics.View },
  { name: 'Users', href: '/dashboard/users', icon: Users, title: t('Dashboard.sidebar.menuItems.users'), desc: t('Dashboard.sidebar.descriptions.users'), domain: 'users', view: Permissions.Users.View },
  { name: 'Categories', href: '/dashboard/categories', icon: FolderTree, title: t('Dashboard.sidebar.menuItems.categories'), desc: t('Dashboard.sidebar.descriptions.categories'), domain: 'categories', view: Permissions.Categories.View },
  { name: 'Services', href: '/dashboard/services', icon: Layers, title: t('Dashboard.sidebar.menuItems.services'), desc: t('Dashboard.sidebar.descriptions.services'), domain: 'services', view: Permissions.Services.View },
  { name: 'Jobs', href: '/dashboard/jobs', icon: ShoppingBag, title: t('Dashboard.sidebar.menuItems.jobs'), desc: t('Dashboard.sidebar.descriptions.jobs'), domain: 'jobs', view: Permissions.Jobs.View },
  { name: 'Orders', href: '/dashboard/orders', icon: Package, title: t('Dashboard.sidebar.menuItems.orders'), desc: t('Dashboard.sidebar.descriptions.orders'), domain: 'orders', view: Permissions.Orders.View },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, title: t('Dashboard.sidebar.menuItems.invoices'), desc: t('Dashboard.sidebar.descriptions.invoices'), domain: 'invoices', view: Permissions.Invoices.View },
  { name: 'Disputes', href: '/dashboard/disputes', icon: Wallet, title: t('Dashboard.sidebar.menuItems.disputes'), desc: t('Dashboard.sidebar.descriptions.disputes'), domain: 'disputes', view: Permissions.Disputes.View },
  { name: 'Finance', href: '/dashboard/finance', icon: Wallet, title: t('Dashboard.sidebar.menuItems.finance'), desc: t('Dashboard.sidebar.descriptions.finance'), domain: 'finance', view: Permissions.Finance.View },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare, title: t('Dashboard.sidebar.menuItems.chat'), desc: t('Dashboard.sidebar.descriptions.chat') },
  { name: 'Monitor Chats', href: '/dashboard/monitor', icon: Activity, title: t('Dashboard.sidebar.menuItems.monitor'), desc: t('Dashboard.sidebar.descriptions.monitor') },
  { name: 'notifications', href: '/dashboard/notifications', icon: Bell, title: t('Dashboard.sidebar.menuItems.notifications'), desc: t('Dashboard.sidebar.descriptions.notifications') },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, title: t('Dashboard.sidebar.menuItems.settings'), desc: t('Dashboard.sidebar.descriptions.settings'), domain: 'settings', view: Permissions.Settings.Update },
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
  const { user } = useAuth();

  const role = user?.role;
  const permissions = user?.permissions || {};

  const menuItems = useMemo(() => {
    return getMenuItems(t).filter(item => {
      // Dashboard نفسه يظهر للجميع
      if (!item.domain) return role === 'admin';

      // Admin يشوف كل شيء
      if (role === 'admin') return true;

      // تحقق من صلاحية view
      const mask = permissions[item.domain] ?? 0;
      return has(mask, item.view);
    });
  }, [t, role, permissions]);

  const activeHref = useMemo(() => {
    if (!menuItems || !menuItems.length) return;
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
          <Link href={`${role === 'seller' ? '/jobs' : '/'}`} >
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
                  <Link href={item.href} prefetch className='group relative z-10 flex items-center gap-3 h-11 px-2 rounded-xl text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-main-500/70' aria-current={isActive ? 'page' : undefined} onClick={closeOnMobile}>
                    {/* Active background */}
                    {isActive && <motion.span layoutId='active-row-bg' className='absolute inset-0 rounded-xl bg-main-50 border border-main-100' transition={{ type: 'spring', stiffness: 420, damping: 35 }} />}

                    {/* Left accent when active */}
                    <motion.span className='absolute left-0 top-1/2 -translate-y-1/2 h-[calc(100%-10px)] w-1.5 rounded-r bg-main-500' initial={{ opacity: 0, scaleY: 0.2 }} animate={isActive ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} />

                    <span className={`relative  ${!open && " w-full"} z-10 shrink-0`}>
                      <Icon className={`h-5 w-5  mx-auto ${isActive ? 'text-main-600' : 'text-slate-400 group-hover:text-main-600'}`} />
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
