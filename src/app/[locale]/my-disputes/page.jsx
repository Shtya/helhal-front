'use client';

import { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import { Modal } from '@/components/common/Modal';
import api from '@/lib/axios';
import { MessageSquare, RefreshCw, Reply, ArrowDown, Send, Search } from 'lucide-react';
import NoResults from '@/components/common/NoResults';
import { Notification } from '@/config/Notification';
import { useAuth } from '@/context/AuthContext';
import Img from '@/components/atoms/Img';
import { Link, usePathname } from '@/i18n/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import TabsPagination from '@/components/common/TabsPagination';
import { MdInfoOutline } from "react-icons/md";
import { useSearchParams } from 'next/navigation';
import { initialsFromName, isErrorAbort, updateUrlParams } from '@/utils/helper';
import { DisputeStatus, disputeType } from '@/constants/dispute';
import DisputeStatusPill from '@/components/pages/disputes/DisputeStatusPill';
import DisputeChat from '@/components/pages/disputes/DisputeChat';
import { useLocale, useTranslations } from 'next-intl';



const tabAnimation = {
  initial: { opacity: 0, y: 8, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
  exit: { opacity: 0, y: -6, scale: 0.985, transition: { duration: 0.18 } },
};


function UserChip({ user }) {
  if (!user) return <span className='text-gray-500'>—</span>;
  const letters = initialsFromName(user?.username) || '?';
  return (
    <div className='flex items-center gap-2 min-w-0'>
      <div className='h-7 w-7 rounded-full bg-gray-200 overflow-hidden grid place-items-center text-[11px] font-semibold shrink-0'>{user?.profileImage ?
        <Img src={user.profileImage} alt={user.username || 'user'} altSrc='/no-user.png' className='h-full w-full object-cover' /> : letters}</div>
      <div className='leading-tight min-w-0'>
        <Link href={`profile/${user?.id}`} className='text-xs font-medium truncate hover:underline'>{user?.username || '—'}</Link>
        <div className='text-[11px] text-gray-500 truncate'>{user?.email || ''}</div>
      </div>
    </div>
  );
}

function Shimmer({ className = '' }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}
function ShimmerListItem() {
  return (
    <div className='p-4'>
      <div className='flex items-center justify-between'>
        <Shimmer className='h-4 w-2/3' />
        <Shimmer className='h-5 w-20 rounded-full' />
      </div>
      <Shimmer className='mt-2 h-3 w-3/5' />
      <Shimmer className='mt-2 h-3 w-4/5' />
    </div>
  );
}



export default function MyDisputesPage() {
  const t = useTranslations('MyDisputes');
  const { user: me, role } = useAuth();
  const isBuyer = role === 'buyer'


  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  function handlePageChange(page) {
    setPagination(prev => ({ ...prev, page }))
  }

  const [search, setSearch] = useState('');
  const { debouncedValue: debounced } = useDebounce({ value: search, onDebounce: () => handlePageChange(1) });

  const [disputes, setDisputes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [selectedId, setSelectedId] = useState(searchParams.get("dispute") || null);

  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(!!searchParams.get("dispute"));
  const [errDetail, setErrDetail] = useState('');

  const [resModalOpen, setResModalOpen] = useState(false);

  const parsedResolution = useMemo(() => {
    const r = detail?.dispute?.resolution;
    const resolutionApplyed = detail?.dispute?.resolutionApplied;
    if (!resolutionApplyed || !r) return null;

    if (typeof r !== 'string') return r;
    try {
      return JSON.parse(r);
    } catch {
      return r;
    }
  }, [detail]);

  const locale = useLocale()
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedId) params.set('dispute', selectedId); else params.delete('dispute');
    updateUrlParams(pathname, params, locale);
  }, [selectedId]);

  const controllerRef = useRef();

  const fetchList = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoadingList(true);
    try {
      const params = {
        search: debounced?.trim(),
        limit: pagination.limit,
        page: pagination.page
      }
      const { data } = await api.get('/disputes/my-disputes', {
        params,
        signal: controller.signal
      });
      const list = data?.disputes || [];
      setDisputes(list);

      if (!selectedId && list.length > 0) {
        setSelectedId(list[0]?.id);
      }

      setPagination(prev => ({ ...prev, pages: data?.pagination.pages }))
    } catch {
      setDisputes([]);
    } finally {
      setLoadingList(false);
    }
  }, [debounced?.trim(), pagination.limit, pagination.page]);


  const detailsControllerRef = useRef(null);

  const fetchDetail = useCallback(async disputeId => {
    if (!disputeId) return;

    // Abort previous request
    if (detailsControllerRef.current) {
      detailsControllerRef.current.abort();
    }

    const controller = new AbortController();
    detailsControllerRef.current = controller;

    setLoadingDetail(true);
    setErrDetail('');

    try {
      const { data } = await api.get(
        `/disputes/${disputeId}/activity`,
        { signal: controller.signal }
      );

      // Only update state if still the active request
      if (detailsControllerRef.current === controller) {
        setDetail(data);
      }

    } catch (e) {
      if (isErrorAbort(e)) return; // ignore abort silently

      // -------- 404 fallback --------
      if (e?.response?.status === 404) {
        try {
          const { data: d2 } = await api.get(
            `/disputes/${disputeId}`,
            { signal: controller.signal }
          );

          if (detailsControllerRef.current === controller) {
            setDetail({
              dispute: d2,
              order: d2?.order || null,
              invoice: null,
              messages: [],
              events: [{
                type: 'opened',
                at: d2?.created_at,
                by: d2?.raisedBy?.username || d2?.raisedById
              }]
            });
          }

        } catch (e2) {
          if (!isErrorAbort(e2) && detailsControllerRef.current === controller) {
            setErrDetail(e2?.response?.data?.message || t('errors.unableToLoad'));
            setDetail(null);
          }
        }

      } else {
        // ---------- normal error ----------
        if (detailsControllerRef.current === controller) {
          setErrDetail(e?.response?.data?.message || t('errors.failedToLoad'));
          setDetail(null);
        }
      }

    } finally {
      // Only stop loading if this request is still active
      if (detailsControllerRef.current === controller) {
        setLoadingDetail(false);
      }
    }

  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
  }, [selectedId, fetchDetail]);


  const isNotFound = useMemo(() => {
    if (!errDetail) return false;
    return /(^|\b)(404|not\s*found|doesn'?t exist|missing|gone)(\b|$)/i.test(String(errDetail));
  }, [errDetail]);

  const mapNames = {
    sellerAmount: t('resolution.sellerAmount'),
    buyerRefund: t('resolution.buyerRefund'),
    note: t('resolution.note'),
    decidedBy: t('resolution.decidedBy'),
  };

  return (
    <div className='container !my-6 flex-1 min-h-0 flex flex-col'>
      {/* Page header */}
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl sm:text-3xl font-bold'>{t('title')}</h1>
          {!!disputes?.length && (
            <span className='text-xs px-2 py-0.5 rounded-full ring-1 ring-gray-200 bg-gray-50 text-gray-600'>
              {disputes.length} / {disputes.length}
            </span>
          )}
        </div>
      </div>

      <div className='mt-3 flex flex-col lg:flex-row gap-6 flex-1 min-h-0 '>
        <aside className='w-full  lg:w-[400px] min-h-0'>
          <div className='rounded-2xl border border-slate-200 bg-white flex-1 h-full lg:h-dvh max-h-dvh flex flex-col sticky top-[100px]'>
            {/* List header with search */}
            <div className='p-3 border-b border-gray-100 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-t-2xl'>
              <div className='relative'>
                <Input cnInput="search-disputes" name='search-disputes' placeholder={t('searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
                <Search className='h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
              </div>
            </div>

            <div className='h-full overflow-y-auto'>
              {loadingList ? (
                <div className='divide-y divide-gray-100'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ShimmerListItem key={i} />
                  ))}
                </div>
              ) : disputes.length ? (
                <ul className='divide-y divide-gray-100 overflow-y-auto h-full '>
                  {disputes.map(d => {
                    const isActive = selectedId === d.id;
                    return (
                      <li key={d.id} className={`p-4 cursor-pointer group transition ${isActive ? 'bg-main-50/40' : 'bg-white'} hover:bg-main-50/30`} onClick={() => {
                        setSelectedId(d?.id);
                      }}>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <div className='font-medium text-sm truncate text-slate-900'>{d?.subject || d.orderId}</div>
                            <div className='mt-0.5 text-[11px] text-slate-500 truncate'>
                              #{(d.id || '').slice(0, 8)} · Opened {new Date(d.created_at).toLocaleString()}
                            </div>
                          </div>
                          <DisputeStatusPill status={d.status} />
                        </div>
                        {d.reason ? <div className='mt-2 text-[12px] text-slate-700 line-clamp-2'>{d.reason}</div> : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className='p-8 text-center'>
                  <div className='mx-auto h-12 w-12 rounded-xl bg-main-50 ring-1 ring-main-100 flex items-center justify-center'>
                    <MessageSquare className='h-6 w-6 text-main-600' />
                  </div>
                  <h3 className='mt-3 text-sm font-semibold text-gray-800'>{t('noDisputes')}</h3>
                  <p className='mt-1 text-xs text-gray-500'>{t('noDisputesDesc')}</p>
                </div>
              )}
            </div>
            <div className='p-4'>

              <TabsPagination loading={loadingList} recordsCount={disputes.length} currentPage={pagination.page} totalPages={pagination.pages} onPageChange={handlePageChange} className="max-md:flex-1" />
            </div>
          </div>
        </aside>

        {/* Right detail */}
        <main className='flex-1 rounded-2xl min-h-0 overflow-y-auto flex flex-col border border-gray-200'>
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center gap-4 p-10 text-gray-500 rounded-2xl text-center">
              <MdInfoOutline className="text-4xl text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-600">{t('noDisputeSelected')}</h2>
              <p className="text-sm text-gray-500 max-w-md">
                {t('noDisputeSelectedDesc')}
              </p>
            </div>

          ) : loadingDetail ? (
            <div className='rounded-2xl -200 p-4 space-y-3 bg-white'>
              <Shimmer className='h-5 w-48' />
              <Shimmer className='h-5 w-52' />
              <Shimmer className='h-4 w-2/3' />
              <Shimmer className='h-24 w-full' />
              <Shimmer className='h-32 w-full' />
              <Shimmer className='h-64 w-full' />
            </div>
          ) : isNotFound || (!errDetail && !detail) ? (
            <NoResults mainText={t('notFound')} additionalText={t('notFoundDesc')} />
          ) : errDetail ? (
            <div className='m-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm'>{errDetail}</div>
          ) : detail ? (
            <AnimatePresence mode='wait'>
              <motion.div key={detail?.dispute?.id} {...tabAnimation} className='flex flex-col min-h-0'>
                {/* Summary */}
                <div className="space-y-4">

                  <div className="rounded-2xl p-4 bg-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      {/* Left Info Block */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">{t('order')}</div>
                          <div className="text-base font-semibold text-slate-900 truncate">
                            {detail?.order?.title || detail?.dispute?.orderId}
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-3 text-xs">
                          {isBuyer ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-gray-500 shrink-0">{t('freelancer')}</span>
                              <UserChip user={detail?.order?.seller} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-gray-500 shrink-0">{t('client')}</span>
                              <UserChip user={detail?.order?.buyer} />
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{t('status')}</span>
                            <DisputeStatusPill status={detail?.dispute?.status} />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 block text-xs">{t('raisedBy')}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {detail?.dispute?.raisedBy?.id === me?.id ? (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-main-100 text-main-700">{t('you')}</span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">{t('otherParty')}</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-500">{t('opened')}</span>{' '}
                            {detail?.dispute?.created_at
                              ? new Date(detail.dispute.created_at).toLocaleString()
                              : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-nowrap items-center gap-2">
                        {parsedResolution && (
                          <Button
                            name={t('viewResolution')}
                            className="!w-full sm:!w-auto"
                            color="outline"
                            onClick={() => setResModalOpen(true)}
                          />
                        )}
                        <Button
                          color="outline"
                          className="!w-full sm:!w-auto h-[36px] md:!h-[40px]"
                          onClick={() => fetchDetail(detail?.dispute?.id)}
                          icon={<RefreshCw className="h-4 w-4" />}
                        />
                      </div>
                    </div>


                    {/* Dispute details */}
                    <div className="mt-4 border-t border-gray-100 pt-4 space-y-3 text-sm">
                      <div>
                        <span className="text-gray-500 block text-xs">{t('subject')}</span>
                        <div className="font-medium text-slate-900">
                          {detail?.dispute?.subject || '—'}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 block text-xs">{t('type')}</span>
                        <div className="font-medium text-slate-900">
                          {(() => {
                            const found = disputeType.find(t => t.id === detail?.dispute?.type);
                            return found ? found.name : detail?.dispute?.type || '—';
                          })()}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-500 block text-xs">{t('reason')}</span>
                        <div className="text-slate-800 whitespace-pre-line">
                          {detail?.dispute?.reason || '—'}
                        </div>
                      </div>

                    </div>

                    {/* Invoice if exists */}
                    {detail?.invoice ? (
                      <div className="relative rounded-2xl mt-4 border border-gray-200 p-4 bg-slate-50">
                        <div className="text-sm font-semibold mb-2">{t('invoice')}</div>
                        <div className="text-sm flex items-center justify-between">
                          <span>{t('subtotal')}</span>
                          <span>{Number(detail.invoice.subtotal).toFixed(2)} SAR</span>
                        </div>
                        <div className="text-sm flex items-center justify-between">
                          <span>{t('serviceFee')}</span>
                          <span>{Number(detail.invoice.platformPercent).toFixed(2)} SAR</span>
                        </div>
                        <div className="text-sm flex items-center justify-between font-semibold">
                          <span>{t('total')}</span>
                          <span>{Number(detail.invoice.totalAmount).toFixed(2)} SAR</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>


                {/* Thread area */}
                <DisputeChat detail={detail} selectedId={selectedId} setDetail={setDetail} />
              </motion.div>
            </AnimatePresence>
          ) : null}
        </main>
      </div>

      {/* Resolution Modal */}
      {resModalOpen && (
        <Modal title={t('proposedResolution')} onClose={() => setResModalOpen(false)}>
          <div className='space-y-3'>
            <div className='rounded-md bg-main-50 border border-main-200 p-3 text-sm'>
              <div className='text-[13px] space-y-1'>
                {(() => {
                  const r = detail?.dispute?.resolution;
                  if (!r) return <div>—</div>;

                  let parsed = r;
                  if (typeof r === 'string') {
                    try {
                      parsed = JSON.parse(r);
                    } catch {
                      return <div>{r}</div>; // if plain string, show directly
                    }
                  }

                  // if parsed is object → show key/value
                  if (typeof parsed === 'object' && parsed !== null) {
                    return Object.entries(parsed).map(([key, value]) =>
                      value ? (
                        <div key={key} className='flex justify-between gap-4 pb-2'>
                          <span className='font-medium text-base text-main-800 capitalize'>{mapNames[key] || key}</span>
                          <span className='text-gray-700 text-base'>{String(value)}</span>
                        </div>
                      ) : null,
                    );
                  }

                  // fallback (string, number, etc.)
                  return <div>{String(parsed)}</div>;
                })()}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
