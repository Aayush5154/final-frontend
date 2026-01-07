import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';

const fetchSubscribedChannels = async (userId) => {
    if (!userId) return [];
    const { data } = await apiClient.get(`/subscriptions/c/${userId}`);
    return data.data.subscribedChannels;
};

function SubscriptionsPage() {
    const { user } = useSelector((state) => state.auth);

    const { data: subscribedChannels, isLoading, isError, error } = useQuery({
        queryKey: ['subscribedChannelsPage', user?._id],
        queryFn: () => fetchSubscribedChannels(user?._id),
        enabled: !!user,
    });

    if (isLoading) {
        return <div className="text-center p-8 text-text-secondary">Loading subscriptions...</div>;
    }

    if (isError) {
        return <div className="text-center p-8 text-red-500">Error loading subscriptions: {error.message}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Subscriptions</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {subscribedChannels?.map((sub) => (
                    <div key={sub.channel._id} className="bg-background-secondary border border-border rounded-xl p-6 flex flex-col items-center text-center hover:bg-white/5 transition-colors">
                        <Link to={`/channel/${sub.channel.username}`}>
                            <img
                                src={sub.channel.avatar}
                                alt={sub.channel.username}
                                className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-transparent hover:border-primary transition-colors"
                            />
                        </Link>
                        <Link to={`/channel/${sub.channel.username}`} className="text-xl font-semibold text-text-primary hover:text-white mb-1">
                            {sub.channel.fullName}
                        </Link>
                        <p className="text-text-secondary text-sm mb-4">@{sub.channel.username}</p>
                        <Link
                            to={`/channel/${sub.channel.username}`}
                            className="px-4 py-2 bg-white/10 text-text-primary text-sm font-medium rounded-full hover:bg-white/20 transition-colors"
                        >
                            View Channel
                        </Link>
                    </div>
                ))}
            </div>

            {subscribedChannels?.length === 0 && (
                <div className="text-center p-12 bg-background-secondary rounded-xl border border-border">
                    <p className="text-text-secondary text-lg">You haven't subscribed to any channels yet.</p>
                </div>
            )}
        </div>
    );
}

export default SubscriptionsPage;
