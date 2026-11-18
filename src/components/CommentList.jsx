import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../api/axios';
import { formatTimeAgo } from '../utils/time';

const fetchComments = async (videoId) => {
    const { data } = await apiClient.get(`/comments/${videoId}`);
    return data.data.docs;
};

const addComment = async ({ videoId, content, parent }) => {
    const { data } = await apiClient.post(`/comments/${videoId}`, { content, parent });
    return data.data;
};

function CommentList({ videoId }) {
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');

    const { data: comments, isLoading } = useQuery({
        queryKey: ['comments', videoId],
        queryFn: () => fetchComments(videoId),
        enabled: !!videoId,
    });

    const addCommentMutation = useMutation({
        mutationFn: addComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', videoId] });
            setNewComment('');
            setReplyTo(null);
            setReplyContent('');
        },
    });

    const topLevelComments = useMemo(
        () => (comments || []).filter((comment) => !comment.parent),
        [comments]
    );

    const repliesByParent = useMemo(() => {
        return (comments || []).reduce((acc, comment) => {
            if (!comment.parent) return acc;

            const key = String(comment.parent);
            if (!acc[key]) acc[key] = [];
            acc[key].push(comment);
            return acc;
        }, {});
    }, [comments]);

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        addCommentMutation.mutate({ videoId, content: newComment });
    };

    const handleReplySubmit = (e, parentId) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        addCommentMutation.mutate({ videoId, content: replyContent, parent: parentId });
    };

    const renderAuthor = (comment) => (
        <div className="flex items-center space-x-2">
            <p className="font-semibold text-text-primary text-sm">{comment.owner?.username}</p>
            <span className="text-xs text-text-muted">
                {formatTimeAgo(comment.createdAt)}
            </span>
        </div>
    );

    return (
        <div className="mt-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">{comments?.length || 0} Comments</h3>

            {isAuthenticated && (
                <div className="mb-6">
                    <form onSubmit={handleCommentSubmit} className="flex items-start space-x-4">
                        <img src={user?.avatar} alt={user?.username} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-grow">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-background text-text-primary p-3 rounded-lg border border-border focus:outline-none focus:border-primary placeholder-text-muted transition-colors resize-y min-h-[80px]"
                                rows="2"
                            ></textarea>
                            <button
                                type="submit"
                                disabled={addCommentMutation.isPending}
                                className="mt-2 px-4 py-2 bg-primary text-white font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors text-sm"
                            >
                                {addCommentMutation.isPending && !replyTo ? 'Posting...' : 'Comment'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isLoading ? (
                <p className="text-text-secondary animate-pulse">Loading comments...</p>
            ) : (
                <div className="space-y-6">
                    {topLevelComments.map((comment) => {
                        const replies = repliesByParent[String(comment._id)] || [];

                        return (
                            <div key={comment._id}>
                                <div className="flex items-start space-x-4">
                                    <img src={comment.owner?.avatar} alt={comment.owner?.username} className="w-10 h-10 rounded-full object-cover" />
                                    <div className="flex-grow">
                                        {renderAuthor(comment)}
                                        <p className="text-text-primary text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                                        {isAuthenticated && (
                                            <button
                                                onClick={() => {
                                                    setReplyTo(replyTo?._id === comment._id ? null : comment);
                                                    setReplyContent('');
                                                }}
                                                className="mt-1 text-xs font-medium text-text-secondary hover:text-white transition-colors"
                                            >
                                                Reply
                                            </button>
                                        )}

                                        {replyTo?._id === comment._id && (
                                            <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="mt-2 flex items-start space-x-3">
                                                <img src={user?.avatar} alt={user?.username} className="w-8 h-8 rounded-full object-cover" />
                                                <div className="flex-grow">
                                                    <textarea
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder={`Reply to @${comment.owner?.username}...`}
                                                        className="w-full bg-background text-text-primary p-2 rounded-lg border border-border focus:outline-none focus:border-primary placeholder-text-muted resize-none text-sm"
                                                        rows="2"
                                                    ></textarea>
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        <button
                                                            type="submit"
                                                            disabled={addCommentMutation.isPending}
                                                            className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors"
                                                        >
                                                            {addCommentMutation.isPending ? 'Posting...' : 'Reply'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setReplyTo(null); setReplyContent(''); }}
                                                            className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-white transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        )}

                                        {replies.length > 0 && (
                                            <div className="mt-4 space-y-4 border-l-2 border-border pl-4">
                                                {replies.map((reply) => (
                                                    <div key={reply._id} className="flex items-start space-x-3">
                                                        <img src={reply.owner?.avatar} alt={reply.owner?.username} className="w-8 h-8 rounded-full object-cover" />
                                                        <div>
                                                            {renderAuthor(reply)}
                                                            <p className="text-text-primary text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {comments?.length === 0 && <p className="text-text-muted">No comments yet. Be the first to comment!</p>}
                </div>
            )}
        </div>
    );
}

export default CommentList;
