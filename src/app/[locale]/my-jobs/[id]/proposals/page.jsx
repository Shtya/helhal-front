'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NativeLink from 'next/link';
import { Link } from '@/i18n/navigation';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-hot-toast';
import { Check, XCircle, MessageSquare, Clock, DollarSign, Filter, Search, Mail, FileText, ShieldCheck, Briefcase } from 'lucide-react';
import TabsPagination from '@/components/common/TabsPagination';
import NoResults from '@/components/common/NoResults';
import AttachmentList from '@/components/common/AttachmentList';
import Button from '@/components/atoms/Button';
import { Modal } from '@/components/common/Modal';
import api from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import Select from '@/components/atoms/Select';
import InputSearch from '@/components/atoms/InputSearch';
import { isErrorAbort } from '@/utils/helper';

// ----------------------------
// API Helpers
// ----------------------------
export const getJobProposals = async (
  { jobId,
    page = 1,
    limit = 20,
    search = '',
    status = '',
    sortBy = '',
    sortdir = '',
    sortOrder = '',
    signal
  }
) => {
  const params = new URLSearchParams();

  params.append('page', page);
  params.append('limit', limit);
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortdir) params.append('sortdir', sortdir);

  const res = await api.get(`/jobs/${jobId}/proposals?${params.toString()}`, {
    signal
  });
  return res.data;
};

// ----------------------------
// API Helpers
// ----------------------------
export const updateProposalStatus = async (proposalId, status) => {
  const payload =
    status === 'accepted'
      ? {
        status: 'accepted',
        checkout: {
          provider: 'fake', // simulate provider
          successUrl: '/payment/success',
          cancelUrl: '/payment/cancel',
        },
      }
      : { status: 'rejected' };

  const res = await api.put(`/jobs/proposals/${proposalId}/status`, payload);
  return res.data; // could return { __checkout__ } or { proposalId, status }
};

// ----------------------------
// Helpers
// ----------------------------
const formatMoney = v => {
  const n = typeof v === 'string' ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
};

const statusPill = status => {
  switch (status) {
    case 'submitted':
      return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200';
    case 'accepted':
      return 'bg-main-50 text-main-700 ring-1 ring-inset ring-main-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200';
  }
};

const SkeletonLoader = () => (
  <div className="space-y-6">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse"
      >
        {/* Header */}
        <div className="mb-5 flex flex-col items-center sm:items-start justify-between gap-4 md:flex-row">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-slate-200 shrink-0" />

            {/* Info */}
            <div className="flex-1 space-y-2 w-full sm:w-auto">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 w-52 rounded bg-slate-200" />
            </div>
          </div>

          {/* Bid Info */}
          <div className="space-y-2 text-right sm:text-left">
            <div className="h-6 w-24 rounded bg-slate-200 ml-auto sm:ml-0" />
            <div className="h-4 w-28 rounded bg-slate-200 ml-auto sm:ml-0" />
          </div>
        </div>

        {/* Body */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
          <div className="h-4 w-4/6 rounded bg-slate-200" />
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 pt-4">

          {/* Actions */}
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <div className="h-10 w-28 rounded bg-slate-200" />
            <div className="h-10 w-24 rounded bg-slate-200" />
            <div className="h-10 w-24 rounded bg-slate-200" />
          </div>
          {/* Status Pill */}
          <div className="h-6 w-24 rounded bg-slate-200 self-center sm:self-auto" />
        </div>
      </div>
    ))}
  </div>
);


function Avatar({ name, src }) {
  const letter = (name?.[0] || '?').toUpperCase();
  return (
    <div className='relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-white shadow shrink-0'>
      {src ? (
        <img src={src} alt={name} className='h-full w-full object-cover shrink-0' />
      ) : (
        <div className='gradient flex h-full w-full items-center justify-center text-white'>
          <span className='text-xl font-bold'>{letter}</span>
        </div>
      )}
    </div>
  );
}

function MetaChip({ icon, text, title }) {
  return (
    <div title={title} className='inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200'>
      {icon}
      <span className='truncate'>{text}</span>
    </div>
  );
}

