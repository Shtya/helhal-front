// hooks/useNotifications.js
import { useState, useEffect } from 'react';
import { notificationService } from '@/services/notificationService';

export const useNotifications = (autoLoad = true) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  useEffect(() => {
    if (autoLoad) {
      loadUnreadCount();
    }
  }, [autoLoad]);

  const loadNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(page);
      setNotifications(response.data.notifications || []);
      setPagination(response.data.pagination || {});
      return response.data;
    } catch (error) {
      console.error('Error loading notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data || 0);
      return response.data;
    } catch (error) {
      console.error('Error loading unread count:', error);
      throw error;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    pagination,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    setNotifications,
    setUnreadCount
  };
};