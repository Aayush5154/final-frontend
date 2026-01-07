import React from 'react';
import { Link } from 'react-router-dom';
import { formatTimeAgo } from '../utils/time';

function VideoCard({ video }) {
    const formatViews = (views) => {
        if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
        if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
        return views;
    };

    // Prevent errors if video or owner data is missing
    if (!video || !video.owner) {
        return null; // Or return a loading skeleton
    }

    return (
        <div className="w-full">
            {/* Link for Thumbnail */}
            <Link to={`/video/${video._id}`}>
                <div className="relative mb-3 w-full pt-[56.25%] group"> {/* 16:9 Aspect Ratio */}
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="absolute top-0 left-0 w-full h-full object-cover rounded-xl group-hover:rounded-none transition-all duration-300"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                        {new Date((video.duration || 0) * 1000).toISOString().substr(14, 5)}
                    </span>
                </div>
            </Link>
            <div className="flex items-start px-1">
                {/* Link for Avatar */}
                <Link to={`/channel/${video.owner.username}`} className="flex-shrink-0 mt-0.5">
                    <img
                        src={video.owner.avatar}
                        alt={video.owner.username}
                        className="w-9 h-9 rounded-full object-cover hover:opacity-80 transition-opacity"
                    />
                </Link>
                <div className="ml-3 flex-grow min-w-0">
                    {/* Link for Title */}
                    <Link to={`/video/${video._id}`}>
                        <h3 className="text-base font-semibold text-text-primary line-clamp-2 leading leading-snug hover:text-white mb-1">
                            {video.title}
                        </h3>
                    </Link>
                    {/* Link for Username */}
                    <Link to={`/channel/${video.owner.username}`}>
                        <p className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center">
                            {video.owner.fullName || video.owner.username}
                        </p>
                    </Link>
                    <div className="text-sm text-text-secondary flex items-center mt-0.5">
                        <span>{formatViews(video.views)} views</span>
                        <span className="mx-1 text-xs">•</span>
                        <span>{formatTimeAgo(video.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VideoCard;