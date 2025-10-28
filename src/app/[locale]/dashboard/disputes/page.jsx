'use client';

import { useEffect, useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import InputSearch from '@/components/atoms/InputSearch';
import Tabs from '@/components/common/Tabs';
import Table from '@/components/common/Table';
import Button from '@/components/atoms/Button';
import DashboardLayout from '@/components/dashboard/Layout';
import api from '@/lib/axios';
import { Modal } from '@/components/common/Modal';
import { Eye, Activity, FilePlus, CheckCircle, XCircle, Search, MoreHorizontal, MessageSquare, Send } from 'lucide-react';
import { createPortal } from 'react-dom';
import ActionsMenu from '@/components/common/ActionsMenu';
import Input from '@/components/atoms/Input';;
import { InputRadio } from '@/components/atoms/InputRadio';
import { useValues } from '@/context/GlobalContext';
const DisputeStatus = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

function UserMini({ user }) {
  const letter = (user?.username?.[0] || '?').toUpperCase();
  const img = user?.profileImage || user?.avatarUrl;
  return (
    <div className='flex items-center gap-2 min-w-[220px]'>
      <div className='h-9 w-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-sm font-semibold'>{img ? <img src={img} alt={user?.username || 'user'} className='h-full w-full object-cover' /> : letter}</div>
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
  const { user } = useValues();

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

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: DisputeStatus.OPEN },
  { label: 'In review', value: DisputeStatus.IN_REVIEW },
  { label: 'Resolved', value: DisputeStatus.RESOLVED },
  { label: 'Rejected', value: DisputeStatus.REJECTED },
];

export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);

  const [resNote, setResNote] = useState('');
  const [sellerAmount, setSellerAmount] = useState('');
  const [buyerRefund, setBuyerRefund] = useState('');
  const [closeAs, setCloseAs] = useState('completed');
  const [resError, setResError] = useState('');
  const [resSubmitting, setResSubmitting] = useState(false);

  const [activity, setActivity] = useState(null);
  const [actLoading, setActLoading] = useState(false);
  const [actError, setActError] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [actMsg, setActMsg] = useState('');
  const [sending, setSending] = useState(false);

  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID', headerClassName: 'w-[110px]' },
      { key: 'orderTitle', label: 'Order', className: 'max-w-[240px] truncate' },
      { key: 'seller', label: 'Owner', headerClassName: 'w-[260px]', render: row => <UserMini user={row._raw?.order?.seller} /> },
      { key: 'buyer', label: 'Client', headerClassName: 'w-[260px]', render: row => <UserMini user={row._raw?.order?.buyer} /> },
      {
        key: 'status',
        label: 'Status',
        status: [
          ['open', 'text-yellow-700'],
          ['in_review', 'text-blue-700'],
          ['resolved', 'text-emerald-700'],
          ['rejected', 'text-rose-700'],
        ],
        headerClassName: 'text-center',
        cellClassName: 'text-center',
      },
      { key: 'raisedBy', label: 'Raised by' },
      { key: 'created', label: 'Created' },
    ],
    [],
  );

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (activeTab !== 'all') qs.set('status', activeTab);
      const { data } = await api.get(`/disputes?${qs.toString()}`);
      const list = (data?.disputes ?? data) || [];
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
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const patchRow = (idShort, updater) => {
    setRows(prev => prev.map(r => (r.id === idShort ? updater(r) : r)));
  };
  const setRowLoading = (idShort, val) => setActionLoading(p => ({ ...p, [idShort]: val }));

  async function loadOrder(orderId) {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrderDetail(data);
      const inv = data?.invoices?.[0];
      const subtotal = Number(inv?.subtotal || 0);
      setSellerAmount(String(subtotal));
      setBuyerRefund('0');
      setCloseAs('completed');
    } catch (e) {
      setOrderDetail(null);
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
    setReplyTo(null);
    setActMsg('');
  }

  async function setStatus(row, status) {
    setRowLoading(row.id, status);
    try {
      const res = await api.put(`/disputes/${row._raw.id}/status`, { status });
      if (res?.status >= 200 && res?.status < 300) {
        patchRow(row.id, r => ({ ...r, status, _raw: { ...r._raw, status } }));
      }
    } finally {
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
    if (!inv) return setResError('No invoice found for this order.');
    if (sAmt < 0 || bRef < 0) return setResError('Amounts must be ≥ 0.');
    if (Number((sAmt + bRef).toFixed(2)) !== Number(subtotal.toFixed(2))) {
      return setResError(`Seller + Buyer refund must equal subtotal (${subtotal}).`);
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
      setResError(e?.response?.data?.message || 'Failed to save resolution.');
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
    if (!inv || subtotal <= 0) return setResError('Cannot payout: missing invoice or zero subtotal.');
    if (sAmt < 0 || bRef < 0) return setResError('Amounts must be ≥ 0.');
    if (Number((sAmt + bRef).toFixed(2)) !== Number(subtotal.toFixed(2))) {
      return setResError(`Seller + Buyer refund must equal subtotal (${subtotal}).`);
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
    } catch (e) {
      setResError(e?.response?.data?.message || 'Resolve & payout failed.');
    } finally {
      setResSubmitting(false);
    }
  }

  async function openActivity(row) {
    setSelected(row);
    setActivityOpen(true);
    setActivity(null);
    setActError('');
    setReplyTo(null);
    setActMsg('');
    await fetchActivity(row?._raw?.id);
  }

  async function fetchActivity(disputeId) {
    if (!disputeId) return;
    setActLoading(true);
    setActError('');
    try {
      const { data } = await api.get(`/disputes/${disputeId}/activity`);

      const parsed = (() => {
        const r = data?.dispute?.resolution;
        if (!r) return null;
        if (typeof r !== 'string')
          try {
            return JSON.parse(r);
          } catch {
            return r;
          }
        try {
          return JSON.parse(r);
        } catch {
          return r;
        }
      })();
      if (parsed) {
        const sysMsg = {
          id: `sys-resolution-${data?.dispute?.id}`,
          parentId: null,
          system: true,
          sender: { id: 'system', username: 'System' },
          message: typeof parsed === 'string' ? `Proposed resolution: ${parsed}` : `Proposed resolution → Seller: ${parsed.sellerAmount} • Buyer refund: ${parsed.buyerRefund}${parsed.note ? ` • Note: ${parsed.note}` : ''}`,
          created_at: data?.dispute?.updated_at || data?.dispute?.created_at || new Date().toISOString(),
        };
        data.messages = [sysMsg, ...(data.messages || [])];
      }
      setActivity(data);
    } catch (e) {
      if (e?.response?.status === 404) {
        try {
          const { data: d2 } = await api.get(`/disputes/${disputeId}`);
          setActivity({
            dispute: d2,
            order: d2?.order || null,
            invoice: null,
            messages: [],
            events: [{ type: 'opened', at: d2?.created_at, by: d2?.raisedBy?.username || d2?.raisedById }],
          });
        } catch (e2) {
          setActError(e2?.response?.data?.message || 'Unable to load activity.');
          setActivity(null);
        }
      } else {
        setActError(e?.response?.data?.message || 'Failed to load activity.');
        setActivity(null);
      }
    } finally {
      setActLoading(false);
    }
  }

  const nowISO = () => new Date().toISOString();

  function makeClientMessage({ text, parentId, me }) {
    return {
      id: `tmp-${Math.random().toString(36).slice(2)}`, // temp id
      parentId: parentId || null,
      system: false,
      sender: { id: me?.id || 'admin', username: me?.username || 'Admin' },
      message: text,
      created_at: nowISO(),
      _optimistic: true, // mark as optimistic
    };
  }

  function replaceMessageById(list, id, next) {
    return (list || []).map(m => (m.id === id ? next : m));
  }
  async function sendAdminMessage() {
    const text = (actMsg || '').trim();
    const disputeId = selected?._raw?.id;
    const parentId = replyTo?.id || null;

    if (!disputeId || !text) return;

    // 1) optimistic add
    const optimistic = makeClientMessage({ text, parentId, me: { id: 'admin', username: 'Admin' } });
    setActivity(prev => (prev ? { ...prev, messages: [...(prev.messages || []), optimistic] } : prev));

    // clear UI immediately
    setActMsg('');
    setReplyTo(null);
    setSending(true);

    try {
      // 2) send to API
      const res = await api.post(`/disputes/${disputeId}/messages`, {
        message: text,
        parentId,
      });

      // The API might return the created message object; try to use it
      const serverMsg = res?.data?.message || res?.data || null;

      // Build a safe fallback if server doesn't return a message
      const finalized = serverMsg
        ? {
          id: serverMsg.id || optimistic.id, // keep id if not provided
          parentId: serverMsg.parentId ?? parentId ?? null,
          system: !!serverMsg.system,
          sender: serverMsg.sender || optimistic.sender,
          message: serverMsg.message ?? text,
          created_at: serverMsg.created_at || nowISO(),
        }
        : {
          ...optimistic,
          _optimistic: false, // commit
        };

      // 3) replace optimistic with server version (or commit optimistic)
      setActivity(prev => (prev ? { ...prev, messages: replaceMessageById(prev.messages || [], optimistic.id, finalized) } : prev));
    } catch (e) {
      // 4) rollback: remove optimistic + surface error
      setActivity(prev => (prev ? { ...prev, messages: (prev.messages || []).filter(m => m.id !== optimistic.id) } : prev));
      alert(e?.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  const renderActions = row => {
    const busy = !!actionLoading[row.id];
    const s = row.status;
    const canPropose = [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW].includes(s);
    const canResolve = s !== DisputeStatus.RESOLVED;

    const options = [
      { icon: <Eye className='h-4 w-4' />, label: 'View', onClick: () => openDetails(row), disabled: busy },
      { icon: <Activity className='h-4 w-4' />, label: 'Activity', onClick: () => openActivity(row), disabled: busy },
      { icon: <FilePlus className='h-4 w-4' />, label: 'Propose', onClick: () => openResolution(row), disabled: busy, hide: !canPropose },
      { icon: <Search className='h-4 w-4' />, label: 'Mark In Review', onClick: () => setStatus(row, DisputeStatus.IN_REVIEW), disabled: busy, hide: s === DisputeStatus.IN_REVIEW },
      { icon: <CheckCircle className='h-4 w-4' />, label: busy ? 'Marking…' : 'Mark Resolved', onClick: () => setStatus(row, DisputeStatus.RESOLVED), disabled: busy, hide: !canResolve },
      { icon: <XCircle className='h-4 w-4' />, label: busy ? 'Rejecting…' : 'Reject', onClick: () => setStatus(row, DisputeStatus.REJECTED), disabled: busy, danger: true, hide: !canResolve },
    ];

    return <ActionsMenu options={options} align='right' />;
  };

  const filtered = rows.filter(r => {
    if (!search?.trim()) return true;
    const s = search.toLowerCase();
    return r.orderTitle?.toLowerCase().includes(s) || r.raisedBy?.toLowerCase().includes(s) || r.id?.toLowerCase().includes(s) || r.seller?.toLowerCase().includes(s) || r.buyer?.toLowerCase().includes(s);
  });

  const emptyMsgRef = useRef(null);

  // Enter to send
  const onEmptyInputKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sending && (actMsg || '').trim()) {
          sendAdminMessage();
        }
      }
    },
    [sending, actMsg, sendAdminMessage],
  );

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

  return (
    <DashboardLayout className='min-h-screen bg-gradient-to-b from-white via-slate-50 to-white'>
      <Tabs className='mb-8' setActiveTab={setActiveTab} activeTab={activeTab} tabs={TABS} />
      <Table loading={loading} data={filtered} columns={columns} actions={renderActions} />

      {/* Details Modal */}
      {detailsOpen && (
        <Modal title='Dispute details' onClose={closeAllModals}>
          <div className='space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <Info label='Order' value={selected?._raw?.order?.title || selected?._raw?.orderId} />
              <Info label='Status' value={selected?._raw?.status} />
              <Info label='Raised by' value={selected?._raw?.raisedBy?.username || selected?._raw?.raisedById} />
              <Info label='Reason' value={selected?._raw?.reason} />
            </div>

            <div className='rounded-lg border border-gray-200 p-3'>
              <h4 className='font-medium mb-2'>Invoice</h4>
              {!orderDetail ? (
                <div className='space-y-2'>
                  <Shimmer className='h-4 w-32' />
                  <Shimmer className='h-4 w-24' />
                  <Shimmer className='h-4 w-40' />
                </div>
              ) : inv ? (
                <div className='text-sm'>
                  <div className='flex justify-between'>
                    <span>Subtotal</span>
                    <span>
                      {subtotal.toFixed(2)} {currency}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Service fee</span>
                    <span>
                      {serviceFee.toFixed(2)} {currency}
                    </span>
                  </div>
                  <div className='flex justify-between font-medium'>
                    <span>Total</span>
                    <span>
                      {total.toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              ) : (
                <p className='text-sm text-gray-500'>No invoice found.</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Resolution Modal */}
      {resolutionOpen && (
        <Modal title='Propose / Resolve Dispute' onClose={closeAllModals}>
          <div className='space-y-4'>
            <div className='rounded-lg border border-gray-200 p-3'>
              <h4 className='font-medium mb-2'>Order</h4>
              <div className='text-sm text-gray-700'>{selected?._raw?.order?.title || selected?._raw?.orderId}</div>
            </div>

            <div className='rounded-lg border border-gray-200 p-3'>
              <h4 className='font-medium mb-2'>Invoice</h4>
              {!orderDetail ? (
                <div className='space-y-2'>
                  <Shimmer className='h-4 w-32' />
                  <Shimmer className='h-4 w-24' />
                  <Shimmer className='h-4 w-40' />
                </div>
              ) : inv ? (
                <div className='text-sm'>
                  <div className='flex justify-between'>
                    <span>Subtotal (escrow)</span>
                    <span className='font-medium'>
                      {subtotal.toFixed(2)} {currency}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Service fee (platform)</span>
                    <span>
                      {serviceFee.toFixed(2)} {currency}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Total</span>
                    <span>
                      {total.toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              ) : (
                <p className='text-sm text-gray-500'>No invoice found.</p>
              )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <Field label='Seller amount (payout)'>
                <input type='number' step='0.01' className='w-full rounded-lg border border-gray-300 p-2' value={sellerAmount} onChange={e => setSellerAmount(e.target.value)} />
              </Field>
              <Field label='Buyer refund (credit)'>
                <input type='number' step='0.01' className='w-full rounded-lg border border-gray-300 p-2' value={buyerRefund} onChange={e => setBuyerRefund(e.target.value)} />
              </Field>
            </div>

            <div className='rounded-lg border border-gray-200 p-3'>
              <div className='text-sm text-gray-700 mb-2'>Close order as</div>
              <div className='flex items-center gap-4'>
                <InputRadio name='closeAs' value='completed' label='Completed' checked={closeAs === 'completed'} onChange={setCloseAs} />
                <InputRadio name='closeAs' value='cancelled' label='Cancelled' checked={closeAs === 'cancelled'} onChange={setCloseAs} />
              </div>
            </div>
            {resError ? <div className='rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'>{resError}</div> : null}

            <div className='flex items-center justify-end gap-2'>
              <Button name={resSubmitting ? 'Processing…' : 'Resolve & Payout'} onClick={resolveAndPayoutNow} className={`rounded-lg px-4 py-2 text-white ${resSubmitting ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`} loading={resSubmitting || !orderDetail} />
            </div>
          </div>
        </Modal>
      )}

      {/* Activity & Thread Modal */}
      {activityOpen && (
        <Modal className={'!max-w-[700px] w-full '} title='Dispute Activity' onClose={closeAllModals}>
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
                <div className='rounded-xl border border-gray-200 p-3'>
                  <div className='text-sm font-semibold mb-3'>Thread</div>
                  <div ref={scrollRef} className=' max-h-[300px] flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-2 space-y-3 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]'>
                    {/* <div className='space-y-3 max-h-[300px] overflow-auto pr-1'> */}
                    {threaded.length ? (
                      threaded.map(node => <MessageNode key={node.id} node={node} onReply={setReplyTo} />)
                    ) : (
                      <div className='flex flex-col items-center justify-center py-6 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg bg-gray-50'>
                        <MessageSquare className='h-6 w-6 mb-2 text-gray-400' />
                        <p className='text-sm font-medium'>No messages yet</p>
                        <p className='text-xs text-gray-400 mt-1'>Start the conversation by sending the first message.</p>
                      </div>
                    )}
                  </div>
                  {/* Composer (send on Enter) */}
                  <div className='mt-3 flex items-center gap-2'>
                    <Input
                      name='thread-message'
                      placeholder='Write a message to both parties…'
                      value={actMsg}
                      onChange={e => setActMsg(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!sending && (actMsg || '').trim()) sendAdminMessage();
                        }
                      }}
                    />
                    <Button loading={sending} icon={<Send className='h-4 w-4' />} color='black' onClick={sendAdminMessage} disabled={sending || !(actMsg || '').trim()} className='!h-[40px] !w-auto px-4' />
                  </div>
                </div>

                {/* <div className='rounded-xl border border-gray-200 p-3'>
                  <div className='text-sm font-semibold mb-3'>Thread</div>
                  <div className='space-y-3 max-h-[300px] overflow-auto pr-1'>
                    {threaded.length ? (
                      threaded.map(node => <MessageNode key={node.id} node={node} onReply={setReplyTo} />)
                    ) : (
                      <div className='flex flex-col items-center justify-center py-6 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg bg-gray-50'>
                        <MessageSquare className='h-6 w-6 mb-2 text-gray-400' />
                        <p className='text-sm font-medium'>No messages yet</p>
                        <p className='text-xs text-gray-400 mt-1'>Start the conversation by sending the first message.</p>
                      </div>
                    )}
                  </div> 
                  {replyTo ? (
                    <div className='mt-3 rounded-lg bg-gray-50 border border-gray-200 p-2 text-xs flex items-center justify-between'>
                      <div className='truncate'>
                        Replying to <b>{replyTo?.sender?.username || 'User'}</b>: <span className='text-gray-600'>{replyTo?.message?.slice(0, 80)}</span>
                      </div>
                      <button onClick={() => setReplyTo(null)} className='text-gray-500 hover:text-gray-700'>
                        Cancel
                      </button>
                    </div>
                  ) : null}

                  <div className='mt-3 flex items-center gap-2'>
                    <input value={actMsg} onChange={e => setActMsg(e.target.value)} placeholder='Write a message to both parties…' className='flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10' />
                    <button onClick={sendAdminMessage} disabled={sending || !actMsg.trim()} className={`rounded-lg px-4 py-2 text-white ${sending ? 'bg-gray-400' : 'bg-black hover:bg-black/90'}`}>
                      {sending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </div> */}
              </>
            ) : null}
          </div>
        </Modal>
      )}
    </DashboardLayout>
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
