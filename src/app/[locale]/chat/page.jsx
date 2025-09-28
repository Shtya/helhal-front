'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations as useTranslation } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import io from 'socket.io-client';
import Tabs from '@/components/common/Tabs';
import { X, Star, Pin, Search, Send, Paperclip, Smile, Archive, LifeBuoy } from 'lucide-react';
import Img from '@/components/atoms/Img';
import { motion, AnimatePresence } from 'framer-motion';
import api, { baseImg } from '@/lib/axios';

/** ───────────────────────────────── SOCKET REF ───────────────────────────────── */
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

/* ------------------------------ NOTIFICATION FUNCTION ------------------------------ */
const showNotification = (message, type = 'success') => {
  // You can replace this with your preferred notification system
  console.log(`${type.toUpperCase()}: ${message}`);
  // For now, using browser notification as fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(message);
  }
};

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
  const [activeTab, setActiveTab] = useState('all');
  const [favoriteThreads, setFavoriteThreads] = useState(new Set());
  const [pinnedThreads, setPinnedThreads] = useState(new Set());
  const [archivedThreads, setArchivedThreads] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  // live refs so socket handlers always see latest values
  const activeThreadIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const messagesByThreadRef = useRef({});

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  useEffect(() => {
    messagesByThreadRef.current = messagesByThread;
  }, [messagesByThread]);

  const formatTime = useCallback(dateString => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = +now - +date;
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

  // Normalize server or UI-shaped message to UI shape
  const normalizeMessage = useCallback((m, currentUserId) => {
    if (m && 'text' in m && ('me' in m || 'authorId' in m)) return m; // already UI-shaped
    const senderId = (m.sender && m.sender.id) || m.senderId;
    const me = senderId === currentUserId;
    const createdRaw = m.created_at || m.createdAt;
    // server attachments may be array of { id, url, mimeType, ... }
    const atts = Array.isArray(m.attachments) ? m.attachments : [];
    // unify to display URLs (prefer absolute if provided; otherwise prefix with baseImg)
    const attUrls = atts.map(a => (a.url ? (a.url.startsWith('http') ? a.url : baseImg + a.url) : a));
    return {
      id: m.id,
      clientMessageId: m.clientMessageId, // if server echoes it
      authorId: senderId,
      authorName: me ? 'You' : (m.sender && m.sender.username) || m.authorName || 'User',
      authorAvatar: me ? (m.sender && m.sender.profileImage) || m.authorAvatar : (m.sender && m.sender.profileImage) || m.authorAvatar,
      text: m.message || m.text || '',
      attachments: attUrls,
      createdAt: createdRaw ? new Date(createdRaw).toLocaleString() : new Date().toLocaleString(),
      me,
    };
  }, []);

  // lifecycle
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth');
      return;
    }
    const userData = JSON.parse(user);
    const token = userData.accessToken;

    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'], // Add fallback transport
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    // incoming message - FIXED: Prevent duplication
    socket.on('new_message', serverMsg => {
      const currentUserId = currentUserIdRef.current;
      const uiMsg = normalizeMessage(serverMsg, currentUserId);
      const cid = serverMsg.conversationId;

      setMessagesByThread(prev => {
        const list = prev[cid] || [];

        // Strong de-duplication check
        const isDuplicate = list.some(m => (m.id && m.id === uiMsg.id) || (m.clientMessageId && m.clientMessageId === uiMsg.clientMessageId));

        if (isDuplicate) {
          console.log('Duplicate message detected, skipping');
          return prev;
        }

        // Update optimistic message if exists
        if (uiMsg.clientMessageId) {
          const optimisticIndex = list.findIndex(m => m.clientMessageId === uiMsg.clientMessageId);
          if (optimisticIndex !== -1) {
            const next = [...list];
            next[optimisticIndex] = { ...uiMsg, pending: false };
            return { ...prev, [cid]: next };
          }
        }

        // Add new message
        return { ...prev, [cid]: [...list, { ...uiMsg, pending: false }] };
      });

      const isForOpenThread = activeThreadIdRef.current === cid;
      const fromOther = (serverMsg.senderId || (serverMsg.sender && serverMsg.sender.id)) !== currentUserId;

      if (isForOpenThread && fromOther) {
        markAsRead(cid);
      } else {
        // bump unread count on that thread
        setThreads(prev =>
          prev.map(t =>
            t.id === cid
              ? {
                  ...t,
                  unreadCount: (t.unreadCount || 0) + 1,
                  lastMessageAt: new Date().toISOString(),
                }
              : t,
          ),
        );
      }
    });

    socket.on('message_notification', n => {
      setThreads(prev => prev.map(t => (t.id === n.conversationId ? { ...t, unreadCount: (t.unreadCount || 0) + 1 } : t)));
    });

    socket.on('error', error => {
      console.error('Socket error:', error);
      showNotification(error.message || 'Connection error', 'error');
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
      if (socket) {
        socket.disconnect();
      }
    };
  }, [router, normalizeMessage]);

