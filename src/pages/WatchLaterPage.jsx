import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import VideoCard from '../components/VideoCard';

const fetchWatchLater = async () => {
    const { data } = await apiClient.get('/watch-later');
    return data.data;
};

const removeFromWatchLater = async (videoId) => {
    await apiClient.delete(`/watch-later/${videoId}`);
};

function WatchLaterPage() {
    const queryClient = useQueryClient();

    const { data: videos, isLoading, isError, error } = useQuery({
        queryKey: ['watchLater'],
        queryFn: fetchWatchLater,
    });

    const removeMutation = useMutation({
        mutationFn: removeFromWatchLater,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['watchLater'] });
        },
    });

    if (isLoading) {
        return <div className="text-center p-8 text-text-secondary">Loading Watch Later...</div>;
    }

    if (isError) {
        return <div className="text-center p-8 text-red-500">Error loading Watch Later: {error.message}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Watch Later</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {videos?.map((video) => (
                    <div key={video._id} className="relative group">
                        <VideoCard video={video} />
                        <button
                            onClick={() => removeMutation.mutate(video._id)}
                            disabled={removeMutation.isPending}
                            title="Remove from Watch Later"
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
                    <p className="text-text-secondary text-lg">No videos saved yet. Use "Watch Later" on any video to add it here.</p>
                </div>
            )}
        </div>
    );
}

export default WatchLaterPage;