function ProposalCard({ proposal, onAcceptClick, onRejectClick }) {
  const t = useTranslations('MyJobs.proposals');
  const seller = proposal.seller;

  const portfolioUrls = useMemo(() => {
    if (!proposal.portfolio) return [];

    return proposal.portfolio
      .split('\n')
      .filter(Boolean)
      .map(url => {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        const hostname = (() => {
          try {
            return new URL(fullUrl).hostname;
          } catch {
            return url;
          }
        })();

        return { fullUrl, hostname };
      });
  }, [proposal.portfolio]);

  return (
    <div className='group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg'>
      {/* Header */}
      <div className='mb-5 flex flex-col items-center sm:items-start justify-between gap-4 md:flex-row'>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar */}
          <Avatar name={seller.username} src={seller.profileImage} className="shrink-0" />

          {/* Info */}
          <div className="flex-1">
            {/* Username + Level */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/profile/${seller.id}`}
                className="text-lg font-semibold text-slate-900 hover:underline"
              >
                {seller.username}
              </Link>
              {seller.sellerLevel && (
                <MetaChip
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  text={seller.sellerLevel}
                  title={t('sellerLevel')}
                />
              )}
            </div>

            {/* Contact + Meta */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
              <NativeLink
                href={`mailto:${seller.email}`}
                className="inline-flex items-center gap-1 hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {seller.email}
              </NativeLink>
              {seller.country && <span>• {seller.country}</span>}
              {seller.memberSince && (
                <span>• {t('memberSince')} {new Date(seller.memberSince).toLocaleDateString()}</span>
              )}
            </div>

            {/* Skills */}
            {seller.skills?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {seller.skills.slice(0, 6).map(s => (
                  <span
                    key={s}
                    className="rounded-md bg-main-50 px-2 py-0.5 text-[11px] font-medium text-main-700 ring-1 ring-inset ring-main-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='flex gap-2 items-center'>

          <div className='flex gap-1 items-center'>
            <div className='inline-flex items-end gap-1'>
              <DollarSign className='mb-0.5 h-5 w-5 text-main-600' />
              <p className='text-2xl font-bold text-main-700'>{formatMoney(proposal.bidAmount)}</p>
              <span className='text-sm text-slate-500'>/{proposal.bidType === 'hourly' ? t('bidType.hourly') : proposal.bidType === 'fixed' ? t('bidType.fixed') : t('bidType.bid')}</span>
            </div>
            <p className='mt-1 inline-flex items-center gap-1 text-sm text-slate-600'>
              <Clock className='h-4 w-4' />
              {t('daysDelivery', { days: proposal.estimatedTimeDays })}
            </p>
          </div>
          <Button
            name={t('message')}
            icon={<MessageSquare className="h-4 w-4" />}
            href={`/chat?userId=${proposal.seller.id}`}
            color="secondary"
            className="!rounded-full !px-5 !py-2 !w-fit text-sm !font-bold !text-slate-700 !bg-white border border-slate-200 shadow-sm hover:!bg-slate-50 hover:border-main-300 transition-all active:scale-95"
          />

        </div>
      </div>

      {/* Body */}
      <div className='mb-5 space-y-2'>
        {portfolioUrls.length > 0 && (
          <div className="mt-4">
            <div className='mb-1 flex items-center gap-1 text-sm font-semibold text-slate-900'>
              <Briefcase className='h-4 w-4' />
              {t('portfolio')}
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolioUrls.map(({ fullUrl, hostname }, i) => (
                <a
                  key={i}
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200 hover:underline"
                >
                  🌐 {hostname}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className='mb-1 flex items-center gap-1 text-sm font-semibold text-slate-900'>
          <FileText className='h-4 w-4' />
          {t('coverLetter')}
        </div>
        <p className='leading-relaxed text-slate-700 break-words'>{proposal.coverLetter}</p>
      </div>

      {!!proposal.attachments?.length && (
        <div className='mb-5'>
          <h4 className='mb-1 text-sm font-semibold text-slate-900'>{t('attachments')}</h4>
          <AttachmentList className='lg:grid-cols-3 xl:grid-cols-4' attachments={proposal.attachments} />
        </div>
      )}

      {/* Footer */}
      <div className={`flex ${proposal.status === 'submitted' ? "flex-col sm:flex-row sm:items-center sm:justify-between" : "flex-row items-center justify-between"}  gap-4 border-t border-slate-100 pt-4`}>

        {/* Status Pill */}
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full self-center sm:self-auto ${statusPill(proposal.status)}`}
        >
          {proposal.status === 'submitted' ? t('status.submitted') : proposal.status === 'accepted' ? t('status.accepted') : proposal.status === 'rejected' ? t('status.rejected') : proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
        </span>
        {/* Actions */}
        <div className="flex flex-wrap justify-center sm:justify-end gap-2">
          {proposal.status === 'submitted' && (
            <>
              <Button
                name={t('acceptProposal')}
                icon={<Check className="h-4 w-4" />}
                color="green"
                onClick={() => onAcceptClick(proposal.id)}
                className="!px-4 !py-2 !w-fit text-sm"
              />
              <Button
                name={t('reject')}
                icon={<XCircle className="h-4 w-4" />}
                color="red"
                onClick={() => onRejectClick(proposal.id)}
                className="!px-4 !py-2 !w-fit text-sm"
              />
            </>
          )}
        </div>
      </div>

    </div>
  );
}

