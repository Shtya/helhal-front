'use client';

import { usePathname } from '@/i18n/navigation';
import Link from 'next/link';
import { LayoutGroup, motion } from 'framer-motion';
import { useMemo } from 'react';
import { LayoutDashboard, Users, FolderTree, ShoppingBag, TrendingUp, Package, Wallet, FileText, HelpCircle, Newspaper, BookOpen, Scale, Settings, MessageSquare, BarChart3 } from 'lucide-react';

export const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, title: 'Dashboard', desc: 'KPIs, trends, and quick actions for your workspace.' },
  { name: 'Users', href: '/dashboard/users', icon: Users, title: 'Users', desc: 'Manage user accounts, roles, status, and permissions.' },
  { name: 'Categories', href: '/dashboard/categories', icon: FolderTree, title: 'Categories', desc: 'Create and organize categories for your content and services.' },
  { name: 'Services', href: '/dashboard/services', icon: ShoppingBag, title: 'Services', desc: 'Add, edit, and publish services with pricing and packages.' },
  { name: 'Job', href: '/dashboard/job', icon: ShoppingBag, title: 'Job', desc: 'Add, edit, and publish Job.' },
  { name: 'Orders', href: '/dashboard/orders', icon: Package, title: 'Orders', desc: 'Track, fulfill, and update order statuses and notes.' },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, title: 'Invoices', desc: 'Generate, download, and manage invoices and billing.' },
  { name: 'Disputes', href: '/dashboard/disputes', icon: Wallet, title: 'Disputes', desc: 'Request payouts, view balances, and payment history.' },
  { name: 'Finance', href: '/dashboard/finance', icon: Wallet, title: 'Finance', desc: 'Request payouts, view balances, and payment history.' },
  { name: 'Level Up', href: '/dashboard/levelup', icon: TrendingUp, title: 'Level Up', desc: 'Growth tools, gamification, and performance boosts.' },
  { name: 'Blogs', href: '/dashboard/blogs', icon: Newspaper, title: 'Blogs', desc: 'Write, schedule, and manage blog posts and drafts.' },
  { name: 'Guides', href: '/dashboard/guides', icon: BookOpen, title: 'Guides', desc: 'Step-by-step tutorials and documentation for your product.' },
   { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare, title: 'Chat', desc: 'Conversations, support inbox, and real-time messages.' },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, title: 'Reports', desc: 'Visual analytics and downloadable summaries.' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, title: 'Settings', desc: 'Account, preferences, integrations, and system options.' },
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
  const pathname = usePathname();

  const activeHref = useMemo(() => {
    if (!pathname) return menuItems[0].href;
    const match = [...menuItems].sort((a, b) => b.href.length - a.href.length).find(i => pathname.startsWith(i.href));
    return match?.href ?? menuItems[0].href;
  }, [pathname]);

  const closeOnMobile = () => isMobile && setOpen?.(false);

  return (
    <aside role='navigation' aria-label='Dashboard sidebar' className='h-full flex flex-col'>
      {/* Brand / Toggle strip */}
      <div className='h-16 px-3 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/65'>
        <div className={`flex  ${!open && "!w-full flex-none justify-center"} items-center gap-3 overflow-hidden`}>
          <div className={` grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white font-bold shadow-sm`}>A</div>
          <div className={`leading-tight whitespace-nowrap ${!open && '!hidden '}`}>
            <div className={`text-slate-900 font-semibold transition-[opacity,transform,width]  hidden lg:block`}>Admin Dashboard</div>
            <div className={`text-xs text-slate-500 transition-[opacity,transform,width] hidden lg:block`}>Control Center</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={closeOnMobile} className='lg:hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100' aria-label='Close'>
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
                    <span className={`relative z-10 text-sm font-medium transition-all duration-200 ${open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} hidden lg:block`}>{item.name}</span>

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
