'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations as useTranslation } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import io from 'socket.io-client';
import { Star } from 'lucide-react';
import api, { baseImg } from '@/lib/axios';

import { AllMessagesPanel } from '@/components/pages/chat/AllMessagesPanel';
import { ChatThread } from '@/components/pages/chat/ChatThread';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';

/** ───────────────────────────────── SOCKET REF ───────────────────────────────── */
let socket;

/* ------------------------------ SKELETONS ------------------------------ */
export const Shimmer = ({ className = '' }) => (
  <div className={`relative overflow-hidden rounded-lg bg-slate-200/60 ${className}`}>
    <div className='absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent' />
  </div>
);

export const MessageSkeletonBubble = ({ me = false }) => (
  <div className={`flex gap-4 ${me ? 'flex-row-reverse' : ''}`}>
    <Shimmer className="h-10 w-10 rounded-full flex-shrink-0" />
    <div className="flex flex-col gap-2 w-full max-w-[calc(100%-3.5rem)]">
      <Shimmer className="h-3 w-[40%] sm:w-24" />
      <div className={`${me ? 'bg-emerald-500/30' : 'bg-slate-200/70'} rounded-2xl p-3`}>
        <Shimmer className="h-4 w-full max-w-[80%] mb-2" />
        <Shimmer className="h-4 w-full max-w-[60%]" />
      </div>
    </div>
  </div>
);


/* ------------------------------ NOTIFICATION FUNCTION ------------------------------ */
const showNotification = (message, type = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(message);
  }
};

/* ------------------------------ CHAT LOGIC ------------------------------ */

