
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations as useTranslation } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import io from 'socket.io-client';
import Tabs from '@/components/common/Tabs';
import { X, Star, Pin, Search, Send, Paperclip, Smile, Archive } from 'lucide-react';
import Img from '@/components/atoms/Img';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';

let socket;

/* ------------------------------ SKELETONS ------------------------------ */
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

/* ------------------------------ CHAT LOGIC ------------------------------ */
const useChat = () => {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messagesByThread, setMessagesByThread] = useState({});
  const [aboutUser, setAboutUser] = useState({});
  const [query, setQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all | favorites | archived
  const [favoriteThreads, setFavoriteThreads] = useState(new Set());
  const [pinnedThreads, setPinnedThreads] = useState(new Set());
  const [archivedThreads, setArchivedThreads] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

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

  const formatDate = useCallback(dateString => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const formatDateTime = useCallback(dateString => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Normalize server or UI-shaped message to UI shape
  const normalizeMessage = useCallback((m, currentUserId) => {
    // already UI shape?
    if (m && 'text' in m && ('me' in m || 'authorId' in m)) return m;
    return {
      id: m.id,
      authorId: (m.sender && m.sender.id) || m.senderId,
      authorName: (m.sender && m.sender.username) || m.authorName || 'User',
      authorAvatar: (m.sender && m.sender.profileImage) || m.authorAvatar,
      text: m.message || m.text || '',
      createdAt: (() => {
        const iso = m.created_at || m.createdAt;
        return iso ? new Date(iso).toLocaleString() : new Date().toLocaleString();
      })(),
      me: ((m.sender && m.sender.id) || m.senderId) === currentUserId,
    };
  }, []);

  // init socket + persisted state
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth');
      return;
    }
    const userData = JSON.parse(user);
    const token = userData.accessToken;

    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001', { auth: { token } });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('new_message', serverMsg => {
      const uiMsg = normalizeMessage(serverMsg, currentUser?.id);
      setMessagesByThread(prev => {
        const cid = serverMsg.conversationId;
        const list = prev[cid] || [];

        // Try to reconcile optimistic by clientMessageId if backend echoes it
        const optimisticIdx = list.findIndex(m => (serverMsg.clientMessageId && m.clientMessageId === serverMsg.clientMessageId) || (!serverMsg.clientMessageId && m.me === true && m.text === uiMsg.text && Math.abs(new Date(uiMsg.createdAt) - new Date(m.createdAt)) < 15000));

        if (optimisticIdx >= 0) {
          const next = [...list];
          next[optimisticIdx] = { ...uiMsg, pending: false };
          return { ...prev, [cid]: next };
        }

        // Avoid duplicates by id
        if (list.some(m => m.id === uiMsg.id)) return prev;
        return { ...prev, [cid]: [...list, { ...uiMsg, pending: false }] };
      });
    });

    socket.on('message_notification', n => {
      setThreads(prev => prev.map(t => (t.id === n.conversationId ? { ...t, unreadCount: (t.unreadCount || 0) + 1 } : t)));
    });

    fetchCurrentUser();
    fetchConversations();

    const fav = localStorage.getItem('favoriteThreads');
    if (fav) setFavoriteThreads(new Set(JSON.parse(fav)));
    const pin = localStorage.getItem('pinnedThreads');
    if (pin) setPinnedThreads(new Set(JSON.parse(pin)));
    const arch = localStorage.getItem('archivedThreads');
    if (arch) setArchivedThreads(new Set(JSON.parse(arch)));

    return () => {
      if (socket) socket.disconnect();
    };
  }, [router, normalizeMessage, currentUser?.id]);

  useEffect(() => {
    if (targetUserId && currentUser && threads.length > 0) {
      const existing = threads.find(t => t.otherUserId === targetUserId);
      if (existing) selectThread(existing.id);
      else createConversation(targetUserId);
    }
  }, [targetUserId, currentUser, threads]);

  const fetchCurrentUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setCurrentUser(data);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        router.push('/auth');
      }
    }
  };

  const fetchConversations = async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/conversations?page=${page}`);
      const formatted = data.conversations.map(conv => {
        const amBuyer = currentUser?.id === conv.buyer.id;
        const other = amBuyer ? conv.seller : conv.buyer;
        return {
          id: conv.id,
          name: other.username,
          avatar: other.profileImage || '/default-avatar.png',
          active: false,
          time: formatTime(conv.lastMessageAt),
          unreadCount: conv.unreadCount,
          about: {
            name: other.username,
            from: formatDate(conv.lastMessageAt),
            onPlatform: 'Member since ' + formatDate(other.memberSince),
            english: 'Intermediate',
            otherLang: 'Native language',
            level: 'Level 1',
            responseRate: '3.4 hrs',
            rating: '5 (1)',
          },
          otherUserId: other.id,
          isFavorite: conv.isFavorite || favoriteThreads.has(conv.id),
          isPinned: pinnedThreads.has(conv.id),
          isArchived: archivedThreads.has(conv.id),
          lastMessageAt: conv.lastMessageAt,
        };
      });

      const sorted = formatted.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
      });

      setThreads(sorted);
      // Do NOT auto-select the first conversation (per your request)
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId, page = 1) => {
    try {
      const { data } = await api.get(`/conversations/${conversationId}/messages?page=${page}`);
      const msgs = data.messages.map(m => normalizeMessage(m, currentUser?.id));
      setMessagesByThread(prev => ({ ...prev, [conversationId]: msgs }));
    } catch {
      // ignore
    }
  };

  const searchUsers = async q => {
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await api.get(`/conversations/search/users?query=${encodeURIComponent(q)}`);
      setSearchResults(data);
      setShowSearchResults(true);
    } catch {
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = q => {
    setQuery(q);
    searchUsers(q);
  };

  const handleSearchResultClick = async user => {
    const existing = threads.find(t => t.otherUserId === user.id);
    if (existing) selectThread(existing.id);
    else {
      const created = await createConversation(user.id);
      if (created?.id) selectThread(created.id);
    }
    setQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const selectThread = useCallback(
    id => {
      setActiveThreadId(id);
      setThreads(prev => prev.map(t => ({ ...t, active: t.id === id })));
      const selected = threads.find(t => t.id === id);
      if (selected) setAboutUser(selected.about || {});
      if (socket) socket.emit('join_conversation', id);
      fetchMessages(id);
      markAsRead(id);
      if (targetUserId) router.replace('/en/chat', { scroll: false });
    },
    [threads, targetUserId, router],
  );

  const markAsRead = async conversationId => {
    try {
      await api.post(`/conversations/${conversationId}/read`);
      setThreads(prev => prev.map(t => (t.id === conversationId ? { ...t, unreadCount: 0 } : t)));
    } catch {}
  };

  // Optimistic send with clientMessageId, and optional ack reconcile
  const sendMessage = (conversationId, messageData) => {
    if (!isConnected || !socket) return;

    // 1) Optimistically add before sending
    setMessagesByThread(prev => {
      const list = prev[conversationId] || [];
      const optimistic = { ...messageData, pending: true }; // contains clientMessageId
      return { ...prev, [conversationId]: [...list, optimistic] };
    });

    // 2) Emit with clientMessageId for precise reconciliation (if server supports it)
    socket.emit('send_message', { conversationId, message: messageData.text, clientMessageId: messageData.clientMessageId }, serverMsg => {
      if (!serverMsg) return;
      const uiMsg = normalizeMessage(serverMsg, currentUser?.id);
      setMessagesByThread(prev => {
        const list = prev[conversationId] || [];
        const idx = list.findIndex(m => m.clientMessageId && m.clientMessageId === messageData.clientMessageId);
        if (idx === -1) {
          if (list.some(m => m.id === uiMsg.id)) return prev;
          return { ...prev, [conversationId]: [...list, { ...uiMsg, pending: false }] };
        }
        const next = [...list];
        next[idx] = { ...uiMsg, pending: false };
        return { ...prev, [conversationId]: next };
      });
    });
  };

  const createConversation = async (otherUserId, serviceId, orderId, initialMessage) => {
    try {
      const { data } = await api.post(`/conversations`, { otherUserId, serviceId, orderId, initialMessage });
      fetchConversations();
      return data;
    } catch {}
  };

  const toggleFavorite = async threadId => {
    try {
      const { data } = await api.post(`/conversations/${threadId}/favorite`);
      setThreads(prev => prev.map(t => (t.id === threadId ? { ...t, isFavorite: data.isFavorite } : t)));
      setFavoriteThreads(prev => {
        const next = new Set(prev);
        data.isFavorite ? next.add(threadId) : next.delete(threadId);
        localStorage.setItem('favoriteThreads', JSON.stringify([...next]));
        return next;
      });
    } catch {}
  };

  const togglePin = threadId => {
    setPinnedThreads(prev => {
      const next = new Set(prev);
      next.has(threadId) ? next.delete(threadId) : next.add(threadId);
      localStorage.setItem('pinnedThreads', JSON.stringify([...next]));
      setThreads(prevT => prevT.map(t => (t.id === threadId ? { ...t, isPinned: next.has(threadId) } : t)));
      return next;
    });
  };

  const toggleArchive = threadId => {
    setArchivedThreads(prev => {
      const next = new Set(prev);
      next.has(threadId) ? next.delete(threadId) : next.add(threadId);
      localStorage.setItem('archivedThreads', JSON.stringify([...next]));
      setThreads(prevT => prevT.map(t => (t.id === threadId ? { ...t, isArchived: next.has(threadId) } : t)));
      if (next.has(threadId) && activeThreadId === threadId) setActiveThreadId(null);
      return next;
    });
  };

  const filteredThreads = useMemo(() => {
    const q = query.toLowerCase();
    let pool = threads.filter(t => t.name.toLowerCase().includes(q));

    if (activeTab === 'favorites') {
      pool = pool.filter(t => favoriteThreads.has(t.id) && !archivedThreads.has(t.id));
    } else if (activeTab === 'archived') {
      pool = pool.filter(t => archivedThreads.has(t.id));
    } else {
      pool = pool.filter(t => !archivedThreads.has(t.id)); // "all" excludes archived
    }

    return pool.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
    });
  }, [threads, query, activeTab, favoriteThreads, archivedThreads]);

  return {
    threads: filteredThreads,
    activeThreadId,
    messagesByThread,
    aboutUser,
    query,
    isConnected,
    currentUser,
    searchResults,
    showSearchResults,
    isSearching,
    activeTab,
    setActiveTab,
    handleSearch,
    selectThread,
    sendMessage,
    handleSearchResultClick,
    setQuery,
    toggleFavorite,
    togglePin,
    toggleArchive,
    favoriteThreads,
    pinnedThreads,
    archivedThreads,
    loading,
    fetchConversations,
  };
};

/* ---------------------------- KEYBOARD SHORTCUTS ---------------------------- */
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[aria-label="Search conversations"]')?.focus();
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('[aria-expanded="true"]').forEach(el => el.setAttribute('aria-expanded', 'false'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};

/* ------------------------------ ACCESSIBLE BTN ------------------------------ */
function AccessibleButton({ children, onClick, className = '', ariaLabel, ariaPressed, ariaExpanded, disabled = false, type = 'button', title }) {
  return (
    <button type={type} onClick={onClick} className={className} aria-label={ariaLabel} aria-pressed={ariaPressed} aria-expanded={ariaExpanded} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

/* --------------------------------- APP --------------------------------- */
const ChatApp = () => {
  const t = useTranslation('Chat');
  useKeyboardShortcuts();

  const { threads, activeThreadId, messagesByThread, aboutUser, query, isConnected, currentUser, searchResults, showSearchResults, isSearching, activeTab, setActiveTab, handleSearch, selectThread, sendMessage, handleSearchResultClick, setQuery, toggleFavorite, togglePin, toggleArchive, favoriteThreads, pinnedThreads, archivedThreads, loading, fetchConversations } = useChat();

  const activeThread = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId]);

  return (
    <div className='divider'>
      <div className='container grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)_360px]'>
        <Panel>
          <AllMessagesPanel items={threads} onSearch={handleSearch} query={query} onSelect={selectThread} t={t} searchResults={searchResults} showSearchResults={showSearchResults} isSearching={isSearching} onSearchResultClick={handleSearchResultClick} activeTab={activeTab} setActiveTab={setActiveTab} toggleFavorite={toggleFavorite} togglePin={togglePin} toggleArchive={toggleArchive} favoriteThreads={favoriteThreads} pinnedThreads={pinnedThreads} archivedThreads={archivedThreads} currentUser={currentUser} loading={loading} onRefresh={fetchConversations} />
        </Panel>

        <Panel>
          {activeThreadId && activeThread ? (
            <ChatThread key={activeThread.id} thread={activeThread} messages={messagesByThread[activeThreadId] || []} onSend={msg => sendMessage(activeThreadId, msg)} t={t} isFavorite={favoriteThreads.has(activeThreadId)} isPinned={pinnedThreads.has(activeThreadId)} isArchived={archivedThreads.has(activeThreadId)} toggleFavorite={() => toggleFavorite(activeThreadId)} togglePin={() => togglePin(activeThreadId)} toggleArchive={() => toggleArchive(activeThreadId)} isConnected={isConnected} currentUser={currentUser} />
          ) : (
            <div className='flex flex-col items-center justify-center h-full p-6 text-center'>
              <Image src='/icons/chat-placeholder.png' alt='Start a conversation' width={200} height={200} />
              <p className='text-gray-600 text-lg -mt-4 mb-1'>Select a conversation to start chatting</p>
              <p className='text-gray-400 text-sm'>Or search for users above to start a new conversation</p>
              <div className='w-full max-w-xl mt-8 space-y-4'>
                <MessageSkeletonBubble />
                <MessageSkeletonBubble me />
              </div>
            </div>
          )}
        </Panel>

        <Panel>
          <AboutPanel about={aboutUser} t={t} />
        </Panel>
      </div>
    </div>
  );
};

/* -------------------------------- PANEL -------------------------------- */
function Panel({ children }) {
  return (
    <div className=' card-glow rounded-xl bg-white border border-slate-200 ring-1 ring-black/5 shadow-sm'>
      <div className='h-fit min-h-[400px] rounded-xl p-6'>{children}</div>
    </div>
  );
}

/* ------------------------------ CHAT THREAD ------------------------------ */
function ChatThread({ thread, messages, onSend, t, isFavorite, isPinned, isArchived, toggleFavorite, togglePin, toggleArchive, isConnected, currentUser }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);
  const emojiRef = useRef(null);

  const addEmoji = emoji => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleAttach = () => fileInputRef.current?.click();
  const handleFiles = e => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  const scrollBodyToBottom = (behavior = 'smooth') => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    setSending(true);

    // Build optimistic message BEFORE sending
    const newMsg = {
      id: crypto.randomUUID(), // local-only id
      clientMessageId: crypto.randomUUID(), // for reconciliation
      authorId: currentUser?.id ?? 0,
      authorName: t('you'),
      authorAvatar: currentUser?.profileImage,
      text: text.trim() || undefined,
      createdAt: new Date().toLocaleString(),
      me: true,
    };

    // Let useChat.sendMessage handle optimistic insert + emit + ack reconcile
    onSend(newMsg);

    setText('');
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSending(false);

    setTimeout(() => scrollBodyToBottom('auto'), 0);
  };

  useEffect(() => {
    scrollBodyToBottom('auto');
  }, [thread?.id]);
  useEffect(() => {
    scrollBodyToBottom('smooth');
  }, [messages.length]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (emojiRef.current && !emojiRef.current.contains(e.target) && !e.target.closest('[data-emoji-toggle]')) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        setLightboxSrc(null);
        setShowEmoji(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className='w-full relative h-full'>
      {/* Header — no three-dots menu, archive/favorite/pin only */}
      <div className='flex items-start justify-between gap-4 border-b border-b-slate-200 pb-5'>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <Img src={thread?.avatar} altSrc={'/no-user.png'} alt={thread?.name} className='h-12 w-12 rounded-full object-cover ring-2 ring-white shadow' />
            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h3 className='text-xl font-semibold tracking-tight'>{thread?.name}</h3>
              {isPinned && <Pin size={16} className='text-blue-500' />}
              {isArchived && <Archive size={16} className='text-slate-500' />}
            </div>
            <p className='mt-1 text-sm text-gray-500'>{isConnected ? 'Online' : 'Offline'}</p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <AccessibleButton title={isFavorite ? t('removeFavorite') : t('addFavorite')} onClick={toggleFavorite} ariaLabel={isFavorite ? t('removeFavorite') : t('addFavorite')} className={`p-2 rounded-lg transition-colors ${isFavorite ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </AccessibleButton>

          <AccessibleButton title={isArchived ? 'Unarchive' : 'Archive'} onClick={toggleArchive} ariaLabel={isArchived ? 'Unarchive' : 'Archive'} className={`p-2 rounded-lg transition-colors ${isArchived ? 'text-slate-700 bg-slate-100' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Archive size={20} />
          </AccessibleButton>

          <AccessibleButton title={isPinned ? 'Unpin' : 'Pin'} onClick={togglePin} ariaLabel={isPinned ? 'Unpin' : 'Pin'} className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Pin size={20} />
          </AccessibleButton>
        </div>
      </div>

      {/* Body */}
      <div ref={bodyRef} className='nice-scroll space-y-5 pt-5 pb-[100px] overflow-y-auto' style={{ height: 'calc(100vh - 420px)' }}>
        {messages.length === 0 ? (
          <div className='space-y-4'>
            <MessageSkeletonBubble />
            <MessageSkeletonBubble me />
            <MessageSkeletonBubble />
          </div>
        ) : (
          messages.map(m => <Message key={m.id || m.clientMessageId} avatar={m.authorAvatar} avatarBg='bg-slate-300' name={m.authorName} text={m.text} attachments={m.attachments ?? []} me={m.me} createdAt={m.createdAt} pending={m.pending} onZoomImage={src => setLightboxSrc(src)} />)
        )}
      </div>

      {/* Composer */}
      <div className='border-t border-t-slate-200 pt-4 absolute w-full bottom-0 left-0 bg-white'>
        <form className='flex items-center gap-3 rounded-xl border border-emerald-500 bg-white p-3' onSubmit={handleSubmit}>
          <input ref={inputRef} type='text' placeholder={t('placeholders.message')} className='w-full border-none bg-transparent text-[15px] outline-none text-black' value={text} onChange={e => setText(e.target.value)} aria-label={t('placeholders.message')} />

          <div className='flex-none flex items-center gap-2 text-slate-500'>
            <input ref={fileInputRef} type='file' accept='image/*' multiple onChange={handleFiles} className='hidden' />
            <AccessibleButton type='button' className='cursor-pointer flex-none p-1 rounded-md hover:bg-gray-100' ariaLabel={t('attach')} title={t('attach')} onClick={handleAttach}>
              <Paperclip size={20} />
            </AccessibleButton>

            <div className='relative flex items-center justify-center' ref={emojiRef}>
              <AccessibleButton type='button' data-emoji-toggle className='cursor-pointer flex-none p-1 rounded-md hover:bg-gray-100' ariaLabel={t('emoji')} title={t('emoji')} onClick={() => setShowEmoji(v => !v)} ariaExpanded={showEmoji}>
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

            <SendButton loading={sending} text={t('send')} />
          </div>
        </form>

        {files.length > 0 && (
          <div className='mt-3 flex flex-wrap gap-3'>
            {files.map((f, i) => (
              <div key={i} className='relative group'>
                <img src={URL.createObjectURL(f)} alt='attachment' className='h-20 w-24 rounded-xl object-cover ring-1 ring-slate-200' />
                <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors' aria-label='Remove attachment'>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4' onClick={() => setLightboxSrc(null)}>
            <img src={lightboxSrc} alt='preview' className='max-h-[90vh] max-w-[90vw] rounded-xl' onClick={e => e.stopPropagation()} />
            <AccessibleButton className='absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2' onClick={() => setLightboxSrc(null)} ariaLabel={t('close')} title={t('close')}>
              ✕
            </AccessibleButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- MESSAGE ------------------------------- */
function Message({ avatar, avatarBg = 'bg-slate-200', name, text, attachments = [], me = false, createdAt, onZoomImage, pending }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex gap-4 ${me ? 'flex-row-reverse text-right' : ''}`}>
      <div className='relative h-fit flex-none'>
        {avatar ? <Img altSrc={'/no-user.png'} src={avatar} alt={name} className='h-10 w-10 rounded-full object-cover ring-2 ring-white shadow' /> : <div className={`h-10 w-10 rounded-full ${avatarBg} ring-2 ring-white shadow`} />}
        <span className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500' />
      </div>

      <div className={`flex-1 ${me ? 'items-end' : ''}`}>
        <div className={`flex items-center ${me ? 'justify-end' : 'justify-start'}`}>
          <p className='text-sm font-medium'>{name}</p>
        </div>

        <div className={`${me ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-800'} mt-1 inline-block max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${pending ? 'opacity-70' : ''}`}>
          {text && <p className='max-w-4xl text-sm leading-5'>{text}</p>}

          {attachments.length > 0 && (
            <div className='mt-3 grid grid-cols-2 gap-3'>
              {attachments.map((src, i) => (
                <div key={i} className='relative group'>
                  <img src={src} alt='attachment' className='h-24 w-28 rounded-xl object-cover ring-1 ring-slate-200' />
                  <AccessibleButton type='button' title='View' ariaLabel='View' className='absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded-full p-1 transition-opacity' onClick={() => onZoomImage?.(src)}>
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'> <circle cx='11' cy='11' r='8' /> <path d='m21 21-4.3-4.3' /> </svg>
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

/* ------------------------------- ABOUT ------------------------------- */
function AboutPanel({ about = {}, t }) {
  return (
    <div className='w-full'>
      <h2 className='text-2xl font-semibold'>{t('about', { name: about.name || 'Contact' })}</h2>
      <div className='mt-3 h-px w-full bg-slate-200' />
      <dl className='mt-4 space-y-4'>
        <Row label={t('labels.from')} value={about.from || '—'} />
        <Row label={t('labels.onPlatform')} value={about.onPlatform || '—'} />
        <Row label={t('labels.english')} value={about.english || '—'} />
        {about.otherLang && <Row label={t('labels.otherLanguage')} value={about.otherLang} />}
        <Row label={t('labels.level')} value={about.level || '—'} />
        <Row label={t('labels.responseRate')} value={about.responseRate || '—'} />
        <Row label={t('labels.rating')} value={<Rating value={about.rating || '—'} />} />
      </dl>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className='grid grid-cols-[1fr_auto] items-center gap-6 py-2'>
      <dt className='text-sm font-medium text-gray-600'>{label}</dt>
      <dd className='text-sm text-gray-900'>{value}</dd>
    </div>
  );
}

function Rating({ value }) {
  return (
    <div className='flex items-center gap-2 text-slate-500'>
      <Star size={16} className='text-yellow-500 fill-yellow-500' />
      <span className='text-sm'>{value}</span>
    </div>
  );
}

/* ---------------------------- LEFT PANEL LIST ---------------------------- */
function AllMessagesPanel({ items, onSearch, query, onSelect, t, searchResults, showSearchResults, isSearching, onSearchResultClick, activeTab, setActiveTab, toggleFavorite, togglePin, toggleArchive, favoriteThreads, pinnedThreads, archivedThreads, currentUser, loading, onRefresh }) {
  return (
    <div className='w-full relative'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-semibold tracking-tight'>{t('allMessages')}</h2>
        <button onClick={onRefresh} className='p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors' aria-label='Refresh conversations' title='Refresh'>
          <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' />
            <path d='M21 3v5h-5' />
            <path d='M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' />
            <path d='M8 16H3v5' />
          </svg>
        </button>
      </div>

      <Tabs
        className='mt-2 !bg-white mb-4'
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        id='filter-msgs'
        tabs={[
          { value: 'all', label: t('tabs.all') },
          { value: 'favorites', label: t('tabs.favorites') },
          { value: 'archived', label: 'Archived' },
        ]}
      />

      <div className='relative rounded-lg bg-gray-100 px-3 py-2 mb-4 ring-1 ring-inset ring-slate-200'>
        <div className='flex items-center'>
          <Search size={18} className='text-gray-500 mr-2' />
          <input value={query} onChange={e => onSearch(e.target.value)} className='w-full bg-transparent text-sm outline-none placeholder:text-gray-500' placeholder={t('placeholders.search')} aria-label={t('placeholders.search')} />
          {query && (
            <AccessibleButton className='text-gray-500 hover:text-gray-700 transition-colors' title={t('clear')} type='button' onClick={() => onSearch('')} ariaLabel={t('clear')}>
              <X size={18} />
            </AccessibleButton>
          )}
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showSearchResults && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className='absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-10 max-h-60 overflow-y-auto' role='listbox' aria-label='Search results'>
            {isSearching ? (
              <div className='p-4 text-center text-slate-500' aria-live='polite'>
                {t('searching')}
              </div>
            ) : searchResults.length > 0 ? (
              <ul>
                {searchResults.map(user => (
                  <li key={user.id}>
                    <AccessibleButton className='w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3' onClick={() => onSearchResultClick(user)} role='option' aria-describedby={`user-desc-${user.id}`}>
                      <Img altSrc={'/no-user.png'} src={user.profileImage} alt={user.username} className='h-8 w-8 rounded-full object-cover' />
                      <div className='flex flex-col'>
                        <span className='font-medium text-sm'>{user.username}</span>
                        <span id={`user-desc-${user.id}`} className='text-xs text-gray-500 truncate whitespace-nowrap w-[220px]'>
                          {user?.email}
                        </span>
                      </div>
                    </AccessibleButton>
                  </li>
                ))}
              </ul>
            ) : (
              <div className='p-4 text-center text-slate-500' aria-live='polite'>
                {t('noUsersFound')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className='my-4 h-px w-full bg-slate-200' />

      {loading ? (
        <div className='py-2'>
          {[...Array(6)].map((_, i) => (
            <ThreadSkeletonItem key={i} />
          ))}
        </div>
      ) : (
        <div className='overflow-y-auto' style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <ul className='space-y-2' aria-label='Conversation list'>
            {items.map(it => (
              <li key={it.id}>
                <ThreadItem user={it} {...it} onClick={() => onSelect(it.id)} isFavorite={favoriteThreads.has(it.id)} isPinned={pinnedThreads.has(it.id)} isArchived={archivedThreads.has(it.id)} onToggleFavorite={() => toggleFavorite(it.id)} onTogglePin={() => togglePin(it.id)} onToggleArchive={() => toggleArchive(it.id)} />
              </li>
            ))}
            {items.length === 0 && (
              <li className='text-sm text-slate-500 p-4 text-center' aria-live='polite'>
                {activeTab === 'favorites' ? t('noFavorites') : activeTab === 'archived' ? 'No archived conversations' : t('noConversations')}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function ThreadItem({ user, name, avatar, time = 'Just now', active = false, unreadCount = 0, onClick, isFavorite, isPinned, isArchived, onToggleFavorite, onTogglePin, onToggleArchive }) {
  return (
    <AccessibleButton onClick={onClick} ariaLabel={`Conversation with ${name}`} ariaPressed={active} className={['group w-full text-left flex items-center justify-between gap-3 rounded-xl p-3', 'ring-1 ring-transparent transition-all duration-200', 'hover:ring-slate-200 hover:bg-slate-50/80', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50', active ? 'bg-emerald-50 ring-emerald-200' : 'bg-transparent text-slate-900'].join(' ')}>
      <div className='flex items-center gap-3 min-w-0 flex-1'>
        <div className='relative flex-none'>
          <Img altSrc={'/no-user.png'} src={avatar} alt={name} className='h-10 w-10 rounded-full object-cover ring-2 ring-white shadow' />
          {!active && unreadCount > 0 && (
            <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-xs font-semibold flex items-center justify-center shadow-sm' aria-label={`${unreadCount} unread`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1'>
            <p className='truncate font-medium text-sm' title={name}>
              {name}
            </p>
            {isPinned && <Pin size={12} className='text-blue-500 flex-shrink-0' />}
            {isArchived && <Archive size={12} className='text-slate-500 flex-shrink-0' />}
          </div>
          <p className='truncate text-xs text-gray-500'>{time}</p>
        </div>
      </div>

      {/* Right actions */}
      <div className='flex items-center gap-1.5 text-slate-500'>
        <AccessibleButton
          ariaLabel={isArchived ? 'Unarchive' : 'Archive'}
          onClick={e => {
            e.stopPropagation();
            onToggleArchive?.();
          }}
          className='p-1 rounded-md transition hover:scale-110 hover:bg-gray-100'
          title={isArchived ? 'Unarchive' : 'Archive'}>
          <Archive size={16} />
        </AccessibleButton>

        <AccessibleButton
          ariaLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={e => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className='p-1 rounded-md transition hover:scale-110 hover:bg-gray-100'
          title={isFavorite ? 'Unfavorite' : 'Favorite'}>
          <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </AccessibleButton>
      </div>
    </AccessibleButton>
  );
}

/* ----------------------------- SEND BUTTON ----------------------------- */
function SendButton({ loading, text }) {
  return (
    <button type='submit' disabled={loading} className={['flex items-center flex-none gap-2 rounded-lg px-3 py-2 text-white shadow', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500', loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'].join(' ')} aria-label={text} title={text}>
      {/* Loading on the Send icon itself */}
      <Send size={18} className={loading ? 'animate-spin' : ''} />
      <span className='text-sm'>{loading ? 'Sending…' : text}</span>
    </button>
  );
}

export default ChatApp;
