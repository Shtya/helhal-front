import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { Notification } from "@/config/Notification";
import { DisputeStatus } from "@/constants/dispute";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { initialsFromName } from "@/utils/helper";
import { ArrowDown, MessageSquare, Reply, Send } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";



export default function DisputeChat({ detail, setDetail, selectedId }) {
    const scrollRef = useRef(null);
    const rafScrollRef = useRef(0);
    const [replyTo, setReplyTo] = useState(null);
    const [msg, setMsg] = useState('');
    const [sending, setSending] = useState(false);

    const { user: me } = useAuth();
    const atBottom = true;

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

    useEffect(() => {

        return () => {
            console.log("distroyed")
        }
    }, [])

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
        return base.some(m => m.id === sysMsg.id) ? base : [...base, sysMsg];
    }, [detail, parsedResolution]);

    const threaded = useMemo(() => threadWithResolution, [threadWithResolution]);

    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        // wait for layout/paint so heights are correct
        if (rafScrollRef.current) {
            try { cancelAnimationFrame(rafScrollRef.current); } catch { }
            rafScrollRef.current = 0;
        }
        rafScrollRef.current = requestAnimationFrame(() => {
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
            rafScrollRef.current = 0;
        });

        return () => {
            if (rafScrollRef.current) {
                try { cancelAnimationFrame(rafScrollRef.current); } catch { }
                rafScrollRef.current = 0;
            }
        };
    }, [threaded]);

    const handleJumpToMessage = useCallback((id) => {
        const container = scrollRef.current;
        if (!container || !id) return;

        // Cancel any pending auto-scroll rAF
        if (rafScrollRef.current) {
            try { cancelAnimationFrame(rafScrollRef.current); } catch { }
            rafScrollRef.current = 0;
        }
        let el = null;
        try {
            const escaped = (window.CSS && window.CSS.escape) ? window.CSS.escape(id) : id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
            el = container.querySelector(`[data-message-id="${escaped}"]`);
        } catch {
            el = container.querySelector(`[data-message-id="${id}"]`);
        }
        if (!el) return;
        try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
            // Fallback manual centering
            const top = el.offsetTop - (container.clientHeight / 2) + (el.clientHeight / 2);
            container.scrollTo({ top, behavior: 'smooth' });
        }
        // Temporary subtle highlight with smooth fade-out
        el.classList.add('transition-colors', 'duration-700');
        el.classList.add('bg-emerald-50');
        setTimeout(() => {
            el.classList.remove('bg-emerald-50');
        }, 800);
    }, []);

    // quick lookup map for parent preview
    const messageById = useMemo(() => {
        const map = new Map();
        (detail?.messages || []).forEach(m => map.set(m.id, m));
        // also map the synthetic system message if injected
        const sys = threadWithResolution[0];
        if (sys && sys.id?.startsWith('sys-resolution-')) map.set(sys.id, sys);
        return map;
    }, [detail?.messages, threadWithResolution]);

    const isDisputeClosed = detail?.dispute?.status === DisputeStatus.REJECTED || detail?.dispute?.status === DisputeStatus.RESOLVED || detail?.dispute?.status === DisputeStatus.CLOSED_NO_PAYOUT;


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
        if (!selectedId || !text) return;

        if (isDisputeClosed) return;

        const parentId = replyTo?.id || null;
        const optimistic = makeClientMessage({ text, parentId });

        // Optimistic add
        setDetail(prev => (prev ? { ...prev, messages: [...(prev.messages || []), optimistic] } : prev));

        setMsg('');
        setReplyTo(null);
        setSending(true);

        try {
            const res = await api.post(`/disputes/${selectedId}/messages`, { message: text, parentId });
            const final = {
                ...optimistic,
                id: res?.data?.id || optimistic.id,
                _optimistic: false,
            };
            setDetail(prev => (prev ? { ...prev, messages: replaceMessageById(prev.messages || [], optimistic.id, final) } : prev));
        } catch (e) {
            setDetail(prev => (prev ? { ...prev, messages: (prev.messages || []).filter(m => m.id !== optimistic.id) } : prev));
            Notification(e?.response?.data?.message || 'Failed to send message.', 'error');
        } finally {
            setSending(false);
        }
    }
    return (
        <div className='mt-4 flex-1 min-h-0 flex flex-col'>
            <div className='relative rounded-2xl  bg-white flex-1 overflow-hidden flex flex-col'>
                {/* Sticky header */}
                <div className='sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100 px-4 py-2 flex items-center justify-between'>
                    <div className='text-sm font-semibold'>Thread</div>
                    <div></div>
                </div>

                {/* Scrollable list */}
                <div ref={scrollRef} className='mb-[73px] flex-1 min-h-[300px] max-h-[485px] overflow-y-auto px-3 sm:px-4 pt-3 pb-2 space-y-3 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]'>
                    {threaded.length ? (
                        threaded.map(n => <MessageNode key={n.id} node={n} onReply={setReplyTo} messageById={messageById} meId={me?.id} onJump={handleJumpToMessage} isDisputeClosed={isDisputeClosed} />)
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
                {<div className='absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 py-3'>
                    <div className='text-[12px] text-gray-500 mb-2'>
                        {replyTo && (
                            <div className='flex items-center justify-between gap-2 max-w-full'>
                                <div className="truncate max-w-[70%] cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition"
                                    onClick={() => handleJumpToMessage?.(replyTo?.id)}
                                >
                                    Replying to <b>{replyTo?.sender?.username || 'User'}</b>: “{replyTo?.message?.slice(0, 120)}
                                    {replyTo?.message?.length > 120 ? '…' : ''}”
                                </div>
                                <button className='ml-2 underline' onClick={() => setReplyTo(null)}>
                                    cancel
                                </button>
                            </div>
                        )}
                    </div>
                    <div className='flex items-end gap-2  w-full '>
                        <Input
                            name='thread-message'
                            placeholder='Write a message…'
                            value={msg}
                            disabled={isDisputeClosed}
                            cnInput={`${isDisputeClosed
                                ? "message-disabled"
                                : ""
                                }`}
                            onChange={e => setMsg(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!sending && (msg || '').trim()) sendMessage();
                                }
                            }}
                            className=""
                        />
                        <Button icon={<Send size={18} />} color='black' onClick={sendMessage} loading={sending} disabled={isDisputeClosed || sending || !msg.trim()} className='!h-[39px] !w-auto px-4' name='Send' />
                    </div>
                </div>}
            </div>
        </div>
    );
}


