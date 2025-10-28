'use client';

/**
 * --------------------------- BACKEND QUICK NOTES ---------------------------
 * Required (recommended) admin endpoints:
 *  - GET /admin/conversations?page=1
 *      returns { conversations: [...], pagination: {...} }
 *      Each conv should include: { id, buyer, seller, service?, order?, unreadCount, lastMessageAt, isFavorite? }
 *  - GET /admin/conversations/:id/messages?page=1
 *      returns { messages: [...] }   // same shape as /conversations/:id/messages
 *  - POST /conversations/:id/message      // already exists (with files)
 *  - POST /conversations/:id/read         // already exists
 *  - GET  /conversations/search/users?query=abc  // already exists
 * 
 * If /admin/conversations is not ready, the page will try fallback to /conversations
 * (admin will then only see chats they participate in).
 * ---------------------------------------------------------------------------
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import io from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Pin, Search, Send, Paperclip, Smile, Archive, LifeBuoy, Shield, Users2, MessageSquare } from 'lucide-react';
import api from '@/lib/axios';
import Img from '@/components/atoms/Img';
import Tabs from '@/components/common/Tabs';
import { useAuth } from '@/context/AuthContext';

let socket;

/* ------------------------------ SMALL UTILS ------------------------------ */
const Shimmer = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded-lg bg-slate-200/60 ${className}`}>
    <div className='absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent' />
  </div>
);
const ThreadSkeletonItem = () => (
  <div className='flex items-center gap-3 p-3'>
    <Shimmer className='h-10 w-10 rounded-full' />
    <div className='flex-1 space-y-2'>
      <Shimmer className='h-3 w-1/2' />
      <Shimmer className='h-2 w-1/3' />
    </div>
    <Shimmer className='h-5 w-5 rounded-md' />
  </div>
);
const MessageSkeletonBubble = ({ me = false }) => (
  <div className={`flex gap-4 ${me ? 'flex-row-reverse' : ''}`}>
    <Shimmer className='h-10 w-10 rounded-full' />
    <div className='max-w-[70%]'>
      <Shimmer className='h-3 w-24 mb-2' />
      <div className={`${me ? 'bg-emerald-500/30' : 'bg-slate-200/70'} rounded-2xl p-3`}>
        <Shimmer className='h-4 w-56 mb-2' />
        <Shimmer className='h-4 w-40' />
      </div>
    </div>
  </div>
);

function AccessibleButton({ children, onClick, className = '', ariaLabel, ariaPressed, ariaExpanded, disabled = false, type = 'button', title }) {
  return (
    <button type={type} onClick={onClick} className={className} aria-label={ariaLabel} aria-pressed={ariaPressed} aria-expanded={ariaExpanded} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

/* ------------------------------ ADMIN HOOK ------------------------------ */
function useAdminChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messagesByConv, setMessagesByConv] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all | unread | favorites | archived
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { user: me } = useAuth();

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [archivedIds, setArchivedIds] = useState(new Set());

  const router = useRouter();

  const currentUserIdRef = useRef(null);
  const activeIdRef = useRef(null);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { currentUserIdRef.current = me?.id; }, [me?.id]);

  const formatTime = useCallback(dateString => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  const normalizeMessage = useCallback((m, currentUserId) => {
    if (m && 'text' in m && ('me' in m || 'authorId' in m)) return m;
    const senderId = (m.sender && m.sender.id) || m.senderId;
    const me = senderId === currentUserId;
    const createdRaw = m.created_at || m.createdAt;
    return {
      id: m.id,
      authorId: senderId,
      authorName: me ? 'You' : (m.sender && m.sender.username) || m.authorName || 'User',
      authorAvatar: me ? (m.sender && m.sender.profileImage) || m.authorAvatar : (m.sender && m.sender.profileImage) || m.authorAvatar,
      text: m.message || m.text || '',
      attachments: Array.isArray(m.attachments) ? m.attachments : [],
      createdAt: createdRaw ? new Date(createdRaw).toLocaleString() : new Date().toLocaleString(),
      me,
    };
  }, []);

  // init socket & auth (same stable deps style you liked)
  useEffect(() => {
    if (!me) { router.push('/auth'); return; }
    const token = JSON.parse(me)?.accessToken;

    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001', { auth: { token } });
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('new_message', msg => {
      const convId = msg.conversationId;
      const ui = normalizeMessage(msg, currentUserIdRef.current);
      setMessagesByConv(prev => {
        const list = prev[convId] || [];
        if (list.some(m => m.id === ui.id)) return prev;
        return { ...prev, [convId]: [...list, ui] };
      });

      // mark read if admin is on this conv and other user sent it
      const isOpen = activeIdRef.current === convId;
      const fromOther = (msg.senderId || (msg.sender && msg.sender.id)) !== currentUserIdRef.current;
      if (isOpen && fromOther) {
        markAsRead(convId);
      } else {
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c));
      }
    });

    fetchMe();
    fetchAdminConversations();

    const fav = localStorage.getItem('admin_favorites'); if (fav) setFavoriteIds(new Set(JSON.parse(fav)));
    const pin = localStorage.getItem('admin_pins'); if (pin) setPinnedIds(new Set(JSON.parse(pin)));
    const arch = localStorage.getItem('admin_archived'); if (arch) setArchivedIds(new Set(JSON.parse(arch)));

    return () => { if (socket) socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, normalizeMessage, me?.id]);

  const fetchAdminConversations = async (page = 1) => {
    setLoading(true);
    try {
      // Try admin endpoint first
      let res;
      try {
        res = await api.get(`/admin/conversations?page=${page}`);
      } catch {
        // fallback to user endpoint (admin will see only own convs then)
        res = await api.get(`/conversations?page=${page}`);
      }
      const { conversations: convs } = res.data;

      const list = convs.map(c => {
        const other =
          me && c.buyer && c.seller
            ? (me?.id === c.buyer.id ? c.seller : c.buyer)
            : (c.buyer || c.seller || { username: 'Unknown', profileImage: '/default-avatar.png' });

        return {
          id: c.id,
          name: other.username,
          avatar: other.profileImage || '/default-avatar.png',
          otherUserId: other.id,
          buyer: c.buyer,
          seller: c.seller,
          service: c.service,
          order: c.order,
          unreadCount: c.unreadCount || 0,
          lastMessageAt: c.lastMessageAt,
          time: formatTime(c.lastMessageAt),
          isFavorite: c.isFavorite || false,
          isPinned: false,
          isArchived: false,
        };
      });

      setConversations(list);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId, page = 1) => {
    try {
      const path = `/admin/conversations/${convId}/messages?page=${page}`;
      let res;
      try {
        res = await api.get(path);
      } catch {
        // fallback user route
        res = await api.get(`/conversations/${convId}/messages?page=${page}`);
      }
      const msgs = (res.data.messages || []).map(m => normalizeMessage(m, me?.id));
      setMessagesByConv(prev => ({ ...prev, [convId]: msgs }));
    } catch { }
  };

  const markAsRead = async (convId) => {
    try {
      await api.post(`/conversations/${convId}/read`);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
    } catch { }
  };

  const selectConv = (id) => {
    setActiveId(id);
    if (socket) socket.emit('join_conversation', id);
    fetchMessages(id);
    markAsRead(id);
  };

  const searchUsers = async (q) => {
    if (!q.trim()) { setSearchResults([]); setShowResults(false); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/conversations/search/users?query=${encodeURIComponent(q)}`);
      setSearchResults(data);
      setShowResults(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (q) => { setQuery(q); searchUsers(q); };

  const handleSearchSelect = async (user) => {
    // create new conversation between admin and the selected user
    try {
      const { data } = await api.post('/conversations', { otherUserId: user.id });
      await fetchAdminConversations();
      if (data?.id) selectConv(data.id);
      setQuery(''); setShowResults(false); setSearchResults([]);
    } catch { }
  };

  const sendMessage = (convId, msg, files) => {
    if (files && files.length) {
      const previews = Array.from(files).map(f => URL.createObjectURL(f));
      setMessagesByConv(prev => {
        const list = prev[convId] || [];
        return { ...prev, [convId]: [...list, { ...msg, attachments: previews, pending: true }] };
      });

      const fd = new FormData();
      if (msg.text) fd.append('message', msg.text);
      Array.from(files).forEach(f => fd.append('files', f));

      api.post(`/conversations/${convId}/message`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        .catch(() => {
          setMessagesByConv(prev => {
            const list = prev[convId] || [];
            return { ...prev, [convId]: list.map(m => m.clientMessageId === msg.clientMessageId ? ({ ...m, pending: false, failed: true }) : m) };
          });
        });

      return;
    }

    if (!isConnected || !socket) return;

    setMessagesByConv(prev => {
      const list = prev[convId] || [];
      return { ...prev, [convId]: [...list, { ...msg, pending: true }] };
    });

    socket.emit('send_message', { conversationId: convId, message: msg.text, clientMessageId: msg.clientMessageId }, serverMsg => {
      if (!serverMsg) return;
      const ui = normalizeMessage(serverMsg, me?.id);
      setMessagesByConv(prev => {
        const list = prev[convId] || [];
        const idx = list.findIndex(m => m.clientMessageId && m.clientMessageId === msg.clientMessageId);
        if (idx === -1) {
          if (list.some(m => m.id === ui.id)) return prev;
          return { ...prev, [convId]: [...list, { ...ui, pending: false }] };
        }
        const next = [...list];
        next[idx] = { ...ui, pending: false };
        return { ...prev, [convId]: next };
      });
    });
  };

  const toggleFavorite = async (id) => {
    try {
      const { data } = await api.post(`/conversations/${id}/favorite`);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        data.isFavorite ? next.add(id) : next.delete(id);
        localStorage.setItem('admin_favorites', JSON.stringify([...next]));
        return next;
      });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, isFavorite: data.isFavorite } : c));
    } catch { }
  };
  const togglePin = (id) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('admin_pins', JSON.stringify([...next]));
      setConversations(prev => prev.map(c => c.id === id ? { ...c, isPinned: next.has(id) } : c));
      return next;
    });
  };
  const toggleArchive = (id) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('admin_archived', JSON.stringify([...next]));
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let pool = conversations.filter(c => (c.name || '').toLowerCase().includes(q));
    if (activeTab === 'unread') pool = pool.filter(c => (c.unreadCount || 0) > 0);
    if (activeTab === 'favorites') pool = pool.filter(c => favoriteIds.has(c.id));
    if (activeTab === 'archived') pool = pool.filter(c => archivedIds.has(c.id));
    else pool = pool.filter(c => !archivedIds.has(c.id));

    return pool.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
    });
  }, [conversations, query, activeTab, favoriteIds, archivedIds]);

  return {
    me,
    list: filtered,
    rawList: conversations,
    activeId,
    messagesByConv,
    loading,
    activeTab,
    setActiveTab,
    query,
    setQuery: handleSearchChange,
    selectConv,
    fetchAdminConversations,
    searchResults,
    showResults,
    searching,
    handleSearchSelect,
    sendMessage,
    toggleFavorite,
    togglePin,
    toggleArchive,
    favoriteIds,
    pinnedIds,
    archivedIds,
    isConnected,
  };
}

