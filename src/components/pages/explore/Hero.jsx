'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/atoms/Button';
import { MailPlus, UserRoundCog, UserIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function HeroAnother() {
  const { user } = useAuth();

  const cards = [
    {
      id: 'recommended',
      icon: <EnvelopeIcon />,
      title: 'Recommended for you',
      lines: ['Get matched with freelancers', 'Create a job and get custom offers'],
      buttonLabel: 'Start a Project',
      href: '/share-job-description',
    },
    {
      id: 'complete-profile',
      icon: <UserIcon />, // lucide-react
      title: 'Complete your account',
      lines: ['Your profile is missing details.', 'Add your info to unlock all features.'],
      buttonLabel: 'Complete Your Profile',
      href: '/profile', // change to your actual profile route
    },
  ];

  return (
    <div className='relative px-6 py-12 my-12 lg:px-12 lg:py-18 text-white rounded-[30px] overflow-hidden shadow-2xl bg-gradient-to-r from-green-400 to-green-600'>
      {/* Fancy green gradient background */}
      <div className='absolute inset-0 bg-gradient-to-r from-green-300 to-green-500 opacity-50'></div>

      {/* Soft glow overlay */}
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]'></div>

      {/* Decorative blobs */}
      <div className='absolute -top-20 -left-20 h-40 w-40 rounded-full bg-green-100 opacity-30 blur-3xl'></div>
      <div className='absolute bottom-0 right-0 h-60 w-60 rounded-full bg-green-300 opacity-20 blur-3xl'></div>

      <div className='relative z-[10]'>
        <motion.h1 className='text-[30px] font-extrabold leading-[1.1] md:text-[50px]' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          Welcome back, {user?.username}
        </motion.h1>

        <div className='mt-10 flex items-center justify-start max-[900px]:flex-wrap gap-5'>
          {cards.map(({ id, icon, title, lines, buttonLabel, href }) => (
            <motion.section key={id} className='flex flex-col rounded-2xl max-w-[500px] w-full bg-white/90 backdrop-blur-[100px] p-8 text-slate-900 shadow-xl' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <div className=' mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 shadow-inner border border-green-200 text-green-700 ring-1 ring-green-200'>{icon}</div>

              <motion.h2 className='text-2xl mb-2 font-[700]' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.3 }}>
                {title}
              </motion.h2>

              {lines.map((text, i) => (
                <motion.p key={i} className='text-base ltr:pl-2 rtl:pr-2' initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}>
                  {text}
                </motion.p>
              ))}

              <Button name={buttonLabel} href={href} color='green' className='mt-8 py-3' icon={<PlusIcon className='h-5 w-5 border border-white rounded-md p-[1px] text-white' />} />
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' aria-hidden='true'>
      <path d='M12 5v14M5 12h14' />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width='30' height='30' viewBox='0 0 60 60' fill='none' stroke='currentColor' strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      <path d='M5 21.25C5 12.5 10 8.75 17.5 8.75H42.5C50 8.75 55 12.5 55 21.25V38.75C55 47.5 50 51.25 42.5 51.25H17.5' strokeWidth={4} />
      <path d='M42.5 22.5L34.675 28.75C32.1 30.8 27.875 30.8 25.3 28.75L17.5 22.5' strokeWidth={4} />
      <path d='M5 41.25H20' strokeWidth={4} />
      <path d='M5 31.25H12.5' strokeWidth={4} />
    </svg>
  );
}