function MessageNode({ node, onReply, messageById, meId, onJump, isDisputeClosed }) {
    const isMine = node?.sender?.id === meId && !node.system;

    // Parent preview chip (if replying to someone)
    const parent = node.parentId ? messageById.get(node.parentId) : null;
    const parentSnippet = parent?.message ? String(parent.message).slice(0, 120) : null;

    return (
        <div className={`relative `} data-message-id={node.id}>
            <div className={`flex gap-2 sm:gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                {/* Avatar */}
                {!isMine && <div className='h-8 w-8 rounded-full bg-gray-200 overflow-hidden grid place-items-center text-[11px] font-semibold shrink-0'>{initialsFromName(node?.sender?.username) || 'S'}</div>}

                {/* Bubble */}
                <div className={`max-w-[88%] sm:max-w-[80%] `}>
                    <div className={`rounded-2xl px-3 py-2 ring-1 shadow-sm ${node.system ? 'bg-slate-50 ring-slate-200' : isMine ? 'bg-emerald-50 ring-emerald-100' : 'bg-white ring-slate-200'}`}>
                        <div className="text-[12px] text-gray-500 mb-1 flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-x-2 gap-y-1">
                            <b className="text-gray-800 truncate max-w-[50%] sm:max-w-none">
                                {node?.sender?.username || (node.system ? 'System' : 'User')}
                            </b>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-500 text-[11px] sm:text-[12px]">
                                <span className="whitespace-nowrap">
                                    {new Date(node.created_at).toLocaleDateString(undefined, {
                                        year: '2-digit',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                                {!node.system && onReply && !isDisputeClosed && (
                                    <button
                                        onClick={() => onReply(node)}
                                        className="text-gray-400 hover:text-emerald-600 transition underline "
                                        title="Reply to this message"
                                    >
                                        ↩ Reply
                                    </button>
                                )}
                            </div>

                        </div>


                        {/* Reply preview chip */}
                        {parentSnippet && (
                            <div
                                className='mb-1 inline-flex items-center gap-2 text-[12px] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 w-full cursor-pointer hover:bg-gray-100'
                                onClick={() => parent?.id && onJump?.(parent.id)}
                                title='Go to parent message'
                            >
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
                        <MessageNode key={c.id} node={c} onReply={onReply} messageById={messageById} meId={meId} onJump={onJump} isDisputeClosed={isDisputeClosed} />
                    ))}
                </div>
            ) : null}
        </div>
    );
}