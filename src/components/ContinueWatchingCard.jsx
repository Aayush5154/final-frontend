import React from 'react';
import { Link } from 'react-router-dom';
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
    const video = item.video;

    if (!video) return null;

    const percent = item.duration > 0
        ? Math.min((item.progress / item.duration) * 100, 100)
        : 0;

    return (
        <Link to={`/video/${video._id}`} className="w-64 flex-shrink-0 group">
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
    );
}

export default ContinueWatchingCard;
