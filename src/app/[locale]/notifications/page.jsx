// app/notifications/page.jsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { notificationService } from '@/services/notificationService';
import { toast } from 'react-hot-toast';
import { Link } from '@/i18n/navigation';
import { getLink } from '@/components/common/NotificationPopup';
import { MoveRight } from 'lucide-react';
import NoResults from '@/components/common/NoResults';
import TabsPagination from '@/components/common/TabsPagination';
import { useNotifications } from '@/context/NotificationContext';
import { isErrorAbort } from '@/utils/helper';
import {
  ShoppingBag,
  AlertCircle,
  Wallet,
  Star,
  Briefcase,
  Bell
} from 'lucide-react';

export const getNotificationConfig = (type, entityType) => {
  // 1. DISPUTE & SYSTEM Group (Critical items)
  if (entityType === 'dispute' || type.includes('rejected') || type.includes('reversed')) {
    return {
      Icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
    };
  }

  // 2. ORDER & PAYMENT Group (Transactional)
  if (entityType === 'order' || entityType === 'transaction' || type === 'payment') {
    return {
      Icon: ShoppingBag,
      color: 'bg-main-100 text-main-600',
    };
  }

  // 3. JOB & PROPOSAL Group (Professional)
  if (entityType === 'job' || entityType === 'proposal' || type === 'new_proposal') {
    return {
      Icon: Briefcase,
      color: 'bg-blue-100 text-blue-600',
    };
  }

  // 4. REVIEW Group (Feedback)
  if (type.includes('review') || type === 'rating_published') {
    return {
      Icon: Star,
      color: 'bg-yellow-100 text-yellow-600',
    };
  }

  // 5. USER & WALLET Group
  if (entityType === 'user' || type === 'referral_signup') {
    return {
      Icon: Wallet,
      color: 'bg-purple-100 text-purple-600',
    };
  }

  // DEFAULT
  return {
    Icon: Bell,
    color: 'bg-gray-100 text-gray-600',
  };
};

const NotificationsPage = () => {
  const t = useTranslations('Notifications.page');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [pageNotifications, setPageNotifications] = useState([]);
  const {
    unreadNotificationCount,
    subscribe,
    markOneAsRead,
    markAllAsRead
  } = useNotifications(); // << use the new context


  const notificationsApiRef = useRef(null)
  const loadNotifications = useCallback(async () => {
    // Cancel previous request
    console.log(notificationsApiRef.current, pagination.page)
    if (notificationsApiRef.current) {
      notificationsApiRef.current.abort();
    }
    const controller = new AbortController();
    notificationsApiRef.current = controller;

    try {
      setLoading(true);
      const response = await notificationService.getNotifications(pagination.page, pagination.limit, controller.signal);
      const records = response.data.records || [];
      setPageNotifications(records);
      setPagination(p => ({
        ...p,
        total: response.data.total_records,
        pages: Math.ceil(response.data.total_records / response.data.per_page),
      }));
    } catch (error) {
      if (!isErrorAbort(error)) {
        console.error('Error loading notifications:', error);
        setPageNotifications([]);
        toast.error(t('failedToLoad'));
      }
    } finally {
      // Only clear loading if THIS request is still the active one
      if (notificationsApiRef.current === controller)
        setLoading(false);
    }
  }, [pagination.page, pagination.limit]);
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const unsubscribe = subscribe((action) => {
      switch (action.type) {

        case "NEW_NOTIFICATION":
          setPageNotifications(prev => {
            const exists = prev.some(n => n.id === action.payload.id);
            if (exists) return prev;
            return [
              action.payload,
              ...prev.slice(0, pagination.limit - 1)
            ];
          });
          break;

        case "MARK_ONE_AS_READ":
          setPageNotifications(prev =>
            prev.map(n =>
              n.id === action.payload.id ? { ...n, isRead: true } : n
            )
          );
          break;

        case "REVERT_MARK_ONE":
          setPageNotifications(prev =>
            prev.map(n =>
              n.id === action.payload.id ? { ...n, isRead: false } : n
            )
          );
          break;

        case "MARK_ALL_AS_READ":
          setPageNotifications(prev =>
            prev.map(n => ({ ...n, isRead: true }))
          );
          break;

        case "REVERT_MARK_ALL":
          loadNotifications();
          break;
      }
    });

    return () => unsubscribe();
  }, []);



  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  const handlePageChange = page => {
    setPagination(prev => ({
      ...prev,
      page,
    }));
  };

  const handleItemsPerPageChange = limit => {
    setPagination(prev => ({
      ...prev,
      limit,
      page: 1, // Reset to first page when changing items per page
    }));
  };

  if (loading && pageNotifications.length === 0) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-4xl !mt-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-1/4'></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className='p-4 border border-gray-200 rounded-lg'>
              <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
              <div className='h-3 bg-gray-200 rounded w-1/2'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className=' !my-8 container  '>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('title')}</h1>
        {unreadNotificationCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            {t('markAllAsRead', { count: unreadNotificationCount })}
          </button>
        )}
      </div>

      {pageNotifications.length === 0 ? (
        <div className='text-center py-12'>
          <NoResults mainText={t('noNotifications')} additionalText={t('noNotificationsDesc')} />
        </div>
      ) : (
        <div className='bg-white shadow-sm rounded-lg overflow-hidden'>
          <div className='divide-y divide-gray-200'>
            {pageNotifications.map(notification => {
              const { Icon, color } = getNotificationConfig(notification.type, notification.relatedEntityType);

              return (
                <div
                  key={notification.id}
                  data-notification-id={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className='flex gap-4'>
                    {/* 1. THE ICON COLUMN - Fixed scope */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                      <Icon className='w-5 h-5' aria-hidden="true" />
                    </div>

                    {/* 2. THE CONTENT COLUMN */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex flex-col xs:flex-row items-start justify-between'>
                        <h3 className='text-sm font-medium text-gray-900'>{notification.title}</h3>
                        <span className='text-xs text-gray-500 whitespace-nowrap xs:ml-2'>
                          {formatDate(notification.created_at)}
                        </span>
                      </div>

                      <p className='text-sm text-gray-600 mt-2'>{notification.message}</p>

                      {/* Actions: Link and Mark as Read */}
                      <div className='flex items-center justify-between mt-3'>
                        {getLink(notification.relatedEntityType, notification.relatedEntityId, notification.type) && (
                          <Link
                            href={getLink(notification.relatedEntityType, notification.relatedEntityId, notification.type)}
                            className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all shadow-sm'
                          >
                            <span className='text-xs'>
                              {notification.relatedEntityType === 'proposal' ? t('viewProposal') : t('viewOrder')}
                            </span>
                            <MoveRight size={16} />
                          </Link>
                        )}

                        {!notification.isRead && (
                          <button
                            onClick={() => markOneAsRead(notification.id)}
                            className='text-xs text-blue-600 hover:text-blue-800 font-medium'
                          >
                            {t('markAsRead')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TabsPagination loading={loading} recordsCount={pageNotifications.length} currentPage={pagination.page} totalPages={pagination.pages} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} itemsPerPage={pagination.limit} />
    </div>
  );
};

export default NotificationsPage;