const pickOtherParty = (conv, meId) => {
  const buyer = conv.buyer || {};
  const seller = conv.seller || {};

  const buyerId = conv.buyerId || buyer.id;
  const sellerId = conv.sellerId || seller.id;

  const amBuyer = meId && buyerId && String(buyerId) === String(meId);
  const amSeller = meId && sellerId && String(sellerId) === String(meId);

  if (amBuyer) return seller || {};
  if (amSeller) return buyer || {};

  if (buyerId && String(buyerId) !== String(meId)) return buyer || {};
  if (sellerId && String(sellerId) !== String(meId)) return seller || {};

  if (buyer?.id && buyer.id !== meId) return buyer;
  if (seller?.id && seller.id !== meId) return seller;

  return {};
};

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
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  // live refs so socket handlers always see latest values
  const activeThreadIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const messagesByThreadRef = useRef({});
  const threadsRef = useRef([]);
  const { user } = useAuth();

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  useEffect(() => {
    messagesByThreadRef.current = messagesByThread;
  }, [messagesByThread]);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

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

  const normalizeMessage = useCallback((m, currentUserId) => {
    if (m && 'text' in m && ('me' in m || 'authorId' in m)) return m;
    const senderId = (m.sender && m.sender.id) || m.senderId;
    const me = String(senderId) === String(currentUserId);
    const createdRaw = m.created_at || m.createdAt;
    const atts = Array.isArray(m.attachments) ? m.attachments : [];
    const attUrls = atts.map(a => (a.url ? (a.url.startsWith('http') ? a.url : baseImg + a.url) : a));
    return {
      id: m.id,
      clientMessageId: m.clientMessageId,
      authorId: senderId,
      authorName: me ? 'You' : (m.sender && m.sender.username) || m.authorName || 'User',
      authorAvatar: me ? (m.sender && m.sender.profileImage) || m.authorAvatar : (m.sender && m.sender.profileImage) || m.authorAvatar,
      text: m.message || m.text || '',
      attachments: attUrls,
      createdAt: createdRaw ? new Date(createdRaw).toLocaleString() : new Date().toLocaleString(),
      me,
    };
  }, []);

  // ── INIT ──
  useEffect(() => {
    const token = user.accessToken;
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
    }

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_user', user.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // 🟢 NEW MESSAGE HANDLER: de-dupe, update messages, keep unread in sync, handle unknown conversations
    const handleNewMessage = serverMsg => {
      const currentUserId = currentUserIdRef.current;
      const uiMsg = normalizeMessage(serverMsg, currentUserId);
      const cid = serverMsg.conversationId;

      setMessagesByThread(prev => {
        const list = prev[cid] || [];

        const isDuplicate = list.some(m => (m.id && m.id === uiMsg.id) || (m.clientMessageId && m.clientMessageId === uiMsg.clientMessageId));
        if (isDuplicate) return prev;

        if (uiMsg.clientMessageId) {
          const optimisticIndex = list.findIndex(m => m.clientMessageId === uiMsg.clientMessageId);
          if (optimisticIndex !== -1) {
            const next = [...list];
            next[optimisticIndex] = { ...uiMsg, pending: false };
            return { ...prev, [cid]: next };
          }
        }

        return { ...prev, [cid]: [...list, { ...uiMsg, pending: false }] };
      });

      const isForOpenThread = activeThreadIdRef.current === cid;
      const fromOther = (serverMsg.senderId || (serverMsg.sender && serverMsg.sender.id)) !== currentUserId;

      if (isForOpenThread && fromOther) {
        markAsRead(cid);
      } else {
        setThreads(prev => {
          const exists = prev.some(t => t.id === cid);
          if (!exists) {
            // Unknown conversation -> fetch full list (keeps sort & metadata correct)
            queueMicrotask(() => fetchConversations());
            return prev;
          }
          // Update the existing thread's unread/lastMessageAt; sorting will react to lastMessageAt
          const updated = prev.map(t =>
            t.id === cid
              ? {
                ...t,
                unreadCount: (t.unreadCount || 0) + 1,
                lastMessageAt: new Date().toISOString(),
              }
              : t,
          );
          return sortThreads(updated);
        });
      }
    };

    socket.on('new_message', handleNewMessage);

    // Some backends emit a lighter notification event too
    socket.on('message_notification', n => {
      const cid = n.conversationId;
      setThreads(prev => {
        const exists = prev.some(t => t.id === cid);
        if (!exists) {
          queueMicrotask(() => fetchConversations());
          return prev;
        }
        const updated = prev.map(t => (t.id === cid ? { ...t, unreadCount: (t.unreadCount || 0) + 1, lastMessageAt: new Date().toISOString() } : t));
        return sortThreads(updated);
      });
    });

    // Optional: support server-side creation events
    socket.on('new_conversation', () => {
      fetchConversations();
    });

    socket.on('error', error => {
      console.error('Socket error:', error);
      showNotification(error.message || 'Connection error', 'error');
    });

    // initial loads
    fetchTotalUnreadCount();
    fetchConversations();

    const fav = localStorage.getItem('favoriteThreads');
    if (fav) setFavoriteThreads(new Set(JSON.parse(fav)));
    const pin = localStorage.getItem('pinnedThreads');
    if (pin) setPinnedThreads(new Set(JSON.parse(pin)));
    const arch = localStorage.getItem('archivedThreads');
    if (arch) setArchivedThreads(new Set(JSON.parse(arch)));

    return () => {
      if (socket) {
        socket.off('new_message', handleNewMessage);
        socket.off('message_notification');
        socket.off('new_conversation');
        socket.off('error');
        // do not disconnect here if you reuse this component often; safe to keep
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, normalizeMessage]);

  const fetchTotalUnreadCount = async () => {
    try {
      const { data } = await api.get('/conversations/unread/count');
      setTotalUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // ✅ DERIVE TOTAL UNREAD FROM THREADS (fixes “disappear until refresh”)
  useEffect(() => {
    const total = threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0);
    setTotalUnreadCount(total);
  }, [threads]);

  // Remove the old updateTotalUnreadCount() write-to-threads helper entirely

  // Auto-select target user if provided
  useEffect(() => {
    if (targetUserId && currentUser && threads.length) {
      const existing = threads.find(t => String(t.otherUserId) === String(targetUserId));
      if (existing) {
        if (activeThreadId !== existing.id) selectThread(existing.id);
      } else {
        createConversation(targetUserId).then(created => {
          if (created?.id) selectThread(created.id);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, currentUser, threads.length, activeThreadId]);

  useEffect(() => {
    setCurrentUser(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortThreads = useCallback(
    list => {
      const withLocal = list.map(t => ({
        ...t,
        isFavorite: t.isFavorite || favoriteThreads.has(t.id),
        isPinned: pinnedThreads.has(t.id),
        isArchived: archivedThreads.has(t.id),
      }));
      return withLocal.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
      });
    },
    [favoriteThreads, pinnedThreads, archivedThreads],
  );

  const fetchConversations = async (page = 1) => {

    const meId = user.id;

    try {
      setLoading(true);
      const { data } = await api.get(`/conversations?page=${page}`);
      const list = data.conversations || data || [];

      const formatted = list.map(conv => {
        const other = pickOtherParty(conv, meId);

        return {
          id: conv.id,
          name: other?.username || 'User',
          email: other?.email,
          avatar: other?.profileImage || '/default-avatar.png',
          active: false,
          time: formatTime(conv.lastMessageAt),
          unreadCount: conv.unreadCount || 0,
          about: {
            name: other?.username || '—',
            from: formatDate(conv.lastMessageAt),
            onPlatform: other?.memberSince ? 'Member since ' + formatDate(other.memberSince) : '—',
            english: 'Intermediate',
            otherLang: 'Native language',
            level: 'Level 1',
            responseRate: '3.4 hrs',
            rating: '5 (1)',
          },
          otherUserId: other?.id || (String(conv.buyerId) !== String(meId) ? conv.buyerId : conv.sellerId),
          isFavorite: conv.isFavorite || false,
          isPinned: false,
          isArchived: false,
          lastMessageAt: conv.lastMessageAt,
        };
      });

      setThreads(prev => {
        // Keep pin/fav/archive local toggles when possible
        const prevById = Object.fromEntries(prev.map(t => [t.id, t]));
        const merged = formatted.map(t => ({
          ...t,
          isFavorite: prevById[t.id]?.isFavorite ?? t.isFavorite,
          isPinned: prevById[t.id]?.isPinned ?? false,
          isArchived: prevById[t.id]?.isArchived ?? false,
        }));
        return sortThreads(merged);
      });
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

  const debouncedQuery = useDebounce({ value: query })
  useEffect(() => {
    if (query.trim()) {
      searchUsers(query);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedQuery]);

  const handleSearch = q => {
    setQuery(q);
  };

  const handleSearchResultClick = async user => {
    const existing = threadsRef.current.find(t => t.otherUserId === user.id);
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
      const selected = threadsRef.current.find(t => t.id === id);
      if (selected) setAboutUser(selected.about || {});
      if (socket) socket.emit('join_conversation', id);
      fetchMessages(id);
      markAsRead(id); // mark read on open
      if (targetUserId) router.replace('/en/chat', { scroll: false });
    },
    [targetUserId, router],
  );

  const sendMessage = async (conversationId, messageData, files = []) => {
    const clientMessageId = crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    const optimisticMessage = {
      ...messageData,
      clientMessageId,
      pending: true,
      id: clientMessageId,
      attachments: files.map(file => file.url || file.path || ''),
      createdAt: new Date().toLocaleString(),
      me: true,
      authorName: 'You',
      authorAvatar: currentUser?.profileImage,
      authorId: currentUser?.id,
    };

    setMessagesByThread(prev => {
      const list = prev[conversationId] || [];
      return { ...prev, [conversationId]: [...list, optimisticMessage] };
    });

    try {
      const payload = {
        message: messageData.text || '',
        attachments: files.map(file => file.id || file.assetId).filter(Boolean),
      };
      await api.post(`/conversations/${conversationId}/message`, payload);
      // server will emit the message via socket, which replaces the optimistic one
    } catch (error) {
      console.error('Error sending message:', error);
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
      const { data } = await api.post(`/conversations`, {
        otherUserId,
        serviceId,
        orderId,
        initialMessage,
      });
      // Refresh list so both browsers get it
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
      const { data: settings } = await api.get('/settings');
      let adminId = settings?.platformAccountUserId;

      if (!adminId) {
        const { data: adminUser } = await api.get('/users/admin');
        adminId = adminUser?.id;
      }

      if (!adminId) {
        adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
      }

      if (!adminId) {
        showNotification('Admin contact unavailable.', 'error');
        return;
      }

      const existing = threadsRef.current.find(t => String(t.otherUserId) === String(adminId));
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
    totalUnreadCount,
    fetchTotalUnreadCount,
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

/* --------------------------------- APP --------------------------------- */
const ChatApp = () => {
  const t = useTranslation('Chat');
  useKeyboardShortcuts();

  const { threads, activeThreadId, messagesByThread, aboutUser, query, isConnected, currentUser, searchResults, showSearchResults, isSearching, activeTab, setActiveTab, handleSearch, selectThread, sendMessage, handleSearchResultClick, setQuery, toggleFavorite, togglePin, toggleArchive, favoriteThreads, pinnedThreads, archivedThreads, loading, fetchConversations, contactAdmin, totalUnreadCount } = useChat();

  const activeThread = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId]);

  return (
    <div className='divider'>
      <div className='container  grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_300px] md:grid-cols-1'>
        {/* Left Panel - Conversations List */}
        <div className=' '>
          <Panel>
            {/* Example: unread badge spot if you want it in your UI header
            {totalUnreadCount > 0 && <span>{totalUnreadCount > 99 ? '99+' : totalUnreadCount}</span>}
            */}
            <AllMessagesPanel items={threads} onSearch={handleSearch} query={query} onSelect={selectThread} t={t} searchResults={searchResults} showSearchResults={showSearchResults} isSearching={isSearching} onSearchResultClick={handleSearchResultClick} activeTab={activeTab} setActiveTab={setActiveTab} toggleFavorite={toggleFavorite} togglePin={togglePin} toggleArchive={toggleArchive} favoriteThreads={favoriteThreads} pinnedThreads={pinnedThreads} archivedThreads={archivedThreads} currentUser={currentUser} loading={loading} onRefresh={() => fetchConversations()} onContactAdmin={contactAdmin} />
          </Panel>
        </div>

        {/* Middle Panel - Chat Thread */}
        <Panel>
          {activeThreadId && activeThread ? (
            <ChatThread key={activeThread.id} thread={activeThread} messages={messagesByThread[activeThreadId] || []} onSend={(msg, files) => sendMessage(activeThreadId, msg, files)} t={t} isFavorite={favoriteThreads.has(activeThreadId)} isPinned={pinnedThreads.has(activeThreadId)} isArchived={archivedThreads.has(activeThreadId)} toggleFavorite={() => toggleFavorite(activeThreadId)} togglePin={() => togglePin(activeThreadId)} toggleArchive={() => toggleArchive(activeThreadId)} isConnected={isConnected} currentUser={currentUser} />
          ) : (
            <div className='max-h-[490px]  flex flex-col items-center justify-center h-full p-6 text-center'>
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
        <div className=' '>
          <Panel>
            <AboutPanel about={aboutUser} t={t} />
          </Panel>
        </div>
      </div>
    </div>
  );
};

export function Panel({ children }) {
  return (
    <div className='card-glow rounded-xl bg-white border border-slate-200 shadow-custom h-fit'>
      <div className='h-fit min-h-[400px] rounded-xl bg-slate-50 p-6'>{children}</div>
    </div>
  );
}

/* ------------------------------- ABOUT ------------------------------- */
export function AboutPanel({ about = {}, t }) {
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
      <dt className='text-sm font-medium text-gray-600 whitespace-nowrap '>{label}</dt>
      <dd title={typeof value === 'string' ? value : undefined} className='text-sm text-gray-900 whitespace-nowrap truncate'>
        {value}
      </dd>
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

export default ChatApp;