useEffect(() => {
  if (targetUserId && currentUser) {
    const existing = threads.find((t) => String(t.otherUserId) === String(targetUserId));
    if (existing) {
      // Only select if not already active
      if (activeThreadId !== existing.id) {
        selectThread(existing.id);
      }
    } else if (threads.length > 0) {
      // Only create if thread doesn't exist and we have loaded threads
      createConversation(targetUserId);
    }
  }
}, [targetUserId, currentUser, threads.length, activeThreadId]);

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
      const formatted = (data.conversations || data || []).map(conv => {
        const amBuyer = currentUser?.id === conv.buyer?.id;
        const other = amBuyer ? conv.seller : conv.buyer;
        return {
          id: conv.id,
          name: other?.username,
          avatar: other?.profileImage || '/default-avatar.png',
          active: false,
          time: formatTime(conv.lastMessageAt),
          unreadCount: conv.unreadCount,
          about: {
            name: other?.username,
            from: formatDate(conv.lastMessageAt),
            onPlatform: 'Member since ' + formatDate(other?.memberSince),
            english: 'Intermediate',
            otherLang: 'Native language',
            level: 'Level 1',
            responseRate: '3.4 hrs',
            rating: '5 (1)',
          },
          otherUserId: other?.id,
          isFavorite: conv.isFavorite || false,
          isPinned: false,
          isArchived: false,
          lastMessageAt: conv.lastMessageAt,
        };
      });

      // enrich with local pin/fav/archive state
      const withLocal = formatted.map(t => ({
        ...t,
        isFavorite: t.isFavorite || favoriteThreads.has(t.id),
        isPinned: pinnedThreads.has(t.id),
        isArchived: archivedThreads.has(t.id),
      }));

      const sorted = withLocal.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
      });

      setThreads(sorted);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      showNotification('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId, page = 1) => {
    try {
      const { data } = await api.get(`/conversations/${conversationId}/messages?page=${page}`);
      const msgs = (data.messages || data || []).map(m => normalizeMessage(m, currentUser?.id));
      setMessagesByThread(prev => ({ ...prev, [conversationId]: msgs }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      showNotification('Failed to load messages', 'error');
    }
  };

  const markAsRead = async conversationId => {
    try {
      await api.post(`/conversations/${conversationId}/read`);
      setThreads(prev => prev.map(t => (t.id === conversationId ? { ...t, unreadCount: 0 } : t)));
      if (socket) {
        socket.emit('mark_as_read', conversationId);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
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
    } catch (error) {
      console.error('Error searching users:', error);
      showNotification('Failed to search users', 'error');
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
    if (existing) {
      selectThread(existing.id);
    } else {
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
      markAsRead(id); // mark read on open
      if (targetUserId) router.replace('/en/chat', { scroll: false });
    },
    [threads, targetUserId, router],
  );

  const sendMessage = async (conversationId, messageData, files = []) => {
    // Generate unique client ID for optimistic update
    const clientMessageId = crypto.randomUUID();

    // Create optimistic message
    const optimisticMessage = {
      ...messageData,
      clientMessageId,
      pending: true,
      id: clientMessageId, // temporary ID
      attachments: files.map(file => file.url || file.path || ''),
      createdAt: new Date().toLocaleString(),
    };

    // Add optimistic message to UI immediately
    setMessagesByThread(prev => {
      const list = prev[conversationId] || [];
      return { ...prev, [conversationId]: [...list, optimisticMessage] };
    });

    try {
      // Prepare payload for API
      const payload = {
        message: messageData.text || '',
        attachments: files.map(file => file.id || file.assetId).filter(Boolean),
      };

      // Use API endpoint instead of socket for consistency
      const response = await api.post(`/conversations/${conversationId}/message`, payload);

      // The server will emit the message via socket, which will replace the optimistic one
      // No need to update here as socket handler will handle it
    } catch (error) {
      console.error('Error sending message:', error);

      // Mark message as failed
      setMessagesByThread(prev => {
        const list = prev[conversationId] || [];
        const updatedList = list.map(msg => (msg.clientMessageId === clientMessageId ? { ...msg, pending: false, failed: true } : msg));
        return { ...prev, [conversationId]: updatedList };
      });

      showNotification('Failed to send message', 'error');
    }
  };

  const createConversation = async (otherUserId, serviceId, orderId, initialMessage) => {
    try {
      const { data } = await api.post(`/conversations`, { otherUserId, serviceId, orderId, initialMessage });
      fetchConversations();
      showNotification('Conversation created successfully', 'success');
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      showNotification('Failed to create conversation', 'error');
      return null;
    }
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
      showNotification(data.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showNotification('Failed to update favorites', 'error');
    }
  };

  const togglePin = threadId => {
    setPinnedThreads(prev => {
      const next = new Set(prev);
      next.has(threadId) ? next.delete(threadId) : next.add(threadId);
      localStorage.setItem('pinnedThreads', JSON.stringify([...next]));
      setThreads(prevT => prevT.map(t => (t.id === threadId ? { ...t, isPinned: next.has(threadId) } : t)));
      showNotification(next.has(threadId) ? 'Conversation pinned' : 'Conversation unpinned', 'success');
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
      showNotification(next.has(threadId) ? 'Conversation archived' : 'Conversation unarchived', 'success');
      return next;
    });
  };

  const contactAdmin = async () => {
    try {
      let adminId;
      try {
        const { data } = await api.get('/users/admin');
        adminId = data?.id;
      } catch {
        adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
      }

      if (!adminId) {
        showNotification('Admin contact unavailable.', 'error');
        return;
      }

      const existing = threads.find(t => String(t.otherUserId) === String(adminId));
      if (existing) {
        selectThread(existing.id);
      } else {
        const created = await createConversation(adminId);
        if (created?.id) selectThread(created.id);
      }
    } catch (error) {
      console.error('Error contacting admin:', error);
      showNotification('Failed to contact admin', 'error');
    }
  };

  const filteredThreads = useMemo(() => {
    const q = query.toLowerCase();
    let pool = threads.filter(t => (t.name || '').toLowerCase().includes(q));

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
      return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
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
    contactAdmin,
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
      if (e.key === 'Enter' && e.ctrlKey) {
        const sendButton = document.querySelector('button[type="submit"]');
        if (sendButton && !sendButton.disabled) {
          sendButton.click();
        }
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

  const { threads, activeThreadId, messagesByThread, aboutUser, query, isConnected, currentUser, searchResults, showSearchResults, isSearching, activeTab, setActiveTab, handleSearch, selectThread, sendMessage, handleSearchResultClick, setQuery, toggleFavorite, togglePin, toggleArchive, favoriteThreads, pinnedThreads, archivedThreads, loading, fetchConversations, contactAdmin } = useChat();

  const activeThread = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId]);

  return (
    <div className='divider'>
      <div className='container grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)_360px] md:grid-cols-1'>
        {/* Left Panel - Conversations List */}
        <div className='lg:block hidden'>
          <Panel>
            <AllMessagesPanel items={threads} onSearch={handleSearch} query={query} onSelect={selectThread} t={t} searchResults={searchResults} showSearchResults={showSearchResults} isSearching={isSearching} onSearchResultClick={handleSearchResultClick} activeTab={activeTab} setActiveTab={setActiveTab} toggleFavorite={toggleFavorite} togglePin={togglePin} toggleArchive={toggleArchive} favoriteThreads={favoriteThreads} pinnedThreads={pinnedThreads} archivedThreads={archivedThreads} currentUser={currentUser} loading={loading} onRefresh={fetchConversations} onContactAdmin={contactAdmin} />
          </Panel>
        </div>

        {/* Middle Panel - Chat Thread */}
        <Panel>
          {activeThreadId && activeThread ? (
            <ChatThread key={activeThread.id} thread={activeThread} messages={messagesByThread[activeThreadId] || []} onSend={(msg, files) => sendMessage(activeThreadId, msg, files)} t={t} isFavorite={favoriteThreads.has(activeThreadId)} isPinned={pinnedThreads.has(activeThreadId)} isArchived={archivedThreads.has(activeThreadId)} toggleFavorite={() => toggleFavorite(activeThreadId)} togglePin={() => togglePin(activeThreadId)} toggleArchive={() => toggleArchive(activeThreadId)} isConnected={isConnected} currentUser={currentUser} />
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

        {/* Right Panel - About (Hidden on mobile) */}
        <div className='lg:block hidden'>
          <Panel>
            <AboutPanel about={aboutUser} t={t} />
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------- PANEL -------------------------------- */
function Panel({ children }) {
  return (
    <div className='card-glow rounded-xl bg-white border border-slate-200 shadow-custom h-fit'>
      <div className='h-fit min-h-[400px] rounded-xl bg-slate-50 p-6'>{children}</div>
    </div>
  );
}

/* ------------------------------ CHAT THREAD ------------------------------ */
function ChatThread({ thread, messages, onSend, t, isFavorite, isPinned, isArchived, toggleFavorite, togglePin, toggleArchive, isConnected, currentUser }) {
  const [text, setText] = useState('');
  const [assets, setAssets] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const emojiRef = useRef(null);

  const addEmoji = emoji => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const scrollBodyToBottom = (behavior = 'smooth') => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if ((!text.trim() && assets.length === 0) || sending) return;

    setSending(true);

    const newMsg = {
      id: crypto.randomUUID(),
      authorId: currentUser?.id ?? 0,
      authorName: 'You',
      authorAvatar: currentUser?.profileImage,
      text: text.trim() || '',
      createdAt: new Date().toLocaleString(),
      me: true,
    };

    try {
      await onSend(newMsg, assets);
      setText('');
      setAssets([]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }

    setTimeout(() => scrollBodyToBottom('auto'), 100);
  };

  // Handle Enter key for sending (Ctrl+Enter)
  const handleKeyDown = e => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  useEffect(() => {
    scrollBodyToBottom('auto');
  }, [thread?.id]);

  useEffect(() => {
    scrollBodyToBottom('smooth');
  }, [messages.length]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (emojiRef.current && !emojiRef.current.contains(e.target) && !e.target.closest?.('[data-emoji-toggle]')) {
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
    <div className='w-full h-full flex flex-col'>
      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-4 border-b border-b-slate-200 pb-5 mb-4'>
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

      {/* Messages Body */}
      <div ref={bodyRef} className='flex-1 px-2 nice-scroll space-y-5 pb-4 overflow-x-hidden overflow-y-auto' style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {messages.length === 0 ? (
          <div className='space-y-4'>
            <MessageSkeletonBubble />
            <MessageSkeletonBubble me />
            <MessageSkeletonBubble />
          </div>
        ) : (
          messages.map(m => <Message key={m.id || m.clientMessageId} avatar={m.authorAvatar} avatarBg='bg-slate-300' name={m.authorName} text={m.text} attachments={m.attachments ?? []} me={m.me} createdAt={m.createdAt} pending={m.pending} failed={m.failed} onZoomImage={src => setLightboxSrc(src)} />)
        )}
      </div>

      {/* Selected assets preview */}
      {assets.length > 0 && (
        <div className='mt-3 flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg'>
          {assets.map((f, i) => {
            const url = f.url || f.path || '';
            const absolute = url ? (url.startsWith('http') ? url : baseImg + url) : '';
            const isImage = f.mimeType?.startsWith?.('image/');
            return (
              <div key={i} className='relative group'>
                {isImage ? (
                  <img src={absolute} alt={f.filename} className='h-20 w-24 rounded-xl object-cover ring-1 ring-slate-200' />
                ) : (
                  <div className='h-20 w-40 rounded-xl ring-1 ring-slate-200 bg-slate-50 p-3 flex items-center gap-2 text-xs'>
                    <Paperclip size={16} />
                    <span className='line-clamp-2'>{f.filename}</span>
                  </div>
                )}
                <button onClick={() => setAssets(prev => prev.filter((_, idx) => idx !== i))} className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors' aria-label='Remove attachment'>
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Input */}
      <div className='mt-4'>
        <form className='flex items-center gap-3 rounded-xl border border-emerald-500 bg-white p-3' onSubmit={handleSubmit}>
          <input ref={inputRef} type='text' placeholder={t('placeholders.message')} className='w-full border-none bg-transparent text-[15px] outline-none text-black' value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} aria-label={t('placeholders.message')} disabled={sending} />

          <div className='flex-none flex items-center gap-2 text-slate-500'>
            <AttachFilesButton onChange={selectedAssets => setAssets(selectedAssets)} />

            <div className='relative flex items-center justify-center' ref={emojiRef}>
              <AccessibleButton type='button' data-emoji-toggle className='cursor-pointer flex-none p-1 rounded-md hover:bg-gray-100' ariaLabel={t('emoji')} title={t('emoji')} onClick={() => setShowEmoji(v => !v)} ariaExpanded={showEmoji} disabled={sending}>
                <Smile size={20} />
              </AccessibleButton>
              <AnimatePresence>
                {showEmoji && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className='absolute w-[220px] right-0 bottom-9 z-50 grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg'>
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
        <p className='text-xs text-gray-500 mt-2 text-center'>Press Ctrl+Enter to send</p>
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
function Message({ avatar, avatarBg = 'bg-slate-200', name, text, attachments = [], me = false, createdAt, onZoomImage, pending, failed }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex gap-4 ${me ? 'flex-row-reverse text-right' : ''}`}>
      <div className='relative h-fit flex-none'>
        {avatar ? <Img altSrc={'/no-user.png'} src={avatar} alt={name} className='h-10 w-10 rounded-full object-cover ring-2 ring-white shadow' /> : <div className={`h-10 w-10 rounded-full ${avatarBg} ring-2 ring-white shadow`} />}
        <span className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500' />
      </div>

      <div className={`flex-1 ${me ? 'items-end' : ''}`}>
        <div className={`flex items-center ${me ? 'justify-end' : 'justify-start'}`}>
          <p className='text-sm font-medium'>{name}</p>
          {pending && <span className='ml-2 text-xs text-gray-500'>Sending...</span>}
          {failed && <span className='ml-2 text-xs text-red-500'>Failed</span>}
        </div>

        <div className={`${me ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-800'} mt-1 inline-block max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${pending ? 'opacity-70' : ''} ${failed ? 'bg-red-100 text-red-800' : ''}`}>
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
function AllMessagesPanel({ items, onSearch, query, onSelect, t, searchResults, showSearchResults, isSearching, onSearchResultClick, activeTab, setActiveTab, toggleFavorite, togglePin, toggleArchive, favoriteThreads, pinnedThreads, archivedThreads, currentUser, loading, onRefresh, onContactAdmin }) {
  return (
    <div className='w-full relative'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-semibold tracking-tight'>{t('allMessages')}</h2>

        <div className='flex items-center gap-1.5'>
          {/* Contact Admin */}
          <button onClick={onContactAdmin} className='p-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors' aria-label='Contact admin' title='Contact admin'>
            <LifeBuoy size={18} />
          </button>

          <button onClick={onRefresh} className='p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors' aria-label='Refresh conversations' title='Refresh'>
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
    <button type='submit' disabled={loading} className={['flex items-center flex-none gap-2 rounded-lg px-3 py-2 text-white shadow', 'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500', loading ? 'bg-emerald-400 cursor-not-allowed' : 'gradient'].join(' ')} aria-label={text} title={text}>
      <Send size={18} className={loading ? 'animate-spin' : ''} />
      <span className='text-sm'>{loading ? 'Sending…' : text}</span>
    </button>
  );
}

/* ───────────────────────────── AttachFilesButton ───────────────────────────── */
import ReactDOM from 'react-dom';
import { FiUpload, FiX } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { File, FileText, ImageIcon, Music, Video } from 'lucide-react';

/** Get file icon based on type */
export const getFileIcon = mimeType => {
  if (mimeType?.startsWith('image')) {
    return <ImageIcon className='w-18 h-full text-blue-500' />;
  } else if (mimeType?.startsWith('video')) {
    return <Video className='w-18 h-full text-purple-500' />;
  } else if (mimeType?.startsWith('audio')) {
    return <Music className='w-18 h-full text-green-500' />;
  } else if (mimeType === 'application/pdf' || mimeType === 'document') {
    return <FileText className='w-18 h-full text-red-500' />;
  } else {
    return <File className='w-18 h-full text-gray-400' />;
  }
};

/**
 * Uploads files to /assets (bulk), lists user assets, lets user select,
 * and returns selected asset objects via onChange.
 */
export function AttachFilesButton({ hiddenFiles, className, onChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOkButton, setShowOkButton] = useState(false);

  // Fetch user assets on modal open
  useEffect(() => {
    if (isModalOpen) {
      fetchUserAssets();
    }
  }, [isModalOpen]);

  const fetchUserAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets');
      setAttachments(response.data.records || response.data || []);
    } catch {
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleFileChange = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('category', 'general');

      const response = await api.post('/assets/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add newly uploaded files to attachments
      const newFiles = response.data.assets || response.data || [];
      setAttachments(prev => [...prev, ...newFiles]);
      showNotification('Files uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading files:', error);
      showNotification('Failed to upload files. Please try again.', 'error');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleFileSelect = file => {
    const exists = selectedFiles.some(f => f.id === file.id);
    const updatedFiles = exists ? selectedFiles.filter(f => f.id !== file.id) : [...selectedFiles, file];

    setSelectedFiles(updatedFiles);
    setShowOkButton(updatedFiles.length > 0);
  };

  const handleOkClick = () => {
    onChange?.(selectedFiles);
    setSelectedFiles([]);
    setShowOkButton(false);
    toggleModal();
  };

  const handleDeleteFile = async (fileId, e) => {
    e.stopPropagation(); // Prevent triggering select
    try {
      await api.delete(`/assets/${fileId}`);
      setAttachments(prev => prev.filter(file => file.id !== fileId));
      setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
      showNotification('File deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting file:', error);
      showNotification('Failed to delete file. Please try again.', 'error');
    }
  };

  const modalContent = (
    <div
      className='fixed inset-0 z-50 bg-gray-800/50 backdrop-blur-lg flex items-center justify-center transition-opacity duration-300 ease-in-out'
      onClick={e => {
        if (e.target === e.currentTarget) {
          toggleModal();
        }
      }}>
      <div className='bg-white p-6 rounded-lg w-full max-w-[90vw] sm:max-w-[700px] shadow-lg max-h-[80vh] overflow-hidden flex flex-col'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold'>Uploaded Attachments</h3>
          <button onClick={toggleModal} className='p-2 hover:bg-gray-100 rounded-full transition-colors' aria-label='Close'>
            <X size={20} />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto'>
          <div>
            <h3 className='text-sm font-semibold text-gray-700 mb-3'>Your Files</h3>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 p-2 bg-gray-50 border border-gray-200 rounded-lg'>
              {/* Upload Button */}
              <label className='hover:scale-[.98] flex flex-col items-center justify-center text-center p-2 h-[130px] w-full border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition duration-300 relative'>
                <input type='file' className='sr-only' onChange={handleFileChange} multiple disabled={uploading || loading} />
                <FiUpload className='h-6 w-6 text-indigo-400' />
                <span className='mt-1 text-xs text-indigo-600'>Upload</span>

                {(uploading || loading) && (
                  <div className='absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg'>
                    <FaSpinner className='animate-spin h-5 w-5 text-indigo-500' />
                  </div>
                )}
              </label>

              {/* User Uploaded Files */}
              {attachments.map(asset => {
                const isSelected = selectedFiles.some(f => f.id === asset.id);
                const absolute = asset.url ? (asset.url.startsWith('http') ? asset.url : baseImg + asset.url) : '';
                const isImage = asset.mimeType?.startsWith?.('image/');
                return (
                  <div key={asset.id} onClick={() => handleFileSelect(asset)} className={`cursor-pointer hover:scale-[.98] duration-300 h-fit group relative shadow-inner rounded-lg border border-gray-200 hover:border-indigo-400 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2 bg-white ${isSelected ? '!border-[var(--main)] !bg-[var(--main)]/20 border' : ''}`}>
                    <button onClick={e => handleDeleteFile(asset.id, e)} className='absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity'>
                      <FiX className='w-3 h-3' />
                    </button>

                    {isImage ? <img src={absolute} alt={asset.filename} className='aspect-square mx-auto w-[100px] object-contain rounded' /> : <div className='mx-auto aspect-square w-[100px] flex items-center justify-center rounded-md'>{getFileIcon(asset.mimeType)}</div>}
                    <p className='mt-2 text-xs text-gray-600 text-center truncate' title={asset.filename}>
                      {asset.filename}
                    </p>
                    <p className='text-xs text-gray-400'>{Math.round((asset.size || 0) / 1024)} KB</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* OK Button */}
        {showOkButton && (
          <div className='flex justify-center mt-4 pt-4 border-t'>
            <button onClick={handleOkClick} className='cursor-pointer px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'>
              Finish Selection ({selectedFiles.length} files selected)
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className || ''}`}>
      <div className='flex items-center gap-4'>
        <div onClick={toggleModal} className='flex-none px-4 sm:px-6 flex items-center gap-2 py-2 rounded-4xl border border-[#108A00] text-[#108A00] cursor-pointer hover:bg-green-50 transition-colors' type='button' aria-label='Attach files'>
          <img src={'/icons/attachment-green.svg'} alt='' className='w-5 h-5' />
          <span className='font-medium text-sm sm:text-base'>Attach Files</span>
        </div>

        {!hiddenFiles && selectedFiles.length > 0 && (
          <ul className='flex flex-wrap items-center gap-2 w-full'>
            {selectedFiles.map((file, index) => (
              <li key={index} className='flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm'>
                <span className='truncate max-w-[120px]' title={file.filename}>
                  {file.filename}
                </span>
                <button onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))} className='text-red-500 hover:text-red-700' aria-label={`Remove ${file.filename}`}>
                  <FiX className='w-3 h-3' />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
}

export default ChatApp;