// ----------------------------
// Page
// ----------------------------
const SORT_CONFIG = {
  recent: { sortBy: 'created_at', sortdir: 'desc' },
  amountAsc: { sortBy: 'bidAmount', sortdir: 'asc' },
  amountDesc: { sortBy: 'bidAmount', sortdir: 'desc' },
  timeAsc: { sortBy: 'estimatedTimeDays', sortdir: 'asc' },
  timeDesc: { sortBy: 'estimatedTimeDays', sortdir: 'desc' },
};

export default function JobProposalsPage() {
  const t = useTranslations('MyJobs.proposals');
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id;

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);

  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('recent');
  const [query, setQuery] = useState('');
  const { debouncedValue: debouncedQuery } = useDebounce({ value: query, onDebounce: () => resetPage() });

  // Accept confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAcceptId, setPendingAcceptId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const controllerRef = useRef();

  const loadProposals = useCallback(
    async () => {
      if (controllerRef.current) controllerRef.current.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const { sortBy, sortdir } = SORT_CONFIG[sortKey] || {};
        setLoading(true);
        const response = await getJobProposals({
          jobId, page: pagination.page, limit: pagination.limit, search: debouncedQuery.trim(), sortBy, sortBy, sortdir, status: statusFilter === 'all' ? '' : statusFilter,
          signal: controller.signal
        });
        setProposals(response.proposals || []);
        setJob(response.job || null);
        setPagination(response.pagination || {});
      } catch (error) {
        if (!isErrorAbort(error)) {
          console.error('Error loading proposals:', error);
          toast.error(t('errors.failedToLoad'));
        }
      } finally {
        if (controllerRef.current === controller)
          setLoading(false);
      }
    },
    [jobId, debouncedQuery.trim(), sortKey, statusFilter, pagination.page, pagination.limit],
  );

  function resetPage() {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  useEffect(() => {
    if (jobId) loadProposals();
  }, [loadProposals]);

  const handleReject = async proposalId => {
    try {
      setActionLoading(true);
      await updateProposalStatus(proposalId, 'rejected');
      toast.success(t('success.proposalRejected'));
      await loadProposals(pagination.page || 1);
    } catch (e) {
      console.error(e);
      toast.error(t('errors.failedToUpdate'));
    } finally {
      setActionLoading(false);
    }
  };

  const openAcceptModal = proposalId => {
    setPendingAcceptId(proposalId);
    setConfirmOpen(true);
  };

  const confirmAccept = async () => {
    if (!pendingAcceptId) return;
    try {
      setActionLoading(true);
      const result = await updateProposalStatus(pendingAcceptId, 'accepted');
      toast.success(t('success.proposalAccepted'));
      setConfirmOpen(false);
      setPendingAcceptId(null);

      // Redirect to payment if backend returned a checkout object
      if (result?.__checkout__?.redirectUrl) {
        router.push(result.__checkout__.redirectUrl);
      } else {
        await loadProposals(pagination.page || 1);
      }
    } catch (e) {
      console.error(e);
      toast.error(t('errors.failedToUpdate'));
    } finally {
      setActionLoading(false);
    }
  };


  return (
    <div className='container min-h-[600px] !py-8'>
      {/* Job Header */}
      <div className='mb-6'>
        <div className='flex flex-col justify-between gap-4 md:flex-row md:items-end'>
          <div>
            <h1 className='mb-1 text-3xl font-bold text-slate-900'>{job?.title || t('title')}</h1>
            <p className='text-slate-600'>
              {proposals.length} {proposals.length === 1 ? t('proposal') : t('proposals')} {t('received')}
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {job?.budget && <MetaChip icon={<DollarSign className='h-3.5 w-3.5' />} text={`${formatMoney(job.budget)} • ${job.budgetType || 'budget'}`} title={t('jobBudget')} />}
            {job?.preferredDeliveryDays != null && <MetaChip icon={<Clock className='h-3.5 w-3.5' />} text={t('daysPreferred', { days: job.preferredDeliveryDays })} title={t('preferredDeliveryTime')} />}
            <Link href='/my-jobs' className='text-sm text-main-700 underline underline-offset-2'>
              {t('viewMyJobs')}
            </Link>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className='mb-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-1 items-center gap-2'>
          <InputSearch iconLeft={'/icons/search.svg'} value={query} onChange={v => setQuery(v)} placeholder={t('searchPlaceholder')} className='w-full md:max-w-md' showAction={false} />
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Select
            value={statusFilter}
            selectkey={t('selectKeys.status')}
            onChange={opt => {
              setStatusFilter(opt?.id ?? 'all');
              resetPage();
            }}
            options={[
              { id: 'all', name: t('status.all') },
              { id: 'submitted', name: t('status.submitted') },
              { id: 'accepted', name: t('status.accepted') },
              { id: 'rejected', name: t('status.rejected') },
            ]}
            className="flex-1 !text-xs min-w-fit"
            variant="minimal"
          />


          <Select
            value={sortKey}
            selectkey={t('selectKeys.sort')}
            onChange={opt => {
              setSortKey(opt?.id ?? 'recent');
              resetPage();
            }}
            options={[
              { id: 'recent', name: t('sort.recent') },
              { id: 'amountAsc', name: t('sort.amountAsc') },
              { id: 'amountDesc', name: t('sort.amountDesc') },
              { id: 'timeAsc', name: t('sort.timeAsc') },
              { id: 'timeDesc', name: t('sort.timeDesc') },
            ]}
            className="flex-1 !text-xs min-w-fit "
            variant="minimal"
          />

        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader />
      ) : proposals.length === 0 ? (
        <NoResults mainText={t('noMatching')} additionalText={t('noMatchingDescription')} buttonText={t('showYourJobs')} buttonLink={`/my-jobs`} />
      ) : (
        <div className='space-y-6'>
          {proposals.map(proposal => (
            <ProposalCard key={proposal.id} proposal={proposal} onAcceptClick={openAcceptModal} onRejectClick={handleReject} />
          ))}
        </div>
      )}

      {proposals.length > 0 && (
        <div className='mt-8'>
          <TabsPagination loading={loading} currentPage={pagination.page} totalPages={pagination.pages} onPageChange={page => setPagination(prev => ({ ...prev, page }))}
            onItemsPerPageChange={limit => setPagination(prev => ({ ...prev, limit }))}
            itemsPerPage={pagination.limit} />
        </div>
      )}

      {/* Accept Confirmation Modal */}
      {confirmOpen && (
        <Modal title={t('acceptConfirmTitle')} onClose={() => setConfirmOpen(false)}>
          <p className='text-slate-700'>
            {t.rich('acceptConfirmMessage', {
              strong: (chunk) => <strong className="font-semibold">{chunk}</strong>
            })}
          </p>
          <div className='mt-6 flex justify-end gap-2'>
            <Button name={t('cancel')} color='secondary' onClick={() => setConfirmOpen(false)} className='!px-4 !py-2 text-sm !text-slate-700' disabled={actionLoading} />
            <Button name={t('confirmAccept')} color='green' onClick={confirmAccept} loading={actionLoading} className='!px-4 !py-2 text-sm' icon={<Check className='h-4 w-4' />} />
          </div>
        </Modal>
      )}
    </div>
  );
}
