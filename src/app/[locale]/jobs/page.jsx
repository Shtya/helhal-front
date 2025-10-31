'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import api from '@/lib/axios';
import InputSearch from '@/components/atoms/InputSearch';
import Select from '@/components/atoms/Select';
import AttachmentList from '@/components/common/AttachmentList';
import NoResults from '@/components/common/NoResults';
import TabsPagination from '@/components/common/TabsPagination';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Banknote, CalendarDays, CheckCircle2, Clock, FolderOpen, MapPin, Star, X, Save, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import AdvancedJobsDropdown from '@/components/Filters/AdvancedJobsDropdown';
import FavoriteButton from '@/components/atoms/FavoriteButton';
import UserAvatar from '@/components/common/UserAvatar';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import { updateUrlParams } from '@/utils/helper';
import { usePathname } from '@/i18n/navigation';
import SellerBudgetDropdown from '@/components/common/Filters/SellerBudgetDropdown';
import CategorySelect from '@/components/atoms/CategorySelect';

// -------------------------------------------------
// Services
// -------------------------------------------------
// build query helper for fetchAllServices
function buildQuery({ page = 1, limit = 12, q = '', filters = {} } = {}) {
  const out = {
    page: Number(page) || 1,
    limit: Number(limit) || 12,
  };

  if (typeof q === 'string' && q.trim()) out.q = q.trim();

  // map filters to API params
  if (filters.category) out.category = String(filters.category);
  if (filters.budgetType) out.budgetType = String(filters.budgetType);
  if (filters.priceRange) out.priceRange = String(filters.priceRange);
  if (filters.customBudget) out.customBudget = String(filters.customBudget);

  // booleans
  if (filters.max7days === true || filters.max7days === 'true') out.max7days = true;
  if (filters.withAttachments === true || filters.withAttachments === 'true') out.withAttachments = true;

  // leave min/max if present (API may consume them)
  if (filters.sortBy) out.sortBy = filters.sortBy;

  return out;
}

async function listPublishedJobs({ page = 1, limit = 12, q = '', category, budgetType, max7days, withAttachments, customBudget, priceRange, sortBy = 'newest' } = {}) {
  const res = await api.get('/jobs', {
    params: {
      page,
      limit,
      q,
      category,
      budgetType,
      max7days,
      withAttachments,
      customBudget,
      priceRange,
      // sortBy, return it when backend add it 
      filters: { status: 'published' },
    },
  });
  // JobsService.getJobs returns { jobs, pagination }
  return res.data?.jobs
    ? res.data
    : {
      jobs: res.data?.records ?? [],
      pagination: { page, limit, total: res.data?.total_records ?? 0, pages: res.data?.pages ?? 1 },
    };
}

async function submitProposal(jobId, payload) {
  const res = await api.post(`/jobs/${jobId}/proposals`, payload);
  return res.data;
}

// -------------------------------------------------
// Utils
// -------------------------------------------------
const spring = { type: 'spring', stiffness: 260, damping: 24 };
const fadeStagger = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05, when: 'beforeChildren' } },
};
const fadeItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

function formatBudget(job) {
  if (!job?.budget) return '—';
  const val = Number(job.budget);
  const money = Number.isFinite(val) ? `$${val.toLocaleString()}` : `$${job.budget}`;
  return `${job.budgetType === 'hourly' ? 'Hourly' : 'Fixed-price'} • Est. Budget: ${money}`;
}

// -------------------------------------------------
// Page
// -------------------------------------------------

