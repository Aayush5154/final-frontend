import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import VideoCard from '../components/VideoCard';

const fetchWatchHistory = async () => {
    const { data } = await apiClient.get('/user/history');
    return data.data;
};

const removeHistoryEntry = async (videoId) => {
    await apiClient.delete(`/user/history/${videoId}`);
};

const clearWatchHistory = async () => {
    await apiClient.delete('/user/history');
};

function HistoryPage() {
    const queryClient = useQueryClient();

    const { data: videos, isLoading, isError, error } = useQuery({
        queryKey: ['watchHistory'],
        queryFn: fetchWatchHistory,
    });

    const removeMutation = useMutation({
        mutationFn: removeHistoryEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
        },
    });

    const clearMutation = useMutation({
        mutationFn: clearWatchHistory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
        },
    });

    const handleClearHistory = () => {
        if (window.confirm('Clear your entire watch history? This cannot be undone.')) {
            clearMutation.mutate();
        }
    };

    if (isLoading) {
        return <div className="text-center p-8 text-text-secondary">Loading history...</div>;
    }

    if (isError) {
        return <div className="text-center p-8 text-red-500">Error loading history: {error.message}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Watch History</h1>
                {videos?.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        disabled={clearMutation.isPending}
                        className="px-4 py-2 text-sm font-medium text-red-500 bg-red-600/10 rounded-full hover:bg-red-600/20 disabled:opacity-50 transition-colors"
                    >
                        {clearMutation.isPending ? 'Clearing...' : 'Clear History'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {videos?.map((video) => (
                    <div key={video._id} className="relative group">
                        <VideoCard video={video} />
                        <button
                            onClick={() => removeMutation.mutate(video._id)}
                            disabled={removeMutation.isPending}
                            title="Remove from history"
                            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-black/90 transition-opacity disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
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
