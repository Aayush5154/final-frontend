import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../api/axios';
import CommentList from '../components/CommentList';
import PlaylistModal from '../components/PlaylistModal';
//import { useSelector } from 'react-redux';

// --- API Functions ---
const fetchVideoById = async (videoId) => {
    const { data } = await apiClient.get(`/videos/${videoId}`);
    return data.data;
};

const toggleSubscription = async (channelId) => {
    const { data } = await apiClient.post(`/subscriptions/c/${channelId}`);
    return data.data;
};

const toggleVideoLike = async (videoId) => {
    const { data } = await apiClient.post(`/likes/toggle/v/${videoId}`);
    return data.data;
};

// --- Component ---
function VideoDetail() {
    const { videoId } = useParams();
    const queryClient = useQueryClient(); // Get the query client instance
    const { isAuthenticated } = useSelector((state) => state.auth); // Check if user is logged in
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);


    const { data: video, error, isLoading, isError } = useQuery({
        queryKey: ['video', videoId],
        queryFn: () => fetchVideoById(videoId),
        enabled: !!videoId,
    });
    const { user: loggedInUser } = useSelector((state) => state.auth); // Get the logged-in user

    // --- Mutations ---
    const subscriptionMutation = useMutation({
        mutationFn: toggleSubscription,
        onSuccess: () => {
            // When the mutation is successful, invalidate the video query to refetch data
            // This will automatically update the subscriber count and button state!
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
        },
    });

    const likeMutation = useMutation({
        mutationFn: toggleVideoLike,
        onSuccess: () => {
            // Invalidate and refetch to update the like count and button state
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
        },
    });

    // --- Event Handlers ---
    const handleSubscribe = () => {
        if (!isAuthenticated) {
            alert("Please log in to subscribe.");
            return;
        }
        subscriptionMutation.mutate(video.owner._id);
    };

    const handleLike = () => {
        if (!isAuthenticated) {
            alert("Please log in to like a video.");
            return;
        }
        likeMutation.mutate(videoId);
    };

    // --- Render Logic ---
    if (isLoading) return <div className="text-center p-8">Loading video...</div>;
    if (isError) return <div className="text-center p-8">Error: {error.message}</div>;

    const isOwner = loggedInUser?._id === video?.owner?._id;

    const formatNumber = (num) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num);

    return (
        <>
            <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="w-full bg-black aspect-video rounded-xl overflow-hidden shadow-lg border border-border">
                        <video src={video.videoFile} controls autoPlay muted className="w-full h-full"></video>
                    </div>
                    <div className="mt-4">
                        <h1 className="text-xl md:text-2xl font-bold text-text-primary">{video.title}</h1>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-4">
                            <div className="flex items-center text-text-secondary text-sm">
                                <span>{formatNumber(video.views)} views</span>
                                <span className="mx-2">•</span>
                                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {/* Like Button */}
                                <button
                                    onClick={handleLike}
                                    disabled={likeMutation.isPending}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full flex items-center space-x-2 transition-colors ${video.isLiked
                                            ? 'bg-white text-black hover:bg-gray-200'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    <span>👍</span>
                                    <span>{formatNumber(video.likesCount)}</span>
                                </button>
                                <button
                                    onClick={() => setIsPlaylistModalOpen(true)}
                                    className="px-4 py-2 text-sm font-semibold bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors flex items-center gap-2"
                                >
                                    <span>➕</span> Save
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-border my-4" />

                    <div className="flex items-center justify-between p-2">
                        <div className="flex items-center space-x-4">
                            <Link to={`/channel/${video.owner.username}`} className="flex-shrink-0">
                                <img src={video.owner.avatar} alt={video.owner.username} className="w-10 h-10 rounded-full object-cover hover:opacity-90 transition-opacity" />
                            </Link>
                            <div>
                                <Link to={`/channel/${video.owner.username}`} className="hover:text-text-primary transition-colors block">
                                    <h2 className="text-base font-bold text-text-primary">{video.owner.username}</h2>
                                </Link>
                                <p className="text-xs text-text-secondary">{formatNumber(video.owner.subscribersCount)} subscribers</p>
                            </div>
                        </div>
                        {/* Subscribe Button */}
                        {!isOwner && (
                            <button
                                onClick={handleSubscribe}
                                disabled={subscriptionMutation.isPending}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${video.owner.isSubscribed
                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                        : 'bg-primary text-white hover:bg-primary-hover'
                                    }`}
                            >
                                {subscriptionMutation.isPending ? '...' : (video.owner.isSubscribed ? 'Subscribed' : 'Subscribe')}
                            </button>
                        )}
                    </div>

                    <div className="mt-4 p-4 bg-background-secondary rounded-xl text-sm border border-border">
                        <p className="text-text-primary whitespace-pre-wrap leading-relaxed">{video.description}</p>
                    </div>

                    <div className="mt-8">
                        <CommentList videoId={videoId} />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Related Videos</h3>
                    <div className="bg-background-secondary border border-border p-8 rounded-xl text-center">
                        <p className="text-text-secondary">Related videos coming soon!</p>
                    </div>
                </div>
            </div>
            {isPlaylistModalOpen && (
                <PlaylistModal
                    video={video}
                    onClose={() => setIsPlaylistModalOpen(false)}
                />
            )}
        </>
    );
}

export default VideoDetail;