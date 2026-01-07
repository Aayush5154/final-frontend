import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import VideoCard from '../components/VideoCard';

const fetchWatchHistory = async () => {
    const { data } = await apiClient.get('/user/history');
    return data.data; // The controller returns the watchHistory array directly
};

function HistoryPage() {
    const { data: videos, isLoading, isError, error } = useQuery({
        queryKey: ['watchHistory'],
        queryFn: fetchWatchHistory,
    });

    if (isLoading) {
        return <div className="text-center p-8 text-text-secondary">Loading history...</div>;
    }

    if (isError) {
        return <div className="text-center p-8 text-red-500">Error loading history: {error.message}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Watch History</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {videos?.map((video) => (
                    <VideoCard key={video._id} video={video} />
                ))}
            </div>

            {videos?.length === 0 && (
                <div className="text-center p-12 bg-background-secondary rounded-xl border border-border">
                    <p className="text-text-secondary text-lg">You haven't watched any videos yet.</p>
                </div>
            )}
        </div>
    );
}

export default HistoryPage;
