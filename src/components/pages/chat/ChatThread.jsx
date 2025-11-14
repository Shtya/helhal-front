import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Star, Pin, Search, Send, Paperclip, Smile, Archive, LifeBuoy } from 'lucide-react';
import Img from '@/components/atoms/Img';
import { motion, AnimatePresence } from 'framer-motion';
import api, { baseImg } from '@/lib/axios';
import { MessageSkeletonBubble } from '@/app/[locale]/chat/page';
import { AttachFilesButton } from './AttachFilesButton';
import { FaSpinner } from 'react-icons/fa';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import Link from 'next/link';

export const NoMessagesPlaceholder = () => (
  <div className="h-full flex flex-col items-center justify-center text-center bg-slate-100 text-slate-500 rounded-xl p-6">
    <HiOutlineChatBubbleLeftRight className="h-10 w-10 mb-3 text-slate-400" />
    <p className="text-sm max-w-xs">
      No messages yet. Once you start chatting, your conversation will appear here.
    </p>
  </div>
);

const emojiRange = Array.from({ length: 80 }, (_, i) => String.fromCodePoint(0x1F600 + i));

export function ChatThread({ AllMessagesPanel, pagination, loadingMessagesId, loadingOlder, onLoadOlder, thread, messages, onSend, t, isFavorite, isPinned, isArchived, toggleFavorite, togglePin, toggleArchive, isConnected, currentUser }) {
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

  const checkIfAtBottom = useCallback(() => {
    if (!bodyRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = bodyRef.current;
    // Check if user is within 50px of the bottom (threshold for "at bottom")
    return scrollHeight - scrollTop - clientHeight < 50;
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
      if (!checkIfAtBottom()) {
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
      <div className='flex  flex-wrap items-start justify-between gap-4 border-b border-b-slate-200 pb-2 mb-2'>
        <div className='flex items-center gap-3'>
          <div className='relative '>
            <Img src={thread?.avatar} altSrc={'/no-user.png'} alt={thread?.name} className='border-green-500 border-[2px] h-10 w-10 rounded-full object-cover ring-2 ring-white shadow' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <div>
                <h3 className='text-lg font-semibold tracking-tight'>{thread?.name}</h3>
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

          <AccessibleButton title={isArchived ? 'Unarchive' : 'Archive'} onClick={toggleArchive} ariaLabel={isArchived ? 'Unarchive' : 'Archive'} className={`p-2 rounded-lg transition-colors ${isArchived ? 'text-slate-700 bg-slate-100' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Archive size={20} />
          </AccessibleButton>

          <AccessibleButton title={isPinned ? 'Unpin' : 'Pin'} onClick={togglePin} ariaLabel={isPinned ? 'Unpin' : 'Pin'} className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Pin size={20} />
          </AccessibleButton>
        </div>
      </div>
      {/* Messages Body */}
      <div ref={bodyRef} className='h-full  !w-[calc(100%+30px)] rtl:mr-[-15px] ltr:ml-[-15px] p-4 flex-1 nice-scroll space-y-5 pb-4 overflow-y-auto' style={{ maxHeight: 'calc(100vh - 400px)' }}>
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
                  <FaSpinner className='mx-auto h-5 w-5 animate-spin text-emerald-500' />
                ) : (
                  <button
                    type='button'
                    onClick={() => onLoadOlder?.()}
                    className='text-blue-500 text-sm hover:underline'
                  >
                    Load older messages ↑
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
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-colors text-sm font-medium"
                ariaLabel="New message - scroll to bottom"
                title="New message - scroll to bottom"
              >
                <span>New message</span>
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
        <span className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500' />
      </div>

      <div className={`flex-1 ${me ? 'items-end' : ''}`}>
        <div className={`${me ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-800'} mt-1 inline-block max-w-[85%] rounded-2xl px-4 py-2 shadow-sm  ${failed ? 'bg-red-100 text-red-800' : ''}`}>
          {text && <p className='max-w-4xl text-sm leading-5 break-words whitespace-pre-wrap'>{text}</p>}

          {attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {/* Images */}
              <div className="flex flex-wrap gap-2 justify-end">
                {attachments
                  .filter((f) => f.mimeType?.startsWith?.('image/'))
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
                  .filter((f) => !f.mimeType?.startsWith?.('image/'))
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
                          ? 'bg-emerald-600/20 hover:bg-emerald-600/40'
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
        loading ? 'bg-emerald-400/80 text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700',
        // effects
        'shadow-sm transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed',
        // focus
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
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
