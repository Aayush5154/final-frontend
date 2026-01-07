import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../api/axios';
import { formatTimeAgo } from '../utils/time';

// --- API Functions ---
const fetchAllTweets = async () => {
    const { data } = await apiClient.get('/tweets'); // <-- Use the new simpler endpoint
    return data.data; // The backend returns the array directly in data.data
};

const createTweet = async (content) => {
    const { data } = await apiClient.post('/tweets', { content });
    return data.data;
};


// --- Component ---
function TweetsPage() {
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [tweetContent, setTweetContent] = useState('');

    // Query to fetch tweets
    // We'll need to expand this later to be a real feed.
    const { data: tweets, isLoading } = useQuery({
        queryKey: ['allTweets'], // Use a new query key
        queryFn: fetchAllTweets, // Use the new fetch function
    });

    // Mutation to create a new tweet
    const createTweetMutation = useMutation({
        mutationFn: createTweet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tweets'] });
            setTweetContent('');
        },
    });

    const handleTweetSubmit = (e) => {
        e.preventDefault();
        if (!tweetContent.trim()) return;
        createTweetMutation.mutate(tweetContent);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Tweets</h1>

            {/* Create Tweet Form */}
            {isAuthenticated && (
                <div className="bg-background-secondary border border-border p-4 rounded-xl mb-8">
                    <form onSubmit={handleTweetSubmit} className="flex items-start space-x-4">
                        <img src={user?.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-grow">
                            <textarea
                                value={tweetContent}
                                onChange={(e) => setTweetContent(e.target.value)}
                                placeholder="What's happening?"
                                className="w-full bg-background/50 text-text-primary p-3 rounded-lg border border-border focus:outline-none focus:border-primary placeholder-text-muted resize-none"
                                rows="3"
                            ></textarea>
                            <div className="text-right mt-2">
                                <button type="submit" disabled={createTweetMutation.isPending} className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors">
                                    Tweet
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Tweet List */}
            {isLoading ? (
                <div className="text-center p-8">
                    <p className="text-text-secondary animate-pulse">Loading tweets...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tweets?.map((tweet) => (
                        <div key={tweet._id} className="bg-background-secondary border border-border p-4 rounded-xl flex items-start space-x-4 hover:bg-white/5 transition-colors">
                            <img src={tweet.owner.avatar} alt={tweet.owner.username} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <p className="font-semibold text-text-primary">{tweet.owner.fullName}</p>
                                    <p className="text-sm text-text-secondary">@{tweet.owner.username}</p>
                                    <span className="text-text-muted">·</span>
                                    <p className="text-sm text-text-secondary">{formatTimeAgo(tweet.createdAt)}</p>
                                </div>
                                <p className="text-text-primary mt-1 whitespace-pre-wrap">{tweet.content}</p>
                            </div>
                        </div>
                    ))}
                    {tweets?.length === 0 && <p className="text-center text-text-secondary py-8">No tweets yet.</p>}
                </div>
            )}
        </div>
    );
}

export default TweetsPage;