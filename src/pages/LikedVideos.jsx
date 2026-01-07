import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import VideoCard from '../components/VideoCard';

const fetchLikedVideos = async () => {
    const { data } = await apiClient.get('/likes/videos');
    return data.data.likedVideos;
};

function LikedVideos() {
    const { data: likedVideos, isLoading, isError, error } = useQuery({
        queryKey: ['likedVideos'],
        queryFn: fetchLikedVideos,
    });

    if (isLoading) {
        return <div className="text-center p-8 text-text-secondary">Loading liked videos...</div>;
    }

    if (isError) {
        return <div className="text-center p-8 text-red-500">Error loading liked videos: {error.message}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Liked Videos</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {likedVideos?.map((item) => (
                    // The backend returns an array of objects where the video itself is in the 'video' property
                    // item = { _id, video: { ...videoDetails }, ... }
                    <VideoCard key={item._id} video={item.video} />
                ))}
            </div>

            {likedVideos?.length === 0 && (
                <div className="text-center p-12 bg-background-secondary rounded-xl border border-border">
                    <p className="text-text-secondary text-lg">You haven't liked any videos yet.</p>
                </div>
            )}
        </div>
    );
}

export default LikedVideos;
