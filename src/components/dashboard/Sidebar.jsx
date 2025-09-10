'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import Link from 'next/link';
import { MotionConfig, AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useMemo } from 'react';
import { LayoutDashboard, Users, FolderTree, ShoppingBag, TrendingUp, Package, Wallet, FileText, HelpCircle, Newspaper, BookOpen, Scale, Settings, MessageSquare, ArrowBigLeft, ArrowBigRight } from 'lucide-react';

 
export const menuItems   = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, title: 'Dashboard', desc: ' KPIs, trends, and quick actions for your workspace.' },
  { name: 'Users', href: '/dashboard/users', icon: Users, title: 'Users', desc: 'Manage user accounts, roles, status, and permissions.' },
  { name: 'Categories', href: '/dashboard/categories', icon: FolderTree, title: 'Categories', desc: 'Create and organize categories for your content and services.' },
  { name: 'Services', href: '/dashboard/services', icon: ShoppingBag, title: 'Services', desc: 'Add, edit, and publish services with pricing and packages.' },
  { name: 'Job', href: '/dashboard/job', icon: ShoppingBag, title: 'Job', desc: 'Add, edit, and publish Job.' },
  { name: 'Level Up', href: '/dashboard/levelup', icon: TrendingUp, title: 'Level Up', desc: 'Growth tools, gamification, and performance boosts.' },
  { name: 'Orders', href: '/dashboard/orders', icon: Package, title: 'Orders', desc: 'Track, fulfill, and update order statuses and notes.' },
  { name: 'Withdraw', href: '/dashboard/withdraw', icon: Wallet, title: 'Withdraw', desc: 'Request payouts, view balances, and payment history.' },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText, title: 'Invoices', desc: 'Generate, download, and manage invoices and billing.' },
  { name: 'FAQs', href: '/dashboard/faqs', icon: HelpCircle, title: 'FAQs', desc: 'Publish common questions and helpful answers for users.' },
  { name: 'Blogs', href: '/dashboard/blogs', icon: Newspaper, title: 'Blogs', desc: 'Write, schedule, and manage blog posts and drafts.' },
  { name: 'Guides', href: '/dashboard/guides', icon: BookOpen, title: 'Guides', desc: 'Step-by-step tutorials and documentation for your product.' },
  { name: 'Terms & Policies', href: '/dashboard/terms-policies', icon: Scale, title: 'Terms & Policies', desc: 'Legal pages: terms of service, privacy, and policy updates.' },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare, title: 'Chat', desc: 'Conversations, support inbox, and real-time messages.' },
  { name: 'Reports', href: '/dashboard/reports', icon: MessageSquare, title: 'Reports', desc: 'Conversations, support inbox, and real-time messages.' },
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

export default function Sidebar({ open, setOpen }) {
  const pathname = usePathname();
  const router = useRouter();

  const activeHref = useMemo(() => menuItems.find(i => pathname?.endsWith(i.href))?.href ?? menuItems[0].href, [pathname]);

  const closeOnMobile = () => setOpen(false);

  return (
    <MotionConfig reducedMotion='user' >
      {/* Mobile overlay */}
      <AnimatePresence>{open && <motion.button aria-label='Close sidebar' onClick={closeOnMobile} className='fixed inset-0 z-40 bg-black/35 backdrop-blur-sm lg:hidden' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence initial={false}  >
        {(open || typeof window === 'undefined') && (
          <motion.aside role='navigation' aria-label='Dashboard sidebar' className=' fixed inset-y-0 left-0 z-50 w-full lg:w-[250px] bg-white border-r border-slate-200 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] lg:static lg:z-auto lg:translate-x-0  flex flex-col ' initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
            {/* Brand */}
            <div className='h-16 px-4 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/65'>
              <div className='flex items-center gap-3'>
                <div className='h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white grid place-items-center font-bold shadow-sm'>A</div>
                <div className='leading-tight'>
                  <div className='text-slate-900 font-semibold'>Admin Dashboard</div>
                  <div className='text-xs text-slate-500'>Control Center</div>
                </div>
              </div>
              <button onClick={closeOnMobile} className='lg:hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100' aria-label='Close'>
                ✕
              </button>
            </div>

            {/* Menu */}
            <LayoutGroup id='sidebar-menu'>
              <div className='flex-1 overflow-y-auto px-3 py-3'>
                <motion.ul variants={listVariants} initial='hidden' animate='visible' custom={0.06} className='space-y-1 relative' role='list'>
                  {menuItems.map(item => {
                    const isActive = activeHref === item.href;
                    const Icon = item.icon;

                    return (
                      <motion.li key={item.href} variants={itemVariants} className='relative'>
                        <Link href={item.href} prefetch  className='group relative z-10 flex items-center gap-3 h-11 px-3 rounded-xl text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70' aria-current={isActive ? 'page' : undefined}>
                          {isActive && <motion.span layoutId='active-row-bg' className='absolute duration-300 inset-0 rounded-xl bg-emerald-50 border border-emerald-100' transition={{ type: 'spring', stiffness: 420, damping: 35 }} />}

                          {/* Left accent when active */}
                          <motion.span className='absolute left-0 top-1/2 -translate-y-1/2 h-[calc(100%-10px)] w-1.5 rounded-r bg-emerald-500' initial={{ opacity: 0, scaleY: 0.2 }} animate={isActive ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} />

                          <span className='relative z-10 group-hover:ltr:ml-[10px] group-hover:rtl:mr-[10px] duration-300 '>
                            <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                          </span>

                          <span className={`relative z-10 text-sm  font-medium ${isActive ? 'text-emerald-700' : 'group-hover:text-emerald-700'}`}>{item.name}</span>

                          {item.badge != null && <span className='ml-auto relative z-10 rounded-full bg-slate-100 text-slate-700 text-xs px-2 py-0.5'>{item.badge}</span>}

                          {/* subtle arrow on hover */}
                          <motion.span className='group-hover:text-emerald-500 duration-300 ml-auto opacity-0 group-hover:opacity-100 relative z-10 text-slate-400' initial={false} animate={{ x: 0 }} whileHover={{ x: 4 }}>
                            <ArrowBigRight size={15} />
                          </motion.span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </div>
            </LayoutGroup>

            {/* Footer (optional quick actions) */}
            <div className='border-t border-slate-200 px-3 py-3'>
              <div className='flex items-center justify-between'>
                <button
                  onClick={() => router.push('/dashboard/chat')}
                  className='inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium
                             bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[.98]'>
                  <MessageSquare className='h-4 w-4' />
                  Open Chat
                </button>

                <span className='text-xs text-slate-500'>v1.0</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
