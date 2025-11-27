// app/seller/proposals/page.jsx — "My Proposals" (Light mode, animated, JS)
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api from '@/lib/axios';
import Button from '@/components/atoms/Button';
import NoResults from '@/components/common/NoResults';
import TabsPagination from '@/components/common/TabsPagination';
import { Modal } from '@/components/common/Modal';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, CalendarDays, Clock, FolderOpen, User2, ArrowUp } from 'lucide-react';
import AttachmentList from '@/components/common/AttachmentList';
import toast from 'react-hot-toast';
import Tabs from '@/components/common/Tabs';
import { isErrorAbort } from '@/utils/helper';

// -------------------------------------------------
// Service helper — GET /jobs/my-proposals
// -------------------------------------------------
async function listMyProposals({ status = '', page = 1, limit = 12 } = {}, { signal }) {
  const res = await api.get('/jobs/my-proposals', {
    params: {
      status: status || undefined, // backend expects string or undefined
      page,
      limit
    },
  }, { signal });
  return res.data; // { proposals, pagination }
}

// -------------------------------------------------
// Visual tokens (light mode)
// -------------------------------------------------
const cardBase = 'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white ring-1 ring-black/5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-[3px]';
const chip = 'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700';

const spring = { type: 'spring', stiffness: 260, damping: 24 };
const fadeStagger = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05, when: 'beforeChildren' } } };
const fadeItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function statusTone(s) {
  const val = String(s || '').toLowerCase();
  if (val === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (val === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200'; // submitted/other
}

// -------------------------------------------------
// Page
// -------------------------------------------------
export default function SellerProposalsPage() {
  const t = useTranslations('Jobs.proposals');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(12);

  const [tab, setTab] = useState('all');
  const [viewer, setViewer] = useState({ open: false, job: null });
  const controllerRef = useRef();
  function resetPage() {
    setPage(1)
  }
  useEffect(() => {

    (async () => {
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      try {


        setLoading(true);
        const params = {
          page,
          limit,
          ...(tab !== 'all' && { status: tab }),
        };

        const res = await listMyProposals(params, { signal: controller.signal });

        setItems(res?.proposals || []);
        setPages(res?.pagination?.pages || 1);
      } catch (e) {
        if (!isErrorAbort(e)) {
          console.error(e);
          toast.error(t('errors.failedToLoad'));
        }
      } finally {
        // Only clear loading if THIS request is still the active one
        if (controllerRef.current === controller)
          setLoading(false);
      }
    })();
  }, [page, limit, tab]);

  return (
    <div className='container !mb-12 !mt-6 min-h-[700px] '>
      <div className='card flex items-center justify-between '>
        <div>
          <h1 className='text-3xl font-extrabold tracking-tight text-slate-900'>{t('title')}</h1>
          <p className='mt-1 text-slate-600'>{t('subtitle')}</p>
        </div>

        <Tabs
          tabs={[
            { label: t('all'), value: 'all' },
            { label: t('submitted'), value: 'submitted' },
            { label: t('accepted'), value: 'accepted' },
            { label: t('rejected'), value: 'rejected' },
          ]}
          setActiveTab={tab => { setTab(tab); resetPage() }}
          activeTab={tab}
        />
      </div>

      <motion.div className='mt-6 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3' variants={fadeStagger} initial='hidden' animate='show'>
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)
        ) : items?.length ? (
          items.map((p, i) => (
            <motion.div key={p.id} variants={fadeItem}>
              <ProposalCard proposal={p} onOpenJob={() => setViewer({ open: true, job: p.job })} />
            </motion.div>
          ))
        ) : (
          <div className='md:col-span-2 lg:col-span-3'>
            <NoResults mainText={t('noProposals')} additionalText={tab === 'all' ? t('noProposalsYet') : t('noStatusProposals', { status: tab })} />
          </div>
        )}
      </motion.div>

      <div className='mt-8'>
        <TabsPagination loading={loading} currentPage={page} totalPages={pages} onPageChange={p => setPage(p)} onItemsPerPageChange={sz => { setLimit(sz); resetPage() }} itemsPerPage={limit}
          options={[
            { id: 5, name: '5' },
            { id: 10, name: '10' },
            { id: 12, name: '12' },
            { id: 20, name: '20' },
            { id: 50, name: '50' },
          ]} />
      </div>

      <AnimatePresence>
        {viewer.open && viewer.job && (
          <Modal title={t('jobDetails')} onClose={() => setViewer({ open: false, job: null })}>
            <JobDetails job={viewer.job} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------
// Cards
// -------------------------------------------------
function ProposalCard({ proposal, onOpenJob }) {
  const t = useTranslations('Jobs.proposals');
  const [expanded, setExpanded] = useState(false);
  const submitted = (proposal?.submittedAt || proposal?.created_at || '').split('T')[0];
  const buyerName = proposal?.job?.buyer?.username || '—';
  const buyerInitials = useMemo(
    () =>
      (buyerName || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join(''),
    [buyerName],
  );


  // Split portfolio string into array of links
  const portfolioLinks = useMemo(() => {
    if (!proposal?.portfolio) return [];
    return proposal.portfolio
      .split('\n')
      .map(link => link.trim())
      .filter(Boolean);
  }, [proposal?.portfolio]);

  // Decide if we need the toggle button
  const needsToggle = proposal?.coverLetter && proposal.coverLetter.length > 200;


  return (
    <motion.article className={cardBase} whileHover={{ y: -2 }} transition={spring}>
      <div className='absolute inset-x-0 top-0 h-1' style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #f59e0b)' }} />

      <div className='p-6 sm:p-7 '>
        <header className='flex items-start justify-between gap-3'>
          <h2 className='text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 line-clamp-1'>{proposal?.job?.title}</h2>
          <span className={`${chip} ${statusTone(proposal?.status)}`}>
            <span className='h-2 w-2 rounded-full bg-current opacity-70 [color:currentColor]' />
            <span className='capitalize'>{String(proposal?.status || 'submitted').toLowerCase()}</span>
          </span>
        </header>

        {proposal?.coverLetter && (
          <div className="mt-2">
            <p
              className={`text-slate-600 ${expanded ? '' : 'line-clamp-3'}`}
            >
              {proposal.coverLetter}
            </p>
            {needsToggle && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-xs text-emerald-600 hover:underline"
              >
                {expanded ? t('showLess') : t('showMore')}
              </button>
            )}
          </div>
        )}

        <div className='mt-5 flex flex-wrap items-center gap-3'>
          <span className={chip}>
            <Banknote className='h-4 w-4' /> {proposal?.bidAmount}
          </span>
          <span className={chip}>
            <Clock className='h-4 w-4' /> {proposal?.estimatedTimeDays} {t('days')}
          </span>
          <span className={chip}>
            <CalendarDays className='h-4 w-4' /> {submitted}
          </span>
        </div>

        {/* Portfolio Links */}
        {portfolioLinks.length > 0 && (
          <div className="mt-4 space-y-1">
            <p className="text-sm font-medium text-slate-700">{t('portfolio')}</p>
            <ul className="space-y-1">
              {portfolioLinks.map((url, idx) => (
                <li key={idx}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 hover:underline break-all"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className='flex items-center justify-between mt-4 '>
          <div className=' flex items-center gap-3'>
            <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200'>
              <span className='text-sm font-semibold'>{buyerInitials}</span>
            </div>
            <div>
              <div className='text-sm font-semibold text-slate-900 flex items-center gap-2'>
                <User2 className='h-4 w-4' />
                <a className='hover:underline' href={`/profile/${proposal?.job?.buyer?.id}`}>{buyerName}</a>
              </div>
              <div className='text-sm text-slate-500'>{proposal?.job?.buyer?.country || ''}</div>
            </div>
          </div>
          <footer className=' !w-fit flex items-center justify-between rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200'>
            <Button icon={<ArrowUp className='rotate-[45deg]' />} className=' !px-2 !h-[35px] !w-fit' onClick={onOpenJob} />
          </footer>
        </div>
      </div>

      <div className='pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5 transition-opacity group-hover:opacity-100' />
    </motion.article>
  );
}

function CardSkeleton() {
  return (
    <motion.div className={cardBase + ' animate-pulse'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className='p-6 sm:p-7'>
        <div className='h-6 w-2/3 rounded bg-slate-200' />
        <div className='mt-3 h-4 w-full rounded bg-slate-200' />
        <div className='mt-2 h-4 w-5/6 rounded bg-slate-200' />
        <div className='mt-5 h-6 w-28 rounded-full bg-slate-200' />
      </div>
    </motion.div>
  );
}

// -------------------------------------------------
// Job details reuse (from job viewer)
// -------------------------------------------------
function JobDetails({ job }) {
  const t = useTranslations('Jobs');
  const buyerName = job?.buyer?.username || '—';
  const buyerInitials = useMemo(
    () =>
      (buyerName || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase())
        .join(''),
    [buyerName],
  );
  const created = (job?.created_at || '').split('T')[0];

  return (
    <section>
      <div className='flex items-start justify-between gap-3'>
        <a href={`/jobs?job=${job?.id}`} className='text-xl font-semibold text-slate-900 hover:underline'>{job?.title}</a>
      </div>
      {job?.description && <p className='mt-2 text-slate-700'>{job.description}</p>}

      <div className='mt-4 flex flex-wrap items-center gap-2'>
        <span className={chip}>
          <Banknote className='h-4 w-4' /> {job.budget}
          {job.budgetType === 'hourly' ? '/hr' : ''}
        </span>
        <span className={chip}>
          <Clock className='h-4 w-4' /> {job.preferredDeliveryDays ?? '—'} {t('page.days')}
        </span>
        <span className={chip}>
          <CalendarDays className='h-4 w-4' /> {created}
        </span>
      </div>

      <div className='mt-5 flex items-center gap-3'>
        <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200'>
          <span className='text-sm font-semibold'>{buyerInitials}</span>
        </div>
        <div>
          <div className='text-sm font-semibold text-slate-900 flex items-center gap-2'>
            <User2 className='h-4 w-4' /> {buyerName}
          </div>
          <div className='text-sm text-slate-500'>{job?.buyer?.country || ''}</div>
        </div>
      </div>

      {Array.isArray(job?.attachments) && job.attachments.length > 0 && (
        <div className='mt-5 rounded-xl border border-slate-200 p-3'>
          <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800'>
            <FolderOpen className='h-4 w-4' /> {t('page.attachments')}
          </div>
          <AttachmentList attachments={job.attachments} />
        </div>
      )}

      {Array.isArray(job?.skillsRequired) && job.skillsRequired.length > 0 && (
        <div className='mt-4'>
          <div className='text-sm font-semibold text-slate-800 mb-2'>{t('page.skillsAndExpertise')}</div>
          <div className='flex flex-wrap gap-2'>
            {job.skillsRequired.map((s, i) => (
              <span key={i} className='gradient text-white px-3 py-1 rounded-full text-sm font-medium'>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