const defaultFilters = {
  priceRange: '',
  customBudget: '',
  budgetType: '',
  minBudget: '',
  maxBudget: '',
  sortBy: 'newest',
  max7days: '',
  withAttachments: '',
  category: '',
}
export default function SellerJobsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { role } = useAuth();

  // Data
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(Number(searchParams.get('limit') || 10));

  // Search
  const [q, setQ] = useState(searchParams.get('q') || '');

  const debouncedQ = useDebounce({ value: q, onDebounce: resetPage });
  const skipDebouncedRef = useRef(false);


  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);


  const openDrawerForJob = async job => {
    try {
      setSelectedJob(job);
      setDrawerOpen(true);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Unable to open job');
    }
  };


  function resetPage() {
    setPage(1);
  }

  // Filters (grouped)
  const [filters, setFiltersState] = useState({
    priceRange: searchParams.get('priceRange') || '',
    customBudget: searchParams.get('customBudget') || '',
    budgetType: searchParams.get('budgetType') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    max7days: searchParams.get('max7days') === 'true',
    withAttachments: searchParams.get('withAttachments') === 'true',
    category: searchParams.get('category') || '',
  });


  function setFilter(key, value) {
    setFiltersState(prev => {

      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
    // always reset page when filters change (but not when we change page/limit)
    setPage(1);
  }

  // Reset filters + search
  const resetFilters = () => {
    setFiltersState(defaultFilters);
    setQ('');
    resetPage();
    if (debouncedQ) skipDebouncedRef.current = true;
  };

  useEffect(() => {
    const params = new URLSearchParams();


    if (page && Number(page) > 1) {
      params.set('page', String(page));
    } else {
      params.delete('page');
    }


    if (limit && Number(limit) !== 10) {
      params.set('limit', String(limit));
    } else {
      params.delete('limit');
    }


    if (typeof debouncedQ === 'string' && debouncedQ.trim()) {
      params.set('q', debouncedQ.trim());
    } else {
      params.delete('q');
    }


    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value === '' || value == null || value === false) {
        params.delete(key);
        return;
      }

      if (typeof value === 'boolean') {
        params.set(key, 'true');
      } else {
        params.set(key, String(value));
      }
    });

    updateUrlParams(pathname, params);
  }, [page, limit, debouncedQ, filters, pathname]);


  // Fetch jobs
  useEffect(() => {
    let isMounted = true;

    async function fetchAllServices() {
      try {
        if (skipDebouncedRef.current) {
          skipDebouncedRef.current = false;
          return; // skip this fetch triggered by debounce reset
        }

        setLoading(true);
        const query = buildQuery({ page, limit, q: debouncedQ, filters });

        const res = await listPublishedJobs(query);
        if (!isMounted) return;
        setJobs(res.jobs || []);
        setPages(res.pagination?.pages || 1);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load jobs');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAllServices();

    return () => {
      isMounted = false;
    };
  }, [page, limit, debouncedQ, filters]);


  return (
    <div className='container !mb-12 !pt-8 '>
      {role === 'buyer' && <HeroHeader />}

      {/* Filters Panel */}
      <motion.section variants={fadeItem} initial='hidden' animate='show' transition={spring} className='card'>
        <div className='grid grid-cols-1 gap-3 items-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
          <InputSearch iconLeft={'/icons/search.svg'} value={q} onChange={v => setQ(v)} placeholder='Search by title, description, or skills' className='!max-w-full' showAction={false} />
          <CategorySelect
            type='category'
            loadingText="Loading categories..."
            cnPlaceholder='!text-gray-900'
            value={filters?.category}
            onChange={opt => {
              setFilter('category', opt?.id ?? '');
            }}
            placeholder='Select a category'
          />


          <Select
            value={filters.budgetType}
            onChange={opt => {
              setFilter('budgetType', opt?.id ?? '');
            }
            }
            options={[
              { id: '', name: 'Any Budget Type' },
              { id: 'fixed', name: 'Fixed' },
              { id: 'hourly', name: 'Hourly' },
            ]}
            className='!text-xs min-w-0 truncate'
            variant='minimal'
          />
          <SellerBudgetDropdown onBudgetChange={() => {
            setFiltersState(prev => {
              const updated = {
                ...prev,
                priceRange,
                customBudget: priceRange === 'custom' ? customBudget : '',
              };
              return updated;
            });
            resetpage();
          }} selectedPriceRange={filters.priceRange} customBudget={filters.customBudget} />

          <div className='flex-grow sm:flex-grow-0'>
            <AdvancedJobsDropdown
              value={{
                sortBy: filters.sortBy,
                max7days: filters.max7days,
                withAttachments: filters.withAttachments,
              }}
              onApply={next => {
                setFiltersState(prev => ({
                  ...prev,
                  sortBy: next.sortBy,
                  max7days: next.max7days,
                  withAttachments: next.withAttachments,
                }))
                resetPage();
              }
              }
            />
          </div>

        </div>
      </motion.section>

      {/* Grid */}
      <motion.div className='mt-6 grid grid-cols-1' variants={fadeStagger} initial='hidden' animate='show'>
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => <JobCardSkeleton key={i} />)
        ) : jobs?.length ? (
          jobs.map((job, i) => (
            <motion.div key={job.id} variants={fadeItem}>
              <JobCard job={job} onOpen={() => openDrawerForJob(job)} index={i} />
            </motion.div>
          ))
        ) : (
          <div className='md:col-span-2 lg:col-span-3'>
            <NoResults mainText='No jobs right now' additionalText='Try widening your filters or check back later.' buttonText="Reset Filters" onClick={resetFilters} />
          </div>
        )}
      </motion.div>

      <div className='mt-8'>
        <TabsPagination currentPage={page} totalPages={pages} onPageChange={p => setPage(p)} onItemsPerPageChange={sz => {
          setLimit(sz)
          resetpage();
        }} itemsPerPage={limit} />
      </div>

      {/* Drawer (details + apply) */}
      <JobDrawer
        open={drawerOpen}
        job={selectedJob}
        onClose={() => setDrawerOpen(false)}
        onSubmitProposal={async values => {
          if (!selectedJob?.id) return;
          const payload = {
            coverLetter: values.coverLetter,
            bidAmount: +values.bidAmount,
            bidType: selectedJob.budgetType === 'hourly' ? 'hourly' : 'fixed',
            estimatedTimeDays: +values.deliveryDays,
            status: 'submitted',
            portfolio: values.portfolioUrls ?? undefined,
          };
          await toast.promise(submitProposal(selectedJob.id, payload), {
            loading: 'Submitting…',
            success: 'Proposal submitted',
            error: e => e?.response?.data?.message || 'Failed to submit',
          });
        }}
      />
    </div>
  );
}