const container = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.06 },
  },
};
const item = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};
export default function Hero() {
  const t = useTranslations('Explore');
  const { user, role } = useAuth();

  const cards = [];

  // Conditionally push the first card based on role
  if (role === 'guest') {
    const cardData = t.raw('hero.cards.guest');
    cards.push({
      id: 'create-account',
      icon: <UserRoundCog className='h-6 w-6' />,
      title: cardData.title,
      lines: cardData.lines,
      buttonLabel: cardData.buttonLabel,
      href: '/auth?tab=register',
      accent: 'from-emerald-400/20 to-emerald-400/0',
      chip: cardData.chip,
    });
  } else if (role === 'buyer') {
    const cardData = t.raw('hero.cards.buyer');
    cards.push({
      id: 'recommended',
      icon: <MailPlus className='h-6 w-6' />,
      title: cardData.title,
      lines: cardData.lines,
      buttonLabel: cardData.buttonLabel,
      href: '/share-job-description',
      accent: 'from-emerald-400/20 to-emerald-400/0',
      chip: cardData.chip,
    });
  } else if (role === 'seller') {
    const cardData = t.raw('hero.cards.seller');
    cards.push({
      id: 'create-service',
      icon: <MailPlus className='h-6 w-6' />,
      title: cardData.title,
      lines: cardData.lines,
      buttonLabel: cardData.buttonLabel,
      href: '/create-gig',
      accent: 'from-emerald-400/20 to-emerald-400/0',
      chip: cardData.chip,
    });
  }
  // No card pushed for admin

  if (role !== 'guest') {
    const cardData = t.raw('hero.cards.completeProfile');
    cards.push({
      id: 'complete-profile',
      icon: <UserRoundCog className='h-6 w-6' />,
      title: cardData.title,
      lines: cardData.lines,
      buttonLabel: cardData.buttonLabel,
      href: '/profile',
      accent: 'from-emerald-400/20 to-emerald-400/0',
      chip: cardData.chip,
    });
  }

  return (
    <section className='relative my-10 rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl' />
        <div className='absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl' />
      </div>

      <div className='relative z-10 px-6 py-10 md:px-10 md:py-14'>
        <motion.div variants={container} initial='hidden' animate='show'>
          <motion.p variants={item} className='mb-2 text-sm text-slate-500'>
            {t('hero.quickActions')}
          </motion.p>

          <motion.h1 variants={item} className='text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900'>
            {t('hero.welcomeBack')}&nbsp;
            <span className='bg-gradient-to-r from-emerald-800 to-emerald-500 bg-clip-text text-transparent'>
              {user?.username || t('hero.there')}
            </span>
          </motion.h1>

          <motion.p variants={item} className='mt-2 text-slate-600'>
            {t('hero.subtitle')}
          </motion.p>

          <motion.div variants={item} className='mt-8 w-full max-w-[1000px] grid gap-5 sm:grid-cols-2'>
            {cards.map((c, idx) => (
              <ActionCard key={c.id} {...c} delay={0.08 * (idx + 1)} />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}


function ActionCard({ icon, title, lines, buttonLabel, href, accent = 'from-emerald-400/15 to-emerald-400/0', chip, delay = 0 }) {
  const t = useTranslations('Explore');
  const locale = useLocale()
  const isArabic = locale === 'ar';

  const displayChip = chip || t('hero.defaultChip');
  return (
    <motion.article initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: 'easeOut', delay }} whileHover={{ y: -2 }} className='group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow'>
      {/* light gradient accent on hover */}
      <div className={`pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br ${accent}   transition`} />

      <div className='flex items-center justify-between'>
        <div className='inline-flex items-center gap-3'>
          <div className='grid h-11 w-11 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-200 text-slate-700'>{icon}</div>
          <div className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600'>{displayChip}</div>
        </div>

        {isArabic ? <ArrowLeft className='h-5 w-5 text-slate-400 group-hover:text-slate-600 transition' /> : <ArrowRight className='h-5 w-5 text-slate-400 group-hover:text-slate-600 transition' />}
      </div>

      <h3 className='mt-4 text-xl font-semibold text-slate-900'>{title}</h3>
      <ul className='mt-2 space-y-1.5 text-slate-600'>
        {lines.map((t, i) => (
          <li key={i} className='text-sm leading-6'>
            {t}
          </li>
        ))}
      </ul>

      <div className='mt-5'>
        <Button
          name={buttonLabel}
          href={href}
          color='green'
          className='w-full justify-center !h-[42px] !rounded-lg shadow-sm'
          icon={
            <span className='inline-flex h-5 w-5 items-center justify-center rounded-md border border-white/0'>
              {isArabic ? <ArrowLeft className='h-4 w-4' /> : <ArrowRight className='h-4 w-4' />}
            </span>
          }
        />
      </div>
    </motion.article>
  );
}
