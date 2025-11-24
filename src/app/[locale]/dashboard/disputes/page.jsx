'use client';

import { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import InputSearch from '@/components/atoms/InputSearch';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';
import Button from '@/components/atoms/Button';
import api from '@/lib/axios';
import { Modal } from '@/components/common/Modal';
import { Eye, Activity, FilePlus, CheckCircle, XCircle, Search, MoreHorizontal, MessageSquare, Send } from 'lucide-react';
import { createPortal } from 'react-dom';
import ActionsMenu from '@/components/common/ActionsMenu';
import Input from '@/components/atoms/Input';;
import { InputRadio } from '@/components/atoms/InputRadio';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { GlassCard } from '@/components/dashboard/Ui';
import Select from '@/components/atoms/Select';
import DisputeStatusPill from '@/components/pages/disputes/DisputeStatusPill';
import Img from '@/components/atoms/Img';
import { DisputeStatus, disputeType } from '@/constants/dispute';
import toast from 'react-hot-toast';
import DisputeChat from '@/components/pages/disputes/DisputeChat';
import { MdOutlineLockOpen } from 'react-icons/md';
import { isErrorAbort } from '@/utils/helper';
import SearchBox from '@/components/common/Filters/SearchBox';
import TruncatedText from '@/components/dashboard/TruncatedText';
import { useTranslations } from 'next-intl';


function UserMini({ user }) {
  const letter = (user?.username?.[0] || '?').toUpperCase();
  const img = user?.profileImage || user?.avatarUrl;
  return (
    <div className='flex items-center gap-2 min-w-[220px]'>
      <div className='h-9 w-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-sm font-semibold'>
        {img ? <Img src={img} alt={user?.username || 'user'} altSrc='/no-user.png' className='h-full w-full object-cover' /> : letter}</div>
      <div className='leading-tight'>
        <h1 className='font-medium text-sm truncate max-w-[160px]'>{user?.username || '—'}</h1>
        <p className='text-xs text-gray-500 truncate max-w-[160px]'>{user?.email || ''}</p>
      </div>
    </div>
  );
}

function Shimmer({ className = '' }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

function nestMessages(list) {
  const map = new Map();
  const arr = (list || []).map(m => ({ ...m, children: [] }));
  arr.forEach(m => map.set(m.id, m));
  const roots = [];
  arr.forEach(m => {
    if (m.parentId && map.has(m.parentId)) map.get(m.parentId).children.push(m);
    else roots.push(m);
  });
  return roots;
}

function MessageNode({ node, onReply, level = 0 }) {
  const { user: me } = useAuth();

  const isMine = node?.sender?.id === me?.id;

  return (
    <div className='space-y-2' style={{ marginLeft: level * 16 }}>
      <div className={`flex gap-3 `}>
        <div className='h-8 w-8 rounded-full bg-gray-200 overflow-hidden grid place-items-center text-xs font-semibold shrink-0'>{(node?.sender?.username?.[0] || 'S').toUpperCase()}</div>
        <div className={`${isMine ? 'bg-emerald-50 ring-emerald-100' : 'bg-slate-50 ring-slate-200'} flex-1 p-1 rounded-lg `}>
          <div className='text-[13px]'>
            <b>{node?.sender?.username || 'System'}</b> <span className='text-gray-500'>• {new Date(node.created_at).toLocaleString()}</span>
          </div>
          <div className='mt-0.5 text-sm whitespace-pre-wrap'>{node.message}</div>
        </div>
      </div>
      {node.children?.length ? node.children.map(c => <MessageNode key={c.id} node={c} onReply={onReply} level={level + 1} />) : null}
    </div>
  );
}
const getTabs = (t) => [
  { label: t('Dashboard.disputes.tabs.all'), value: 'all' },
  { label: t('Dashboard.disputes.tabs.open'), value: DisputeStatus.OPEN },
  { label: t('Dashboard.disputes.tabs.inReview'), value: DisputeStatus.IN_REVIEW },
  { label: t('Dashboard.disputes.tabs.closedNoPayout'), value: DisputeStatus.CLOSED_NO_PAYOUT },
  { label: t('Dashboard.disputes.tabs.resolved'), value: DisputeStatus.RESOLVED },
  { label: t('Dashboard.disputes.tabs.rejected'), value: DisputeStatus.REJECTED },
];

export default function DisputesPage() {
  const t = useTranslations();
  const TABS = getTabs(t);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    total: 9,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });
  function resetPage() {
    setFilters(p => ({ ...p, page: 1 }))
  }

  const [sort, setSort] = useState('newest');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const handleSearch = value => {
    setDebouncedSearch(value);
    setFilters(p => ({ ...p, page: 1 }));
  };
  const [rows, setRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(null);

  const [resNote, setResNote] = useState('');
  const [sellerAmount, setSellerAmount] = useState('');
  const [buyerRefund, setBuyerRefund] = useState('');
  const [closeAs, setCloseAs] = useState('completed');
  const [resError, setResError] = useState('');
  const [resSubmitting, setResSubmitting] = useState(false);

  const [activity, setActivity] = useState(null);
  const [actLoading, setActLoading] = useState(false);
  const [actError, setActError] = useState('');


  const handleTabChange = tab => {
    const v = typeof tab === 'string' ? tab : tab?.value;
    setActiveTab(v);
    resetPage()
  };


  const applySortPreset = opt => {
    const id = opt?.id ?? opt?.target?.value ?? opt;
    if (id === 'newest') { setSort(id); setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'DESC', page: 1 })) }
    else if (id === 'oldest') { setSort(id); setFilters(p => ({ ...p, sortBy: 'created_at', sortOrder: 'ASC', page: 1 })) }
    else return;
  };


  const columns = useMemo(
    () => [
      { key: 'id', label: t('Dashboard.disputes.columns.id'), headerClassName: 'w-[150px]', render: (value) => <TruncatedText text={value?._raw?.id} maxLength={50} /> },
      { key: 'subject', label: t('Dashboard.disputes.columns.subject'), className: 'max-w-[240px] truncate', render: (value) => <TruncatedText text={value?._raw?.subject} maxLength={300} /> },
      { key: 'orderTitle', label: t('Dashboard.disputes.columns.order'), className: 'max-w-[240px] truncate', render: (value) => <TruncatedText text={value?.orderTitle} maxLength={300} /> },
      { key: 'seller', label: t('Dashboard.disputes.columns.owner'), headerClassName: 'w-[260px]', render: row => <UserMini user={row._raw?.order?.seller} /> },
      { key: 'buyer', label: t('Dashboard.disputes.columns.client'), headerClassName: 'w-[260px]', render: row => <UserMini user={row._raw?.order?.buyer} /> },
      {
        key: 'status',
        label: t('Dashboard.disputes.columns.status'),
        status: [
          ['open', 'text-yellow-700'],
          ['in_review', 'text-blue-700'],
          ['resolved', 'text-emerald-700'],
          ['rejected', 'text-rose-700'],
        ],
        headerClassName: 'text-center',
        cellClassName: 'text-center',
      },
      { key: 'raisedBy', label: t('Dashboard.disputes.columns.raisedBy') },
      { key: 'created', label: t('Dashboard.disputes.columns.created') },
    ],
    [t],
  );

  const controllerRef = useRef();
  const fetchDisputes = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (activeTab !== 'all') qs.set('status', activeTab);
      if (debouncedSearch?.trim()) qs.set('search', debouncedSearch?.trim());

      if (filters.page) qs.set('page', filters.page);
      if (filters.limit) qs.set('limit', filters.limit);

      if (filters.sortBy) qs.set('sortBy', filters.sortBy);
      if (filters.sortOrder) qs.set('sortOrder', filters.sortOrder);

      const { data } = await api.get(`/disputes?${qs.toString()}`, { signal: controller.signal });
      const list = (data?.disputes ?? data) || [];
      setFilters(p => ({ ...p, page: data?.pagination?.page, limit: data?.pagination?.limit, total: data?.pagination?.total }))
      setRows(
        list.map(d => ({
          _raw: d,
          id: (d.id || '').slice(0, 8) + '…',
          orderTitle: d?.order?.title || d.orderId || '—',
          seller: d?.order?.seller?.username || d?.order?.sellerId || '—',
          buyer: d?.order?.buyer?.username || d?.order?.buyerId || '—',
          raisedBy: d?.raisedBy?.username || d.raisedById || '—',
          status: d.status || 'open',
          created: d?.created_at ? new Date(d.created_at).toLocaleString() : '',
        })),
      );
    } finally {
      if (controllerRef.current === controller)
        setLoading(false);
    }
  }, [activeTab, debouncedSearch?.trim(), filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const patchRow = (idShort, updater) => {
    setRows(prev => prev.map(r => (r.id === idShort ? updater(r) : r)));
  };
  const setRowLoading = (idShort, val) => setActionLoading(p => ({ ...p, [idShort]: val }));

  const orderControllerRef = useRef();
  async function loadOrder(orderId) {
    if (!orderId) return;

    // Abort previous request
    if (orderControllerRef.current) {
      orderControllerRef.current.abort();
    }

    const controller = new AbortController();
    orderControllerRef.current = controller;

    setOrderDetailLoading(true);
    try {
      const { data } = await api.get(`/orders/${orderId}`, {
        signal: controller.signal
      });

      setOrderDetail(data);
      const inv = data?.invoices?.[0];
      const subtotal = Number(inv?.subtotal || 0);
      setSellerAmount(String(subtotal));
      setBuyerRefund('0');
      setCloseAs('completed');
    } catch (e) {
      if (!isErrorAbort(e))
        setOrderDetail(null);
    }
    finally {
      if (orderControllerRef.current === controller) {
        setOrderDetailLoading(false);
      }
    }
  }

  function openDetails(row) {
    setSelected(row);
    setDetailsOpen(true);
    setOrderDetail(null);
    const orderId = row?._raw?.orderId || row?._raw?.order?.id;
    if (orderId) loadOrder(orderId);
  }

  function openResolution(row) {
    setSelected(row);
    setResolutionOpen(true);
    setResNote('');
    setResError('');
    setOrderDetail(null);
    setResSubmitting(false);
    const orderId = row?._raw?.orderId || row?._raw?.order?.id;
    if (orderId) loadOrder(orderId);
  }

  function closeAllModals() {
    if (resSubmitting) return;
    setDetailsOpen(false);
    setResolutionOpen(false);
    setActivityOpen(false);
    setSelected(null);
    setOrderDetail(null);
    setResNote('');
    setResError('');
    setSellerAmount('');
    setBuyerRefund('');
    setActivity(null);
    setActError('');
  }

  async function setStatus(row, status) {
    const toastId = toast.loading(t('Dashboard.disputes.toast.updatingStatus', { status }));
    setRowLoading(row.id, status);
    try {
      const res = await api.put(`/disputes/${row._raw.id}/status`, { status });
      if (res?.status >= 200 && res?.status < 300) {
        toast.success(t('Dashboard.disputes.toast.statusUpdated', { status }), { id: toastId });
        patchRow(row.id, r => ({ ...r, status, _raw: { ...r._raw, status } }));
      }
    } catch (e) {
      toast.error(
        e?.response?.data?.message || t('Dashboard.disputes.toast.statusUpdateFailed', { status }),
        { id: toastId }
      );
    }
    finally {
      setRowLoading(row.id, null);
    }
  }

  function markInReview(row) {
    return setStatus(row, DisputeStatus.IN_REVIEW);
  }

  async function submitProposalOnly() {
    if (!selected) return;
    const inv = orderDetail?.invoices?.[0];
    const subtotal = Number(inv?.subtotal || 0);
    const sAmt = Number(sellerAmount || 0);
    const bRef = Number(buyerRefund || 0);
    if (!inv) return setResError(t('Dashboard.disputes.modals.noInvoice'));
    if (sAmt < 0 || bRef < 0) return setResError(t('Dashboard.disputes.modals.amountsMustBePositive'));
    if (Number((sAmt + bRef).toFixed(2)) !== Number(subtotal.toFixed(2))) {
      return setResError(t('Dashboard.disputes.modals.amountsMustEqual', { subtotal }));
    }
    setResSubmitting(true);
    setResError('');
    try {
      const resolution = JSON.stringify({ sellerAmount: sAmt, buyerRefund: bRef, note: resNote || '' });
      const res = await api.put(`/disputes/${selected._raw.id}/resolution`, { resolution });
      if (res?.status >= 200 && res?.status < 300) {
        patchRow(selected.id, r => ({
          ...r,
          status: DisputeStatus.IN_REVIEW,
          _raw: { ...r._raw, status: DisputeStatus.IN_REVIEW, resolution },
        }));
        closeAllModals();
      }
    } catch (e) {
      setResError(e?.response?.data?.message || t('Dashboard.disputes.modals.failedToSave'));
    } finally {
      setResSubmitting(false);
    }
  }

  async function resolveAndPayoutNow() {
    if (!selected) return;
    const inv = orderDetail?.invoices?.[0];
    const subtotal = Number(inv?.subtotal || 0);
    const sAmt = Number(sellerAmount || 0);
    const bRef = Number(buyerRefund || 0);
    if (!inv || subtotal <= 0) return setResError(t('Dashboard.disputes.modals.cannotPayout'));
    if (sAmt < 0 || bRef < 0) return setResError(t('Dashboard.disputes.modals.amountsMustBePositive'));
    if (Number((sAmt + bRef).toFixed(2)) !== Number(subtotal.toFixed(2))) {
      return setResError(t('Dashboard.disputes.modals.amountsMustEqual', { subtotal }));
    }

    setResSubmitting(true);
    setResError('');
    try {
      const payload = { sellerAmount: sAmt, buyerRefund: bRef, note: resNote || '', closeAs };
      const res = await api.post(`/disputes/${selected._raw.id}/resolve-payout`, payload);
      if (res?.status >= 200 && res?.status < 300) {
        patchRow(selected.id, r => ({
          ...r,
          status: DisputeStatus.RESOLVED,
          _raw: { ...r._raw, status: DisputeStatus.RESOLVED, resolution: JSON.stringify(payload) },
        }));
        closeAllModals();
      }

      toast.success(t('Dashboard.disputes.toast.resolvedPayout'));
    } catch (e) {
      const msg = e?.response?.data?.message || t('Dashboard.disputes.toast.resolvePayoutFailed');
      setResError(msg);
      toast.error(msg)
    } finally {
      setResSubmitting(false);
    }
  }

  async function openActivity(row) {
    setSelected(row);
    setActivityOpen(true);
    setActivity(null);
    setActError('');
    await fetchActivity(row?._raw?.id);
  }

  const activityControllerRef = useRef(null);

  async function fetchActivity(disputeId) {
    if (!disputeId) return;

    // abort previous request
    if (activityControllerRef.current) {
      activityControllerRef.current.abort();
    }

    const controller = new AbortController();
    activityControllerRef.current = controller;
    setActLoading(true);
    setActError('');
    try {
      const { data } = await api.get(`/disputes/${disputeId}/activity`, { signal: controller.signal });

      // Only update state if this request is still active
      if (activityControllerRef.current === controller) {
        setActivity(data);
      }
    } catch (e) {
      if (!isErrorAbort(e) && e?.response?.status === 404) {
        try {
          const { data: d2 } = await api.get(`/disputes/${disputeId}`, { signal: controller.signal });
          if (activityControllerRef.current === controller)
            setActivity({
              dispute: d2,
              order: d2?.order || null,
              invoice: null,
              messages: [],
              events: [{ type: 'opened', at: d2?.created_at, by: d2?.raisedBy?.username || d2?.raisedById }],
            });
        } catch (e2) {
          if (!isErrorAbort(e2)) {

            setActError(e2?.response?.data?.message || t('Dashboard.disputes.modals.failedToLoad'));
            setActivity(null);
          }
        }
      } else {
        if (controllerRef.current === controller) {

          setActError(e?.response?.data?.message || t('Dashboard.disputes.modals.failedToLoad'));
          setActivity(null);
        }
      }
    } finally {
      if (controllerRef.current === controller)
        setActLoading(false);
    }
  }


  const renderActions = row => {
    const busy = !!actionLoading[row.id];
    const s = row.status;

    const canPropose = [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW].includes(s);

    const options = [
      { icon: <Eye className='h-4 w-4' />, label: t('Dashboard.disputes.actions.view'), onClick: () => openDetails(row), disabled: busy },
      { icon: <Activity className='h-4 w-4' />, label: t('Dashboard.disputes.actions.activity'), onClick: () => openActivity(row), disabled: busy },
      { icon: <FilePlus className='h-4 w-4' />, label: t('Dashboard.disputes.actions.propose'), onClick: () => openResolution(row), disabled: busy, hide: !canPropose },
      { icon: <MdOutlineLockOpen className='h-4 w-4' />, label: t('Dashboard.disputes.actions.openAgain'), onClick: () => setStatus(row, DisputeStatus.OPEN), disabled: busy, hide: s === DisputeStatus.OPEN },
      { icon: <Search className='h-4 w-4' />, label: t('Dashboard.disputes.actions.markInReview'), onClick: () => setStatus(row, DisputeStatus.IN_REVIEW), disabled: busy, hide: s === DisputeStatus.IN_REVIEW },
      { icon: <CheckCircle className='h-4 w-4' />, label: busy ? t('Dashboard.disputes.actions.closing') : t('Dashboard.disputes.actions.closeOrder'), onClick: () => setStatus(row, DisputeStatus.CLOSED_NO_PAYOUT), disabled: busy, hide: !canPropose },
      { icon: <XCircle className='h-4 w-4' />, label: busy ? t('Dashboard.disputes.actions.rejecting') : t('Dashboard.disputes.actions.reject'), onClick: () => setStatus(row, DisputeStatus.REJECTED), disabled: busy, danger: true, hide: !canPropose },
    ];

    return <ActionsMenu options={options} align='right' />;
  };


  const inv = orderDetail?.invoices?.[0];
  const subtotal = Number(inv?.subtotal || 0);
  const serviceFee = Number(inv?.serviceFee || 0);
  const total = Number(inv?.totalAmount || 0);
  const currency = 'SAR';

  const threaded = useMemo(() => nestMessages(activity?.messages || []), [activity]);

  const scrollRef = useRef(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // wait for layout/paint so heights are correct
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [threaded]);

  const isDisputeClosed = activity?.dispute?.status === DisputeStatus.REJECTED || activity?.dispute?.status === DisputeStatus.RESOLVED; isDisputeClosed
  return (
    <div>

      <GlassCard gradient='from-green-400 via-emerald-400 to-teal-400' className='mb-6 !overflow-visible'>
        <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
          <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={handleTabChange} />
          <div className='flex flex-wrap items-center gap-3'>
            <SearchBox placeholder={t('Dashboard.disputes.searchPlaceholder')} onSearch={handleSearch} />
            <Select
              className='!w-fit'
              onChange={applySortPreset}
              placeholder={t('Dashboard.disputes.orderBy')}
              value={sort}
              options={[
                { id: 'newest', name: t('Dashboard.disputes.sortOptions.newest') },
                { id: 'oldest', name: t('Dashboard.disputes.sortOptions.oldest') },
              ]}
            />
          </div>
        </div>
      </GlassCard>
      <Table
        loading={loading}
        data={rows}
        columns={columns}
        actions={renderActions}
        rowsPerPage={filters.limit}
        page={filters.page}
        totalCount={filters.total}
        onPageChange={p => setFilters(prev => ({ ...prev, page: p }))}
      />

      {/* Details Modal */}
      {detailsOpen && (
        <Modal title={t('Dashboard.disputes.modals.detailsTitle')} onClose={closeAllModals}>
          <div className="space-y-4">
            {/* Dispute Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Info label={t('Dashboard.disputes.modals.order')} value={selected?._raw?.order?.title || selected?._raw?.orderId} />
              <Info label={t('Dashboard.disputes.modals.raisedBy')} value={selected?._raw?.raisedBy?.username || selected?._raw?.raisedById} />
              <Info label={t('Dashboard.disputes.modals.subject')} value={selected?._raw?.subject} />
              <Info
                label={t('Dashboard.disputes.modals.type')}
                value={
                  disputeType.find((type) => type.id === selected?._raw?.type)?.name ?? '—'
                }
              />

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">{t('Dashboard.disputes.modals.status')}:</span>
                <DisputeStatusPill status={selected?._raw?.status} />
              </div>
            </div>
            <Info label={t('Dashboard.disputes.modals.reason')} value={selected?._raw?.reason} />

            {/* Invoice Section */}
            <div className="rounded-lg border border-gray-200 p-3">
              <h4 className="font-medium mb-2">{t('Dashboard.disputes.modals.invoice')}</h4>
              {orderDetailLoading ? (
                <div className="space-y-2">
                  <Shimmer className="h-4 w-32" />
                  <Shimmer className="h-4 w-24" />
                  <Shimmer className="h-4 w-40" />
                </div>
              ) : inv ? (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>{t('Dashboard.disputes.modals.subtotal')}</span>
                    <span>{subtotal.toFixed(2)} {currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('Dashboard.disputes.modals.serviceFee')}</span>
                    <span>{serviceFee.toFixed(2)} {currency}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>{t('Dashboard.disputes.modals.total')}</span>
                    <span>{total.toFixed(2)} {currency}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t('Dashboard.disputes.modals.noInvoice')}</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Resolution Modal */}
      {resolutionOpen && (
        <Modal title={t('Dashboard.disputes.modals.proposeTitle')} onClose={closeAllModals}>
          <div className='space-y-4'>
            <div className='rounded-lg border border-gray-200 p-3'>
              <h4 className='font-medium mb-2'>{t('Dashboard.disputes.modals.order')}</h4>
              <div className='text-sm text-gray-700'>{selected?._raw?.order?.title || selected?._raw?.orderId}</div>
            </div>

            <div className='rounded-lg border border-gray-200 p-3'>
              <h4 className='font-medium mb-2'>{t('Dashboard.disputes.modals.invoice')}</h4>
              {!orderDetail ? (
                <div className='space-y-2'>
                  <Shimmer className='h-4 w-32' />
                  <Shimmer className='h-4 w-24' />
                  <Shimmer className='h-4 w-40' />
                </div>
              ) : inv ? (
                <div className='text-sm'>
                  <div className='flex justify-between'>
                    <span>{t('Dashboard.disputes.modals.subtotalEscrow')}</span>
                    <span className='font-medium'>
                      {subtotal.toFixed(2)} {currency}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>{t('Dashboard.disputes.modals.serviceFeePlatform')}</span>
                    <span>
                      {serviceFee.toFixed(2)} {currency}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>{t('Dashboard.disputes.modals.total')}</span>
                    <span>
                      {total.toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              ) : (
                <p className='text-sm text-gray-500'>{t('Dashboard.disputes.modals.noInvoice')}</p>
              )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <Field label={t('Dashboard.disputes.modals.sellerAmount')}>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={sellerAmount}
                  onChange={e => {
                    const val = Number(e.target.value);
                    const safeVal = isNaN(val) || val < 0 ? 0 : val;
                    setSellerAmount(safeVal);
                    setBuyerRefund(Math.max(0, Number((subtotal - safeVal).toFixed(2))));
                  }}
                />
              </Field>

              <Field label={t('Dashboard.disputes.modals.buyerRefund')}>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={buyerRefund}
                  onChange={e => {
                    const val = Number(e.target.value);
                    const safeVal = isNaN(val) || val < 0 ? 0 : val;
                    setBuyerRefund(safeVal);
                    setSellerAmount(Math.max(0, Number((subtotal - safeVal).toFixed(2))));
                  }}
                />
              </Field>

            </div>

            <div className='rounded-lg border border-gray-200 p-3'>
              <div className='text-sm text-gray-700 mb-2'>{t('Dashboard.disputes.modals.closeOrderAs')}</div>
              <div className='flex items-center gap-4'>
                <InputRadio name='closeAs' value='completed' label={t('Dashboard.disputes.modals.completed')} checked={closeAs === 'completed'} onChange={setCloseAs} />
                <InputRadio name='closeAs' value='cancelled' label={t('Dashboard.disputes.modals.cancelled')} checked={closeAs === 'cancelled'} onChange={setCloseAs} />
              </div>
            </div>
            {resError ? <div className='rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'>{resError}</div> : null}

            <div className='flex items-center justify-end gap-2'>
              <Button name={resSubmitting ? t('Dashboard.disputes.modals.processing') : t('Dashboard.disputes.modals.resolvePayout')} onClick={resolveAndPayoutNow} className={`rounded-lg px-4 py-2 text-white ${resSubmitting ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`} loading={resSubmitting || !orderDetail} />
            </div>
          </div>
        </Modal>
      )}

      {/* Activity & Thread Modal */}
      {activityOpen && (
        <Modal className={'!max-w-[700px] w-full '} title={t('Dashboard.disputes.modals.activityTitle')} onClose={closeAllModals}>
          <div className='space-y-4'>
            {actLoading ? (
              <div className='space-y-3'>
                <Shimmer className='h-5 w-40' />
                <Shimmer className='h-4 w-2/3' />
                <Shimmer className='h-32 w-full' />
              </div>
            ) : actError ? (
              <div className='rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'>{actError}</div>
            ) : activity ? (
              <>
                <DisputeChat detail={activity} selectedId={activity?.dispute?.id} setDetail={setActivity} />

              </>
            ) : null}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className='text-sm'>
      <div className='text-gray-500'>{label}</div>
      <div className='font-medium text-gray-900'>{value ?? '—'}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className='block'>
      <span className='text-sm font-medium text-gray-700'>{label}</span>
      <div className='mt-1'>{children}</div>
    </label>
  );
}


