import Tabs from '@/components/common/Tabs';
import { AccessibleButton } from './ChatThread';
import { AnimatePresence, motion } from 'framer-motion';
import Img from '@/components/atoms/Img';
import { X, Star, Pin, Search, Archive, LifeBuoy } from 'lucide-react';
import { Shimmer } from './ChatApp';
import { useLocale, useTranslations } from 'next-intl';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { useRef } from 'react';
import { canViewContactInfo } from '@/utils/helper';
import { useAuth } from '@/context/AuthContext';

export function AllMessagesPanel({ showContactAdmin, adminLoading, userPagination, setUserPagination, items, onSearch, query, onSelect, t: tProp, searchResults, onCloseSearchMenu, showSearchResults, isSearching, onSearchResultClick, activeTab, setActiveTab, toggleFavorite, togglePin, toggleArchive, favoriteThreads, pinnedThreads, archivedThreads, currentUser, loading, onRefresh, onContactAdmin }) {
  const t = tProp || useTranslations('Chat');
  const locale = useLocale();
  const isArabic = locale === 'ar'
  const searchRef = useRef(null)
  useOutsideClick(searchRef, () => onCloseSearchMenu())
  const { role } = useAuth()


  return (
    <div className='flex flex-col h-full'>

      <div className='flex-1 flex flex-col w-full relative pt-6 overflow-hidden'>
        <div className=' px-6 '>

          <div className='flex items-center justify-between mb-4 '>
            <h2 className='text-2xl font-semibold tracking-tight dark:text-dark-text-primary'>{t('allMessages')}</h2>

            <div className='flex items-center gap-1.5'>
              {/* Contact Admin */}
              {showContactAdmin && <button disabled={loading || adminLoading} onClick={onContactAdmin} className='p-2 rounded-lg text-main-700 bg-main-50 hover:bg-main-100 dark:text-main-400 dark:bg-main-900/20 dark:hover:bg-main-900/30 transition-colors' title={t('contactAdmin')}>
                <LifeBuoy size={18} className='dark:invert' />
              </button>
              }
              <button disabled={loading} onClick={onRefresh} className='p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-dark-text-secondary dark:hover:bg-dark-bg-card transition-colors' aria-label='Refresh conversations' title='Refresh'>
                <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='dark:invert'>
                  <path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' />
                  <path d='M21 3v5h-5' />
                  <path d='M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' />
                  <path d='M8 16H3v5' />
                </svg>
              </button>
            </div>
          </div>

          <Tabs
            className='mt-2 !bg-white dark:!bg-dark-bg-input mb-4'
            setActiveTab={setActiveTab}
            activeTab={activeTab}
            id='filter-msgs'
            tabs={[
              { value: 'all', label: t('tabs.all') },
              { value: 'favorites', label: t('tabs.favorites') },
              { value: 'archived', label: t('tabs.archived') },
            ]}
          />

          <div className='relative rounded-lg bg-white dark:bg-dark-bg-input px-3 py-2 mb-4 ring-1 ring-inset ring-slate-200 dark:ring-dark-border'>
            <div className='flex  items-center' disabled={loading}>
              <Search size={18} className='text-gray-500 dark:text-dark-text-secondary mr-2 dark:invert' />
              <input value={query} onChange={e => onSearch(e.target.value?.trim())} className='w-full bg-transparent text-sm outline-none placeholder:text-gray-500 dark:placeholder-dark-text-secondary dark:text-dark-text-primary' placeholder={t('placeholders.search')} aria-label={t('placeholders.search')} />
              {query && (
                <AccessibleButton className='text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-dark-text-primary transition-colors' title={t('clear')} type='button' onClick={() => onSearch('')} ariaLabel={t('clear')}>
                  <X size={18} className='dark:invert' />
                </AccessibleButton>
              )}
            </div>
          </div>

          {/* Search Results */}
          <AnimatePresence>
            {showSearchResults && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className='absolute top-full left-0 right-0 bg-white dark:bg-dark-bg-card rounded-xl border border-slate-200 dark:border-dark-border shadow-lg z-10 max-h-60 overflow-y-auto' role='listbox' aria-label='Search results'>
                {isSearching ? (
                  <div className='p-4 text-center text-slate-500 dark:text-dark-text-secondary' aria-live='polite'>
                    {t('searching')}
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul
                    ref={searchRef}>
                    {searchResults.map(user => {
                      const canSeeContacts = canViewContactInfo(role, user?.role);
                      return (
                        <li key={user.id}>
                          <AccessibleButton className='w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-dark-bg-input flex items-center gap-3' onClick={() => onSearchResultClick(user)} role='option' aria-describedby={`user-desc-${user.id}`}>
                            <Img altSrc={'/no-user.png'} src={user.profileImage} alt={user.username} className='h-8 w-8 rounded-full object-cover' />
                            <div className='flex flex-col'>
                              <span className='font-medium text-sm dark:text-dark-text-primary'>{user.username}</span>
                              {canSeeContacts && <span id={`user-desc-${user.id}`} className='text-xs text-gray-500 dark:text-dark-text-secondary truncate whitespace-nowrap w-[220px]'>
                                {user?.email}
                              </span>}
                            </div>
                          </AccessibleButton>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className='p-4 text-center text-slate-500 dark:text-dark-text-secondary' aria-live='polite'>
                    {t('noUsersFound')}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className='my-4 h-px w-full bg-slate-200 dark:bg-dark-border' />
        <div className='flex-1 min-h-0 px-6 flex flex-col'>
          {loading ? (
            <div className='flex-1 py-2 w-[calc(100%+44px)] ltr:ml-[-22px] rtl:mr-[-22px] px-4 overflow-y-auto xl:h-[320px] xl:flex-none'>
              {[...Array(4)].map((_, i) => (
                <ThreadSkeletonItem key={i} />
              ))}
            </div>
          ) : (
            <div className='flex-1 py-2 w-[calc(100%+44px)] ltr:ml-[-22px] rtl:mr-[-22px] px-4 overflow-y-auto xl:h-[320px] xl:flex-none'>
              <ul className='space-y-2' aria-label='Conversation list'>
                {items.map(it => (
                  <li key={it.id}>
                    <ThreadItem user={it} {...it} onClick={() => onSelect(it.id)} onToggleFavorite={() => toggleFavorite(it.id)} onTogglePin={() => togglePin(it.id)} onToggleArchive={() => toggleArchive(it.id)} />
                  </li>
                ))}
                {items.length === 0 && (
                  <li className='text-sm text-slate-500 dark:text-dark-text-secondary p-4 text-center' aria-live='polite'>
                    {activeTab === 'favorites' ? t('noFavorites') : activeTab === 'archived' ? t('noArchivedConversations') : t('noConversations')}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {
        activeTab === 'all' && <div className="mt-auto flex items-center justify-between p-3 border-t border-t-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-card rounded-b-xl">
          <button
            onClick={() => setUserPagination((uP) => ({ ...uP, page: Math.max(1, userPagination.page - 1) }))}
            disabled={userPagination.page === 1}
            className="w-[35px] h-[35px] flex items-center justify-center p-2 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-dark-bg-input rounded-full dark:text-dark-text-primary"
          >
            {isArabic ? "▶" : "◀"}
          </button>

          <span className="text-sm font-medium dark:text-dark-text-primary">
            {t('page', { current: userPagination.page, total: userPagination.pages })}
          </span>

          <button
            onClick={() => setUserPagination((uP) => ({ ...uP, page: Math.min(userPagination.pages, userPagination.page + 1) }))}
            disabled={userPagination.page === userPagination.pages}
            className="w-[35px] h-[35px] flex items-center justify-center p-2 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-dark-bg-input rounded-full dark:text-dark-text-primary"
          >
            {isArabic ? "◀" : "▶"}

          </button>
        </div>
      }
    </div >
  );
}

function ThreadItem({ id, user, name, avatar, time = 'Just now', active = false, unreadCount = 0, onClick, isFavorite, isPinned, isArchived, onToggleFavorite, onTogglePin, onToggleArchive }) {

  return (
    <div onClick={onClick} data-conversation-id={id} aria-label={`Conversation with ${name}`} aria-pressed={active} className={['cursor-pointer group w-full text-left flex items-center justify-between gap-3 rounded-xl p-3', 'ring-1 ring-transparent transition-all duration-200', 'hover:ring-slate-200 hover:bg-slate-50/80 dark:hover:ring-dark-border dark:hover:bg-dark-bg-input/80', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-500/50', active ? 'gradient  ' : 'bg-transparent text-slate-900 dark:text-dark-text-primary'].join(' ')}>
      <div className='flex items-center gap-3 min-w-0 flex-1'>
        <div className='relative flex-none'>
          <Img altSrc={'/no-user.png'} src={avatar} alt={name} className='h-9 w-9 rounded-full object-cover ring-2 ring-white shadow' />
          {!active && unreadCount > 0 && (
            <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-xs font-semibold flex items-center justify-center shadow-sm' aria-label={`${unreadCount} unread`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-1'>
            <p className={`truncate font-medium text-sm ${active && 'text-white'} `} title={name}>
              {name}
            </p>
            {isPinned && <Pin size={12} className={`text-blue-500 dark:text-main-400 flex-shrink-0 dark:invert ${active && '!text-white dark:!text-white'} `} />}
            {isArchived && <Archive size={12} className={`text-slate-500 dark:text-dark-text-secondary flex-shrink-0 dark:invert ${active && '!text-white dark:!text-white'} `} />}
          </div>
          <p className={`truncate text-xs text-gray-500 dark:text-dark-text-secondary ${active && '!text-white dark:!text-white'} `}>{time}</p>
        </div>
      </div>

      {/* Right actions */}
      <div className='flex items-center gap-1.5 text-slate-500 dark:text-dark-text-secondary'>
        <AccessibleButton
          ariaLabel={isArchived ? 'Unarchive' : 'Archive'}
          onClick={e => {
            e.stopPropagation();
            onToggleArchive?.();
          }}
          className={`p-1 rounded-md transition hover:scale-110 hover:bg-gray-100 dark:hover:bg-dark-bg-card ${active && '!text-white hover:!text-black dark:!text-white'} `}
          title={isArchived ? 'Unarchive' : 'Archive'}>
          <Archive size={16} className='dark:invert' />
        </AccessibleButton>

        <AccessibleButton
          ariaLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={e => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className={`p-1 rounded-md transition hover:scale-110 hover:bg-gray-100 dark:hover:bg-dark-bg-card ${active && '!text-white hover:!text-black dark:!text-white'} `}
          title={isFavorite ? 'Unfavorite' : 'Favorite'}>
          <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} className='dark:invert' />
        </AccessibleButton>
      </div>
    </div>
  );
}


const ThreadSkeletonItem = () => (
  <div className='flex items-center gap-3 p-3'>
    <Shimmer className='h-10 w-10 rounded-full' animated />
    <div className='flex-1 space-y-2'>
      <Shimmer className='h-3 w-1/2' animated />
      <Shimmer className='h-2 w-1/3' animated />
    </div>
    <Shimmer className='h-5 w-5 rounded-md' animated />
  </div>
);