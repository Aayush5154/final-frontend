import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getSocket } from './index';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

function SocketProvider({ children }) {
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const socketRef = useRef(null);
    if (!socketRef.current) {
        socketRef.current = getSocket();
    }
    const seenNotifications = useRef(new Set());

    useEffect(() => {
        const socket = socketRef.current;

        const handleNewNotification = (notification) => {
            if (!notification?._id || seenNotifications.current.has(notification._id)) return;
            seenNotifications.current.add(notification._id);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
        };

        const handleNewFollowerVideo = (video) => {
            if (!video?._id) return;
            queryClient.setQueryData(['videos'], (current) => {
                if (!Array.isArray(current)) return current;
                if (current.some((item) => item._id === video._id)) return current;
                return [video, ...current];
            });
        };

        socket.on('notification:new', handleNewNotification);
        socket.on('feed:new-video', handleNewFollowerVideo);

        return () => {
            socket.off('notification:new', handleNewNotification);
            socket.off('feed:new-video', handleNewFollowerVideo);
        };
    }, [queryClient]);

    useEffect(() => {
        const socket = socketRef.current;
        socket.connect();

        return () => {
            socket.disconnect();
        };
    }, []);

    // Re-handshake when the signed-in identity changes so cookies and user rooms stay correct
    const identity = isAuthenticated ? user?._id || 'authenticated' : 'guest';
    const identityRef = useRef(identity);

    useEffect(() => {
        if (identityRef.current === identity) return;
        identityRef.current = identity;

        const socket = socketRef.current;
        if (socket.connected) {
            socket.disconnect().connect();
        }
    }, [identity]);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketProvider;
