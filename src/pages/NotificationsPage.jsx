import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { formatTimeAgo } from '../utils/time';

const fetchNotifications = async () => {
    const { data } = await apiClient.get('/notifications?limit=50');
    return data.data;
};

const markNotificationRead = async (notificationId) => {
    await apiClient.patch(`/notifications/${notificationId}/read`);
};

const markAllNotificationsRead = async () => {
    await apiClient.patch('/notifications/read-all');
};

const notificationText = (notification) => {
    switch (notification.type) {
        case 'like':
            return notification.comment ? 'liked your comment' : 'liked your video';
        case 'comment':
            return 'commented on your video';
        case 'reply':
            return 'replied to your comment';
        case 'subscription':
            return 'subscribed to your channel';
        case 'video_upload':
            return 'uploaded a new video';
        default:
            return 'sent you a notification';
    }
};

function NotificationsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
    });

    const markReadMutation = useMutation({
        mutationFn: markNotificationRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
        },
    });

    const markAllMutation = useMutation({
        mutationFn: markAllNotificationsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
        },
    });

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markReadMutation.mutate(notification._id);
        }

        if (notification.type === 'subscription' && notification.sender?.username) {
            navigate(`/channel/${notification.sender.username}`);
        } else if (notification.video?._id) {
            navigate(`/video/${notification.video._id}`);
        }
    };

    if (isLoading) {
        return <div className="text-center p-8 text-text-secondary">Loading notifications...</div>;
    }

    if (isError) {
        return <div className="text-center p-8 text-red-500">Error loading notifications: {error.message}</div>;
    }

    const notifications = data?.notifications || [];

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Notifications</h1>
                {data?.unreadCount > 0 && (
                    <button
                        onClick={() => markAllMutation.mutate()}
                        disabled={markAllMutation.isPending}
                        className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 disabled:opacity-50 transition-colors"
                    >
                        {markAllMutation.isPending ? 'Marking...' : 'Mark all as read'}
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {notifications.map((notification) => (
                    <button
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full flex items-start space-x-4 p-4 rounded-xl border border-border text-left transition-colors hover:bg-white/5 ${notification.isRead ? 'bg-background-secondary' : 'bg-white/10'}`}
                    >
                        <img
                            src={notification.sender?.avatar}
                            alt={notification.sender?.username}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-grow min-w-0">
                            <p className="text-sm text-text-primary">
                                <span className="font-semibold">
                                    {notification.sender?.fullname || notification.sender?.username}
                                </span>{' '}
                                {notificationText(notification)}
                            </p>
                            {notification.comment?.content && (
                                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                    "{notification.comment.content}"
                                </p>
                            )}
                            <p className="text-xs text-text-muted mt-1">
                                {formatTimeAgo(notification.createdAt)}
                            </p>
                        </div>
                        {notification.video?.thumbnail && (
                            <img
                                src={notification.video.thumbnail}
                                alt={notification.video.title}
                                className="w-24 h-14 rounded-lg object-cover flex-shrink-0"
                            />
                        )}
                        {!notification.isRead && (
                            <span className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                    </button>
                ))}
            </div>

            {notifications.length === 0 && (
                <div className="text-center p-12 bg-background-secondary rounded-xl border border-border">
                    <p className="text-text-secondary text-lg">You don't have any notifications yet.</p>
                </div>
            )}
        </div>
    );
}

export default NotificationsPage;
