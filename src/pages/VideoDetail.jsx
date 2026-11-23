import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../api/axios';
import CommentList from '../components/CommentList';
import VideoInsights from '../components/VideoInsights';
import VideoChat from '../components/VideoChat';
import PlaylistModal from '../components/PlaylistModal';
import VideoPlayer from '../components/VideoPlayer';
import Loader from '../components/common/Loader';

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

const toggleWatchLater = async ({ videoId, isInWatchLater }) => {
    if (isInWatchLater) {
        await apiClient.delete(`/watch-later/${videoId}`);
    } else {
        await apiClient.post(`/watch-later/${videoId}`);
    }
};

const sendWatchProgress = (videoId, progress, duration) => {
    apiClient.put(`/progress/${videoId}`, {
        progress: Math.floor(progress),
        duration: Math.floor(duration || 0),
    }).catch(() => {});
};

function VideoDetail() {
    const { videoId } = useParams();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const videoRef = useRef(null);
    const lastSavedProgress = useRef(0);

    const { data: video, error, isLoading, isError } = useQuery({
        queryKey: ['video', videoId],
        queryFn: () => fetchVideoById(videoId),
        enabled: !!videoId,
    });
    const { user: loggedInUser } = useSelector((state) => state.auth);

    const subscriptionMutation = useMutation({
        mutationFn: toggleSubscription,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
        },
    });

    const likeMutation = useMutation({
        mutationFn: toggleVideoLike,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
        },
    });

    const watchLaterMutation = useMutation({
        mutationFn: toggleWatchLater,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
            queryClient.invalidateQueries({ queryKey: ['watchLater'] });
        },
    });

    useEffect(() => {
        if (!isAuthenticated || !videoId) return undefined;

        const interval = setInterval(() => {
            const player = videoRef.current;
            if (!player || player.paused || !Number.isFinite(player.duration)) return;

            const current = Math.floor(player.currentTime);
            if (Math.abs(current - lastSavedProgress.current) < 5) return;

            lastSavedProgress.current = current;
            sendWatchProgress(videoId, current, player.duration);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAuthenticated, videoId]);

    const handleLoadedMetadata = () => {
        const player = videoRef.current;
        if (!player || !video?.progress) return;

        if (video.progress > 5 && video.progress < player.duration - 5) {
            player.currentTime = video.progress;
            lastSavedProgress.current = video.progress;
        }
    };

    const handleProgressSave = () => {
        const player = videoRef.current;
        if (!isAuthenticated || !player || !Number.isFinite(player.duration)) return;

        lastSavedProgress.current = Math.floor(player.currentTime);
        sendWatchProgress(videoId, player.currentTime, player.duration);
    };

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

    const handleWatchLater = () => {
        if (!isAuthenticated) {
            alert("Please log in to save videos for later.");
            return;
        }
        watchLaterMutation.mutate({ videoId, isInWatchLater: video.isInWatchLater });
    };

    if (isLoading) return <div className="text-center p-8">Loading video...</div>;
    if (isError) return <div className="text-center p-8">Error: {error.message}</div>;

    const isOwner = loggedInUser?._id === video?.owner?._id;

    const formatNumber = (num) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num);
    const handleSeek = (seconds) => {
        const player = videoRef.current;
        if (!player) return;
        player.currentTime = seconds;
        player.play().catch(() => {});
    };

    return (
        <>
            <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="w-full bg-black aspect-video rounded-xl overflow-hidden shadow-lg border border-border">
                        <VideoPlayer
                            video={video}
                            videoRef={videoRef}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPause={handleProgressSave}
                            onEnded={handleProgressSave}
                        />
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
                                <button
                                    onClick={handleLike}
                                    disabled={likeMutation.isPending}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full flex items-center space-x-2 transition-colors ${video.isLiked
                                            ? 'bg-white text-black hover:bg-gray-200'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {likeMutation.isPending ? <Loader size="w-4 h-4" /> : <span>👍</span>}
                                    <span>{formatNumber(video.likesCount)}</span>
                                </button>
                                <button
                                    onClick={handleWatchLater}
                                    disabled={watchLaterMutation.isPending}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full flex items-center space-x-2 transition-colors disabled:opacity-50 ${video.isInWatchLater
                                            ? 'bg-white text-black hover:bg-gray-200'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {watchLaterMutation.isPending ? <Loader size="w-4 h-4" /> : (
                                        <svg className="w-4 h-4" fill={video.isInWatchLater ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
                                        </svg>
                                    )}
                                    <span>{video.isInWatchLater ? 'Saved' : 'Watch Later'}</span>
                                </button>
                                <button
                                    onClick={() => setIsPlaylistModalOpen(true)}
                                    className="px-4 py-2 text-sm font-semibold bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors flex items-center gap-2"
                                >
                                    <span>➕</span> Save to Playlist
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
                        {!isOwner && (
                            <button
                                onClick={handleSubscribe}
                                disabled={subscriptionMutation.isPending}
                                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${video.owner.isSubscribed
                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                        : 'bg-primary text-white hover:bg-primary-hover'
                                    }`}
                            >
                                <span className="flex items-center justify-center">{subscriptionMutation.isPending ? <><Loader size="w-4 h-4" className="mr-2" /> Subscribing...</> : (video.owner.isSubscribed ? 'Subscribed' : 'Subscribe')}</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-4 p-4 bg-background-secondary rounded-xl text-sm border border-border">
                        <p className="text-text-primary whitespace-pre-wrap leading-relaxed">{video.description}</p>
                    </div>

                    <VideoInsights
                        videoId={videoId}
                        isOwner={isOwner}
                        onSeek={handleSeek}
                    />
                    <VideoChat
                        videoId={videoId}
                        isAuthenticated={isAuthenticated}
                        onSeek={handleSeek}
                    />

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