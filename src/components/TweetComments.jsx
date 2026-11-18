import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../api/axios';
import Loader from './common/Loader';
import { formatTimeAgo } from '../utils/time';
import { groupThreads } from '../utils/threads';

const fetchTweetComments = async (tweetId) => {
    const { data } = await apiClient.get(`/tweets/${tweetId}/comments`);
    return data.data;
};

const addTweetComment = async ({ tweetId, content, parent }) => {
    const { data } = await apiClient.post(`/tweets/${tweetId}/comments`, { content, parent });
    return data.data;
};

function TweetComments({ tweetId }) {
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');

    const { data: comments, isLoading } = useQuery({
        queryKey: ['tweetComments', tweetId],
        queryFn: () => fetchTweetComments(tweetId),
    });

    const addCommentMutation = useMutation({
        mutationFn: addTweetComment,
        onSuccess: (comment) => {
            queryClient.setQueryData(['tweetComments', tweetId], (current) => {
                if (!Array.isArray(current)) return current;
                if (current.some((item) => item._id === comment._id)) return current;
                return [...current, comment];
            });
            setNewComment('');
            setReplyTo(null);
            setReplyContent('');
        },
    });

    const { topLevel, repliesByParent } = useMemo(
        () => groupThreads(comments || []),
        [comments]
    );

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        addCommentMutation.mutate({ tweetId, content: newComment });
    };

    const handleReplySubmit = (e, parentId) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        addCommentMutation.mutate({ tweetId, content: replyContent, parent: parentId });
    };

    const renderAuthor = (comment) => (
        <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-text-primary">
                {comment.owner?.fullname || comment.owner?.username}
            </span>
            <span className="text-[11px] text-text-muted">
                {formatTimeAgo(comment.createdAt)}
            </span>
        </div>
    );

    return (
        <div className="mt-3 border-t border-border pt-3">
            {isAuthenticated && (
                <form onSubmit={handleCommentSubmit} className="flex items-start space-x-2 mb-3">
                    <img src={user?.avatar} alt={user?.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-grow">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            rows="1"
                            className="w-full bg-background text-text-primary p-2 rounded-lg border border-border focus:outline-none focus:border-primary placeholder-text-muted resize-none text-sm"
                        ></textarea>
                        <div className="text-right mt-1">
                            <button
                                type="submit"
                                disabled={addCommentMutation.isPending}
                                className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors"
                            >
                                <span className="flex items-center">{addCommentMutation.isPending && !replyTo ? <><Loader size="w-3.5 h-3.5" className="mr-1.5" /> Posting...</> : 'Comment'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {isLoading ? (
                <p className="text-xs text-text-secondary animate-pulse">Loading comments...</p>
            ) : (
                <div className="space-y-3">
                    {topLevel.map((comment) => {
                        const replies = repliesByParent[String(comment._id)] || [];

                        return (
                            <div key={comment._id} className="flex items-start space-x-2">
                                <img src={comment.owner?.avatar} alt={comment.owner?.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                <div className="flex-grow min-w-0">
                                    {renderAuthor(comment)}
                                    <p className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                                    {isAuthenticated && (
                                        <button
                                            onClick={() => {
                                                setReplyTo(replyTo === comment._id ? null : comment._id);
                                                setReplyContent('');
                                            }}
                                            className="mt-1 text-xs font-medium text-text-secondary hover:text-white transition-colors"
                                        >
                                            Reply
                                        </button>
                                    )}

                                    {replyTo === comment._id && (
                                        <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="mt-2 flex items-start space-x-2">
                                            <img src={user?.avatar} alt={user?.username} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                            <div className="flex-grow">
                                                <textarea
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    placeholder={`Reply to @${comment.owner?.username}...`}
                                                    rows="1"
                                                    className="w-full bg-background text-text-primary p-2 rounded-lg border border-border focus:outline-none focus:border-primary placeholder-text-muted resize-none text-xs"
                                                ></textarea>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <button
                                                        type="submit"
                                                        disabled={addCommentMutation.isPending}
                                                        className="px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors"
                                                    >
                                                        <span className="flex items-center">{addCommentMutation.isPending ? <><Loader size="w-3.5 h-3.5" className="mr-1.5" /> Posting...</> : 'Reply'}</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setReplyTo(null); setReplyContent(''); }}
                                                        className="px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-white transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    )}

                                    {replies.length > 0 && (
                                        <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
                                            {replies.map((reply) => (
                                                <div key={reply._id} className="flex items-start space-x-2">
                                                    <img src={reply.owner?.avatar} alt={reply.owner?.username} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                                    <div>
                                                        {renderAuthor(reply)}
                                                        <p className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap">{reply.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {topLevel.length === 0 && (
                        <p className="text-xs text-text-muted">No comments yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default TweetComments;
