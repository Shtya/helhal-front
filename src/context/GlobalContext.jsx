'use client';

import api from '@/lib/axios';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

const GlobalContext = createContext();

// Provider Component
export const GlobalProvider = ({ children }) => {
  const [categories, setCategories] = useState();
  const [cart, setCart] = useState();
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingCart, setLoadingCart] = useState(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const socketRef = useRef(null);
  const { user } = useAuth();

  const fetchCategories = async () => {
    try {
      setLoadingCategory(true);
      const res = await api.get('categories?filters[type]=category');
      setCategories(Array.isArray(res?.data?.records) ? res?.data?.records : []);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCategory(false);
    }
  };

  const fetchCart = async () => {
    try {
      setLoadingCart(true);
      const res = await api.get("/cart")
      setCart(res.data)
    } catch {
      setCart([])
    } finally {
      setLoadingCart(false);
    }
  };

  const fetchUnreadChatCount = async () => {
    try {
      const { data } = await api.get('/conversations/unread/count');
      setUnreadChatCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread chat count:', error);
      setUnreadChatCount(0);
    }
  };

  // Initialize socket connection for message notifications
  useEffect(() => {
    const token = user?.accessToken;
    const userId = user?.id;

    if (!token || !userId) {
      return;
    }

    // Disconnect existing socket if token changed
    if (socketRef.current) {
      const oldToken = socketRef.current.auth?.token;
      if (oldToken !== token) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }

    // Create new socket if doesn't exist
    if (!socketRef.current) {
      socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });
    }

    const socket = socketRef.current;

    // Listen for message_notification event
    const handleMessageNotification = (notification) => {
      // Increase unread count by 1 when new message arrives
      setUnreadChatCount(prev => prev + 1);
    };

    socket.on('message_notification', handleMessageNotification);

    // Cleanup
    return () => {
      if (socket) {
        socket.off('message_notification', handleMessageNotification);
      }
    };
  }, [user?.accessToken, user?.id]);

  // Fetch unread count on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchUnreadChatCount();
    } else {
      setUnreadChatCount(0);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCategories();
    fetchCart();
  }, []);

  return <GlobalContext.Provider value={{
    cart,
    categories,
    loadingCategory,
    loadingCart,
    unreadChatCount,
    setUnreadChatCount,
    fetchUnreadChatCount
  }}>{children}</GlobalContext.Provider>;
};

export const useValues = () => {
  return useContext(GlobalContext);
};
