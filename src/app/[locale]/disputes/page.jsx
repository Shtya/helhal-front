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

const tabAnimation = {
  initial: { opacity: 0, y: 8, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } },
  exit: { opacity: 0, y: -6, scale: 0.985, transition: { duration: 0.18 } },
};

function StatusPill({ status }) {
  const map = {
    open: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
    in_review: 'bg-blue-50 text-blue-800 ring-blue-200',
    resolved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  };
  return <span className={` text-nowrap inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ring-1 capitalize ${map[status] || 'bg-gray-50 text-gray-700 ring-gray-200'}`}>{String(status || '—').replace('_', ' ')}</span>;
}

function initialsFromName(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || parts[0]?.[1] || '' || '';
  return (first + second).toUpperCase();
}

function UserChip({ user }) {
  if (!user) return <span className='text-gray-500'>—</span>;
  const letters = initialsFromName(user?.username) || '?';
  return (
    <div className='flex items-center gap-2 min-w-0'>
      <div className='h-7 w-7 rounded-full bg-gray-200 overflow-hidden grid place-items-center text-[11px] font-semibold shrink-0'>{user?.profileImage ? <img src={user.profileImage} alt={user.username || 'user'} className='h-full w-full object-cover' /> : letters}</div>
      <div className='leading-tight min-w-0'>
        <div className='text-xs font-medium truncate'>{user?.username || '—'}</div>
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

/** Build a nested tree */
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

function MessageNode({ node, onReply, level = 0, messageById, meId }) {
  const isMine = node?.sender?.id === meId && !node.system;

  // Parent preview chip (if replying to someone)
  const parent = node.parentId ? messageById.get(node.parentId) : null;
  const parentSnippet = parent?.message ? String(parent.message).slice(0, 120) : null;

  return (
    <div className={`relative ${isMine ? 'pl-10 sm:pl-20' : 'pr-10 sm:pr-20'}`}>
      <div className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {/* Avatar */}
        {!isMine && <div className='h-8 w-8 rounded-full bg-gray-200 overflow-hidden grid place-items-center text-[11px] font-semibold shrink-0'>{initialsFromName(node?.sender?.username) || 'S'}</div>}

        {/* Bubble */}
        <div className={`max-w-[88%] sm:max-w-[80%] ${level > 0 ? 'ml-1' : ''}`}>
          <div className={`rounded-2xl px-3 py-2 ring-1 shadow-sm ${node.system ? 'bg-slate-50 ring-slate-200' : isMine ? 'bg-emerald-50 ring-emerald-100' : 'bg-white ring-slate-200'}`}>
            <div className='text-[12px] text-gray-500 mb-1 flex items-center justify-between gap-2'>
              <b className='text-gray-800 truncate'>{node?.sender?.username || (node.system ? 'System' : 'User')}</b>
              <span className='shrink-0'>{new Date(node.created_at).toLocaleString()}</span>
            </div>

            {/* Reply preview chip */}
            {parentSnippet && (
              <div className='mb-1 inline-flex items-center gap-2 text-[12px] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 w-full'>
                <Reply className='h-3.5 w-3.5 text-gray-500' />
                <span className='truncate text-gray-600'>
                  In reply to <b>{parent?.sender?.username || 'User'}</b>: “{parentSnippet}
                  {parent?.message?.length > 120 ? '…' : ''}”
                </span>
              </div>
            )}

            <div className='text-[14px] leading-relaxed whitespace-pre-wrap text-gray-800 break-words'>{node.message}</div>
          </div>
        </div>

        {/* Right-side avatar for my messages */}
        {isMine && <div className='h-8 w-8 rounded-full bg-emerald-100 grid place-items-center text-[11px] font-semibold shrink-0 text-emerald-800'>{initialsFromName(node?.sender?.username) || 'ME'}</div>}
      </div>

      {/* Children */}
      {node.children?.length ? (
        <div className={`mt-2 ${isMine ? 'pr-6' : 'pl-6'}`}>
          {node.children.map(c => (
            <MessageNode key={c.id} node={c} onReply={onReply} level={level + 1} messageById={messageById} meId={meId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function MyDisputesPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [disputes, setDisputes] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState(null);

  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errDetail, setErrDetail] = useState('');

  const [msg, setMsg] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);

  const [resModalOpen, setResModalOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return disputes;
    const s = search.toLowerCase();
    return disputes.filter(d => {
      const orderTitle = d?.order?.title || '';
      const who = `${d?.order?.buyer?.username || ''} ${d?.order?.seller?.username || ''} ${d?.raisedBy?.username || ''}`;
      return orderTitle.toLowerCase().includes(s) || d.status?.toLowerCase().includes(s) || d.id?.toLowerCase().includes(s) || who.toLowerCase().includes(s);
    });
  }, [disputes, search]);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get('/disputes/my-disputes');
      const list = data?.disputes || [];
      setDisputes(list);
      if (!selected && list.length) setSelected(list[0]);
    } catch {
      setDisputes([]);
    } finally {
      setLoadingList(false);
    }
  }, [selected]);

  const fetchDetail = useCallback(async disputeId => {
    if (!disputeId) return;
    setLoadingDetail(true);
    setErrDetail('');
    try {
      const { data } = await api.get(`/disputes/${disputeId}/activity`);
      setDetail(data);
    } catch (e) {
      if (e?.response?.status === 404) {
        try {
          const { data: d2 } = await api.get(`/disputes/${disputeId}`);
          setDetail({
            dispute: d2,
            order: d2?.order || null,
            invoice: null,
            messages: [],
            events: [{ type: 'opened', at: d2?.created_at, by: d2?.raisedBy?.username || d2?.raisedById }],
          });
        } catch (e2) {
          setErrDetail(e2?.response?.data?.message || 'Unable to load dispute.');
          setDetail(null);
        }
      } else {
        setErrDetail(e?.response?.data?.message || 'Failed to load activity.');
        setDetail(null);
      }
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selected?.id) fetchDetail(selected.id);
  }, [selected, fetchDetail]);

  const parsedResolution = useMemo(() => {
    const r = detail?.dispute?.resolution;
    if (!r) return null;
    if (typeof r !== 'string') return r;
    try {
      return JSON.parse(r);
    } catch {
      return r;
    }
  }, [detail]);

  // Add a system "resolution" message to head (dedup by id)
  const threadWithResolution = useMemo(() => {
    const base = detail?.messages || [];
    if (!parsedResolution) return base;
    const sysMsg = {
      id: `sys-resolution-${detail?.dispute?.id}`,
      parentId: null,
      system: true,
      sender: { id: 'system', username: 'System' },
      message: typeof parsedResolution === 'string' ? `Proposed resolution: ${parsedResolution}` : `Proposed resolution → Seller: ${parsedResolution.sellerAmount} • Buyer refund: ${parsedResolution.buyerRefund}${parsedResolution.note ? ` • Note: ${parsedResolution.note}` : ''}`,
      created_at: detail?.dispute?.updated_at || detail?.dispute?.created_at || new Date().toISOString(),
    };
    return base.some(m => m.id === sysMsg.id) ? base : [sysMsg, ...base];
  }, [detail, parsedResolution]);

  const threaded = useMemo(() => nestMessages(threadWithResolution), [threadWithResolution]);

  // quick lookup map for parent preview
  const messageById = useMemo(() => {
    const map = new Map();
    (detail?.messages || []).forEach(m => map.set(m.id, m));
    // also map the synthetic system message if injected
    const sys = threadWithResolution[0];
    if (sys && sys.id?.startsWith('sys-resolution-')) map.set(sys.id, sys);
    return map;
  }, [detail?.messages, threadWithResolution]);

  // Optimistic send
  const nowISO = () => new Date().toISOString();
  function makeClientMessage({ text, parentId }) {
    return {
      id: `tmp-${Math.random().toString(36).slice(2)}`,
      parentId: parentId || null,
      system: false,
      sender: { id: me?.id || 'me', username: me?.username || 'Me' },
      message: text,
      created_at: nowISO(),
      _optimistic: true,
    };
  }
  function replaceMessageById(list, id, next) {
    return (list || []).map(m => (m.id === id ? next : m));
  }

  async function sendMessage() {
    const text = (msg || '').trim();
    if (!selected?.id || !text) return;

    const parentId = replyTo?.id || null;
    const optimistic = makeClientMessage({ text, parentId });

    // Optimistic add
    setDetail(prev => (prev ? { ...prev, messages: [...(prev.messages || []), optimistic] } : prev));

    setMsg('');
    setReplyTo(null);
    setSending(true);

    try {
      const res = await api.post(`/disputes/${selected.id}/messages`, { message: text, parentId });
      const final = {
        ...optimistic,
        id: res?.data?.id || optimistic.id,
        _optimistic: false,
      };
      setDetail(prev => (prev ? { ...prev, messages: replaceMessageById(prev.messages || [], optimistic.id, final) } : prev));
    } catch (e) {
      setDetail(prev => (prev ? { ...prev, messages: (prev.messages || []).filter(m => m.id !== optimistic.id) } : prev));
      Notification(e?.response?.data?.message || 'Failed to send message.', 'success');
    } finally {
      setSending(false);
    }
  }

  const scrollRef = useRef(null);
  const [atBottom, setAtBottom] = useState(true);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // wait for layout/paint so heights are correct
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [threaded]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 24; // px
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - threshold);
    };
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef]);

  const isNotFound = useMemo(() => {
    if (!errDetail) return false;
    return /(^|\b)(404|not\s*found|doesn'?t exist|missing|gone)(\b|$)/i.test(String(errDetail));
  }, [errDetail]);

  const mapNames = {
    sellerAmount: 'Seller amount',
    buyerRefund: 'Buyer refund',
    note: 'Note',
    decidedBy: 'Decided by',
  };

  return (
    <div className='container !my-6 max-lg:min-h-dvh lg:h-dvh  flex flex-col'>
      {/* Page header */}
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl sm:text-3xl font-bold'>My Disputes</h1>
          {!!disputes?.length && (
            <span className='text-xs px-2 py-0.5 rounded-full ring-1 ring-gray-200 bg-gray-50 text-gray-600'>
              {filtered.length} / {disputes.length}
            </span>
          )}
        </div>
      </div>

      <div className='mt-3 grid grid-cols-12 gap-6 flex-1 min-h-0 '>
        <aside className='col-span-12 lg:col-span-4 min-h-0'>
          <div className='rounded-2xl border border-slate-200 bg-white flex-1 h-full flex flex-col '>
            {/* List header with search */}
            <div className='p-3 border-b border-gray-100 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60'>
              <div className='relative'>
                <Input name='search-disputes' placeholder='Search disputes (title, status, id, user)…' value={search} onChange={e => setSearch(e.target.value)} />
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
              ) : filtered.length ? (
                <ul className='divide-y divide-gray-100 overflow-y-auto h-full max-h-dvh'>
                  {filtered.map(d => {
                    const isActive = selected?.id === d.id;
                    return (
                      <li key={d.id} className={`p-4 cursor-pointer group transition ${isActive ? 'bg-emerald-50/40' : 'bg-white'} hover:bg-emerald-50/30`} onClick={() => setSelected(d)}>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <div className='font-medium text-sm truncate text-slate-900'>{d?.order?.title || d.orderId}</div>
                            <div className='mt-0.5 text-[11px] text-slate-500 truncate'>
                              #{(d.id || '').slice(0, 8)} · Opened {new Date(d.created_at).toLocaleString()}
                            </div>
                          </div>
                          <StatusPill status={d.status} />
                        </div>
                        {d.reason ? <div className='mt-2 text-[12px] text-slate-700 line-clamp-2'>{d.reason}</div> : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className='p-8 text-center'>
                  <div className='mx-auto h-12 w-12 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center'>
                    <MessageSquare className='h-6 w-6 text-emerald-600' />
                  </div>
                  <h3 className='mt-3 text-sm font-semibold text-gray-800'>No disputes found</h3>
                  <p className='mt-1 text-xs text-gray-500'>Try adjusting your search or reloading.</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right detail */}
        <main className='col-span-12 lg:col-span-8 min-h-0 overflow-hidden flex flex-col'>
          {!selected ? (
            <div className='rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500'>Select a dispute from the list to view details.</div>
          ) : loadingDetail ? (
            <div className='rounded-2xl border border-gray-200 p-4 space-y-3 bg-white'>
              <Shimmer className='h-5 w-48' />
              <Shimmer className='h-4 w-2/3' />
              <Shimmer className='h-24 w-full' />
              <Shimmer className='h-64 w-full' />
            </div>
          ) : isNotFound || (!errDetail && !detail) ? (
            <NoResults mainText={'Dispute not found'} additionalText={'The dispute you selected could not be located. It may have been removed or the link is invalid.'} />
          ) : errDetail ? (
            <div className='rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm'>{errDetail}</div>
          ) : detail ? (
            <AnimatePresence mode='wait'>
              <motion.div key={detail?.dispute?.id} {...tabAnimation} className='flex flex-col min-h-0'>
                {/* Summary */}
                <div className='space-y-4'>
                  <div className='rounded-2xl border border-gray-200 p-4 bg-white'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <div className='text-xs text-gray-500'>Order</div>
                        <div className='text-base font-semibold text-slate-900 truncate'>{detail?.order?.title || detail?.dispute?.orderId}</div>
                        <div className='mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='text-gray-500 shrink-0'>Owner:</span>
                            <UserChip user={detail?.order?.seller} />
                          </div>
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='text-gray-500 shrink-0'>Client:</span>
                            <UserChip user={detail?.order?.buyer} />
                          </div>
                          <div className='flex items-center gap-2'>
                            <span className='text-gray-500'>Status:</span> <StatusPill status={detail?.dispute?.status} />
                          </div>
                          <div>
                            <span className='text-gray-500'>Opened:</span> {detail?.dispute?.created_at ? new Date(detail.dispute.created_at).toLocaleString() : '—'}
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        {parsedResolution ? <Button name='View resolution' className='!w-auto' color='outline' onClick={() => setResModalOpen(true)} /> : null}
                        <Button color='outline' className='!w-auto !h-[40px] ' onClick={() => fetchDetail(detail?.dispute?.id)} icon={<RefreshCw className='h-4 w-4' />} />
                      </div>
                    </div>

                    {detail?.invoice ? (
                      <div className='relative rounded-2xl mt-4 border border-gray-200 p-4 bg-slate-50'>
                        <div className='text-sm font-semibold mb-2'>Invoice</div>
                        <div className='text-sm flex items-center justify-between'>
                          <span>Subtotal (escrow)</span>
                          <span>{Number(detail.invoice.subtotal).toFixed(2)} SAR</span>
                        </div>
                        <div className='text-sm flex items-center justify-between'>
                          <span>Service fee</span>
                          <span>{Number(detail.invoice.serviceFee).toFixed(2)} SAR</span>
                        </div>
                        <div className='text-sm flex items-center justify-between font-semibold'>
                          <span>Total</span>
                          <span>{Number(detail.invoice.totalAmount).toFixed(2)} SAR</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Thread area */}
                <div className='mt-4 flex-1 min-h-0 flex flex-col'>
                  <div className='rounded-2xl border border-gray-200 bg-white flex-1 overflow-hidden flex flex-col'>
                    {/* Sticky header */}
                    <div className='sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100 px-4 py-2 flex items-center justify-between'>
                      <div className='text-sm font-semibold'>Thread</div>
                      <div className='text-[12px] text-gray-500'>
                        {replyTo ? (
                          <span>
                            Replying to <b>{replyTo?.sender?.username || 'User'}</b>
                            <button className='ml-2 underline' onClick={() => setReplyTo(null)}>
                              cancel
                            </button>
                          </span>
                        ) : (
                          <span>New message</span>
                        )}
                      </div>
                    </div>

                    {/* Scrollable list */}
                    <div ref={scrollRef} className='flex-1 min-h-[300px] max-h-[485px] overflow-y-auto px-4 pt-3 pb-2 space-y-3 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]'>
                      {threaded.length ? (
                        threaded.map(n => <MessageNode key={n.id} node={n} onReply={setReplyTo} messageById={messageById} meId={me?.id} />)
                      ) : (
                        <div className='mx-2 flex flex-col items-center justify-center py-8 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50 h-full'>
                          <MessageSquare className='h-6 w-6 mb-2 text-gray-400' />
                          <p className='text-sm font-medium'>No messages yet</p>
                          <p className='text-xs text-gray-400 mt-1'>Start the conversation by sending the first message.</p>
                        </div>
                      )}

                      {/* Scroll to bottom */}
                      {!atBottom && (
                        <div className='sticky bottom-3 flex justify-center'>
                          <button
                            onClick={() => {
                              const el = scrollRef.current;
                              if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                            }}
                            className='inline-flex items-center gap-1 rounded-full bg-white/90 ring-1 ring-gray-200 px-3 py-1 text-xs shadow'>
                            <ArrowDown className='h-4 w-4' /> Newer messages
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Composer */}
                    <div className='border-t border-gray-100 bg-white px-4 py-3'>
                      <div className='flex items-end gap-2  w-full '>
                        <Input
                          name='thread-message'
                          placeholder='Write a message…'
                          value={msg}
                          onChange={e => setMsg(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (!sending && (msg || '').trim()) sendMessage();
                            }
                          }}
                          className="w-full"
                        />
                        <Button icon={<Send size={18} />} color='black' onClick={sendMessage} loading={sending} disabled={sending || !msg.trim()} className='!h-[39px] !w-auto px-4' name='Send' />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : null}
        </main>
      </div>

      {/* Resolution Modal */}
      {resModalOpen && (
        <Modal title='Proposed Resolution' onClose={() => setResModalOpen(false)}>
          <div className='space-y-3'>
            <div className='rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm'>
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
                          <span className='font-medium text-base text-emerald-800 capitalize'>{mapNames[key] || key}</span>
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