// -------------------------------------------------
// Hero
// -------------------------------------------------
function HeroHeader() {
  return (
    <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring} className='card relative mb-6 overflow-hidden'>
      <div className='pointer-events-none absolute inset-0 -z-10 opacity-80 [background:radial-gradient(1000px_300px_at_20%_-10%,#ecfeff,transparent),radial-gradient(1000px_300px_at_80%_120%,#eef2ff,transparent)]' />
      <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
        <div>
          <h1 className='text-4xl font-extrabold tracking-tight text-slate-900'>Find Work</h1>
          <p className='mt-1 text-slate-600'>Hand-picked jobs. Smooth proposals. Land the gig.</p>
        </div>
        <motion.a whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }} href='/jobs/proposals' className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm'>
          My Proposals <ArrowUpRight className='h-4 w-4' />
        </motion.a>
      </div>
    </motion.header>
  );
}

// -------------------------------------------------
// Cards (Upwork-like layout)
// -------------------------------------------------
function JobCard({ job, onOpen, index }) {
  const posted = timeAgo?.(job?.created_at) || '';
  const createdDate = (job?.created_at || '').split('T')[0];
  const budgetLine = formatBudget?.(job) || `${job?.pricing || ''}`;
  const buyer = job?.buyer || {};
  const country = buyer?.country || '—';

  return (
    <motion.article className='group  border-b border-b-slate-200 p-5 sm:p-6 hover:bg-gray-100 bg-gray-50/50 transition-all duration-200 cursor-pointer' onClick={onOpen} role='button' tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen()} transition={spring}>
      {/* Top bar (posted + actions) */}
      <div className='mb-1 flex items-center justify-between'>
        <div className='text-xs text-slate-500'>Posted {posted || createdDate}</div>
        <div className='relative flex items-center gap-2 opacity-70 group-hover:opacity-100'
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()} >
          <FavoriteButton className=' !top-0 !right-0 !relative' />
        </div>
      </div>

      <UserAvatar buyer={buyer} />

      <h2 className='text-lg sm:text-xl font-semibold text-slate-900 leading-snug'>{job.title}</h2>

      <div className='mt-1 text-sm text-slate-600'>{budgetLine || 'Fixed-price · Intermediate'}</div>

      {/* Description */}
      {job.description ? <p className='mt-2 text-slate-700 line-clamp-2'>{job.description}</p> : null}

      {/* Skill chips */}
      {Array.isArray(job.skillsRequired) && job.skillsRequired.length > 0 && (
        <div className='mt-3 flex flex-wrap gap-2'>
          {job.skillsRequired.map((s, i) => (
            <span key={i} className='inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold border border-slate-200'>
              {s}
            </span>
          ))}
        </div>
      )}

      <div className='mt-5 flex items-center justify-end'>
        <div className='flex items-center gap-2'>
          <span className='inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800'>
            View & Apply <ArrowUpRight className='h-4 w-4' />
          </span>
        </div>
      </div>
    </motion.article>
  );
}

