'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations as useTranslation } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import io from 'socket.io-client';
import { Star } from 'lucide-react';
import api from '@/lib/axios';
import { AllMessagesPanel } from '@/components/pages/chat/AllMessagesPanel';
import { ChatThread } from '@/components/pages/chat/ChatThread';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { showNotification } from '@/utils/notifications';
import { isErrorAbort } from '@/utils/helper';
import { useValues } from '@/context/GlobalContext';
import { useSocket } from '@/context/SocketContext';


/** ───────────────────────────────── SOCKET REF ───────────────────────────────── */
// Socket is now managed via useRef inside useChat hook

/* ------------------------------ SKELETONS ------------------------------ */
export const Shimmer = ({ className = '', animated = false }) => (
  <div className={`${animated ? "animate-pulse bg-slate-200" : "bg-slate-200/60 "} relative overflow-hidden rounded-lg ${className}`}>
    <div className='absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent' />
  </div>
);

export const MessageSkeletonBubble = ({ me = false, animated = false }) => (
  <div className={`flex gap-4 ${me ? 'flex-row-reverse' : ''}`}>
    <Shimmer className="h-10 w-10 rounded-full flex-shrink-0" animated={animated} />
    <div className="flex flex-col gap-2 w-full max-w-[calc(100%-3.5rem)]">
      <Shimmer className="h-3 w-[40%] sm:w-24" animated={animated} />
      <div className={`${animated ? me ? 'animate-pulse bg-emerald-500/50' : 'animate-pulse bg-slate-200/90' : me ? 'bg-emerald-500/30' : 'bg-slate-200/70'} rounded-2xl p-3`}>
        <Shimmer className="h-4 w-full max-w-[80%] mb-2" animated={animated} />
        <Shimmer className="h-4 w-full max-w-[60%]" animated={animated} />
      </div>
    </div>
  </div>
);

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

  const [userPagination, setUserPagination] = useState({
    page: 1,
    pages: 1
  })
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messagesByThread, setMessagesByThread] = useState(() => new Map());
  const [messagesPaginationByThread, setMessagesPaginationByThread] = useState(() => new Map());

  const [aboutUser, setAboutUser] = useState({});
  const [query, setQuery] = useState('');
  //initail user id from access token to able detect me messges when user not fetched yet
  const [currentUser, setCurrentUser] = useState({ id: null });
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [favoriteThreads, setFavoriteThreads] = useState(() => {
    const fav = localStorage.getItem('favoriteThreads');
    return fav ? new Set(JSON.parse(fav)) : new Set();
  });

  const [pinnedThreads, setPinnedThreads] = useState(() => {
    const pin = localStorage.getItem('pinnedThreads');
    return pin ? new Set(JSON.parse(pin)) : new Set();
  });

  const [archivedThreads, setArchivedThreads] = useState(() => {
    const arch = localStorage.getItem('archivedThreads');
    return arch ? new Set(JSON.parse(arch)) : new Set();
  });

  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  // live refs so socket handlers always see latest values
  const activeThreadIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const messagesByThreadRef = useRef(new Map());
  const messagesPaginationByThreadRef = useRef(new Map());
  const threadsRef = useRef([]);
  const { user } = useAuth();

  const {
    isConnected,
    setUnreadChatCount,
    // Publisher/Subscriber
    subscribe,
    // External controls
    incrementUnread,
  } = useSocket()

  useEffect(() => {
    const handleNewMessage = serverMsg => {
      const currentUserId = currentUserIdRef.current;
      const cid = serverMsg?.conversationId;
      const other = serverMsg?.sender;
      const uiMsg = normalizeMessage(serverMsg, currentUserId);

      //show conversation item at top regardless of pagination when conversation not exist at currunt shown conversations.
      if (other.id !== user?.id && !threadsRef.current.some(c => c.id === serverMsg?.conversationId)) {
        const conversationId = serverMsg?.conversationId;
        setThreads(prev => {
          const newConversation = {
            id: conversationId,
            name: other?.username || t('user'),
            email: other?.email,
            avatar: other?.profileImage || '/default-avatar.png',
            active: false,
            time: formatTime(serverMsg?.created_at),
            unreadCount: 1,
            about: {
              id: other?.id,
              name: other?.username || '—',
              from: formatDate(serverMsg?.created_at),
              onPlatform: other?.memberSince ? 'Member since ' + formatDate(other.memberSince) : '—',
              languages: other?.languages?.join(', ') || '—',
              level: other?.sellerLevel ? other?.sellerLevel : '—',
              responseRate: other?.responseTime ? `${other.responseTime} hrs` : '—',
              ordersCompleted: other?.ordersCompleted ?? 0,
              role: other?.role ?? 'member',
              topRated: other?.topRated ?? false,
            }
            ,
            otherUserId: other?.id,
            isFavorite: false,
            isPinned: false,
            isArchived: false,
            lastMessageAt: serverMsg?.created_at,
          }
          return sortThreads([newConversation, ...prev])
        })

        // Trigger highlight animation after DOM update
        setTimeout(() => {
          const el = document.querySelector(`[data-conversation-id="${conversationId}"]`);
          if (el) el.classList.add("highlight");
        }, 50);

        return;
      }

      //only add message if messages for this conversation already loaded
      if (messagesByThreadRef.current.has(cid)) {
        setMessagesByThread(prev => {
          const updated = new Map(prev);
          const list = updated.get(cid) || [];

          const isDuplicate = list.some(m => (m.id && m.id === uiMsg.id) || (m.clientMessageId && m.clientMessageId === uiMsg.clientMessageId));
          if (isDuplicate) return prev;

          if (uiMsg.clientMessageId) {
            const optimisticIndex = list.findIndex(m => m.clientMessageId === uiMsg.clientMessageId);
            if (optimisticIndex !== -1) {
              const next = [...list];
              next[optimisticIndex] = { ...uiMsg, pending: false };
              updated.set(cid, next);
              return updated;
            }
          }

          updated.set(cid, [...list, { ...uiMsg, pending: false }]);
          return updated;
        });
      }

      const isForOpenThread = activeThreadIdRef.current === cid;
      const fromOther = (serverMsg?.senderId || (serverMsg?.sender && serverMsg?.sender.id)) !== currentUserId;

      if (isForOpenThread && fromOther) {
        markAsRead(cid);
      }

      if (!isForOpenThread) {
        incrementUnread(1)
      }

      // Update the existing thread's unread/lastMessageAt; sorting will react to lastMessageAt
      if (!isForOpenThread && fromOther) {
        setThreads(prev => {
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

    const unsubscribe = subscribe(({ type, payload }) => {
      if (type === "NEW_MESSAGE") {
        const msg = payload;

        handleNewMessage(msg)
      }
    });

    return () => unsubscribe();
  }, []);

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
    messagesPaginationByThreadRef.current = messagesPaginationByThread;
  }, [messagesPaginationByThread]);

  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const conversationMap = useMemo(() => {
    const map = new Map();
    for (const thread of threads) {
      map.set(thread.id, thread);
    }
    return map;
  }, [threads]);


  const t = useTranslation('Chat');
  const formatTime = useCallback(dateString => {
    if (!dateString) return t('justNow');
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = +now - +date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('timeAgo.minutes', { count: diffMins });
    if (diffHours < 24) return t('timeAgo.hours', { count: diffHours });
    if (diffDays < 7) return t('timeAgo.days', { count: diffDays });
    return date.toLocaleDateString();
  }, [t]);

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
    // const attUrls = atts.map(a => (a.url ? (a.url.startsWith('http') ? a.url : baseImg + a.url) : a));
    return {
      id: m.id,
      clientMessageId: m.clientMessageId,
      authorId: senderId,
      authorName: me ? t('you') : (m.sender && m.sender.username) || m.authorName || t('user'),
      authorAvatar: me ? (m.sender && m.sender.profileImage) || m.authorAvatar : (m.sender && m.sender.profileImage) || m.authorAvatar,
      text: m.message || m.text || '',
      attachments: atts,
      createdAt: createdRaw ? new Date(createdRaw).toLocaleString() : new Date().toLocaleString(),
      me,
    };
  }, [t]);




  //initial fetch conversations

  useEffect(() => {
    const sortUserId = user?.id;
    if (sortUserId) {
      fetchConversations(userPagination.page);
    }
  }, [user?.id, userPagination.page]);



  // Auto-select target user if provided
  useEffect(() => {
    async function create() {
      if (loading) return;

      if (targetUserId && currentUser) {
        const existing = threads.find(t => String(t.otherUserId) === String(targetUserId));
        if (existing) {
          if (activeThreadId !== existing.id) selectThread(existing.id);
        } else {
          await createConversation(targetUserId)
        }
      }
    }
    create();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, currentUser, threads.length, activeThreadId]);

  useEffect(() => {
    setCurrentUser(user || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const sortThreads = useCallback(
    list => {
      const withLocal = list.map(t => ({
        ...t,
        isFavorite: t.isFavorite || favoriteThreads.has(t.id),
        isPinned: pinnedThreads.has(t.id),
        isArchived: archivedThreads.has(t.id),
      }));

      return sortByThreadPriority(withLocal);
    },

    [favoriteThreads, pinnedThreads, archivedThreads],
  );

  function sortByThreadPriority(list) {
    const getPriority = t => {
      if (t.isPinned && t.isFavorite) return 3;
      if (t.isPinned) return 2;
      if (t.isFavorite) return 1;
      return 0;
    };

    return list.sort((a, b) => {
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      if (priorityA !== priorityB) return priorityB - priorityA;

      return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
    });
  }

  const formatConversation = useCallback((conv) => {
    const meId = user?.id;

    if (!meId) {
      console.warn('No user ID available to fetch conversations.');
      return;
    }

    const other = pickOtherParty(conv, meId);

    return {
      id: conv.id,
      name: other?.username || t('user'),
      email: other?.email,
      avatar: other?.profileImage || '/default-avatar.png',
      active: false,
      time: formatTime(conv.lastMessageAt),
      unreadCount: conv.unreadCount || 0,
      about: {
        id: other?.id,
        name: other?.username || '—',
        from: formatDate(conv.lastMessageAt),
        onPlatform: other?.memberSince ? t('memberSince', { date: formatDate(other.memberSince) }) : '—',
        languages: other?.languages?.join(', ') || '—',
        level: other?.sellerLevel ? other?.sellerLevel : '—',
        responseRate: other?.responseTime ? `${other.responseTime} hrs` : '—',
        ordersCompleted: other?.ordersCompleted ?? 0,
        role: other?.role ?? 'member',
        topRated: other?.topRated ?? false,
      }
      ,
      otherUserId: other?.id || (String(conv.buyerId) !== String(meId) ? conv.buyerId : conv.sellerId),
      isFavorite: conv.isFavorite || false,
      isPinned: false,
      isArchived: false,
      lastMessageAt: conv.lastMessageAt,
    };
  }, [user, t, formatTime, formatDate])

  const conversationsApiRef = useRef(null)
  const fetchConversations = useCallback(async (page = 1, options = { silent: false }) => {
    const meId = user?.id;

    if (!meId) {
      console.warn('No user ID available to fetch conversations.');
      return;
    }

    // Cancel previous request
    if (conversationsApiRef.current) {
      conversationsApiRef.current.abort();
    }
    const controller = new AbortController();
    conversationsApiRef.current = controller;

    try {
      // Only show loading spinner if not silent
      if (!options.silent) {
        setLoading(true);
      }
      const { data } = await api.get(`/conversations?page=${page}`, {
        signal: controller.signal
      });
      const list = data.conversations || [];

      setUserPagination((p) => ({
        ...p,
        page: data?.pagination?.page || 1,
        pages: data?.pagination?.pages || 1
      }))
      const formatted = list.map(conv => {
        return formatConversation(conv);
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
      if (!isErrorAbort(error)) {

        console.error('Error fetching conversations:', error);
        showNotification('Failed to load conversations', 'error');
      }
    } finally {
      // Only clear loading if THIS request is still the active one
      if (conversationsApiRef.current === controller && !options.silent)
        setLoading(false);
    }
  }, [user]);

  const [loadingMessagesId, setLaodingMessagesId] = useState(false)
  const [loadingOlderThreads, setLoadingOlderThreads] = useState(() => new Set());

  const messagesApiRef = useRef(null)
  const fetchMessages = useCallback(async (conversationId, page = 1, { append = false } = {}) => {
    try {
      if (messagesApiRef.current) {
        messagesApiRef.current.abort();
      }
      messagesApiRef.current = new AbortController();


      if (append) {
        setLoadingOlderThreads(prev => {
          const next = new Set(prev);
          next.add(conversationId);
          return next;
        });
      } else {
        setLaodingMessagesId(conversationId);
      }

      const { data } = await api.get(`/conversations/${conversationId}/messages?page=${page}`, {
        signal: messagesApiRef.current.signal
      });
      const currentUserId = currentUserIdRef.current ?? currentUser?.id;
      const msgs = (data.messages || data || []).map(m => normalizeMessage(m, currentUserId));

      setMessagesByThread(prev => {
        const updated = new Map(prev);
        if (append) {
          const existing = updated.get(conversationId) || [];
          const combined = [...msgs, ...existing];
          const seen = new Set();
          const deduped = combined.filter(msg => {
            const key = msg.id || msg.clientMessageId || `${msg.authorId}-${msg.createdAt}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          updated.set(conversationId, deduped);
        } else {
          updated.set(conversationId, msgs);
        }
        return updated;
      });

      setMessagesPaginationByThread(prev => {
        const updated = new Map(prev);
        const pagination = data?.pagination || { page, pages: page, total: msgs.length, limit: msgs.length };
        updated.set(conversationId, pagination);
        return updated;
      });

    } catch (error) {
      if (!isErrorAbort(error)) {
        console.error('Error fetching messages:', error);
        showNotification('Failed to load messages', 'error');
      }
    } finally {
      messagesApiRef.current = null;
      if (append) {
        setLoadingOlderThreads(prev => {
          const next = new Set(prev);
          next.delete(conversationId);
          return next;
        });
      } else {
        setLaodingMessagesId(null);
      }
    }
  }, [currentUser?.id, normalizeMessage]);

  const loadOlderMessages = useCallback(conversationId => {
    if (loadingOlderThreads.has(conversationId)) return;
    const pagination =
      messagesPaginationByThreadRef.current.get(conversationId) ||
      messagesPaginationByThread.get(conversationId);
    const currentPage = pagination?.page || 1;
    const totalPages = pagination?.pages || 1;
    if (currentPage >= totalPages) return;
    fetchMessages(conversationId, currentPage + 1, { append: true });
  }, [fetchMessages, loadingOlderThreads, messagesPaginationByThread]);

  const markAsRead = async conversationId => {
    try {
      const thread = threadsRef.current.find(t => t.id === conversationId);
      const unreadCount = thread?.unreadCount || 0;

      await api.post(`/conversations/${conversationId}/read`);
      setThreads(prev => prev.map(t => (t.id === conversationId ? { ...t, unreadCount: 0 } : t)));

      // Decrease global unread count by the number of messages marked as read
      if (unreadCount > 0) {
        setUnreadChatCount(prev => Math.max(0, prev - unreadCount));
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
    if (q.trim().length < 2) {
      return;
    }
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const { data } = await api.get(`/conversations/search/users?query=${encodeURIComponent(q)}`);
      setSearchResults(data);

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
    const existing = threadsRef.current.find(t => t.otherUserId === user?.id);
    if (existing) {
      selectThread(existing.id);
    } else {
      await createConversation(user?.id);
    }
    setQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  function onCloseSearchMenu() {
    setQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  }

  const selectThread = useCallback(
    id => {
      setActiveThreadId(id);
      setThreads(prev => prev.map(t => ({ ...t, active: t.id === id })));
      const selected = threadsRef.current.find(t => t.id === id);
      if (selected) setAboutUser(selected.about || {});

      if (!messagesByThreadRef.current.has(id)) {
        fetchMessages(id);
      }
      markAsRead(id); // mark read on open

      if (targetUserId) router.replace('/en/chat', { scroll: false });
    },
    [targetUserId, router, fetchMessages],
  );

  const sendMessage = async (conversationId, messageData, files = []) => {
    const clientMessageId = crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());


    const optimisticMessage = {
      ...messageData,
      clientMessageId,
      pending: true,
      id: clientMessageId,
      attachments: files,
      createdAt: new Date().toLocaleString(),
      me: true,
      authorName: 'You',
      authorAvatar: currentUser?.profileImage,
      authorId: currentUser?.id,
    };
    setMessagesByThread(prev => {
      const updated = new Map(prev);
      const list = updated.get(conversationId) || [];
      updated.set(conversationId, [...list, optimisticMessage]);
      return updated;
    });


    try {
      const payload = {
        message: messageData.text || '',
        attachments: files
          .map(file => ({
            url: file?.url || file?.path,
            type: file?.mimeType || file?.type,
            filename: file?.filename || file?.name,
          }))
      };

      await api.post(`/conversations/${conversationId}/message`, payload);
      // server will emit the message via socket, which replaces the optimistic one
    } catch (error) {
      console.error('Error sending message:', error);
      setMessagesByThread(prev => {
        const updated = new Map(prev);
        const list = updated.get(conversationId) || [];

        const updatedList = list.map(msg =>
          msg.clientMessageId === clientMessageId
            ? { ...msg, pending: false, failed: true }
            : msg
        );

        updated.set(conversationId, updatedList);
        return updated;
      });

      showNotification('Failed to send message', 'error');
    }
  };

  const createConversation = async (otherUserId, serviceId, orderId, initialMessage) => {
    const toastId = showNotification('Creating conversation...', 'loading');
    try {
      const { data } = await api.post(`/conversations`, {
        otherUserId,
        serviceId,
        orderId,
        initialMessage,
      });
      const newConversation = formatConversation(data)
      const conversationId = newConversation?.id;
      setThreads(prev => {
        const exists = prev.some(t => t.id === conversationId);

        if (!exists) {
          const updated = [newConversation, ...prev];
          return sortThreads(updated);
        }

        return prev;
      })

      selectThread(conversationId);

      setTimeout(() => {
        const el = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (el) el.classList.add("highlight");
      }, 50);


      showNotification('Conversation created successfully', 'success', toastId);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      showNotification('Failed to create conversation', 'error', toastId);
      return null;
    }
  };

  const toggleFavorite = async threadId => {
    const thread = conversationMap.get(threadId);
    const name = thread?.name || 'contact';
    const toastId = toast.loading(`Updating favorite for ${name}...`);

    try {
      const { data } = await api.post(`/conversations/${threadId}/favorite`);
      setThreads(prev => prev.map(t => (t.id === threadId ? { ...t, isFavorite: data.isFavorite } : t)));
      setFavoriteThreads(prev => {
        const next = new Set(prev);
        data.isFavorite ? next.add(threadId) : next.delete(threadId);
        localStorage.setItem('favoriteThreads', JSON.stringify([...next]));
        return next;
      });

      toast.success(
        data.isFavorite
          ? `Added ${name} to favorites`
          : `Removed ${name} from favorites`,
        { id: toastId });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(`Failed to update favorite for ${name}`, { id: toastId });
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

  const [adminId, setAdminId] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    const resolveAdminId = async () => {
      setAdminLoading(true);
      try {
        const { data: settings } = await api.get('/settings');
        let id = settings?.platformAccountUserId;

        if (!id) {
          const { data: adminUser } = await api.get('/auth/users/admin');
          id = adminUser?.id;
        }

        if (!id) {
          id = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
        }

        setAdminId(id || null);
      } catch (err) {
        console.error('Error resolving adminId:', err);
        setAdminId(null);
      } finally {
        setAdminLoading(false);
      }
    };

    resolveAdminId();
  }, []);

  const contactAdmin = async () => {
    try {
      if (!adminId) {
        showNotification('Admin contact unavailable.', 'error');
        return;
      }

      const existing = threadsRef.current.find(t => String(t.otherUserId) === String(adminId));
      if (existing) {
        selectThread(existing.id);
      } else {
        await createConversation(adminId);
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

    return sortByThreadPriority(pool);
  }, [threads, query, activeTab, favoriteThreads, archivedThreads]);

  return {
    threads: filteredThreads,
    messagesPaginationByThread,
    userPagination,
    setUserPagination,
    loadingMessagesId,
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
    loadOlderMessages,
    loadingOlderThreads,
    contactAdmin,
    adminLoading,
    onCloseSearchMenu
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
const ChatApp = ({ showContactAdmin = true, swapEarly = false }) => {
  const t = useTranslation('Chat');
  useKeyboardShortcuts();

  const { threads, adminLoading, messagesPaginationByThread, userPagination, setUserPagination, loadingMessagesId, loadingOlderThreads, loadOlderMessages, activeThreadId, messagesByThread, aboutUser, query, isConnected, currentUser, searchResults, onCloseSearchMenu, showSearchResults, isSearching, activeTab, setActiveTab, handleSearch, selectThread, sendMessage, handleSearchResultClick, setQuery, toggleFavorite, togglePin, toggleArchive, favoriteThreads, pinnedThreads, archivedThreads, loading, fetchConversations, contactAdmin } = useChat();

  const activeThread = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId]);

  return (
    <div className='divider'>
      <div className={`container  grid gap-6 ${swapEarly ? "2xl:grid-cols-[350px_minmax(0,1fr)_350px]" : "xl:grid-cols-[350px_minmax(0,1fr)_350px]"} md:grid-cols-1`}>
        {/* Left Panel - Conversations List */}
        <div className=' '>
          <Panel className="h-full" cdCard="h-full !p-0">
            <AllMessagesPanel showContactAdmin={showContactAdmin} adminLoading={adminLoading} userPagination={userPagination} setUserPagination={onCloseSearchMenu} items={threads} onSearch={handleSearch} query={query} onSelect={selectThread} t={t} searchResults={searchResults} onCloseSearchMenu={onCloseSearchMenu} showSearchResults={showSearchResults} isSearching={isSearching} onSearchResultClick={handleSearchResultClick} activeTab={activeTab} setActiveTab={setActiveTab} toggleFavorite={toggleFavorite} togglePin={togglePin} toggleArchive={toggleArchive} favoriteThreads={favoriteThreads} pinnedThreads={pinnedThreads} archivedThreads={archivedThreads} currentUser={currentUser} loading={loading} onRefresh={() => fetchConversations()} onContactAdmin={contactAdmin} />
          </Panel>
        </div>

        {/* Middle Panel - Chat Thread */}
        <Panel cdCard="flex items-stretch h-full" className="h-full">
          {activeThreadId && activeThread ? (
            <ChatThread
              key={activeThread.id}
              loadingMessagesId={loadingMessagesId}
              loadingOlder={loadingOlderThreads.has(activeThreadId)}
              onLoadOlder={() => loadOlderMessages(activeThreadId)}
              thread={activeThread}
              pagination={messagesPaginationByThread.get(activeThreadId) || {}}
              messages={messagesByThread.get(activeThreadId) || []}
              onSend={(msg, files) => sendMessage(activeThreadId, msg, files)}
              t={t}
              isFavorite={favoriteThreads.has(activeThreadId)}
              isPinned={pinnedThreads.has(activeThreadId)}
              isArchived={archivedThreads.has(activeThreadId)}
              toggleFavorite={() => toggleFavorite(activeThreadId)}
              togglePin={() => togglePin(activeThreadId)}
              toggleArchive={() => toggleArchive(activeThreadId)}
              isConnected={isConnected}
              currentUser={currentUser}
            />
          ) : (
            <div className='flex-1  max-h-[540px] h-full flex flex-col items-center justify-center p-6 text-center'>
              <Image src='/icons/chat-placeholder.png' alt='Start a conversation' width={200} height={200} />
              <p className='text-gray-600 text-lg -mt-4 mb-1'>{t('placeholders.selectConversation')}</p>
              <p className='text-gray-400 text-sm'>{t('placeholders.searchUsers')}</p>
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

export function Panel({ children, cdCard, className }) {
  return (
    <div className={`card-glow rounded-xl bg-white border border-slate-200 shadow-custom h-fit ${className}`}>
      <div className={`h-fit min-h-[400px] rounded-xl bg-slate-50 p-6 ${cdCard}`}>{children}</div>
    </div>
  );
}

/* ------------------------------- ABOUT ------------------------------- */
export function AboutPanel({ about = {} }) {
  const t = useTranslation('Chat');
  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold flex flex-wrap items-center justify-between gap-2 min-w-0">
        <span className="truncate">{t('aboutPanel.about', { name: about.name || 'Contact' })}</span>
        {about.topRated && (
          <span className="shrink-0 text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
            {t('aboutPanel.topRated')}
          </span>
        )}
      </h2>


      <div className="mt-3 h-px w-full bg-slate-200" />
      <dl className="mt-4 space-y-4">
        <Row label={t('aboutPanel.lastMessage')} value={about.from || '—'} />
        <Row label={t('aboutPanel.onPlatform')} value={about.onPlatform || '—'} />
        <Row label={t('aboutPanel.languages')} value={about.languages || '—'} />
        <Row label={t('aboutPanel.level')} value={about.level || '—'} />
        <Row label={t('aboutPanel.responseRate')} value={about.responseRate || '—'} />
        <Row label={t('aboutPanel.ordersCompleted')} value={about.ordersCompleted ?? '—'} />
        <Row label={t('aboutPanel.role')} value={about.role || '—'} />
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
