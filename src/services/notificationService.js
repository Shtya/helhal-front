// services/notificationService.js
import api from '@/lib/axios';

export const notificationService = {
  // Get notifications with pagination
  getNotifications: (page = 1 , limit) => {
    return api.get(`/notifications?limit=${limit}&page=${page}`);
  },

  // Get unread count
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    return api.put(`/notifications/read/${notificationId}`);
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return api.put('/notifications/read-all');
  },

  // Get notification settings
  getNotificationSettings: () => {
    return api.get('/notifications/settings');
  },

  // Update notification settings
  updateNotificationSettings: (settings) => {
    return api.put('/notifications/settings', settings);
  },
};