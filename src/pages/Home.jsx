import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../api/axios';
import VideoCard from '../components/VideoCard';
import ContinueWatchingCard from '../components/ContinueWatchingCard';
import Loader from '../components/common/Loader';

const fetchVideos = async () => {
    const { data } = await apiClient.get('/videos');
    return data.data.docs;
};

const fetchContinueWatching = async () => {
    const { data } = await apiClient.get('/progress');
    return data.data;
};

const fetchRecommendations = async () => {
    const { data } = await apiClient.get('/recommendations', {
        params: { page: 1, limit: 8 },
    });
    return data.data;
};

function Home() {
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const { data: videos, error, isLoading, isError } = useQuery({
        queryKey: ['videos'],
        queryFn: fetchVideos,
    });

    const { data: continueWatching } = useQuery({
        queryKey: ['continueWatching'],
        queryFn: fetchContinueWatching,
        enabled: isAuthenticated,
    });

    const {
        data: recommendations,
        isLoading: isLoadingRecommendations,
    } = useQuery({
        queryKey: ['recommendations', user?._id],
        queryFn: fetchRecommendations,
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });

    const recommendedVideos = recommendations?.videos || [];

    if (isLoading) {
        return (
            <div className="text-center p-8">
                <p className="text-lg text-gray-300">Loading videos...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center p-8">
                <p className="text-lg text-red-500">Error: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 md:py-8">
            {isAuthenticated && continueWatching?.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-text-primary mb-4">Continue Watching</h2>
                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                        {continueWatching.map((item) => (
                            <ContinueWatchingCard key={item._id} item={item} />
                        ))}
                    </div>
                </section>
            )}

            {isAuthenticated && (isLoadingRecommendations || recommendedVideos.length > 0) && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-text-primary">Recommended for You</h2>
                            {recommendations?.personalized && (
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                    Personalized
                                </span>
                            )}
                        </div>
                        <span className="hidden sm:block text-sm text-text-muted">
                            {recommendations?.personalized
                                ? 'Based on your activity'
                                : 'Trending on VideoTube'}
                        </span>
                    </div>
                    {isLoadingRecommendations ? (
                        <div className="flex items-center justify-center gap-3 py-10 text-text-secondary">
                            <Loader size="w-5 h-5" className="text-primary" />
                            <span className="text-sm">Finding videos for you...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                            {recommendedVideos.map((video) => (
                                <VideoCard key={video._id} video={video} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {videos && videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {videos.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-8 mt-12 bg-background-secondary rounded-2xl mx-auto max-w-lg text-center">
                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">No videos found</h2>
                    <p className="text-text-secondary mt-2">Try uploading a video to get started!</p>
                </div>
            )}
        </div>
    );
}

export default Home;