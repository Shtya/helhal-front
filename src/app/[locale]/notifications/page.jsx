// app/notifications/page.jsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { toast } from 'react-hot-toast';
import { Link } from '@/i18n/navigation';
import { getLink } from '@/components/common/NotificationPopup';
import { MoveRight } from 'lucide-react';
import NoResults from '@/components/common/NoResults';
import TabsPagination from '@/components/common/TabsPagination';
import { useNotifications } from '@/context/NotificationContext';
import { isErrorAbort } from '@/utils/helper';

const NotificationsPage = () => {
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
      setPagination({
        page: response.data.current_page,
        limit: response.data.per_page,
        total: response.data.total_records,
        pages: Math.ceil(response.data.total_records / pagination.limit),
      });
    } catch (error) {
      if (!isErrorAbort(error)) {
        console.error('Error loading notifications:', error);
        toast.error('Failed to load notifications');
      }
    } finally {
      // Only clear loading if THIS request is still the active one
      if (controllerRef.current === controller)
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

  const getNotificationIcon = type => {
    switch (type) {
      case 'message':
        return '/icons/message.svg';
      case 'order':
        return '/icons/shopping-bag.svg';
      case 'system':
        return '/icons/system.svg';
      case 'promotion':
        return '/icons/discount.svg';
      default:
        return '/icons/notification.svg';
    }
  };

  const getNotificationColor = type => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-600';
      case 'order':
        return 'bg-green-100 text-green-600';
      case 'system':
        return 'bg-purple-100 text-purple-600';
      case 'promotion':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
        {unreadNotificationCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Mark all as read ({unreadNotificationCount})
          </button>
        )}
      </div>

      {pageNotifications.length === 0 ? (
        <div className='text-center py-12'>
          <NoResults mainText={'No notifications yet'} additionalText={"We'll notify you when something arrives."} />
        </div>
      ) : (
        <div className='bg-white shadow-sm rounded-lg overflow-hidden'>
          <div className='divide-y divide-gray-200'>
            {pageNotifications.map(notification => (
              <div key={notification.id} data-notification-id={notification.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}>
                <div className='flex gap-4'>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                    <img src={getNotificationIcon(notification.type)} alt={notification.type} className='w-5 h-5' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex flex-col xs:flex-row items-start justify-between'>
                      <h3 className='text-sm font-medium text-gray-900'>{notification.title}</h3>
                      <span className='text-xs text-gray-500 whitespace-nowrap xs:ml-2'>{formatDate(notification.created_at)}</span>
                    </div>
                    <p className='text-sm text-gray-600 mt-2'>{notification.message}</p>
                    {getLink(notification.relatedEntityType, notification.relatedEntityId) && (
                      <div className='mt-3'>
                        <Link href={getLink(notification.relatedEntityType, notification.relatedEntityId)} className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 ease-in-out shadow-sm cursor-pointer'>
                          <span className='text-xs'>{notification.relatedEntityType === 'proposal' ? 'View Proposal' : 'View Order'}</span>
                          <span className='text-blue-600 text-sm'>
                            {' '}
                            <MoveRight size={16} />{' '}
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                {!notification.isRead && (
                  <div className='mt-3'>
                    <button onClick={() => markOneAsRead(notification.id)} className='text-xs text-blue-600 hover:text-blue-800 font-medium'>
                      Mark as read
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <TabsPagination loading={loading} currentPage={pagination.page} totalPages={pagination.pages} onPageChange={handlePageChange} onItemsPerPageChange={handleItemsPerPageChange} itemsPerPage={pagination.limit} />
    </div>
  );
};

export default NotificationsPage;
