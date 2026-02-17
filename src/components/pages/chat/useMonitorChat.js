'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import { showNotification } from '@/utils/notifications';
import { isErrorAbort } from '@/utils/helper';

const formatTime = (dateString, t) => {
  if (!dateString) return t?.('justNow') || 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = +now - +date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return t?.('justNow') || 'Just now';
  if (diffMins < 60) return t?.('timeAgoMinutes', { count: diffMins }) || `${diffMins}m ago`;
  if (diffHours < 24) return t?.('timeAgoHours', { count: diffHours }) || `${diffHours}h ago`;
  if (diffDays < 7) return t?.('timeAgoDays', { count: diffDays }) || `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const normalizeMessage = (m, t) => {
  if (m && 'text' in m && ('me' in m || 'authorId' in m)) return m;
  const senderId = (m.sender && m.sender.id) || m.senderId;
  const createdRaw = m.created_at || m.createdAt;
  const atts = Array.isArray(m.attachments) ? m.attachments : [];
  return {
    id: m.id,
    clientMessageId: m.clientMessageId,
    authorId: senderId,
    authorName: (m.sender && m.sender.username) || m.authorName || t?.('user') || 'User',
    authorAvatar: (m.sender && m.sender.profileImage) || m.authorAvatar,
    text: m.message || m.text || '',
    attachments: atts,
    createdAt: createdRaw ? new Date(createdRaw).toLocaleString() : new Date().toLocaleString(),
    me: false, // Admin view: no "me" messages
  };
};

export function useMonitorChat(t) {
  const [threads, setThreads] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, pages: 1 });
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messagesByThread, setMessagesByThread] = useState(() => new Map());
  const [messagesPaginationByThread, setMessagesPaginationByThread] = useState(() => new Map());
  const [aboutBuyer, setAboutBuyer] = useState(null);
  const [aboutSeller, setAboutSeller] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessagesId, setLoadingMessagesId] = useState(null);
  const [loadingOlderThreads, setLoadingOlderThreads] = useState(() => new Set());

  const conversationsApiRef = useRef(null);
  const messagesApiRef = useRef(null);

  const formatConversation = useCallback(
    (conv) => ({
      id: conv.id,
      buyer: conv.buyer,
      seller: conv.seller,
      time: formatTime(conv.lastMessageAt, t),
      lastMessageAt: conv.lastMessageAt,
    }),
    [t]
  );

  const fetchConversations = useCallback(
    async (page = 1, options = { silent: false }) => {
      if (!options.silent) setLoading(true);
      if (conversationsApiRef.current) conversationsApiRef.current.abort();
      const controller = new AbortController();
      conversationsApiRef.current = controller;

      try {
        const { data } = await api.get(`/conversations/admin?page=${page}`, {
          signal: controller.signal,
        });
        const list = data.conversations || [];
        const formatted = list.map((c) => formatConversation(c));

        setUserPagination((p) => ({
          ...p,
          page: data?.pagination?.page || 1,
          pages: data?.pagination?.pages || 1,
        }));
        setThreads(formatted);
      } catch (error) {
        if (!isErrorAbort(error)) {
          showNotification(error?.response?.data?.message || 'Failed to load conversations', 'error');
        }
      } finally {
        if (conversationsApiRef.current === controller && !options.silent) setLoading(false);
      }
    },
    [formatConversation]
  );

  const fetchMessages = useCallback(
    async (conversationId, page = 1, { append = false } = {}) => {
      try {
        if (messagesApiRef.current) messagesApiRef.current.abort();
        messagesApiRef.current = new AbortController();

        if (append) {
          setLoadingOlderThreads((prev) => new Set(prev).add(conversationId));
        } else {
          setLoadingMessagesId(conversationId);
        }

        const { data } = await api.get(`/conversations/admin/${conversationId}/messages?page=${page}`, {
          signal: messagesApiRef.current.signal,
        });

        const msgs = (data.messages || []).map((m) => normalizeMessage(m, t));

        setMessagesByThread((prev) => {
          const updated = new Map(prev);
          if (append) {
            const existing = updated.get(conversationId) || [];
            const seen = new Set();
            const deduped = [...msgs, ...existing].filter((msg) => {
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

        setMessagesPaginationByThread((prev) => {
          const updated = new Map(prev);
          updated.set(conversationId, data?.pagination || { page, pages: page, total: msgs.length, limit: msgs.length });
          return updated;
        });
      } catch (error) {
        if (!isErrorAbort(error)) {
          showNotification('Failed to load messages', 'error');
        }
      } finally {
        messagesApiRef.current = null;
        if (append) {
          setLoadingOlderThreads((prev) => {
            const next = new Set(prev);
            next.delete(conversationId);
            return next;
          });
        } else {
          setLoadingMessagesId(null);
        }
      }
    },
    [t]
  );

  const threadsRef = useRef(threads);
  const messagesByThreadRef = useRef(messagesByThread);
  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);
  useEffect(() => {
    messagesByThreadRef.current = messagesByThread;
  }, [messagesByThread]);

  const selectThread = useCallback(
    (id) => {
      setActiveThreadId(id);
      setThreads((prev) => prev.map((t) => ({ ...t, active: t.id === id })));

      const selected = threadsRef.current.find((t) => t.id === id);
      if (selected) {
        setAboutBuyer(selected.buyer || null);
        setAboutSeller(selected.seller || null);
      }

      if (!messagesByThreadRef.current.has(id)) {
        fetchMessages(id);
      }
    },
    [fetchMessages]
  );

  const loadOlderMessages = useCallback(
    (conversationId) => {
      if (loadingOlderThreads.has(conversationId)) return;
      const pagination = messagesPaginationByThread.get(conversationId) || {};
      const currentPage = pagination.page || 1;
      const totalPages = pagination.pages || 1;
      if (currentPage >= totalPages) return;
      fetchMessages(conversationId, currentPage + 1, { append: true });
    },
    [fetchMessages, loadingOlderThreads, messagesPaginationByThread]
  );

  const handleSearch = useCallback((q) => setQuery(q || ''), []);

  const { debouncedValue: debouncedQuery } = useDebounce({ value: query, delay: 350 });
  const skipPageEffectRef = useRef(false);

  useEffect(() => {
    setUserPagination((p) => ({ ...p, page: 1 }));
    skipPageEffectRef.current = true;
    fetchConversations(1, debouncedQuery);
  }, [debouncedQuery, fetchConversations]);

  useEffect(() => {
    if (skipPageEffectRef.current) {
      skipPageEffectRef.current = false;
      return;
    }
    fetchConversations(userPagination.page, debouncedQuery);
  }, [userPagination.page, debouncedQuery, fetchConversations]);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId), [threads, activeThreadId]);

  const refresh = useCallback(() => {
    fetchConversations(userPagination.page, debouncedQuery);
  }, [fetchConversations, userPagination.page, debouncedQuery]);

  return {
    threads,
    activeThreadId,
    activeThread,
    messagesByThread,
    messagesPaginationByThread,
    aboutBuyer,
    aboutSeller,
    userPagination,
    setUserPagination,
    loading,
    loadingMessagesId,
    loadingOlderThreads,
    query,
    selectThread,
    fetchConversations,
    fetchMessages,
    loadOlderMessages,
    handleSearch,
    refresh,
  };
}
