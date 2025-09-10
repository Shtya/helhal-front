'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations as useTranslation } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import io from 'socket.io-client';

let socket;



// Custom hook for chat functionality
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
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'
  const [favoriteThreads, setFavoriteThreads] = useState(new Set());

  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  // Helper functions
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

    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  // Initialize socket connection
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      console.error('No authentication token found');
      return;
    }
    const token = JSON.parse(user).accessToken;

    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001', {
      auth: { token: token },
    });

    socket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    socket.on('new_message', message => {
      console.log('New message received:', message);
      setMessagesByThread(prev => {
        const threadMessages = prev[message.conversationId] || [];
        return {
          ...prev,
          [message.conversationId]: [...threadMessages, message],
        };
      });
    });

    socket.on('message_notification', notification => {
      console.log('Message notification:', notification);
      setThreads(prev => prev.map(t => (t.id === notification.conversationId ? { ...t, unreadCount: (t.unreadCount || 0) + 1 } : t)));
    });

    socket.on('error', error => {
      console.error('Socket error:', error);
    });

    fetchCurrentUser(token);
    fetchConversations(token);

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteThreads');
    if (savedFavorites) {
      setFavoriteThreads(new Set(JSON.parse(savedFavorites)));
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [router]);

  // Handle targetUserId from query parameter
  useEffect(() => {
    if (targetUserId && currentUser && threads.length > 0) {
      const existingThread = threads.find(t => t.otherUserId === targetUserId);

      if (existingThread) {
        selectThread(existingThread.id);
      } else {
        createConversation(targetUserId);
      }
    }
  }, [targetUserId, currentUser, threads]);

  const fetchCurrentUser = async token => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      } else if (response.status === 401) {
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchConversations = async (token, page = 1) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/conversations?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const formattedThreads = data.conversations.map(conv => ({
          id: conv.id,
          name: currentUser?.id === conv.buyer.id ? conv.seller.username : conv.buyer.username,
          avatar: currentUser?.id === conv.buyer.id ? conv.seller.profileImage || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=240&auto=format&fit=crop' : conv.buyer.profileImage || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=240&auto=format&fit=crop',
          active: false,
          time: formatTime(conv.lastMessageAt),
          unreadCount: conv.unreadCount,
          about: {
            name: currentUser?.id === conv.buyer.id ? conv.seller.username : conv.buyer.username,
            from: formatDate(conv.lastMessageAt),
            onPlatform: 'Member since ' + formatDate(currentUser?.id === conv.buyer.id ? conv.seller.memberSince : conv.buyer.memberSince),
            english: 'Intermediate',
            otherLang: 'Native language',
            level: 'Level 1',
            responseRate: '3.4 hrs',
            rating: '5 (1)',
          },
          otherUserId: currentUser?.id === conv.buyer.id ? conv.seller.id : conv.buyer.id,
          isFavorite: favoriteThreads.has(conv.id),
          isPinned: false,
        }));

        // Sort threads: pinned first, then favorites, then others
        const sortedThreads = formattedThreads.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.time) - new Date(a.time);
        });

        setThreads(sortedThreads);

        if (sortedThreads.length > 0 && !activeThreadId && !targetUserId) {
          setActiveThreadId(sortedThreads[0].id);
          setAboutUser(sortedThreads[0].about);
          fetchMessages(sortedThreads[0].id, token);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId, token, page = 1) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/conversations/${conversationId}/messages?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.messages.map(msg => ({
          id: msg.id,
          authorId: msg.sender.id,
          authorName: msg.sender.username,
          authorAvatar: msg.sender.profileImage,
          text: msg.message,
          createdAt: formatDateTime(msg.created_at),
          me: msg.sender.id === currentUser?.id,
        }));

        setMessagesByThread(prev => ({
          ...prev,
          [conversationId]: formattedMessages,
        }));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const searchUsers = async searchQuery => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    const user = localStorage.getItem('user');
    if (!user) return;

    const token = JSON.parse(user).accessToken;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/search?search=${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.records || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = searchQuery => {
    setQuery(searchQuery);
    searchUsers(searchQuery);
  };

  const handleSearchResultClick = async user => {
    const userData = localStorage.getItem('user');
    if (!userData) return;

    const token = JSON.parse(userData).accessToken;
    const existingThread = threads.find(t => t.otherUserId === user.id);

    if (existingThread) {
      selectThread(existingThread.id);
    } else {
      const newConversation = await createConversation(user.id);
      if (newConversation) {
        selectThread(newConversation.id);
      }
    }

    setQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const selectThread = useCallback(
    id => {
      const user = localStorage.getItem('user');
      if (!user) return;

      const token = JSON.parse(user).accessToken;
      setActiveThreadId(id);
      setThreads(prev => prev.map(t => ({ ...t, active: t.id === id })));

      const selectedThread = threads.find(t => t.id === id);
      if (selectedThread) {
        setAboutUser(selectedThread.about || {});
      }

      if (socket) {
        socket.emit('join_conversation', id);
      }

      fetchMessages(id, token);
      markAsRead(id, token);

      if (targetUserId) {
        router.replace('/en/chat', { scroll: false });
      }
    },
    [threads, targetUserId, router],
  );

  const markAsRead = async (conversationId, token) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setThreads(prev => prev.map(t => (t.id === conversationId ? { ...t, unreadCount: 0 } : t)));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = (conversationId, messageData) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        conversationId,
        message: messageData.text,
      });
    }
  };

  const createConversation = async (otherUserId, serviceId, orderId) => {
    const user = localStorage.getItem('user');
    if (!user) return;

    const token = JSON.parse(user).accessToken;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/conversations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otherUserId, serviceId, orderId }),
      });

      if (response.ok) {
        const newConversation = await response.json();
        console.log('New conversation created:', newConversation);
        fetchConversations(token);
        return newConversation;
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const toggleFavorite = threadId => {
    const newFavorites = new Set(favoriteThreads);
    if (newFavorites.has(threadId)) {
      newFavorites.delete(threadId);
    } else {
      newFavorites.add(threadId);
    }

    setFavoriteThreads(newFavorites);
    localStorage.setItem('favoriteThreads', JSON.stringify(Array.from(newFavorites)));

    // Update the thread's favorite status
    setThreads(prev => prev.map(t => (t.id === threadId ? { ...t, isFavorite: newFavorites.has(threadId) } : t)));
  };

  const togglePin = threadId => {
    setThreads(prev => prev.map(t => (t.id === threadId ? { ...t, isPinned: !t.isPinned } : t)));
  };

  const filteredThreads = useMemo(() => {
    let filtered = threads.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));

    if (activeTab === 'favorites') {
      filtered = filtered.filter(t => favoriteThreads.has(t.id));
    }

    // Sort: pinned first, then favorites, then others
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.time) - new Date(a.time);
    });
  }, [threads, query, activeTab, favoriteThreads]);

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
    favoriteThreads,
  };
};

