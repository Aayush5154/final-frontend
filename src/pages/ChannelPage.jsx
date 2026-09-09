import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import VideoCard from '../components/VideoCard';

const fetchChannelProfile = async (username) => {
    const { data } = await apiClient.get(`/user/c/${username}`);
    return data.data;
};

const fetchChannelVideos = async (userId) => {
    if (!userId) return [];
    const { data } = await apiClient.get(`/videos?userId=${userId}`);
    return data.data.docs;
};

function ChannelPage() {
    const { username } = useParams();

    const { data: channel, isLoading: isLoadingChannel } = useQuery({
        queryKey: ['channel', username],
        queryFn: () => fetchChannelProfile(username),
        enabled: !!username,
    });

    const { data: videos, isLoading: isLoadingVideos } = useQuery({
        queryKey: ['channelVideos', channel?._id],
        queryFn: () => fetchChannelVideos(channel?._id),
        enabled: !!channel,
    });

    if (isLoadingChannel) {
        return <div className="text-center p-8">Loading channel...</div>;
    }

    if (!channel) {
        return <div className="text-center p-8">Channel not found.</div>;
    }

    return (
        <div className="text-text-primary">
            <div className="w-full h-48 md:h-64 bg-background-secondary relative group">
                {channel.coverImage ? (
                    <img src={channel.coverImage} alt={`${channel.username}'s cover`} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                        No cover image
                    </div>
                )}
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-20 relative z-10">
                    <img src={channel.avatar} alt={channel.username} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-background bg-background-secondary" />
                    <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-text-primary">{channel.fullName}</h1>
                        <p className="text-text-secondary">@{channel.username}</p>
                        <div className="flex items-center justify-center md:justify-start space-x-4 mt-2 text-text-muted text-sm">
                            <span>{channel.subscriberCount} Subscribers</span>
                            <span>•</span>
                            <span>{channel.subscribedToCount} Subscribed</span>
                        </div>
                    </div>
                </div>

                <div className="border-b border-border my-8" />

                <h2 className="text-xl font-bold text-text-primary mb-6">Videos</h2>
                {isLoadingVideos ? (
                    <div className="text-center p-8 text-text-secondary animate-pulse">Loading videos...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                        {videos?.map((video) => (
                            <VideoCard key={video._id} video={video} />
                        ))}
                    </div>
                )}
                {videos?.length === 0 && !isLoadingVideos && (
                    <p className="text-text-muted text-center py-8">This channel has no public videos yet.</p>
                )}
            </div>
        </div>
    );
}

export default ChannelPage;