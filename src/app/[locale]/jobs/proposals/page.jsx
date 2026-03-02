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
import { Banknote, CalendarDays, Clock, FolderOpen, User2, ArrowUp, ExternalLink, Paperclip, ChevronDown } from 'lucide-react';
import AttachmentList from '@/components/common/AttachmentList';
import toast from 'react-hot-toast';
import Tabs from '@/components/common/Tabs';
import { canViewUserProfile, isErrorAbort, resolveUrl } from '@/utils/helper';
import { formatDate } from '@/utils/date';
import { useAuth } from '@/context/AuthContext';

// -------------------------------------------------
// Service helper — GET /jobs/my-proposals
// -------------------------------------------------

const statusConfig = {
  accepted: { label: "Accepted", dot: "#22c55e", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-200 dark:ring-emerald-800" },
  rejected: { label: "Rejected", dot: "#ef4444", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", ring: "ring-red-200 dark:ring-red-800" },
  pending: { label: "Pending", dot: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-200 dark:ring-amber-800" },
  submitted: { label: "Submitted", dot: "#6366f1", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400", ring: "ring-indigo-200 dark:ring-indigo-800" },
};

function getStatus(raw) {
  const key = (raw || "submitted").toLowerCase();
  return statusConfig[key] ?? statusConfig.submitted;
}

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
// Visual tokens (light + dark mode)
// -------------------------------------------------

const cardBase = `
group relative overflow-hidden rounded-2xl
border border-slate-200 dark:border-dark-border
bg-white dark:bg-dark-bg-card
ring-1 ring-black/5 dark:ring-white/5
transition-all duration-300
hover:shadow-2xl hover:-translate-y-[3px]
`;

const chip = `
inline-flex items-center gap-1 rounded-full
border border-slate-200 dark:border-dark-border
bg-slate-50 dark:bg-dark-bg-input
px-3 py-1 text-xs font-semibold
text-slate-700 dark:text-dark-text-primary
`;

const spring = { type: 'spring', stiffness: 260, damping: 24 };

const fadeStagger = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.05, when: 'beforeChildren' }
  }
};

const fadeItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

function statusTone(s) {
  const val = String(s || '').toLowerCase();

  if (val === 'accepted')
    return `
      bg-main-50 text-main-700 border-main-200
      dark:bg-main-900/30 dark:text-main-300 dark:border-main-700
    `;

  if (val === 'rejected')
    return `
      bg-rose-50 text-rose-700 border-rose-200
      dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700
    `;

  return `
    bg-slate-50 text-slate-700 border-slate-200
    dark:bg-dark-bg-input dark:text-dark-text-secondary dark:border-dark-border
  `;
}

// -------------------------------------------------
// Page
// -------------------------------------------------
export default function SellerProposalsPage() {
  const t = useTranslations('Jobs.proposals');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
    <div className='
    container !mb-12 !mt-6 min-h-[700px]
    dark:text-dark-text-primary
    transition-colors duration-300
  '>

      <div className='card flex items-center justify-between
                    dark:bg-dark-bg-card
                    dark:border-dark-border
                    transition-colors duration-300'>
        <div>
          <h1 className='
          text-3xl font-extrabold tracking-tight
          text-slate-900
          dark:text-dark-text-primary
        '>
            {t('title')}
          </h1>

          <p className='
          mt-1 text-slate-600
          dark:text-dark-text-secondary
        '>
            {t('subtitle')}
          </p>
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

      <motion.div
        className='mt-6 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3'
        variants={fadeStagger}
        initial='hidden'
        animate='show'
      >
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)
        ) : items?.length ? (
          items.map((p, i) => (
            <motion.div key={p.id} variants={fadeItem}>
              <ProposalCard
                proposal={p}
                onOpenJob={() => {
                  setViewer({ open: true, job: p.job })
                }}
              />
            </motion.div>
          ))
        ) : (
          <div className='md:col-span-2 lg:col-span-3'>
            <NoResults
              mainText={t('noProposals')}
              additionalText={
                tab === 'all'
                  ? t('noProposalsYet')
                  : t('noStatusProposals', { status: tab })
              }
            />
          </div>
        )}
      </motion.div>

      <div className='mt-8'>
        <TabsPagination
          loading={loading}
          currentPage={page}
          totalPages={pages}
          onPageChange={p => setPage(p)}
          onItemsPerPageChange={sz => { setLimit(sz); resetPage() }}
          itemsPerPage={limit}
          options={[
            { id: 5, name: '5' },
            { id: 10, name: '10' },
            { id: 12, name: '12' },
            { id: 20, name: '20' },
            { id: 50, name: '50' },
          ]}
        />
      </div>

      <AnimatePresence>
        {viewer.open && viewer.job && (
          <Modal
            title={t('jobDetails')}
            onClose={() => setViewer({ open: false, job: null })}
          >
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

const COVER_THRESHOLD = 220;




function MetaPill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
      bg-slate-100 dark:bg-dark-bg-input
      text-slate-600 dark:text-dark-text-primary
      ring-1 ring-slate-200 dark:ring-dark-border">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
      {children}
    </span>
  );
}


