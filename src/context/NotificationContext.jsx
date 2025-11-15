'use client';

import { createContext, useContext, useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';
import api from '@/lib/axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    const subscribers = useRef(new Set());
    const { user } = useAuth();

    // ------------------------------
    // Pub/Sub System
    // ------------------------------
    const publish = (action) => {
        subscribers.current.forEach(cb => cb(action));
    };

    const subscribe = (callback) => {
        subscribers.current.add(callback);
        return () => subscribers.current.delete(callback);
    };

    // ------------------------------
    // Notification Actions
    // ------------------------------
    const addIncoming = (notification) => {
        if (!notification.isRead) {
            setUnreadNotificationCount(prev => prev + 1);
        }

        publish({ type: "NEW_NOTIFICATION", payload: notification });

        setTimeout(() => {
            const els = document.querySelectorAll(
                `[data-notification-id="${notification.id}"]`
            );
            els.forEach(el => el.classList.add("highlight"));
        }, 50);


    };

    const markOneAsRead = async (id) => {
        // Optimistic
        publish({ type: "MARK_ONE_AS_READ", payload: { id } });
        setUnreadNotificationCount(prev => Math.max(prev - 1, 0));

        try {
            await api.put(`/notifications/read/${id}`);
        } catch {
            // Revert
            setUnreadNotificationCount(prev => prev + 1);
            publish({ type: "REVERT_MARK_ONE", payload: { id } });
        }
    };

    const markAllAsRead = async () => {
        // Optimistic
        const prevUnreadCount = unreadNotificationCount;
        setUnreadNotificationCount(0);
        publish({ type: "MARK_ALL_AS_READ" });

        try {
            await api.put('/notifications/read-all');
        } catch {
            // Revert
            setUnreadNotificationCount(prevUnreadCount);
            publish({ type: "REVERT_MARK_ALL" });
        }
    };

    // ------------------------------
    // Fetch initial counts
    // ------------------------------
    const fetchUnreadNotificationCount = async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            const count = Number(res?.data?.total_records ?? 0);
            setUnreadNotificationCount(count);
        } catch {
            setUnreadNotificationCount(0);
        }
    };

    // Initial data
    useEffect(() => {
        if (user?.id) {
            fetchUnreadNotificationCount();
        } else {
            setUnreadNotificationCount(0);
        }
    }, [user?.id]);

    return (
        <NotificationContext.Provider
            value={{
                unreadNotificationCount,
                addIncoming,
                markOneAsRead,
                markAllAsRead,
                subscribe,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
