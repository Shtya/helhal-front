import { createContext, useContext, useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "@/lib/axios";
import { useNotifications } from "./NotificationContext";


// ------------------------------
// Socket Context
// ------------------------------
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const { addIncoming } = useNotifications()
    const socketRef = useRef(null);
    const subscribers = useRef(new Set());

    const [isConnected, setIsConnected] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    // ------------------------------
    // Pub/Sub
    // ------------------------------
    const publish = (action) => {
        subscribers.current.forEach((cb) => cb(action));
    };

    const subscribe = (cb) => {
        subscribers.current.add(cb);
        return () => subscribers.current.delete(cb);
    };

    // ------------------------------
    // External Controls
    // ------------------------------
    const incrementUnread = () =>
        setUnreadChatCount((prev) => prev + 1);

    const clearUnreadForThread = (threadId) => {
        publish({ type: "THREAD_READ", payload: threadId });
    };

    const resetUnread = () => setUnreadChatCount(0);

    // ------------------------------
    // Fetch Initial Count
    // ------------------------------
    const fetchUnreadChatCount = async () => {
        if (typeof window === "undefined") return; // ⛔ Prevent SSR cras

        try {

            const { data } = await api.get("/conversations/unread/count");
            setUnreadChatCount(data?.unreadCount || 0);
        } catch {
            setUnreadChatCount(0);
        }
    };

    // ------------------------------
    // Initialize Socket
    // ------------------------------
    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!user?.id || !token) return;

        // Disconnect if token changes
        if (socketRef.current) {
            const oldToken = socketRef.current.auth?.token;
            if (oldToken !== token) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }

        // Create socket instance
        if (!socketRef.current) {
            socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
                auth: { token },
                transports: ["websocket", 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: Infinity,
            });
        }

        const socket = socketRef.current;

        // ------------------ HANDLERS ------------------

        socket.on("connect", () => {
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        socket.on("reconnect", () => {
            // Refresh token on reconnect
            socket.auth = { token };
        });

        socket.on("reconnect_error", (err) => {
            console.error("Reconnect error:", err);
        });

        // ------------------ NEW MESSAGE ------------------
        socket.on("new_message", (msg) => {
            const hasSubscribers = subscribers.current && subscribers.current.size > 0;

            if (!hasSubscribers) {
                // No screen is listening → increase unread bubble
                incrementUnread();
                return;
            }

            publish({ type: "NEW_MESSAGE", payload: msg });
        });

        socket.on("new_notification", (notification) => {
            addIncoming(notification)
        })
        // Cleanup listeners
        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("reconnect");
            socket.off("reconnect_error");
            socket.off("new_message");
        };
    }, [user?.id, user?.accessToken]);



    // Fetch unread counts on mount and when user changes
    useEffect(() => {
        if (user?.id) {
            fetchUnreadChatCount();
        } else {
            setUnreadChatCount(0);
        }
    }, [user?.id]);

    // Disconnect on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return (
        <SocketContext.Provider
            value={{
                isConnected,
                unreadChatCount,

                // Publisher/Subscriber
                subscribe,

                // External controls
                incrementUnread,
                resetUnread,
                clearUnreadForThread,
                fetchUnreadChatCount,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
