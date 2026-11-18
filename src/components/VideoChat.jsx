import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

const fetchChat = async (videoId) => {
    const { data } = await apiClient.get(`/chat/${videoId}`);
    return data.data;
};

const fetchInsights = async (videoId) => {
    const { data } = await apiClient.get(`/insights/${videoId}`);
    return data.data;
};

const timestampToSeconds = (timestamp) => {
    const parts = timestamp.split(':').map(Number);
    return parts.length === 3
        ? parts[0] * 3600 + parts[1] * 60 + parts[2]
        : parts[0] * 60 + parts[1];
};

function AnswerText({ content, onSeek }) {
    const parts = [];
    const pattern = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
    let lastIndex = 0;

    for (const match of content.matchAll(pattern)) {
        if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
        const timestamp = match[1];
        parts.push(
            <button
                key={`${match.index}-${timestamp}`}
                type="button"
                onClick={() => onSeek?.(timestampToSeconds(timestamp))}
                className="font-mono text-primary hover:underline"
            >
                {timestamp}
            </button>
        );
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) parts.push(content.slice(lastIndex));

    return <p className="whitespace-pre-wrap leading-relaxed">{parts}</p>;
}

function VideoChat({ videoId, isAuthenticated, onSeek }) {
    const queryClient = useQueryClient();
    const [question, setQuestion] = useState('');
    const scrollRef = useRef(null);

    const { data: insightData } = useQuery({
        queryKey: ['insights', videoId],
        queryFn: () => fetchInsights(videoId),
        enabled: !!videoId,
    });
    const { data, isLoading } = useQuery({
        queryKey: ['videoChat', videoId],
        queryFn: () => fetchChat(videoId),
        enabled: isAuthenticated && !!videoId,
    });

    const askMutation = useMutation({
        mutationFn: (text) => apiClient.post(`/chat/${videoId}/messages`, { question: text }),
        onSuccess: (response) => {
            const payload = response.data?.data;
            queryClient.setQueryData(['videoChat', videoId], { messages: payload?.messages || [] });
            setQuestion('');
        },
    });

    const messages = data?.messages || [];
    const transcription = insightData?.insight?.transcription;
    const embedding = insightData?.insight?.embedding;
    const transcriptReady = transcription?.status === 'ready' && transcription?.segments?.length > 0;

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages.length, askMutation.isPending]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const text = question.trim();
        if (!text || askMutation.isPending) return;
        askMutation.mutate(text);
    };

    return (
        <section className="mt-4 p-4 bg-background-secondary rounded-xl text-sm border border-border">
            <div className="flex items-center space-x-2 mb-1">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h8M8 14h5m8-2a9 9 0 01-9 9l-4 2 1-5a9 9 0 1112-6z" />
                </svg>
                <h2 className="text-base font-semibold text-text-primary">Chat with this video</h2>
            </div>
            <p className="text-xs text-text-muted mb-4">Answers use only this video&apos;s transcript. Timestamps open the relevant moment.</p>

            {!isAuthenticated ? (
                <p className="text-text-secondary">
                    <Link to="/login" className="text-primary hover:underline">Log in</Link> to ask questions and keep your conversation history.
                </p>
            ) : (
                <>
                    <div ref={scrollRef} className="max-h-80 overflow-y-auto custom-scrollbar space-y-3 pr-1 mb-4">
                        {isLoading && <p className="text-text-secondary">Loading conversation...</p>}
                        {!isLoading && !messages.length && (
                            <p className="text-text-secondary">Ask about a concept, explanation, or moment from this video.</p>
                        )}
                        {messages.map((message, index) => (
                            <div key={`${message.createdAt}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-xl px-3 py-2 ${message.role === 'user' ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary'}`}>
                                    {message.role === 'assistant'
                                        ? <AnswerText content={message.content} onSeek={onSeek} />
                                        : <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>}
                                </div>
                            </div>
                        ))}
                        {askMutation.isPending && (
                            <div className="flex items-center space-x-2 text-text-secondary">
                                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span>Searching the transcript...</span>
                            </div>
                        )}
                    </div>

                    {askMutation.isError && (
                        <p className="text-xs text-red-400 mb-3">
                            {askMutation.error?.response?.data?.message || 'Unable to answer right now. Please try again.'}
                        </p>
                    )}
                    {!transcriptReady && transcription && (
                        <p className="text-xs text-text-secondary mb-3">Chat becomes available when the transcript is ready.</p>
                    )}
                    {embedding?.status === 'processing' && (
                        <p className="text-xs text-text-secondary mb-3">Preparing transcript search...</p>
                    )}

                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        <textarea
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    handleSubmit(event);
                                }
                            }}
                            rows={1}
                            maxLength={1000}
                            disabled={askMutation.isPending || !transcriptReady}
                            placeholder={transcriptReady ? 'Ask about this video...' : 'Waiting for the transcript...'}
                            className="flex-1 resize-none bg-background border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!question.trim() || askMutation.isPending || !transcriptReady}
                            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                        >
                            Send
                        </button>
                    </form>
                </>
            )}
        </section>
    );
}

export default VideoChat;
