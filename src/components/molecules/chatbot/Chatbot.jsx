'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Trash2,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Loader2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useChatbot } from '@/hooks/useChatbot';

const springy = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.6
};

const fadeIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: springy }
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: springy }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

export default function Chatbot({ personalData = null }) {
  const t = useTranslations('chatbot');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const lastProcessedId = useRef(null);
  const messagesEndRef = useRef(null);


  const {
    messages,
    isLoading,
    isVoiceMode,
    isRecording,
    isSpeaking,
    unreadCount,
    isConnecting,
    inputRef,
    setUnreadCount,
    sendTextMessage,
    startRecording,
    stopRecording,
    toggleVoiceMode,
    clearMessages,
  } = useChatbot(personalData);


  // Effect 1 Increment count for new bot messages while closed
  useEffect(() => {
    if (messages.length === 0) {
      setUnreadCount(0);
      return;
    }
    const lastMessage = messages[messages.length - 1];

    if (isOpen) {
      setUnreadCount(0);
      lastProcessedId.current = lastMessage.id; // Mark as counted
      return
    }


    // Only increment if it's a BOT message we haven't counted yet
    if ((lastMessage.type === 'bot' || lastMessage.type === 'error') && lastMessage.id !== lastProcessedId.current) {
      setUnreadCount(prev => prev + 1);
      lastProcessedId.current = lastMessage.id; // Mark as counted
    }
  }, [messages, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [isOpen]);


  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current && !isVoiceMode) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isMinimized, isVoiceMode]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendTextMessage(inputValue);
      setInputValue('');
    }
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      stopRecording();
    }
    toggleVoiceMode();
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="fixed bottom-3 ltr:left-3 rtl:right-3 sm:bottom-6 sm:ltr:left-6 sm:rtl:right-6 z-50 w-14 h-14 bg-gradient-to-br from-main-500 to-main-600 hover:from-main-600 hover:to-main-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
            aria-label={t('open')}
          >
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />

            {/* Pulse animation */}
            {unreadCount > 0 && (
              <span className="absolute inset-0 rounded-full bg-main-400 animate-ping opacity-25" />
            )}
            {/* Unread badge */}
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 border-2 border-white dark:border-dark-bg-base"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={fadeIn}
            className={`
        fixed z-50
        bg-white dark:bg-dark-bg-card
        flex flex-col overflow-hidden
        border border-transparent dark:border-dark-border
        transition-all
sm:w-[400px] sm:h-[600px]
        ${isMinimized
                ? // minimized: bottom center, rounded, shadow, max width 300, height 60 (all screens)
                'ltr:left-3 rtl:right-3 bottom-6 transform w-[calc(100%-2rem)] max-w-[300px] h-[60px]! rounded-2xl shadow-lg'
                : // expanded: fullscreen on mobile, popup on desktop
                'inset-0 sm:bottom-6 sm:ltr:left-6 sm:rtl:right-6 sm:inset-auto w-full h-full  sm:rounded-2xl sm:shadow-2xl max-sm:border-none!'
              }
      `}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-main-500 to-main-600 text-white px-5 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-main-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base truncate">{t('title')}</h3>
                  <p className="text-xs text-white/80 truncate">{t('subtitle')}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMinimize}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition"
                  aria-label={isMinimized ? t('maximize') : t('minimize')}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </motion.button>

                {messages.length > 0 && !isMinimized && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={clearMessages}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition"
                    aria-label={t('clearChat')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition"
                  aria-label={t('close')}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Messages Container */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-dark-bg-base/40 transition-colors">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full flex items-center justify-center"
                    >
                      <div className="text-center max-w-xs">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-main-100 dark:bg-main-900/20 flex items-center justify-center">
                          <MessageCircle className="w-8 h-8 text-main-600 dark:text-main-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-800 dark:text-dark-text-primary mb-2">
                          {t('welcome')}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
                          {t('welcomeMessage')}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div variants={staggerContainer} className="space-y-4">
                      {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} t={t} />
                      ))}
                      {isLoading && <TypingIndicator />}
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-dark-bg-card border-t border-slate-200 dark:border-dark-border transition-colors shrink-0">
                  <AnimatePresence>
                    {isVoiceMode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-3 flex items-center justify-center gap-2 text-sm text-main-600 dark:text-main-400 overflow-hidden"
                      >
                        {isSpeaking ? (
                          <><Volume2 className="w-4 h-4 animate-pulse" /> <span>{t('speaking')}</span></>
                        ) : isRecording ? (
                          <><motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}><Mic className="w-4 h-4 text-red-500" /></motion.div> <span className="text-red-500">{t('recording')}</span></>
                        ) : (
                          <><Mic className="w-4 h-4" /> <span>{t('voiceModeActive')}</span></>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: isConnecting ? 1 : 1.05 }}
                      whileTap={{ scale: isConnecting ? 1 : 0.95 }}
                      disabled={isConnecting}
                      onClick={handleToggleVoice}
                      className={`p-2.5 rounded-xl transition-colors shrink-0 ${isVoiceMode
                        ? 'bg-main-500 text-white'
                        : 'bg-slate-100 dark:bg-dark-bg-input text-slate-600 dark:text-dark-text-secondary hover:bg-slate-200 dark:hover:bg-dark-border'
                        } ${isConnecting ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : isVoiceMode ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </motion.button>

                    {isVoiceMode & !isConnecting ? (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleMicClick}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-main-500 hover:bg-main-600 text-white'}`}
                        disabled={isSpeaking}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isRecording ? <><MicOff className="w-5 h-5" /> <span className="hidden sm:inline">{t('stopRecording')}</span></> : <><Mic className="w-5 h-5" /> <span className="hidden sm:inline">{t('startRecording')}</span></>}
                        </div>
                      </motion.button>
                    ) : (
                      <>
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={t('placeholder')}
                          className="flex-1 px-4 py-3 bg-slate-100 dark:bg-dark-bg-input rounded-xl focus:outline-none focus:ring-2 focus:ring-main-500 transition-all text-slate-800 dark:text-dark-text-primary placeholder:text-slate-400 dark:placeholder:text-dark-text-secondary"
                          disabled={isLoading}
                        />
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={!inputValue.trim() || isLoading}
                          className="p-3 bg-main-500 text-white rounded-xl hover:bg-main-600 disabled:opacity-50 transition-colors shrink-0"
                        >
                          <Send className="w-5 h-5" />
                        </motion.button>
                      </>
                    )}
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ message, t }) {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';

  return (
    <motion.div variants={slideUp} initial="hidden" animate="show" className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-main-100 dark:bg-main-900/30 flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-main-600 dark:text-main-400" />
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm transition-colors ${isUser
        ? 'bg-gradient-to-br from-main-500 to-main-600 text-white rounded-tr-sm'
        : isError
          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-tl-sm border border-red-200 dark:border-red-900/50'
          : 'bg-white dark:bg-dark-bg-input text-slate-800 dark:text-dark-text-primary rounded-tl-sm border border-transparent dark:border-dark-border'
        }`}>
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.isVoice && isUser ? <span className="flex items-center gap-2"><Mic className="w-4 h-4" /> {t('voiceMessage')}</span> : message.content}
        </p>
        <p className={`text-[10px] mt-1.5 ${isUser ? 'text-white/70' : 'text-slate-500 dark:text-dark-text-secondary'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-main-600 text-white flex items-center justify-center shrink-0 text-[10px] font-semibold">
          {t('you')}
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
      <div className="w-8 h-8 rounded-full bg-main-100 dark:bg-main-900/30 flex items-center justify-center shrink-0">
        <MessageCircle className="w-4 h-4 text-main-600 dark:text-main-400" />
      </div>
      <div className="bg-white dark:bg-dark-bg-input rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-transparent dark:border-dark-border">
        <div className="flex gap-1.5">
          {[0, 0.2, 0.4].map((delay) => (
            <motion.div key={delay} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1, delay }} className="w-2 h-2 bg-slate-400 dark:bg-dark-text-secondary rounded-full" />
          ))}
        </div>
      </div>
    </motion.div>
  )
}