import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Star, Pin, Search, Send, Paperclip, Smile, Archive, LifeBuoy, FileText, Package, Clock, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import Img from '@/components/atoms/Img';
import { motion, AnimatePresence } from 'framer-motion';
import api, { baseImg } from '@/lib/axios';
import { AttachFilesButton } from './AttachFilesButton';
import { FaSpinner } from 'react-icons/fa';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import { Link } from '@/i18n/navigation';
import { MessageSkeletonBubble } from './ChatApp';
import { useTranslations } from 'next-intl';
import Currency from '@/components/common/Currency';
import { OrderStatus } from '@/constants/order';
import { formatDate } from '@/utils/date';

export const NoMessagesPlaceholder = () => {
  const t = useTranslations('Chat');
  return (
    <div className="h-full flex flex-col items-center justify-center text-center bg-slate-100 text-slate-500 rounded-xl p-6">
      <HiOutlineChatBubbleLeftRight className="h-10 w-10 mb-3 text-slate-400" />
      <p className="text-sm max-w-xs">
        {t('noMessages.title')}
      </p>
    </div>
  );
};

const emojiRange = Array.from({ length: 80 }, (_, i) => String.fromCodePoint(0x1F600 + i));

export function ChatThread({ AllMessagesPanel, pagination, loadingMessagesId, loadingOlder, onLoadOlder, thread, messages, onSend, t: tProp, isFavorite, isPinned, isArchived, toggleFavorite, togglePin, toggleArchive, isConnected, currentUser }) {
  const t = useTranslations('Chat');
  const [text, setText] = useState('');
  const [assets, setAssets] = useState([]);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showBottom, setShowBottom] = useState(false);

  const inputRef = useRef(null);
  const bodyRef = useRef(null);
  const emojiRef = useRef(null);

  const isInitialLoadRef = useRef(true);
  const previousMessagesLengthRef = useRef(0);

  const conversationId = thread.id;

  const hasMore =
    (pagination?.page || 1) < (pagination?.pages || 1);


  const addEmoji = emoji => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const scrollBodyToBottom = (behavior = 'smooth') => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior });
    // Hide the button when scrolling to bottom
    if (behavior === 'smooth' || behavior === 'auto') {
      setShowBottom(false);
    }
  };

  const checkIfAtBottom = useCallback((includeLastCheck = false) => {
    if (!bodyRef.current) return false;

    const lastChild = bodyRef.current.lastElementChild;
    const lastChildHeight = lastChild && includeLastCheck ? lastChild.offsetHeight : 0;


    const { scrollTop, scrollHeight, clientHeight } = bodyRef.current;
    // Check if user is within 50px of the bottom (threshold for "at bottom")
    return scrollHeight - scrollTop - clientHeight - lastChildHeight < 50;
  }, []);

  const handleScrollToBottom = () => {
    scrollBodyToBottom('smooth');
    setShowBottom(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if ((!text.trim() && assets.length === 0) || sending) return;

    setSending(true);

    const newMsg = {
      id: crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())(),
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
    // Reset initial load flag when thread changes
    isInitialLoadRef.current = true;
    previousMessagesLengthRef.current = 0;
    setShowBottom(false);
  }, [thread?.id]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isNewMessage = messages.length > previousMessagesLengthRef.current;

    // On initial load, always scroll to bottom
    if (isInitialLoadRef.current) {
      if (messages.length > 0) {
        scrollBodyToBottom('auto');
        isInitialLoadRef.current = false;
      }
      previousMessagesLengthRef.current = messages.length;
      return;
    }

    // For subsequent new messages
    if (isNewMessage && lastMessage && lastMessage?.authorId !== currentUser?.id) {
      // Only show button if user is not at bottom
      if (!checkIfAtBottom({ includeLastCheck: true })) {
        setShowBottom(true);
      } else {
        setShowBottom(false);
        scrollBodyToBottom('smooth');
      }
    } else if (isNewMessage) {
      // User's own message - always scroll
      scrollBodyToBottom('smooth');
    }

    previousMessagesLengthRef.current = messages.length;
  }, [messages.length, currentUser?.id, checkIfAtBottom]);

  // Listen to scroll events to hide/show the button
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    const handleScroll = () => {
      if (checkIfAtBottom()) {
        setShowBottom(false);
      }
    };

    body.addEventListener('scroll', handleScroll);
    return () => {
      body.removeEventListener('scroll', handleScroll);
    };
  }, [checkIfAtBottom]);

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

  //w-[calc(100%+20px)] rtl:mr-[-10px] ltr:ml-[-10px]  
  return (
    <div className='relative flex-1 w-full max-h-[540px] h-full flex flex-col'>
      {/* Header */}

      <div className='flex flex-wrap items-start justify-between gap-4 border-b border-b-slate-200 pb-2 mb-2'>
        <div className='flex items-center gap-3'>
          <div className='relative '>
            <Img src={thread?.avatar} altSrc={'/no-user.png'} alt={thread?.name} className='border-main-500 border-[2px] h-10 w-10 rounded-full object-cover ring-2 ring-white shadow' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <div>
                <Link href={`/profile/${thread?.about?.id}`} className='text-lg font-semibold tracking-tight'>{thread?.name}</Link>
                <span className='text-xs  mt-[-3px] font-[500] block '>{thread?.email}</span>
              </div>
              {isPinned && <Pin size={16} className='text-blue-500' />}
              {isArchived && <Archive size={16} className='text-slate-500' />}
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <AccessibleButton title={isFavorite ? t('removeFavorite') : t('addFavorite')} onClick={toggleFavorite} ariaLabel={isFavorite ? t('removeFavorite') : t('addFavorite')} className={`p-2 rounded-lg transition-colors ${isFavorite ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </AccessibleButton>

          <AccessibleButton title={isArchived ? t('unarchive') : t('archive')} onClick={toggleArchive} ariaLabel={isArchived ? t('unarchive') : t('archive')} className={`p-2 rounded-lg transition-colors ${isArchived ? 'text-slate-700 bg-slate-100' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Archive size={20} />
          </AccessibleButton>

          <AccessibleButton title={isPinned ? t('unpin') : t('pin')} onClick={togglePin} ariaLabel={isPinned ? t('unpin') : t('pin')} className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Pin size={20} />
          </AccessibleButton>
        </div>
      </div>
      {/* Messages Body */}
      <div className='relative'>
        <ActiveOrdersButton
          otherUserId={thread?.about?.id}
          otherUserName={thread?.name}
        />
      </div>
      {/* <div className=''> */}
      <div ref={bodyRef} className='h-full relative  !w-[calc(100%+30px)] rtl:mr-[-15px] ltr:ml-[-15px] p-4 flex-1 nice-scroll space-y-5 pb-4 overflow-y-auto' style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {conversationId && conversationId === loadingMessagesId ? (
          <div className='space-y-4'>
            <MessageSkeletonBubble animated />
            <MessageSkeletonBubble me animated />
            <MessageSkeletonBubble animated />
            <MessageSkeletonBubble me animated />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className='text-center'>
                {loadingOlder ? (
                  <FaSpinner className='mx-auto h-5 w-5 animate-spin text-main-500' />
                ) : (
                  <button
                    type='button'
                    onClick={() => onLoadOlder?.()}
                    className='text-blue-500 text-sm hover:underline'
                  >
                    {t('loadOlderMessages')}
                  </button>
                )}
              </div>
            )}
            {messages.length === 0 ? (
              <NoMessagesPlaceholder />
            ) : (
              messages.map(m => (
                <Message key={m.id || m.clientMessageId} avatar={m.authorAvatar} avatarBg='bg-slate-300' name={m.authorName} text={m.text} attachments={m.attachments ?? []} me={m.me} createdAt={m.createdAt} pending={m.pending} failed={m.failed} onZoomImage={src => setLightboxSrc(src)} />
              ))
            )}
          </>
        )}
        {/* New Message Button */}
        <AnimatePresence>
          {showBottom && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10"
            >
              <AccessibleButton
                onClick={handleScrollToBottom}
                className="bg-main-500 hover:bg-main-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-colors text-sm font-medium"
                ariaLabel={t('newMessageScroll')}
                title={t('newMessageScroll')}
              >
                <span>{t('newMessage')}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </AccessibleButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* </div> */}
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
                  <a href={absolute} target='_blank' className='hover:underline cursor-pointer h-20 w-40 rounded-xl ring-1 ring-slate-200 bg-slate-50 p-3 flex items-center gap-2 text-xs'>
                    <Paperclip size={16} />
                    <span className='line-clamp-2'>{f.filename}</span>
                  </a>
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
      <div className='mt-3'>
        <form className='flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 ' onSubmit={handleSubmit}>
          <input ref={inputRef} type='text' placeholder={t('placeholders.message')} aria-label={t('placeholders.message')} className='w-full bg-transparent text-[14px] placeholder:text-slate-400 focus:outline-none' value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} disabled={sending} />

          {/* Attach */}
          <AttachFilesButton hiddenFiles={true} onChange={selectedAssets => setAssets(selectedAssets)} className='!m-0' />

          {/* Emoji */}
          <div className='relative' ref={emojiRef}>
            <AccessibleButton type='button' data-emoji-toggle ariaLabel={t('emoji')} title={t('emoji')} onClick={() => setShowEmoji(v => !v)} ariaExpanded={showEmoji} disabled={sending} className='grid h-8 w-8 place-items-center rounded-full text-slate-600 bg-slate-100 transition'>
              <Smile size={16} />
            </AccessibleButton>

            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }} className='max-h-[150px] overflow-y-auto absolute w-[210px] right-0 bottom-10 z-50 grid grid-cols-7 gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xl'>
                  {/* {['😀', '😁', '😂', '🤣', '😊', '😍', '😅', '🤩', '🤔', '👍', '👏', '🙏', '🔥', '🚀', '✅', '❗', '💡', '📎'] */}
                  {emojiRange.map(e => (
                    <AccessibleButton key={e} type='button' className='text-lg hover:scale-110 transition' onClick={() => addEmoji(e)} ariaLabel={`Emoji: ${e}`}>
                      {e}
                    </AccessibleButton>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Send */}
          <SendButton loading={sending} text={t('send')} />
        </form>
      </div>
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4' onClick={() => setLightboxSrc(null)}>
            <img src={lightboxSrc} alt='preview' className='max-h-[90vh] max-w-[90vw] rounded-xl' onClick={e => e.stopPropagation()} />
            <AccessibleButton className='absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p- w-[32px] h-[32px]' onClick={() => setLightboxSrc(null)} ariaLabel={t('close')} title={t('close')}>
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
        {/* <span className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-main-500' /> */}
      </div>

      <div className={`flex-1 ${me ? 'flex flex-col items-end' : ''}`}>
        <div className={`${me ? 'bg-main-500 text-white' : 'bg-slate-100 text-slate-800'} mt-1 inline-block max-w-[85%] rounded-2xl px-4 py-2 shadow-sm  ${failed ? 'bg-red-100 text-red-800' : ''}`}>
          {text && <p className='max-w-4xl text-sm leading-5 break-words whitespace-pre-wrap'>{text}</p>}

          {attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {/* Images */}
              <div className="flex flex-wrap gap-2 justify-end">
                {attachments
                  .filter((f) => (f.mimeType || f.type)?.startsWith?.('image/'))
                  .map((f, idx) => {
                    const url = f.url || f.path || '';
                    const absolute = url ? (url.startsWith('http') ? url : baseImg + url) : '';
                    // const absolute = '/images/clients/client1.jpg';
                    return (
                      <div key={idx} className="relative group w-24 h-20">
                        <img
                          src={absolute}
                          alt={f.filename}
                          onClick={() => onZoomImage?.(absolute)}
                          className="w-full h-full object-cover rounded-lg cursor-pointer border ring-1 ring-slate-200 hover:opacity-90 transition"
                        />
                        <button
                          type="button"
                          title="Preview"
                          aria-label="Preview"
                          onClick={() => onZoomImage?.(absolute)}
                          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 bg-black/50 text-white rounded-full p-1 transition-opacity"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
              </div>

              {/* Files */}
              <div className="flex flex-wrap gap-2 justify-end">
                {attachments
                  .filter((f) => !(f.mimeType || f.type)?.startsWith?.('image/'))
                  .map((f, idx) => {
                    const url = f.url || f.path || '';
                    const absolute = url ? (url.startsWith('http') ? url : baseImg + url) : '';
                    return (
                      <a
                        key={idx}
                        href={absolute}
                        target="_blank"
                        title={f.filename}
                        className={`text-xs px-3 py-2 rounded-md inline-flex items-center gap-2 ${me
                          ? 'bg-main-600/20 hover:bg-main-600/40'
                          : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                      >
                        📎
                        <span className="truncate max-w-[160px]">{f.filename}</span>
                      </a>
                    );
                  })}
              </div>
            </div>
          )}

        </div>

        <div className={`mt-1 text-xs text-slate-400 ${me ? 'text-right' : 'text-left'}`}>
          {createdAt
            ? new Date(createdAt).toLocaleString('en-US', {
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })
            : ''}
        </div>
      </div>
    </motion.div>
  );
}

function SendButton({ loading, text }) {
  return (
    <button
      type='submit'
      disabled={loading}
      aria-label={text}
      title={text}
      className={[
        // layout
        'relative inline-flex items-center rounded-full',
        // size & typography
        'text-[13px] font-medium',
        // colors
        loading ? 'bg-main-400/80 text-white' : 'bg-main-500 text-white hover:bg-main-600 active:bg-main-700',
        // effects
        'shadow-sm transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed',
        // focus
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-main-500/60',
      ].join(' ')}>
      <span className='grid place-items-center rounded-full h-8 w-8 bg-white/10'>{loading ? <FaSpinner className='h-3.5 w-3.5 animate-spin' /> : <Send size={14} />}</span>

      {/* subtle progress overlay when loading */}
      {loading && <span className='absolute inset-0 rounded-full ring-1 ring-white/10' />}
    </button>
  );
}

export function AccessibleButton({ children, onClick, className = '', ariaLabel, ariaPressed, ariaExpanded, disabled = false, type = 'button', title }) {
  return (
    <button type={type} onClick={onClick} className={className} aria-label={ariaLabel} aria-pressed={ariaPressed} aria-expanded={ariaExpanded} disabled={disabled} title={title}>
      {children}
    </button>
  );
}


// Status badge helper
const getStatusColor = (status) => {
  const map = {
    [OrderStatus.PENDING]: 'bg-amber-50 text-amber-700 ring-amber-200',
    [OrderStatus.ACCEPTED]: 'bg-main-50 text-main-700 ring-main-200',
    [OrderStatus.DELIVERED]: 'bg-blue-50 text-blue-700 ring-blue-200',
    [OrderStatus.COMPLETED]: 'bg-teal-50 text-teal-700 ring-teal-200',
    [OrderStatus.CANCELLED]: 'bg-rose-50 text-rose-700 ring-rose-200',
    [OrderStatus.DISPUTED]: 'bg-violet-50 text-violet-700 ring-violet-200',
    [OrderStatus.CHANGES_REQUESTED]: 'bg-pink-50 text-pink-700 ring-pink-200',
    [OrderStatus.WAITING]: 'bg-orange-50 text-orange-700 ring-orange-200',
  };
  return map[status] || 'bg-slate-50 text-slate-600 ring-slate-200';
};

export default function ActiveOrdersButton({ otherUserId, otherUserName }) {
  const t = useTranslations('Chat.activeOrders');
  const [showPopover, setShowPopover] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch active orders when popover opens
  useEffect(() => {
    if (!otherUserId) return;
    //id, title, status, created_at
    const fetchActiveOrders = async () => {
      setLoading(true);
      setError(null);
      setOrders([])
      try {
        // Mock endpoint - replace with your actual API call
        const { data } = await api.get(`/orders/active-with-user/${otherUserId}`);
        setOrders(data || []);
      } catch (err) {
        console.error('Failed to fetch active orders:', err);
        setError(err?.response?.data?.message || t('errorLoading'));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOrders();
  }, [otherUserId, t]);

  if (!otherUserId) return null;

  if ((!orders || orders?.length === 0) && !error) return null;
  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={() => setShowPopover(true)}
        className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-main-500 hover:bg-main-600 text-white shadow-sm shadow-main-900/20 transition-all hover:shadow-xl hover:scale-105 text-sm font-semibold"
        title={t('viewActiveOrders')}
      >
        <FileText className="h-4 w-4" />
        <span className="hidden sm:inline">{t('viewContracts')}</span>
      </motion.button>

      {/* Popover Modal */}
      <AnimatePresence>
        {showPopover && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopover(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />

            {/* Popover Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md max-h-[70vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{t('activeOrdersTitle')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('withUser', { name: otherUserName || 'User' })}
                  </p>
                </div>
                <button
                  onClick={() => setShowPopover(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {loading ? (
                  <LoadingState />
                ) : error ? (
                  <ErrorState message={error} />
                ) : orders.length === 0 ? (
                  <EmptyState userName={otherUserName} />
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <OrderCard key={order.id} order={order} onClose={() => setShowPopover(false)} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Order Card ──
function OrderCard({ order, onClose }) {
  const t = useTranslations('Chat.activeOrders');

  return (
    <Link
      href={`/contracts/${order.id}`}
      onClick={onClose}
      className="block group"
    >
      <div className="bg-white border border-slate-200 hover:border-main-300 rounded-xl p-4 transition-all hover:shadow-md">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-main-600 transition-colors">
            {order.title || 'Untitled Order'}
          </h4>
          <span
            className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ring-1 ${getStatusColor(order.status)}`}
          >
            {order.status}
          </span>
        </div>

        {/* Meta info */}
        <div className="space-y-1.5 mb-3">
          {/* <div className="flex items-center gap-2 text-xs text-slate-500">
            <Package className="h-3 w-3" />
            <span className="capitalize">{order.packageType || 'Standard'} Package</span>
          </div> */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            <span>{t('ordered')}: {formatDate(order.created_at)}</span>
          </div>
        </div>

        {/* Price + Arrow */}
        {/* <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-baseline gap-1">
            <Currency size={11} className="text-slate-500" />
            <span className="text-base font-bold text-slate-800">
              {Number(order.totalAmount || 0).toFixed(2)}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-main-500 transition-colors" />
        </div> */}
      </div>
    </Link>
  );
}

// ── Loading State ──
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 text-main-500 animate-spin mb-3" />
      <p className="text-sm text-slate-500">Loading orders...</p>
    </div>
  );
}

// ── Error State ──
function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mb-3">
        <AlertCircle className="h-5 w-5 text-rose-500" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">Failed to load orders</p>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  );
}

// ── Empty State ──
function EmptyState({ userName }) {
  const t = useTranslations('Chat.activeOrders');
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
        <FileText className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">
        {t('noActiveOrders')}
      </p>
      <p className="text-xs text-slate-500 max-w-[240px]">
        {t('noActiveOrdersDesc', { name: userName || 'this user' })}
      </p>
    </div>
  );
}