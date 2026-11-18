import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../api/axios';
import { formatTimeAgo } from '../utils/time';
import { useSocket } from '../socket/SocketProvider';
import TweetComments from '../components/TweetComments';
import Loader from '../components/common/Loader';

const fetchAllTweets = async () => {
    const { data } = await apiClient.get('/tweets');
    return data.data;
};

const createTweet = async (content) => {
    const { data } = await apiClient.post('/tweets', { content });
    return data.data;
};

const toggleTweetLike = async (tweetId) => {
    const { data } = await apiClient.post(`/likes/toggle/t/${tweetId}`);
    return data.data;
};

function TweetsPage() {
    const queryClient = useQueryClient();
    const socket = useSocket();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [tweetContent, setTweetContent] = useState('');
    const [expandedTweetId, setExpandedTweetId] = useState(null);
    const seenCommentIds = useRef(new Set());

    const { data: tweets, isLoading } = useQuery({
        queryKey: ['allTweets'],
        queryFn: fetchAllTweets,
    });

    const createTweetMutation = useMutation({
        mutationFn: createTweet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allTweets'] });
            setTweetContent('');
        },
    });

    const likeMutation = useMutation({
        mutationFn: toggleTweetLike,
        onSuccess: (result, tweetId) => {
            queryClient.setQueryData(['allTweets'], (current) => {
                if (!Array.isArray(current)) return current;
                return current.map((tweet) => (
                    tweet._id === tweetId
                        ? { ...tweet, isLiked: result.isLiked, likesCount: result.likesCount }
                        : tweet
                ));
            });
        },
    });

    useEffect(() => {
        if (!socket) return undefined;

        const patchTweetList = (updater) => {
            queryClient.setQueryData(['allTweets'], (current) => (
                Array.isArray(current) ? updater(current) : current
            ));
        };

        const handleLikeUpdated = (payload) => {
            if (!payload?.tweetId) return;
            patchTweetList((current) => current.map((tweet) => {
                if (tweet._id !== payload.tweetId) return tweet;

                const isOwnAction = payload.userId && payload.userId === user?._id;
                return {
                    ...tweet,
                    likesCount: payload.likesCount,
                    ...(isOwnAction ? { isLiked: payload.isLiked } : {}),
                };
            }));
        };

        const handleNewComment = (comment) => {
            if (!comment?._id || !comment.tweet) return;
            const tweetId = String(comment.tweet);

            queryClient.setQueryData(['tweetComments', tweetId], (current) => {
                if (!Array.isArray(current)) return current;
                if (current.some((item) => item._id === comment._id)) return current;
                return [...current, comment];
            });

            if (seenCommentIds.current.has(comment._id)) return;
            seenCommentIds.current.add(comment._id);

            patchTweetList((current) => current.map((tweet) => (
                tweet._id === tweetId
                    ? { ...tweet, commentsCount: (tweet.commentsCount || 0) + 1 }
                    : tweet
            )));
        };

        const handleDeletedTweet = (deleted) => {
            if (!deleted?._id) return;
            patchTweetList((current) => current.filter((tweet) => tweet._id !== deleted._id));
            queryClient.removeQueries({ queryKey: ['tweetComments', deleted._id] });
        };

        socket.on('tweet:like-updated', handleLikeUpdated);
        socket.on('tweet:comment:new', handleNewComment);
        socket.on('tweet:deleted', handleDeletedTweet);

        return () => {
            socket.off('tweet:like-updated', handleLikeUpdated);
            socket.off('tweet:comment:new', handleNewComment);
            socket.off('tweet:deleted', handleDeletedTweet);
        };
    }, [socket, queryClient, user?._id]);

    const handleTweetSubmit = (e) => {
        e.preventDefault();
        if (!tweetContent.trim()) return;
        createTweetMutation.mutate(tweetContent);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Tweets</h1>

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
                                    <span className="flex items-center">{createTweetMutation.isPending ? <><Loader size="w-4 h-4" className="mr-2" /> Posting...</> : 'Tweet'}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {isLoading ? (
                <div className="text-center p-8">
                    <p className="text-text-secondary animate-pulse">Loading tweets...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tweets?.map((tweet) => (
                        <div key={tweet._id} className="bg-background-secondary border border-border p-4 rounded-xl flex items-start space-x-4 hover:bg-white/5 transition-colors">
                            <img src={tweet.owner?.avatar} alt={tweet.owner?.username} className="w-10 h-10 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <p className="font-semibold text-text-primary">{tweet.owner?.fullname || tweet.owner?.username}</p>
                                    <p className="text-sm text-text-secondary">@{tweet.owner?.username}</p>
                                    <span className="text-text-muted">·</span>
                                    <p className="text-sm text-text-secondary">{formatTimeAgo(tweet.createdAt)}</p>
                                </div>
                                <p className="text-text-primary mt-1 whitespace-pre-wrap">{tweet.content}</p>

                                <div className="flex items-center space-x-4 mt-3">
                                    <button
                                        onClick={() => likeMutation.mutate(tweet._id)}
                                        disabled={likeMutation.isPending}
                                        className={`flex items-center space-x-1.5 text-sm transition-colors disabled:opacity-50 ${tweet.isLiked ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                                        title={tweet.isLiked ? 'Unlike' : 'Like'}
                                    >
                                        {likeMutation.isPending ? <Loader size="w-5 h-5" /> : (
                                            <svg className="w-5 h-5" fill={tweet.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        )}
                                        <span>{tweet.likesCount || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => setExpandedTweetId(expandedTweetId === tweet._id ? null : tweet._id)}
                                        className={`flex items-center space-x-1.5 text-sm transition-colors ${expandedTweetId === tweet._id ? 'text-primary' : 'text-text-secondary hover:text-white'}`}
                                        title="Comments"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <span>{tweet.commentsCount || 0}</span>
                                    </button>
                                </div>

                                {expandedTweetId === tweet._id && (
                                    <TweetComments tweetId={tweet._id} />
                                )}
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