function JobCardSkeleton() {
  return (
    <motion.div className=' border-b border-b-slate-200 bg-white p-6 animate-pulse' initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className='h-3 w-24 rounded bg-slate-200' />
      <div className='mt-3 h-6 w-2/3 rounded bg-slate-200' />
      <div className='mt-2 h-4 w-full rounded bg-slate-200' />
      <div className='mt-2 h-4 w-5/6 rounded bg-slate-200' />
      <div className='mt-4 flex gap-2'>
        <div className='h-6 w-20 rounded-full bg-slate-200' />
        <div className='h-6 w-20 rounded-full bg-slate-200' />
        <div className='h-6 w-20 rounded-full bg-slate-200' />
      </div>
      <div className='mt-5 h-9 w-36 rounded bg-slate-200' />
    </motion.div>
  );
}

// -------------------------------------------------
// Drawer (Details + Apply)
// -------------------------------------------------
const fmtMoney = n => (typeof n === 'number' ? `$${n.toLocaleString()}` : n || '');
const applySchema = yup.object({
  coverLetter: yup.string().min(20, 'Min 20 chars').required('Required'),
  bidAmount: yup.number().typeError('Enter a number').positive().required('Required'),
  deliveryDays: yup.number().typeError('Enter a number').positive().integer().required('Required'),
  portfolioUrls: yup.string().optional(),
  milestoneTitle: yup.string().optional(),
  milestoneAmount: yup.number().typeError('Enter a number').positive().optional(),
});