function Avatar({ name }) {
  const initials = useMemo(
    () =>
      (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join(""),
    [name]
  );

  // deterministic hue from name
  const hue = useMemo(() => {
    let h = 0;
    for (let i = 0; i < (name || "").length; i++) h = (h * 37 + name.charCodeAt(i)) % 360;
    return h;
  }, [name]);

  return (
    <div
      className="h-10 w-10 rounded-full grid place-items-center ring-2 ring-white dark:ring-dark-bg-card flex-shrink-0 select-none"
      style={{ background: `hsl(${hue},55%,55%)` }}
    >
      <span className="text-sm font-bold text-white">{initials}</span>
    </div>
  );
}


function ProposalCard({ proposal, onOpenJob }) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations('Jobs.proposals');
  const { role } = useAuth()
  const status = getStatus(proposal?.status);
  const submitted = formatDate(proposal?.submittedAt || proposal?.created_at);
  const buyerName = proposal?.job?.buyer?.username || "Unknown buyer";
  const needsToggle = (proposal?.coverLetter?.length ?? 0) > COVER_THRESHOLD;

  const portfolioLinks = useMemo(() => {
    if (!proposal?.portfolio) return [];
    return proposal.portfolio.split("\n").map((l) => l.trim()).filter(Boolean);
  }, [proposal?.portfolio]);

  const canAccess = canViewUserProfile(role, proposal?.job?.buyer?.role);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      // whileHover={{ y: -3, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className="relative group rounded-2xl overflow-hidden hover:bg-gray-100 dark:hover:bg-dark-bg-input
        bg-white dark:bg-dark-bg-card
        ring-1 ring-slate-200 dark:ring-dark-border
        shadow-sm"
    >
      {/* accent bar */}
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg,#6366f1,#a855f7 50%,#f59e0b)" }} />

      <div className="p-6 flex flex-col gap-5">

        {/* ── header row ── */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="flex-1 text-lg font-semibold leading-snug
            text-slate-900 dark:text-dark-text-primary
            line-clamp-2 tracking-tight">
            {proposal?.job?.title ?? "Untitled job"}
          </h2>

          <span className={`
            inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
            ring-1 flex-shrink-0 mt-0.5
            ${status.bg} ${status.text} ${status.ring}
          `}>
            <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: status.dot }} />
            {status.label}
          </span>
        </div>

        {/* ── cover letter ── */}
        {proposal?.coverLetter && (
          <div>
            <AnimatePresence initial={false}>
              <motion.p
                key={expanded ? "expanded" : "collapsed"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm leading-relaxed text-slate-600 dark:text-dark-text-secondary
                  [overflow-wrap:anywhere] ${expanded ? "" : "line-clamp-3"}`}
              >
                {proposal.coverLetter}
              </motion.p>
            </AnimatePresence>

            {needsToggle && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium
                  text-main-600 dark:text-main-400 hover:text-main-800 dark:hover:text-main-300
                  transition-colors"
              >
                <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
                {expanded ? t('showLess') : t('showMore')}

              </button>
            )}
          </div>
        )}

        {/* ── meta pills ── */}
        <div className="flex flex-wrap gap-2">
          <MetaPill icon={Banknote}>
            <span className="font-semibold text-slate-800 dark:text-dark-text-primary">{proposal?.bidAmount ?? "—"}</span>
          </MetaPill>

          <MetaPill icon={Clock}>
            {proposal?.estimatedTimeDays ?? "—"} {t('estimatedTimeDays')}
          </MetaPill>

          <MetaPill icon={CalendarDays}>
            {submitted}
          </MetaPill>
        </div>

        {/* ── portfolio links ── */}
        {portfolioLinks.length > 0 && (
          <div className="rounded-xl bg-slate-50 dark:bg-dark-bg-input ring-1 ring-slate-200 dark:ring-dark-border p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide
              text-slate-400 dark:text-dark-text-secondary mb-2">
              <Paperclip className="h-3 w-3" /> {t('portfolio')}
            </p>
            <ul className="space-y-1.5">
              {portfolioLinks.map((url, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3 flex-shrink-0 text-main-500 dark:text-main-400" />
                  <a
                    href={resolveUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-main-600 dark:text-main-400 hover:underline truncate"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── footer row ── */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-dark-border">
          {/* buyer */}
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={buyerName} />
            <div className="min-w-0">
              {proposal?.job?.buyer?.id && canAccess ? (<a
                href={`/profile/${proposal?.job?.buyer?.id}`}
                className="flex items-center gap-1.5 text-sm font-semibold
                  text-slate-900 dark:text-dark-text-primary hover:text-main-600 dark:hover:text-main-400
                  transition-colors truncate"
              >
                <User2 className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                {buyerName}
              </a>) : (
                <div
                  className="flex items-center gap-1.5 text-sm font-semibold
                  text-slate-900 dark:text-dark-text-primary hover:text-main-600 dark:hover:text-main-400
                  transition-colors truncate"
                >
                  <User2 className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                  {buyerName}
                </div>
              )}
              {proposal?.job?.buyer?.country && (
                <p className="text-xs text-slate-400 dark:text-dark-text-secondary mt-0.5">
                  {proposal.job.buyer.country}
                </p>
              )}
            </div>
          </div>

          {/* open job button */}
          <button
            type="button"
            onClick={onOpenJob}
            disabled={!proposal.job}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
              bg-main-600 hover:bg-main-700 active:bg-main-800
              text-white shadow-sm shadow-main-200 dark:shadow-main-900/40
              transition-all duration-150"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("viewJob")}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function CardSkeleton() {
  return (
    <motion.div
      className={`${cardBase} animate-pulse dark:bg-dark-bg-card dark:border-dark-border transition-colors duration-300`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className='p-6 sm:p-7'>
        <div className='h-6 w-2/3 rounded bg-slate-200 dark:bg-dark-bg-input' />
        <div className='mt-3 h-4 w-full rounded bg-slate-200 dark:bg-dark-bg-input' />
        <div className='mt-2 h-4 w-5/6 rounded bg-slate-200 dark:bg-dark-bg-input' />
        <div className='mt-5 h-6 w-28 rounded-full bg-slate-200 dark:bg-dark-bg-input' />
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
        <a
          href={`/jobs?job=${job?.id}`}
          className='text-xl font-semibold text-slate-900 dark:text-dark-text-primary hover:underline transition-colors duration-300'
        >
          {job?.title}
        </a>
      </div>

      {job?.description && (
        <p className='mt-2 text-slate-700 dark:text-dark-text-secondary transition-colors duration-300'>
          {job.description}
        </p>
      )}

      <div className='mt-4 flex flex-wrap items-center gap-2'>
        <span className={`${chip} dark:bg-dark-bg-card dark:border-dark-border dark:text-dark-text-primary transition-colors duration-300`}>
          <Banknote className='h-4 w-4' /> {job.budget}
          {job.budgetType === 'hourly' ? '/hr' : ''}
        </span>
        <span className={`${chip} dark:bg-dark-bg-card dark:border-dark-border dark:text-dark-text-primary transition-colors duration-300`}>
          <Clock className='h-4 w-4' /> {job.preferredDeliveryDays ?? '—'} {t('page.days')}
        </span>
        <span className={`${chip} dark:bg-dark-bg-card dark:border-dark-border dark:text-dark-text-primary transition-colors duration-300`}>
          <CalendarDays className='h-4 w-4' /> {created}
        </span>
      </div>

      <div className='mt-5 flex items-center gap-3'>
        <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-dark-bg-input text-slate-700 dark:text-dark-text-primary ring-1 ring-slate-200 dark:ring-dark-border transition-colors duration-300'>
          <span className='text-sm font-semibold'>{buyerInitials}</span>
        </div>
        <div>
          <div className='text-sm font-semibold text-slate-900 dark:text-dark-text-primary flex items-center gap-2 transition-colors duration-300'>
            <User2 className='h-4 w-4' /> {buyerName}
          </div>
          <div className='text-sm text-slate-500 dark:text-dark-text-secondary transition-colors duration-300'>
            {job?.buyer?.country || ''}
          </div>
        </div>
      </div>

      {Array.isArray(job?.attachments) && job.attachments.length > 0 && (
        <div className='mt-5 rounded-xl border border-slate-200 dark:border-dark-border dark:bg-dark-bg-card p-3 transition-colors duration-300'>
          <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-dark-text-primary transition-colors duration-300'>
            <FolderOpen className='h-4 w-4' /> {t('page.attachments')}
          </div>
          <AttachmentList attachments={job.attachments} />
        </div>
      )}

      {Array.isArray(job?.skillsRequired) && job.skillsRequired.length > 0 && (
        <div className='mt-4'>
          <div className='text-sm font-semibold text-slate-800 dark:text-dark-text-primary mb-2 transition-colors duration-300'>
            {t('page.skillsAndExpertise')}
          </div>
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
