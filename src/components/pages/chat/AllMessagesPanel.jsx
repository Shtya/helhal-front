import Tabs from '@/components/common/Tabs';
 import { AccessibleButton } from './ChatThread';
import { AnimatePresence , motion } from 'framer-motion';
import Img from '@/components/atoms/Img';
import { Shimmer } from '@/app/[locale]/chat/page';



 import { X, Star, Pin, Search, Send, Paperclip, Smile, Archive, LifeBuoy } from 'lucide-react';
   
export function AllMessagesPanel({ items, onSearch, query, onSelect, t, searchResults, showSearchResults, isSearching, onSearchResultClick, activeTab, setActiveTab, toggleFavorite, togglePin, toggleArchive, favoriteThreads, pinnedThreads, archivedThreads, currentUser, loading, onRefresh, onContactAdmin }) {
  return (
    <div className='w-full relative  '>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-2xl font-semibold tracking-tight'>{t('allMessages')}</h2>

        <div className='flex items-center gap-1.5'>
          {/* Contact Admin */}
          <button onClick={onContactAdmin} className='p-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors' aria-label='Contact admin' title='Contact admin'>
            <LifeBuoy size={18} />
          </button>

          <button onClick={onRefresh} className='p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors' aria-label='Refresh conversations' title='Refresh'>
            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' />
              <path d='M21 3v5h-5' />
              <path d='M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' />
              <path d='M8 16H3v5' />
            </svg>
          </button>
        </div>
      </div>

      <Tabs
        className='mt-2 !bg-white mb-4'
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        id='filter-msgs'
        tabs={[
          { value: 'all', label: t('tabs.all') },
          { value: 'favorites', label: t('tabs.favorites') },
          { value: 'archived', label: 'Archived' },
        ]}
      />

      <div className='relative rounded-lg bg-white px-3 py-2 mb-4 ring-1 ring-inset ring-slate-200'>
        <div className='flex  items-center'>
          <Search size={18} className='text-gray-500 mr-2' />
          <input value={query} onChange={e => onSearch(e.target.value)} className='w-full bg-transparent text-sm outline-none placeholder:text-gray-500' placeholder={t('placeholders.search')} aria-label={t('placeholders.search')} />
          {query && (
            <AccessibleButton className='text-gray-500 hover:text-gray-700 transition-colors' title={t('clear')} type='button' onClick={() => onSearch('')} ariaLabel={t('clear')}>
              <X size={18} />
            </AccessibleButton>
          )}
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showSearchResults && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className='absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-10 max-h-60 overflow-y-auto' role='listbox' aria-label='Search results'>
            {isSearching ? (
              <div className='p-4 text-center text-slate-500' aria-live='polite'>
                {t('searching')}
              </div>
            ) : searchResults.length > 0 ? (
              <ul>
                {searchResults.map(user => (
                  <li key={user.id}>
                    <AccessibleButton className='w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3' onClick={() => onSearchResultClick(user)} role='option' aria-describedby={`user-desc-${user.id}`}>
                      <Img altSrc={'/no-user.png'} src={user.profileImage} alt={user.username} className='h-8 w-8 rounded-full object-cover' />
                      <div className='flex flex-col'>
                        <span className='font-medium text-sm'>{user.username}</span>
                        <span id={`user-desc-${user.id}`} className='text-xs text-gray-500 truncate whitespace-nowrap w-[220px]'>
                          {user?.email}
                        </span>
                      </div>
                    </AccessibleButton>
                  </li>
                ))}
              </ul>
            ) : (
              <div className='p-4 text-center text-slate-500' aria-live='polite'>
                {t('noUsersFound')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className='my-4 h-px w-full bg-slate-200' />

      {loading ? (
        <div className='py-2 max-h-[320px] w-[calc(100%+44px)] ltr:ml-[-22px] rtl:mr-[-22px] px-4  h-full overflow-auto'>
          {[...Array(4)].map((_, i) => (
            <ThreadSkeletonItem key={i} />
          ))}
        </div>
      ) : (
        <div className='py-2 max-h-[320px] w-[calc(100%+44px)] ltr:ml-[-22px] rtl:mr-[-22px] px-4  h-full overflow-auto' >
          <ul className='space-y-2' aria-label='Conversation list'>
            {items.map(it => (
              <li key={it.id}>
                <ThreadItem user={it} {...it} onClick={() => onSelect(it.id)} isFavorite={favoriteThreads.has(it.id)} isPinned={pinnedThreads.has(it.id)} isArchived={archivedThreads.has(it.id)} onToggleFavorite={() => toggleFavorite(it.id)} onTogglePin={() => togglePin(it.id)} onToggleArchive={() => toggleArchive(it.id)} />
              </li>
            ))}
            {items.length === 0 && (
              <li className='text-sm text-slate-500 p-4 text-center' aria-live='polite'>
                {activeTab === 'favorites' ? t('noFavorites') : activeTab === 'archived' ? 'No archived conversations' : t('noConversations')}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function ThreadItem({ user, name, avatar, time = 'Just now', active = false, unreadCount = 0, onClick, isFavorite, isPinned, isArchived, onToggleFavorite, onTogglePin, onToggleArchive }) {
  return (
    <AccessibleButton onClick={onClick} ariaLabel={`Conversation with ${name}`} ariaPressed={active} className={['group w-full text-left flex items-center justify-between gap-3 rounded-xl p-3', 'ring-1 ring-transparent transition-all duration-200', 'hover:ring-slate-200 hover:bg-slate-50/80', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50', active ? 'gradient  ' : 'bg-transparent text-slate-900'].join(' ')}>
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
            {isPinned && <Pin size={12} className={`text-blue-500 flex-shrink-0 ${active && '!text-white'} `} />}
            {isArchived && <Archive size={12} className={`text-slate-500 flex-shrink-0 ${active && '!text-white'} `} />}
          </div>
          <p className={`truncate text-xs text-gray-500 ${active && '!text-white'} `}>{time}</p>
        </div>
      </div>

      {/* Right actions */}
      <div className='flex items-center gap-1.5 text-slate-500'>
        <AccessibleButton
          ariaLabel={isArchived ? 'Unarchive' : 'Archive'}
          onClick={e => {
            e.stopPropagation();
            onToggleArchive?.();
          }}
          className={`p-1 rounded-md transition hover:scale-110 hover:bg-gray-100 ${active && '!text-white hover:!text-black'} `}
          title={isArchived ? 'Unarchive' : 'Archive'}>
          <Archive size={16} />
        </AccessibleButton>

        <AccessibleButton
          ariaLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={e => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className={`p-1 rounded-md transition hover:scale-110 hover:bg-gray-100 ${active && '!text-white hover:!text-black'} `}
          title={isFavorite ? 'Unfavorite' : 'Favorite'}>
          <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </AccessibleButton>
      </div>
    </AccessibleButton>
  );
}


const ThreadSkeletonItem = () => (
  <div className='flex items-center gap-3 p-3'>
    <Shimmer className='h-10 w-10 rounded-full' />
    <div className='flex-1 space-y-2'>
      <Shimmer className='h-3 w-1/2' />
      <Shimmer className='h-2 w-1/3' />
    </div>
    <Shimmer className='h-5 w-5 rounded-md' />
  </div>
);