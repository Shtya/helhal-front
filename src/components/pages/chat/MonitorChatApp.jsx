'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MonitorAllMessagesPanel } from '@/components/pages/chat/MonitorAllMessagesPanel';
import { ChatThreadReadOnly } from '@/components/pages/chat/ChatThreadReadOnly';
import { MonitorAboutPanel } from '@/components/pages/chat/MonitorAboutPanel';
import { useMonitorChat } from '@/components/pages/chat/useMonitorChat';
import { MessageSkeletonBubble, Panel } from './ChatApp';

const EmptyState = ({ t, MessageSkeletonBubble: Skeleton }) => (
  <div className="flex-1 max-h-[540px] h-full flex flex-col items-center justify-center p-6 text-center">
    <Image src="/icons/chat-placeholder.png" alt="Select conversation" width={200} height={200} />
    <p className="text-gray-600 text-lg -mt-4 mb-1">{t('placeholders.selectConversation')}</p>
    <p className="text-gray-400 text-sm">{t('placeholders.searchUsers')}</p>
    <div className="w-full max-w-xl mt-8 space-y-4">
      <Skeleton />
      <Skeleton me />
    </div>
  </div>
);

export default function MonitorChatApp() {
  const tChat = useTranslations('Chat');
  const t = useTranslations('Dashboard.monitor');

  const {
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
    fetchMessages,
    loadOlderMessages,
    handleSearch,
    refresh,
  } = useMonitorChat(t);

  const [showConversationsSidebar, setShowConversationsSidebar] = useState(false);
  const [showAboutSidebar, setShowAboutSidebar] = useState(false);
  const breakpoint = '';

  const handleThreadSelect = (id) => {
    selectThread(id);
    setShowConversationsSidebar(false);
  };

  return (
    <div className="divider">
      <div className="container relative">
        {/* Desktop Layout - 3 Column Grid */}
        <div className={`hidden 2xl:grid gap-6 xl:grid-cols-[350px_minmax(0,1fr)_350px]`}>
          <Panel className="h-full" cdCard="h-full !p-0">
            <MonitorAllMessagesPanel
              items={threads}
              onSearch={handleSearch}
              query={query}
              onSelect={selectThread}
              t={t}
              userPagination={userPagination}
              setUserPagination={setUserPagination}
              loading={loading}
              onRefresh={refresh}
            />
          </Panel>

          <Panel cdCard="flex items-stretch h-full" className="h-full">
            {activeThreadId && activeThread ? (
              <ChatThreadReadOnly
                key={activeThread.id}
                loadingMessagesId={loadingMessagesId}
                loadingOlder={loadingOlderThreads.has(activeThreadId)}
                onLoadOlder={() => loadOlderMessages(activeThreadId)}
                thread={activeThread}
                pagination={messagesPaginationByThread.get(activeThreadId) || {}}
                messages={messagesByThread.get(activeThreadId) || []}
                t={tChat}
                buyer={activeThread.buyer}
                seller={activeThread.seller}
              />
            ) : (
              <EmptyState t={tChat} MessageSkeletonBubble={MessageSkeletonBubble} />
            )}
          </Panel>

          <Panel cdCard="!p-0">
            <MonitorAboutPanel buyer={aboutBuyer} seller={aboutSeller} t={t} />
          </Panel>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className={`2xl:hidden`}>
          <Panel cdCard="flex items-stretch h-full !p-0" className="h-full">
            {activeThreadId && activeThread ? (
              <div className="flex flex-col w-full h-full">
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white rounded-t-xl">
                  <button
                    onClick={() => setShowConversationsSidebar(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={t('showConversations')}
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {activeThread.buyer?.username || activeThread.buyer?.person?.username} ↔ {activeThread.seller?.username || activeThread.seller?.person?.username}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAboutSidebar(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={t('showDetails')}
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-hidden p-6 flex-1">
                  <ChatThreadReadOnly
                    key={activeThread.id}
                    loadingMessagesId={loadingMessagesId}
                    loadingOlder={loadingOlderThreads.has(activeThreadId)}
                    onLoadOlder={() => loadOlderMessages(activeThreadId)}
                    thread={activeThread}
                    pagination={messagesPaginationByThread.get(activeThreadId) || {}}
                    messages={messagesByThread.get(activeThreadId) || []}
                    t={tChat}
                    buyer={activeThread.buyer}
                    seller={activeThread.seller}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white rounded-t-xl">
                  <button
                    onClick={() => setShowConversationsSidebar(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <h3 className="font-semibold text-gray-900">{t('allConversations')}</h3>
                </div>
                <EmptyState t={tChat} MessageSkeletonBubble={MessageSkeletonBubble} />
              </div>
            )}
          </Panel>

          {/* Mobile sidebar - conversations */}
          <MonitorSidebar isOpen={showConversationsSidebar} onClose={() => setShowConversationsSidebar(false)} title={t('allConversations')} position="left">
            <MonitorAllMessagesPanel
              items={threads}
              onSearch={handleSearch}
              query={query}
              onSelect={handleThreadSelect}
              t={t}
              userPagination={userPagination}
              setUserPagination={setUserPagination}
              loading={loading}
              onRefresh={refresh}
            />
          </MonitorSidebar>

          {/* Mobile sidebar - about */}
          <MonitorSidebar isOpen={showAboutSidebar} onClose={() => setShowAboutSidebar(false)} title={t('about')} position="right">
            <MonitorAboutPanel buyer={aboutBuyer} seller={aboutSeller} t={t} />
          </MonitorSidebar>
        </div>
      </div>
    </div>
  );
}

function MonitorSidebar({ isOpen, onClose, title, children, position = 'left' }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} h-full w-full max-w-sm bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="h-[calc(100%-73px)] overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
