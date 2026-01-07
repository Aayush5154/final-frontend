import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import VideoCard from '../components/VideoCard';

// This function will be called by React Query to fetch the data
const fetchVideos = async () => {
    const { data } = await apiClient.get('/videos');
    // The videos are nested in data.data.docs
    return data.data.docs;
};

function Home() {
    // useQuery handles fetching, caching, loading states, and errors for us
    const { data: videos, error, isLoading, isError } = useQuery({
        queryKey: ['videos'], // A unique key for this query
        queryFn: fetchVideos, // The function to fetch the data
    });

    // Show a loading message while data is being fetched
    if (isLoading) {
        return (
            <div className="text-center p-8">
                <p className="text-lg text-gray-300">Loading videos...</p>
            </div>
        );
    }

    // Show an error message if the fetch fails
    if (isError) {
        return (
            <div className="text-center p-8">
                <p className="text-lg text-red-500">Error: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 md:py-8">
            {videos && videos.length > 0 ? (
                // If we have videos, render the grid
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {videos.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            ) : (
                // If there are no videos, show a message
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