export function JobDrawer({ open, onClose, job, onSubmitProposal }) {
  const buyer = job?.buyer || {};
  const country = buyer?.country || '—';
  const budget = job?.budget ?? job?.estimatedBudget;
  const priceType = job?.budgetType === 'hourly' ? 'Hourly' : 'Fixed-price';
  const experience = job?.experienceLevel || 'Intermediate';
  const projectType = job?.projectType || 'One-time project';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ resolver: yupResolver(applySchema) });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const submit = async values => {
    await onSubmitProposal?.(values);
    reset();
    onClose?.();
  };

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
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div className='fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40' onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

          {/* Drawer */}
          <motion.aside className='fixed inset-y-0 left-0 z-50 w-full max-w-[560px] bg-white shadow-2xl flex flex-col' initial={{ x: -580 }} animate={{ x: 0 }} exit={{ x: -580 }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
            {/* Header */}
            <div className='flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200'>
              <h3 className='text-lg font-semibold text-slate-900 line-clamp-1'>{job?.title || 'Job details'}</h3>
              <button onClick={onClose} className='rounded-full p-2 hover:bg-slate-100'>
                <X className='h-5 w-5 text-slate-700' />
              </button>
            </div>

            {/* Scrollable body */}
            <div className='flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6'>
              {/* Summary */}
              {job?.description && (
                <section>
                  <h4 className='text-sm font-semibold text-slate-900 mb-2'>Summary</h4>
                  <p className='text-sm text-slate-700'>{job.description}</p>
                </section>
              )}

              {/* Basic meta */}
              <section className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='rounded-xl border border-slate-200 p-4'>
                  <div className='text-slate-900 font-semibold'>{fmtMoney(budget)}</div>
                  <div className='text-xs text-slate-500'>{priceType}</div>
                </div>
              </section>

              {/* Skills */}
              {Array.isArray(job?.skillsRequired) && job.skillsRequired.length > 0 && (
                <section>
                  <h4 className='text-sm font-semibold text-slate-900 mb-2'>Skills and Expertise</h4>
                  <div className='flex flex-wrap gap-2'>
                    {job.skillsRequired.map((s, i) => (
                      <span key={i} className='inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-xs font-semibold border border-slate-200'>
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Client */}
              <section>
                <h4 className='text-sm font-semibold text-slate-900 mb-2'>About the client</h4>
                <div className='mt-1 flex items-center gap-3'>
                  <div className='grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200'>
                    <span className='text-sm font-semibold'>{buyerInitials}</span>
                  </div>
                  <div>
                    <div className='text-sm font-semibold text-slate-900 flex items-center gap-2'>{buyerName}</div>
                    <div className='text-sm text-slate-500'>{country}</div>
                  </div>
                </div>

                <div className='mt-3 space-y-2 text-sm'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                    <span>Payment method verified</span>
                  </div>
                  <div className='flex items-center gap-2 text-slate-700'>
                    <CalendarDays className='h-4 w-4' />
                    <span>Posted {created || '—'}</span>
                  </div>
                </div>
              </section>

              {/* Attachments */}
              {Array.isArray(job?.attachments) && job.attachments.length > 0 && (
                <section>
                  <h4 className='text-sm font-semibold text-slate-900 mb-2'>Attachments</h4>
                  <div className='rounded-xl border border-slate-200 p-3'>
                    <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800'>
                      <FolderOpen className='h-4 w-4' /> Files
                    </div>
                    <AttachmentList attachments={job.attachments} />
                  </div>
                </section>
              )}

              {/* APPLY FORM */}
              <section id='apply'>
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='text-sm font-semibold text-slate-900'>Apply</h4>
                </div>

                <form className='space-y-4' onSubmit={handleSubmit(submit)}>
                  {/* Bid + Delivery */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-slate-700'>Bid amount (SAR)</label>
                      <input type='number' step='1' className='mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500' placeholder='90' {...register('bidAmount')} />
                      {errors.bidAmount && <p className='mt-1 text-xs text-rose-600'>{errors.bidAmount.message}</p>}
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-slate-700'>Delivery (days)</label>
                      <input type='number' step='1' className='mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500' placeholder='3' {...register('deliveryDays')} />
                      {errors.deliveryDays && <p className='mt-1 text-xs text-rose-600'>{errors.deliveryDays.message}</p>}
                    </div>
                  </div>

                  {/* Cover letter */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700'>Cover letter</label>
                    <textarea rows={6} className='mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500' placeholder='Explain your approach, similar work, and timeline…' {...register('coverLetter')} />
                    {errors.coverLetter && <p className='mt-1 text-xs text-rose-600'>{errors.coverLetter.message}</p>}
                  </div>

                  {/* Portfolio links */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700'>Portfolio links (one per line)</label>
                    <textarea rows={3} className='mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500' placeholder={'https://…\nhttps://…'} {...register('portfolioUrls')} />
                  </div>

                  <div className='flex items-center justify-end gap-2'>
                    <button type='button' onClick={onClose} className='inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50'>
                      Cancel
                    </button>
                    <button type='submit' disabled={isSubmitting} className='inline-flex items-center rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60'>
                      {isSubmitting ? 'Submitting…' : 'Apply now'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
