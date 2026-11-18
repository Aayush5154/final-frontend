import React from 'react';
import { Link } from 'react-router-dom';
import Loader from './common/Loader';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { formatTimeAgo } from '../utils/time';

const formatClock = (totalSeconds = 0) => {
    const seconds = Math.max(Math.floor(totalSeconds), 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
    }
    return `${minutes}:${String(remaining).padStart(2, '0')}`;
};

function ContinueWatchingCard({ item }) {
    const queryClient = useQueryClient();
    const video = item.video;

    const removeMutation = useMutation({
        mutationFn: () => apiClient.delete(`/progress/${video._id}`),
        onSuccess: () => {
            queryClient.setQueryData(['continueWatching'], (current) => (
                Array.isArray(current) ? current.filter((entry) => entry._id !== item._id) : current
            ));
        },
    });

    if (!video) return null;

    const percent = item.duration > 0
        ? Math.min((item.progress / item.duration) * 100, 100)
        : 0;

    return (
        <div className="w-64 flex-shrink-0 group relative">
            <Link to={`/video/${video._id}`}>
                <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden border border-border bg-background-secondary">
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="absolute top-0 left-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/25">
                        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-white">
                    {video.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1 truncate">
                    {video.owner?.fullname || video.owner?.username}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                    Resume at {formatClock(item.progress)} · {formatTimeAgo(item.updatedAt)}
                </p>
            </Link>
            <button
                type="button"
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
                aria-label="Remove from Continue Watching"
                title="Remove from Continue Watching"
                className="absolute top-2 right-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-black/70 text-white transition-opacity hover:bg-black/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
                {removeMutation.isPending ? <Loader size="w-4 h-4" /> : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default ContinueWatchingCard;