const ChatApp = () => {
  const t = useTranslation('Chat');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use our custom hook for chat functionality
  const { threads, activeThreadId, messagesByThread, aboutUser, query, isConnected, currentUser, searchResults, showSearchResults, isSearching, activeTab, setActiveTab, handleSearch, selectThread, sendMessage, handleSearchResultClick, setQuery, toggleFavorite, togglePin, favoriteThreads } = useChat();

  const activeThread = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId]);

  return (
    <div className='divider'>
      <div className='container grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)_360px]'>
        <Panel>
          <AllMessagesPanel items={threads} onSearch={handleSearch} query={query} onSelect={selectThread} t={t} searchResults={searchResults} showSearchResults={showSearchResults} isSearching={isSearching} onSearchResultClick={handleSearchResultClick} activeTab={activeTab} setActiveTab={setActiveTab} toggleFavorite={toggleFavorite} togglePin={togglePin} favoriteThreads={favoriteThreads} />
        </Panel>

        <Panel>
          {activeThread ? (
            <ChatThread key={activeThread.id} thread={activeThread} messages={messagesByThread[activeThreadId] || []} onSend={msg => sendMessage(activeThreadId, msg)} t={t} isFavorite={favoriteThreads.has(activeThreadId)} toggleFavorite={() => toggleFavorite(activeThreadId)} />
          ) : (
            <div className='flex items-center justify-center h-full'>
              <p className='text-gray-500'>Select a conversation to start chatting</p>
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

// Panel Component
function Panel({ children }) {
  return (
    <div className='rounded-xl bg-white ring-1 ring-black/5' style={{ boxShadow: '0px 0px 12px 0px #0000001A' }}>
      <div className='h-fit min-h-[400px] rounded-xl p-6'>{children}</div>
    </div>
  );
}

// ChatThread Component
function ChatThread({ thread, messages, onSend, t, isFavorite, toggleFavorite }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);
  const menuRef = useRef(null);
  const emojiRef = useRef(null);

  const addEmoji = emoji => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleAttach = () => fileInputRef.current?.click();

  const handleFiles = e => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  const scrollBodyToBottom = (behavior = 'smooth') => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior,
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;

    setLoading(true);

    const attachments = files.map(f => URL.createObjectURL(f));

    const newMsg = {
      id: crypto.randomUUID(),
      authorId: 0,
      authorName: t('you'),
      text: text.trim() || undefined,
      attachments,
      createdAt: new Date().toLocaleString(),
      me: true,
    };

    // Call the onSend function which will send the message via socket
    onSend(newMsg);

    setText('');
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(false);

    setTimeout(() => scrollBodyToBottom('instant'), 0);
  };

  // scroll when opening thread or messages change
  useEffect(() => {
    scrollBodyToBottom('instant');
  }, [thread?.id]);

  useEffect(() => {
    scrollBodyToBottom('smooth');
  }, [messages.length]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(event.target) && !event.target.closest('[data-emoji-toggle]')) {
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
        setShowMenu(false);
        setShowEmoji(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onMenuAction = action => {
    setShowMenu(false);
  };

  return (
    <div className='w-full relative h-full'>
      <div className='flex items-start justify-between gap-4 border-b border-b-slate-200 pb-5'>
        <div>
          <div className='flex items-center gap-2'>
            <span className='relative inline-flex h-2.5 w-2.5'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75'></span>
              <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500'></span>
            </span>
            <h3 className='text-2xl font-semibold tracking-tight'>{thread?.name}</h3>
          </div>
          <p className='mt-1 text-sm text-black opacity-60 font-medium '>{new Date().toLocaleString()}</p>
        </div>

        <div className='flex items-center gap-2 relative'>
          <IconButton title={isFavorite ? t('removeFavorite') : t('addFavorite')} onClick={toggleFavorite}>
            <Image className='w-fit h-[20px] hover:scale-[1.1] duration-300' src={isFavorite ? '/icons/star-filled.svg' : '/icons/star.svg'} width={20} height={20} alt='' />
          </IconButton>

          <div className='relative' ref={menuRef}>
            <button type='button' className='group cursor-pointer rounded-xl w-[40px] h-[40px] flex items-center justify-center p-2 text-slate-500 ring-1 ring-transparent transition hover:bg-slate-100 bg-slate-50 hover:text-slate-700 hover:ring-slate-300 border border-slate-200' aria-label={t('more')} title={t('more')} onClick={() => setShowMenu(v => !v)}>
              <Image className='opacity-50 group-hover:opacity-100 w-fit h-[20px] hover:scale-[1.1] duration-300' src={'/icons/dots.svg'} width={20} height={20} alt='' />
            </button>

            {showMenu && (
              <div className='absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg z-50'>
                <ul className='py-1 text-sm text-slate-700'>
                  <MenuItem onClick={() => onMenuAction('markUnread')} icon='📩'>
                    {t('menu.markUnread')}
                  </MenuItem>
                  <MenuItem onClick={() => onMenuAction('mute')} icon='🔕'>
                    {t('menu.mute')}
                  </MenuItem>
                  <MenuItem onClick={() => onMenuAction('block')} icon='⛔'>
                    {t('menu.block')}
                  </MenuItem>
                  <MenuItem onClick={() => onMenuAction('export')} icon='📤'>
                    {t('menu.export')}
                  </MenuItem>
                  <MenuItemDanger onClick={() => onMenuAction('delete')} icon='🗑'>
                    {t('menu.delete')}
                  </MenuItemDanger>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={bodyRef}
        className='nice-scroll space-y-5 pt-5 pb-[100px] overflow-y-auto'
        style={{
          height: 'calc(100vh - 420px)',
        }}>
        {messages.map(m => (
          <Message key={m.id} avatar={m.authorAvatar} avatarBg='bg-slate-300' name={m.authorName} text={m.text} attachments={m.attachments ?? []} me={m.me} createdAt={m.createdAt} onZoomImage={src => setLightboxSrc(src)} />
        ))}
      </div>

      <div className='border-t border-t-slate-200 pt-4 absolute w-full bottom-0 left-0 bg-white'>
        <form className='flex items-center gap-3 rounded-xl border border-[#108A00] bg-white p-2 mx-0' onSubmit={handleSubmit}>
          <input ref={inputRef} type='text' placeholder={t('placeholders.message')} className='w-full border-none bg-transparent text-[15px] outline-none text-black' value={text} onChange={e => setText(e.target.value)} />
          <div className='flex-none flex items-center gap-1 text-slate-500'>
            <input ref={fileInputRef} type='file' accept='image/*' multiple onChange={handleFiles} className='hidden' />
            <button type='button' className='cursor-pointer flex-none' aria-label={t('attach')} title={t('attach')} onClick={handleAttach}>
              <Image src={'/icons/attachment.svg'} alt='' width={20} height={20} />
            </button>

            <div className='relative flex items-center justify-center ' ref={emojiRef}>
              <button type='button' data-emoji-toggle className='cursor-pointer flex-none' aria-label={t('emoji')} title={t('emoji')} onClick={() => setShowEmoji(v => !v)}>
                <Image src={'/icons/emoji.svg'} alt='' width={20} height={20} />
              </button>
              {showEmoji && (
                <div className='absolute w-[180px] right-0 bottom-9 z-50 grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg'>
                  {['😀', '😁', '😂', '🤣', '😊', '😍', '😅', '🤩', '🤔', '👍', '👏', '🙏', '🔥', '🚀', '✅', '❗', '💡', '📎'].map(e => (
                    <button key={e} type='button' className='text-xl hover:scale-110 transition' onClick={() => addEmoji(e)}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <CustomButton type='submit' loading={loading} text={t('send')} icon={<Image src={'/icons/send.svg'} alt='' width={20} height={20} />} />
          </div>
        </form>

        {files.length > 0 && (
          <div className='mt-3 flex flex-wrap gap-3'>
            {files.map((f, i) => (
              <img key={i} src={URL.createObjectURL(f)} alt='attachment' className='h-20 w-24 rounded-xl object-cover ring-1 ring-slate-200' />
            ))}
          </div>
        )}
      </div>

      {lightboxSrc && (
        <div className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4' onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt='preview' className='max-h-[90vh] max-w-[90vw] rounded-xl' onClick={e => e.stopPropagation()} />
          <button className='absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2' onClick={() => setLightboxSrc(null)} aria-label={t('close')} title={t('close')}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// Message Component
function Message({ avatar, avatarBg = 'bg-slate-200', name, text, attachments = [], me = false, createdAt, onZoomImage }) {
  return (
    <div className={'flex gap-4 ' + (me ? 'flex-row-reverse text-right' : '')}>
      <div className='relative h-fit flex-none'>
        {avatar ? <img src={avatar} alt={name} className='h-12 w-12 rounded-full object-cover' /> : <div className={`h-12 w-12 rounded-full ${avatarBg}`} />}
        <span className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500' />
      </div>

      <div className={'flex-1 ' + (me ? 'items-end' : '')}>
        <div className={'flex items-center ' + (me ? 'justify-end' : 'justify-start')}>
          <p className='text-base font-semibold'>{name}</p>
        </div>

        <div className={(me ? 'bg-emerald-50' : 'bg-slate-50') + ' mt-1 inline-block max-w-[85%] rounded-2xl px-4 py-3 ring-1 ring-slate-200'}>
          {text && <p className='max-w-4xl text-[15px] leading-6 text-slate-700'>{text}</p>}

          {attachments.length > 0 && (
            <div className='mt-3 grid grid-cols-2 gap-3'>
              {attachments.map((src, i) => (
                <div key={i} className='relative group'>
                  <img src={src} alt='attachment' className='h-24 w-28 rounded-xl object-cover ring-1 ring-slate-200' />
                  <button type='button' title='View' aria-label='View' className='absolute right-2 bottom-2 opacity-90 group-hover:opacity-100 bg-black/50 text-white rounded-full p-1' onClick={() => onZoomImage && onZoomImage(src)}>
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                      <circle cx='11' cy='11' r='8' />
                      <path d='m21 21-4.3-4.3' />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={'mt-1 text-xs text-slate-400 ' + (me ? 'text-right' : 'text-left')}>{createdAt || ''}</div>
      </div>
    </div>
  );
}

// AboutPanel Component
function AboutPanel({ about = {}, t }) {
  return (
    <div className='w-full'>
      <h2 className='text-2xl font-semibold'>{t('about', { name: about.name || 'Contact' })}</h2>
      <div className='mt-3 h-px w-full bg-slate-200' />

      <dl className='mt-4'>
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
      <dt className='text-lg font-medium'>{label}</dt>
      <dd className='text-lg opacity-70'>{value}</dd>
    </div>
  );
}

function Rating({ value }) {
  return (
    <div className='flex items-center gap-2 text-slate-500'>
      <StarOutlineIcon />
      <span className='text-lg'>{value}</span>
    </div>
  );
}

function StarOutlineIcon(props) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' {...props}>
      <path d='m12 17.27 5.18 3.04-1.64-5.81 4.46-3.73-5.87-.5L12 4l-2.13 6.27-5.87.5 4.46 3.73-1.64 5.81L12 17.27z' />
    </svg>
  );
}

// AllMessagesPanel Component
function AllMessagesPanel({ items, onSearch, query, onSelect, t, searchResults, showSearchResults, isSearching, onSearchResultClick, activeTab, setActiveTab, toggleFavorite, togglePin, favoriteThreads }) {
  return (
    <div className='w-full relative'>
      <h2 className='text-3xl font-semibold tracking-tight'>{t('allMessages')}</h2>

      {/* Tabs */}
      <div className='mt-4 flex border-b border-slate-200'>
        <button className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-[#108A00] border-b-2 border-[#108A00]' : 'text-slate-500'}`} onClick={() => setActiveTab('all')}>
          {t('tabs.all')}
        </button>
        <button className={`px-4 py-2 font-medium ${activeTab === 'favorites' ? 'text-[#108A00] border-b-2 border-[#108A00]' : 'text-slate-500'}`} onClick={() => setActiveTab('favorites')}>
          {t('tabs.favorites')}
        </button>
      </div>

      <div className='mt-5 rounded-[8px] bg-slate-50 p-2 ring-1 ring-slate-200'>
        <div className='flex items-stretch gap-2 rounded-xl bg-white p-2 pl-4 shadow-sm ring-1 ring-slate-200'>
          <div className='flex items-center text-slate-400'>
            <Image src={'/icons/search.svg'} width={25} height={25} alt='' />
          </div>
          <input value={query} onChange={e => onSearch(e.target.value)} className='w-full border-none bg-transparent text-[15px] outline-none placeholder:text-slate-400' placeholder={t('placeholders.search')} />
          <button className='cursor-pointer duration-300 rounded-xl bg-[#108A00] w-[40px] h-[35px] flex-none flex items-center justify-center text-white hover:bg-emerald-700' title={t('clear')} type='button' onClick={() => onSearch('')}>
            <Image src={'/icons/send-arrow.svg'} width={20} height={25} alt='' className=' ' />
          </button>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showSearchResults && (
        <div className='absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-10 max-h-60 overflow-y-auto'>
          {isSearching ? (
            <div className='p-4 text-center text-slate-500'>Searching...</div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map(user => (
                <li key={user.id}>
                  <button className='w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3' onClick={() => onSearchResultClick(user)}>
                    <img src={user.profileImage || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=240&auto=format&fit=crop'} alt={user.username} className='h-8 w-8 rounded-full object-cover' />
                    <div className='flex flex-col'>
                      <span className='font-medium'>{user.username}</span>
                      <span className='font-medium text-sm underline truncate whitespace-nowrap w-[220px] '>{user.email}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className='p-4 text-center text-slate-500'>No users found</div>
          )}
        </div>
      )}

      <div className='my-4 h-px w-full bg-slate-200' />

      <ul className='space-y-2'>
        {items.map(it => (
          <li key={it.id}>
            <ThreadItem {...it} onClick={() => onSelect(it.id)} isFavorite={favoriteThreads.has(it.id)} onToggleFavorite={() => toggleFavorite(it.id)} onTogglePin={() => togglePin(it.id)} />
          </li>
        ))}
        {items.length === 0 && <li className='text-sm text-slate-500'>{t('noMatches')}</li>}
      </ul>
    </div>
  );
}

function ThreadItem({ name, avatar, time = 'Just now', active = false, unreadCount = 0, onClick, isFavorite, onToggleFavorite, onTogglePin }) {
  return (
    <button onClick={onClick} className={'w-full text-left flex items-center justify-between gap-3 rounded-[8px] p-4 ring-1 transition cursor-pointer ' + (active ? 'bg-[#108A00] text-white ring-[#108A00]' : 'bg-transparent ring-transparent hover:ring-slate-200 hover:bg-slate-50')}>
      <div className='flex items-center gap-4'>
        <div className='relative flex-none'>
          <img src={avatar} alt={name} className='flex-none h-[33px] w-[33px] rounded-full object-cover' />
          <span className={(active ? 'border-[#108A00]' : 'border-white') + ' absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 bg-emerald-500'} />
          {unreadCount > 0 && !active && <span className='absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center'>{unreadCount}</span>}
        </div>
        <p className={'text-base font-semibold whitespace-nowrap truncate ' + (active ? 'text-white' : 'text-slate-900')}>{name}</p>
      </div>

      <div className='flex flex-col items-center'>
        <span className={'text-xs font-[300] mb-1 text-nowrap ' + (active ? 'text-white/90' : 'text-slate-400')}>{time}</span>
        <div className={'flex items-center gap-1 ' + (active ? 'text-white' : 'text-slate-500')}>
          <button
            onClick={e => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className='p-1 hover:scale-110 transition'>
            <Image className={`cursor-pointer ${!active && !isFavorite && ' invert opacity-50'}`} src={isFavorite ? '/icons/star-filled.svg' : '/icons/star.svg'} width={16} height={16} alt='' />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onTogglePin();
            }}
            className='p-1 hover:scale-110 transition'>
            <Image className={`cursor-pointer ${!active && ' invert opacity-50'}`} src={'/icons/pin.svg'} width={16} height={16} alt='' />
          </button>
        </div>
      </div>
    </button>
  );
}

// Reusable Components
function IconButton({ title, children, className = '', onClick }) {
  return (
    <button type='button' onClick={onClick} className={'group cursor-pointer rounded-xl w-[40px] h-[40px] flex items-center justify-center p-2 text-slate-500 ring-1 ring-transparent transition hover:bg-slate-100 bg-slate-50 hover:text-slate-700 hover:ring-slate-300 border border-slate-200 ' + className} aria-label={title} title={title}>
      {children}
    </button>
  );
}

function CustomButton({ type = 'button', loading, text, icon, onClick }) {
  return (
    <button type={type} onClick={onClick} disabled={loading} className={'flex items-center flex-none gap-2 rounded-xl px-4 py-2 text-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ' + (loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-[#108A00] hover:bg-emerald-700')}>
      {loading && <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' aria-hidden='true' />}
      {!loading && icon}
      <span>{loading ? 'Sending…' : text}</span>
    </button>
  );
}

function MenuItem({ children, onClick, icon }) {
  return (
    <li>
      <button onClick={onClick} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50'>
        <span className='text-lg leading-none'>{icon}</span>
        <span>{children}</span>
      </button>
    </li>
  );
}

function MenuItemDanger({ children, onClick, icon }) {
  return (
    <li>
      <button onClick={onClick} className='w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600'>
        <span className='text-lg leading-none'>{icon}</span>
        <span>{children}</span>
      </button>
    </li>
  );
}

export default ChatApp;
