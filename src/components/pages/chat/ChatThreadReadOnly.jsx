import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import Img from '@/components/atoms/Img';
import api, { baseImg } from '@/lib/axios';
import { FaSpinner } from 'react-icons/fa';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import { AccessibleButton } from './ChatThread';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSkeletonBubble } from './ChatApp';

/**
 * Read-only ChatThread: same message display as ChatThread but without send input,
 * favorite, archive, or pin actions.
 */
export function ChatThreadReadOnly({
  pagination,
  loadingMessagesId,
  loadingOlder,
  onLoadOlder,
  thread,
  messages,
  t: tProp,
  tMonitor,
  buyer,
  seller,
}) {
  const t = tProp || useTranslations('Chat');
  const tm = tMonitor || t;
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showBottom, setShowBottom] = useState(false);
  const bodyRef = useRef(null);
  const conversationId = thread?.id;

  const hasMore = (pagination?.page || 1) < (pagination?.pages || 1);
  const buyerName = buyer?.username || buyer?.person?.username || t('user');
  const sellerName = seller?.username || seller?.person?.username || t('user');

  const scrollBodyToBottom = (behavior = 'smooth') => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior });
    if (behavior === 'smooth' || behavior === 'auto') setShowBottom(false);
  };

  const checkIfAtBottom = useCallback(() => {
    if (!bodyRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = bodyRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  useEffect(() => {
    scrollBodyToBottom('auto');
    setShowBottom(false);
  }, [thread?.id]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const handleScroll = () => {
      if (checkIfAtBottom()) setShowBottom(false);
    };
    body.addEventListener('scroll', handleScroll);
    return () => body.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative flex-1 w-full max-h-[540px] h-full flex flex-col">
      {/* Header: Buyer & Seller abbreviations */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-b-slate-200 pb-2 mb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Img src={buyer?.profileImage} altSrc="/no-user.png" alt={buyerName} className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow" />
            <div>
              <Link href={`/profile/${buyer?.id}`} className="text-sm font-semibold text-slate-900 hover:text-main-600">
                {buyerName}
              </Link>
              <span className="text-xs block text-emerald-600 font-medium">Buyer</span>
            </div>
          </div>
          <span className="text-slate-400">↔</span>
          <div className="flex items-center gap-2">
            <Img src={seller?.profileImage} altSrc="/no-user.png" alt={sellerName} className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow" />
            <div>
              <Link href={`/profile/${seller?.id}`} className="text-sm font-semibold text-slate-900 hover:text-main-600">
                {sellerName}
              </Link>
              <span className="text-xs block text-main-600 font-medium">Seller</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages body */}
      <div
        ref={bodyRef}
        className="h-full !w-[calc(100%+30px)] rtl:mr-[-15px] ltr:ml-[-15px] p-4 flex-1 nice-scroll space-y-5 pb-4 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        {conversationId && conversationId === loadingMessagesId ? (
          <div className="space-y-4">
            <MessageSkeletonBubble animated />
            <MessageSkeletonBubble me animated />
            <MessageSkeletonBubble animated />
            <MessageSkeletonBubble me animated />
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center">
                {loadingOlder ? (
                  <FaSpinner className="mx-auto h-5 w-5 animate-spin text-main-500" />
                ) : (
                  <button type="button" onClick={() => onLoadOlder?.()} className="text-blue-500 text-sm hover:underline">
                    {t('loadOlderMessages')}
                  </button>
                )}
              </div>
            )}
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center bg-slate-100 text-slate-500 rounded-xl p-6">
                <HiOutlineChatBubbleLeftRight className="h-10 w-10 mb-3 text-slate-400" />
                <p className="text-sm max-w-xs">{t('noMessages.title')}</p>
              </div>
            ) : (
              messages.map((m) => (
                <Message
                  key={m.id || m.clientMessageId}
                  avatar={m.authorAvatar}
                  name={m.authorName}
                  text={m.text}
                  attachments={m.attachments ?? []}
                  me={m.me}
                  createdAt={m.createdAt}
                  onZoomImage={(src) => setLightboxSrc(src)}
                />
              ))
            )}
          </>
        )}

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
                onClick={() => scrollBodyToBottom('smooth')}
                className="bg-main-500 hover:bg-main-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-colors text-sm font-medium"
                ariaLabel={t('newMessageScroll')}
                title={t('newMessageScroll')}
              >
                <span>{t('newMessage')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
              </AccessibleButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightboxSrc(null)}
          >
            <img src={lightboxSrc} alt="preview" className="max-h-[90vh] max-w-[90vw] rounded-xl" onClick={(e) => e.stopPropagation()} />
            <AccessibleButton
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8"
              onClick={() => setLightboxSrc(null)}
              ariaLabel={t('close')}
              title={t('close')}
            >
              ✕
            </AccessibleButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Message({ avatar, name, text, attachments = [], me = false, createdAt, onZoomImage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-4 ${me ? 'flex-row-reverse text-right' : ''}`}
    >
      <div className="relative h-fit flex-none">
        {avatar ? (
          <Img altSrc="/no-user.png" src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-slate-200 ring-2 ring-white shadow" />
        )}
      </div>
      <div className={`flex-1 ${me ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`${me ? 'bg-main-500 text-white' : 'bg-slate-100 text-slate-800'} mt-1 inline-block max-w-[85%] rounded-2xl px-4 py-2 shadow-sm`}
        >
          {text && <p className="max-w-4xl text-sm leading-5 break-words whitespace-pre-wrap">{text}</p>}
          {attachments?.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-2 justify-end">
                {attachments
                  .filter((f) => (f.mimeType || f.type)?.startsWith?.('image/'))
                  .map((f, idx) => {
                    const url = f.url || f.path || '';
                    const absolute = url ? (url.startsWith('http') ? url : baseImg + url) : '';
                    return (
                      <img
                        key={idx}
                        src={absolute}
                        alt={f.filename}
                        onClick={() => onZoomImage?.(absolute)}
                        className="w-24 h-20 object-cover rounded-lg cursor-pointer border ring-1 ring-slate-200 hover:opacity-90 transition"
                      />
                    );
                  })}
              </div>
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
                        rel="noreferrer"
                        className={`text-xs px-3 py-2 rounded-md inline-flex items-center gap-2 ${me ? 'bg-main-600/20 hover:bg-main-600/40' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        📎 <span className="truncate max-w-[160px]">{f.filename}</span>
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