/* ---------------------------- PAGE COMPONENT ---------------------------- */
export default function AdminMessagesPage() {
  const {
    me, list, rawList, activeId, messagesByConv, loading, activeTab, setActiveTab, query, setQuery,
    selectConv, fetchAdminConversations, searchResults, showResults, searching, handleSearchSelect,
    sendMessage, toggleFavorite, togglePin, toggleArchive, favoriteIds, pinnedIds, archivedIds, isConnected
  } = useAdminChat();

  const active = useMemo(() => list.find(i => i.id === activeId) || rawList.find(i => i.id === activeId), [list, rawList, activeId]);

  return (
    <div className='container py-6'>
      <div className='mb-6 flex items-center gap-3'>
        <Shield className='text-emerald-600' />
        <h1 className='text-2xl font-semibold'>Admin Messages</h1>
        <span className='ml-auto inline-flex items-center gap-2 text-sm text-slate-500'>
          <MessageSquare size={16} />
          {rawList.length} conversations
        </span>
      </div>

      <div className='grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)_360px]'>
        {/* LEFT: conversations */}
        <div className='card-glow rounded-xl bg-white border border-slate-200 ring-1 ring-black/5 shadow-sm'>
          <div className='p-4'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-lg font-semibold tracking-tight'>Conversations</h2>
              <div className='flex items-center gap-2'>
                <button onClick={fetchAdminConversations} className='p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors' title='Refresh'>
                  <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' />
                    <path d='M21 3v5h-5' />
                    <path d='M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' />
                    <path d='M8 16H3v5' />
                  </svg>
                </button>
              </div>
            </div>

            <Tabs
              className='mt-2 !bg-white mb-4'
              setActiveTab={setActiveTab}
              activeTab={activeTab}
              id='admin-filter-msgs'
              tabs={[
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread' },
                { value: 'favorites', label: 'Favorites' },
                { value: 'archived', label: 'Archived' },
              ]}
            />

            {/* Search users to start convo */}
            <div className='relative rounded-lg bg-gray-100 px-3 py-2 mb-4 ring-1 ring-inset ring-slate-200'>
              <div className='flex items-center'>
                <Search size={18} className='text-gray-500 mr-2' />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className='w-full bg-transparent text-sm outline-none placeholder:text-gray-500'
                  placeholder='Search users or conversations'
                  aria-label='Search'
                />
                {query && (
                  <AccessibleButton className='text-gray-500 hover:text-gray-700 transition-colors' title='Clear' type='button' onClick={() => setQuery('')} ariaLabel='Clear'>
                    <X size={18} />
                  </AccessibleButton>
                )}
              </div>

              <AdminSearchResults
                open={showResults}
                searching={searching}
                results={searchResults}
                onSelect={handleSearchSelect}
              />
            </div>

            <div className='my-3 h-px bg-slate-200' />

            {loading ? (
              <div className='py-2'>{[...Array(6)].map((_, i) => <ThreadSkeletonItem key={i} />)}</div>
            ) : (
              <div className='overflow-y-auto' style={{ maxHeight: 'calc(100vh - 320px)' }}>
                <ul className='space-y-2' aria-label='Conversation list'>
                  {list.map(c => (
                    <li key={c.id}>
                      <ThreadItem
                        {...c}
                        onClick={() => selectConv(c.id)}
                        isFavorite={favoriteIds.has(c.id)}
                        isPinned={pinnedIds.has(c.id)}
                        isArchived={archivedIds.has(c.id)}
                        onToggleFavorite={() => toggleFavorite(c.id)}
                        onTogglePin={() => togglePin(c.id)}
                        onToggleArchive={() => toggleArchive(c.id)}
                      />
                    </li>
                  ))}
                  {list.length === 0 && (
                    <li className='text-sm text-slate-500 p-4 text-center'>No conversations found</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: chat */}
        <div className='card-glow rounded-xl bg-white border border-slate-200 ring-1 ring-black/5 shadow-sm'>
          <div className='p-4 h-full min-h-[400px]'>
            {active ? (
              <AdminThread
                conv={active}
                messages={messagesByConv[activeId] || []}
                onSend={(msg, files) => sendMessage(active.id, msg, files)}
                isConnected={isConnected}
                me={me}
              />
            ) : (
              <div className='flex flex-col items-center justify-center h-full p-6 text-center'>
                <Image src='/icons/chat-placeholder.png' alt='Open a conversation' width={200} height={200} />
                <p className='text-gray-600 text-lg -mt-4 mb-1'>Select a conversation to start</p>
                <p className='text-gray-400 text-sm'>Or search a user to start a new chat</p>
                <div className='w-full max-w-xl mt-8 space-y-4'>
                  <MessageSkeletonBubble />
                  <MessageSkeletonBubble me />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: participants / meta */}
        <div className='card-glow rounded-xl bg-white border border-slate-200 ring-1 ring-black/5 shadow-sm'>
          <div className='p-4'>
            <h2 className='text-lg font-semibold tracking-tight mb-2'>Conversation info</h2>
            {active ? (
              <>
                <div className='flex items-center gap-3'>
                  <Img src={active.avatar} altSrc='/no-user.png' alt={active.name} className='h-12 w-12 rounded-full object-cover ring-2 ring-white shadow' />
                  <div>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium'>{active.name}</p>
                      {active.isPinned && <Pin size={16} className='text-blue-500' />}
                      {active.isArchived && <Archive size={16} className='text-slate-500' />}
                    </div>
                    <p className='text-xs text-slate-500'>Last activity: {active.time}</p>
                  </div>
                </div>

                <div className='my-4 h-px bg-slate-200' />

                <div className='space-y-2 text-sm'>
                  <div className='flex items-center gap-2 text-slate-600'><Users2 size={16} /> Participants</div>
                  <div className='mt-1 space-y-1'>
                    {active.buyer && (
                      <div className='flex items-center gap-2'>
                        <Img src={active.buyer.profileImage} altSrc='/no-user.png' alt={active.buyer.username} className='h-6 w-6 rounded-full object-cover' />
                        <span className='text-sm'>{active.buyer.username} <span className='text-xs text-slate-500'>(buyer)</span></span>
                      </div>
                    )}
                    {active.seller && (
                      <div className='flex items-center gap-2'>
                        <Img src={active.seller.profileImage} altSrc='/no-user.png' alt={active.seller.username} className='h-6 w-6 rounded-full object-cover' />
                        <span className='text-sm'>{active.seller.username} <span className='text-xs text-slate-500'>(seller)</span></span>
                      </div>
                    )}
                    <div className='flex items-center gap-2'>
                      <Img src={me?.profileImage} altSrc='/no-user.png' alt='Admin' className='h-6 w-6 rounded-full object-cover' />
                      <span className='text-sm'>You <span className='text-xs text-slate-500'>(admin)</span></span>
                    </div>
                  </div>
                </div>

                <div className='my-4 h-px bg-slate-200' />

                <div className='grid grid-cols-3 gap-2'>
                  <button onClick={() => toggleFavorite(active.id)} className='rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50'>
                    {active.isFavorite ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button onClick={() => togglePin(active.id)} className='rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50'>
                    {active.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button onClick={() => toggleArchive(active.id)} className='rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50'>
                    {archivedIds.has(active.id) ? 'Unarchive' : 'Archive'}
                  </button>
                </div>

                {active.service && (
                  <>
                    <div className='my-4 h-px bg-slate-200' />
                    <div className='text-sm'>
                      <p className='font-medium mb-1'>Service</p>
                      <div className='rounded-lg border border-slate-200 p-3'>
                        <div className='text-slate-700'>{active.service.title || `#${active.service.id}`}</div>
                        <div className='text-xs text-slate-500'>ID: {active.service.id}</div>
                      </div>
                    </div>
                  </>
                )}

                {active.order && (
                  <>
                    <div className='my-4 h-px bg-slate-200' />
                    <div className='text-sm'>
                      <p className='font-medium mb-1'>Order</p>
                      <div className='rounded-lg border border-slate-200 p-3'>
                        <div className='text-slate-700'>Order #{active.order.id}</div>
                        <div className='text-xs text-slate-500'>Buyer: {active.order.buyer?.username} • Seller: {active.order.seller?.username}</div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className='text-sm text-slate-500'>Select a conversation.</p>
            )}

            <div className='my-4 h-px bg-slate-200' />
            <div className='rounded-lg bg-emerald-50 text-emerald-700 p-3 text-sm flex items-start gap-2'>
              <LifeBuoy size={16} className='mt-0.5' />
              <div>
                <p className='font-medium mb-0.5'>Mediation tips</p>
                <p>Be neutral. Keep the conversation on a single thread so buyer & seller and you can see the same history.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- SUBVIEWS ------------------------------- */
function AdminSearchResults({ open, searching, results, onSelect }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className='absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-10 max-h-60 overflow-y-auto'>
          {searching ? (
            <div className='p-4 text-center text-slate-500'>Searching…</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map(u => (
                <li key={u.id}>
                  <AccessibleButton className='w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3' onClick={() => onSelect(u)}>
                    <Img altSrc='/no-user.png' src={u.profileImage} alt={u.username} className='h-8 w-8 rounded-full object-cover' />
                    <div className='flex flex-col'>
                      <span className='font-medium text-sm'>{u.username}</span>
                      <span className='text-xs text-gray-500 truncate whitespace-nowrap w-[220px]'>{u.email}</span>
                    </div>
                  </AccessibleButton>
                </li>
              ))}
            </ul>
          ) : (
            <div className='p-4 text-center text-slate-500'>No users found</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ThreadItem({
  name, avatar, time = 'Just now', unreadCount = 0, onClick,
  isFavorite, isPinned, isArchived, onToggleFavorite, onTogglePin, onToggleArchive
}) {
  return (
    <AccessibleButton onClick={onClick} ariaLabel={`Open conversation with ${name}`} className={['group w-full text-left flex items-center justify-between gap-3 rounded-xl p-3', 'ring-1 ring-transparent transition-all duration-200', 'hover:ring-slate-200 hover:bg-slate-50/80', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50'].join(' ')}>
      <div className='flex items-center gap-3 min-w-0 flex-1'>
        <div className='relative flex-none'>
          <Img altSrc='/no-user.png' src={avatar} alt={name} className='h-10 w-10 rounded-full object-cover ring-2 ring-white shadow' />
          {unreadCount > 0 && (
            <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-xs font-semibold flex items-center justify-center shadow-sm'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1'>
            <p className='truncate font-medium text-sm' title={name}>{name}</p>
            {isPinned && <Pin size={12} className='text-blue-500 flex-shrink-0' />}
            {isArchived && <Archive size={12} className='text-slate-500 flex-shrink-0' />}
          </div>
          <p className='truncate text-xs text-gray-500'>{time}</p>
        </div>
      </div>

      <div className='flex items-center gap-1.5 text-slate-500'>
        <AccessibleButton onClick={(e) => { e.stopPropagation(); onToggleArchive?.(); }} className='p-1 rounded-md transition hover:scale-110 hover:bg-gray-100' title={isArchived ? 'Unarchive' : 'Archive'}>
          <Archive size={16} />
        </AccessibleButton>
        <AccessibleButton onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }} className='p-1 rounded-md transition hover:scale-110 hover:bg-gray-100' title={isFavorite ? 'Unfavorite' : 'Favorite'}>
          <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </AccessibleButton>
        <AccessibleButton onClick={(e) => { e.stopPropagation(); onTogglePin?.(); }} className='p-1 rounded-md transition hover:scale-110 hover:bg-gray-100' title={isPinned ? 'Unpin' : 'Pin'}>
          <Pin size={16} />
        </AccessibleButton>
      </div>
    </AccessibleButton>
  );
}

/* ------------------------------- CHAT THREAD ------------------------------- */
function AdminThread({ conv, messages, onSend, isConnected, me }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);
  const emojiRef = useRef(null);

  const addEmoji = e => { setText(p => p + e); setShowEmoji(false); inputRef.current?.focus(); };
  const handleAttach = () => fileInputRef.current?.click();
  const handleFiles = e => setFiles(Array.from(e.target.files || []));

  const scrollBottom = (behavior = 'smooth') => { if (bodyRef.current) bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior }); };

  const submit = e => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    setSending(true);

    const msg = {
      id: crypto.randomUUID(),
      clientMessageId: crypto.randomUUID(),
      authorId: me?.id,
      authorName: 'You',
      authorAvatar: me?.profileImage,
      text: text.trim() || undefined,
      createdAt: new Date().toLocaleString(),
      me: true,
    };

    onSend(msg, files);

    setText('');
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSending(false);

    setTimeout(() => scrollBottom('auto'), 0);
  };

  useEffect(() => { scrollBottom('auto'); }, [conv?.id]);
  useEffect(() => { scrollBottom('smooth'); }, [messages.length]);

  useEffect(() => {
    const closeEmoji = e => { if (emojiRef.current && !emojiRef.current.contains(e.target) && !e.target.closest('[data-emoji-toggle]')) setShowEmoji(false); };
    document.addEventListener('mousedown', closeEmoji);
    document.addEventListener('touchstart', closeEmoji);
    return () => { document.removeEventListener('mousedown', closeEmoji); document.removeEventListener('touchstart', closeEmoji); };
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setLightboxSrc(null); setShowEmoji(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className='w-full relative h-full'>
      {/* header */}
      <div className='flex items-start justify-between gap-4 border-b border-b-slate-200 pb-4'>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <Img src={conv.avatar} altSrc='/no-user.png' alt={conv.name} className='h-12 w-12 rounded-full object-cover ring-2 ring-white shadow' />
            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='text-xl font-semibold tracking-tight'>{conv.name}</h3>
              {conv.isPinned && <Pin size={16} className='text-blue-500' />}
              {conv.isArchived && <Archive size={16} className='text-slate-500' />}
            </div>
            <p className='mt-1 text-sm text-gray-500'>{isConnected ? 'Online' : 'Offline'}</p>
          </div>
        </div>
      </div>

      {/* body */}
      <div ref={bodyRef} className='nice-scroll space-y-5 pt-5 pb-[100px] overflow-y-auto' style={{ height: 'calc(100vh - 420px)' }}>
        {messages.length === 0 ? (
          <div className='space-y-4'>
            <MessageSkeletonBubble />
            <MessageSkeletonBubble me />
            <MessageSkeletonBubble />
          </div>
        ) : (
          messages.map(m => (
            <MessageBubble
              key={m.id || m.clientMessageId}
              avatar={m.authorAvatar}
              avatarBg='bg-slate-300'
              name={m.authorName}
              text={m.text}
              attachments={m.attachments ?? []}
              me={m.me}
              createdAt={m.createdAt}
              pending={m.pending}
              onZoomImage={src => setLightboxSrc(src)}
            />
          ))
        )}
      </div>

      {/* composer */}
      <div className='border-t border-t-slate-200 pt-4 absolute w-full bottom-0 left-0 bg-white'>
        <form className='flex items-center gap-3 rounded-xl border border-emerald-500 bg-white p-3' onSubmit={submit}>
          <input
            ref={inputRef}
            type='text'
            placeholder='Write a message…'
            className='w-full border-none bg-transparent text-[15px] outline-none text-black'
            value={text}
            onChange={e => setText(e.target.value)}
          />

          <div className='flex-none flex items-center gap-2 text-slate-500'>
            <input ref={fileInputRef} type='file' accept='image/*,application/pdf' multiple onChange={handleFiles} className='hidden' />
            <AccessibleButton type='button' className='cursor-pointer flex-none p-1 rounded-md hover:bg-gray-100' ariaLabel='Attach' title='Attach' onClick={handleAttach}>
              <Paperclip size={20} />
            </AccessibleButton>

            <div className='relative flex items-center justify-center' ref={emojiRef}>
              <AccessibleButton type='button' data-emoji-toggle className='cursor-pointer flex-none p-1 rounded-md hover:bg-gray-100' ariaLabel='Emoji' title='Emoji' onClick={() => setShowEmoji(v => !v)} ariaExpanded={showEmoji}>
                <Smile size={20} />
              </AccessibleButton>
              <AnimatePresence>
                {showEmoji && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className='absolute w-[200px] right-0 bottom-9 z-50 grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg'>
                    {['😀', '😁', '😂', '🤣', '😊', '😍', '😅', '🤩', '🤔', '👍', '👏', '🙏', '🔥', '🚀', '✅', '❗', '💡', '📎'].map(e => (
                      <AccessibleButton key={e} type='button' className='text-xl hover:scale-110 transition' onClick={() => addEmoji(e)} ariaLabel={`Emoji: ${e}`}>
                        {e}
                      </AccessibleButton>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <SendButton loading={sending} text='Send' />
          </div>
        </form>

        {files.length > 0 && (
          <div className='mt-3 flex flex-wrap gap-3'>
            {files.map((f, i) => (
              <div key={i} className='relative group'>
                {f.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(f)} alt='attachment' className='h-20 w-24 rounded-xl object-cover ring-1 ring-slate-200' />
                ) : (
                  <div className='h-20 w-40 rounded-xl ring-1 ring-slate-200 bg-slate-50 p-3 flex items-center gap-2 text-xs'>
                    <Paperclip size={16} />
                    <span className='line-clamp-2'>{f.name}</span>
                  </div>
                )}
                <button onClick={() => {
                  const next = [...files]; next.splice(i, 1); setFiles(next);
                }} className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors' aria-label='Remove attachment'>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4' onClick={() => setLightboxSrc(null)}>
            <img src={lightboxSrc} alt='preview' className='max-h-[90vh] max-w-[90vw] rounded-xl' onClick={e => e.stopPropagation()} />
            <AccessibleButton className='absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2' onClick={() => setLightboxSrc(null)} ariaLabel='Close' title='Close'>
              ✕
            </AccessibleButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageBubble({ avatar, avatarBg = 'bg-slate-200', name, text, attachments = [], me = false, createdAt, onZoomImage, pending }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex gap-4 ${me ? 'flex-row-reverse text-right' : ''}`}>
      <div className='relative h-fit flex-none'>
        {avatar ? <Img altSrc='/no-user.png' src={avatar} alt={name} className='h-10 w-10 rounded-full object-cover ring-2 ring-white shadow' /> : <div className={`h-10 w-10 rounded-full ${avatarBg} ring-2 ring-white shadow`} />}
        <span className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500' />
      </div>

      <div className={`flex-1 ${me ? 'items-end' : ''}`}>
        <div className={`flex items-center ${me ? 'justify-end' : 'justify-start'}`}>
          <p className='text-sm font-medium'>{name}</p>
        </div>

        <div className={`${me ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-800'} mt-1 inline-block max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${pending ? 'opacity-70' : ''}`}>
          {text && <p className='max-w-4xl text-sm leading-5 break-words whitespace-pre-wrap'>{text}</p>}

          {attachments.length > 0 && (
            <div className='mt-3 grid grid-cols-2 gap-3'>
              {attachments.map((src, i) => (
                <div key={i} className='relative group'>
                  <img src={src} alt='attachment' className='h-24 w-28 rounded-xl object-cover ring-1 ring-slate-200' />
                  <AccessibleButton type='button' title='View' ariaLabel='View' className='absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded-full p-1 transition-opacity' onClick={() => onZoomImage?.(src)}>
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                      <circle cx='11' cy='11' r='8' /> <path d='m21 21-4.3-4.3' />
                    </svg>
                  </AccessibleButton>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`mt-1 text-xs text-slate-400 ${me ? 'text-right' : 'text-left'}`}>{createdAt || ''}</div>
      </div>
    </motion.div>
  );
}

function SendButton({ loading, text }) {
  return (
    <button type='submit' disabled={loading} className={['flex items-center flex-none gap-2 rounded-lg px-3 py-2 text-white shadow', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500', loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'].join(' ')} aria-label={text} title={text}>
      <Send size={18} className={loading ? 'animate-spin' : ''} />
      <span className='text-sm'>{loading ? 'Sending…' : text}</span>
    </button>
  );
}
