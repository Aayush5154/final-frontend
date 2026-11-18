import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { useSocket } from '../socket/SocketProvider';
import Loader from './common/Loader';

const fetchInsights = async (videoId) => {
    const { data } = await apiClient.get(`/insights/${videoId}`);
    return data.data;
};

const formatTimestamp = (seconds = 0) => {
    const total = Math.max(Math.floor(seconds), 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remaining = total % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
    }
    return `${minutes}:${String(remaining).padStart(2, '0')}`;
};

const Spinner = ({ label }) => (
    <div className="flex items-center space-x-3 text-text-secondary py-2">
        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
        <p className="text-sm">{label}</p>
    </div>
);

function VideoInsights({ videoId, isOwner, onSeek }) {
    const queryClient = useQueryClient();
    const socket = useSocket();
    const [showTranscript, setShowTranscript] = useState(false);
    const [showDetailed, setShowDetailed] = useState(false);

    const { data } = useQuery({
        queryKey: ['insights', videoId],
        queryFn: () => fetchInsights(videoId),
        enabled: !!videoId,
    });

    const processMutation = useMutation({
        mutationFn: (force) => apiClient.post(`/insights/${videoId}/process`, { force }),
        onSuccess: (response) => {
            const payload = response.data?.data;
            if (payload?.insight) {
                queryClient.setQueryData(['insights', videoId], (current) => ({ ...current, insight: payload.insight }));
            }
            queryClient.invalidateQueries({ queryKey: ['insights', videoId] });
        },
    });

    useEffect(() => {
        if (!socket || !videoId) return undefined;

        const joinRoom = () => socket.emit('video:join', videoId);
        joinRoom();
        socket.on('connect', joinRoom);

        const handleInsightsUpdated = (payload) => {
            if (!payload?.insight || String(payload.insight.video) !== String(videoId)) return;
            queryClient.setQueryData(['insights', videoId], (current) => ({ ...current, insight: payload.insight }));
        };

        socket.on('insights:updated', handleInsightsUpdated);

        return () => {
            socket.off('connect', joinRoom);
            socket.off('insights:updated', handleInsightsUpdated);
        };
    }, [socket, videoId, queryClient]);

    const insight = data?.insight;
    const transcription = insight?.transcription;
    const analysis = insight?.analysis;

    const isTranscribing = ['pending', 'processing'].includes(transcription?.status);
    const isAnalyzing = analysis?.status === 'processing';
    const transcriptReady = transcription?.status === 'ready' && transcription?.segments?.length > 0;
    const analysisReady = analysis?.status === 'ready';

    return (
        <div className="mt-4 p-4 bg-background-secondary rounded-xl text-sm border border-border">
            <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-base font-semibold text-text-primary flex items-center space-x-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>AI Insights</span>
                </h2>
                {isOwner && (!insight || transcription?.status === 'failed' || analysis?.status === 'failed') && (
                    <button
                        type="button"
                        onClick={() => processMutation.mutate(false)}
                        disabled={processMutation.isPending}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors"
                    >
                        <span className="flex items-center">{processMutation.isPending ? <><Loader size="w-3.5 h-3.5" className="mr-1.5" /> Queuing...</> : insight ? 'Retry' : 'Generate insights'}</span>
                    </button>
                )}
            </div>

            {processMutation.isError && (
                <p className="text-xs text-red-400 mb-2">
                    {processMutation.error?.response?.data?.message || 'Failed to start AI processing.'}
                </p>
            )}

            {!insight && !processMutation.isPending && (
                <p className="text-text-secondary">
                    {isOwner
                        ? 'Generate a timestamped transcript, AI summary and key takeaways for this video.'
                        : 'AI insights have not been generated for this video yet.'}
                </p>
            )}

            {isTranscribing && (
                <Spinner label="Transcribing audio locally with faster-whisper. Longer videos take more time..." />
            )}

            {transcription?.status === 'failed' && (
                <p className="text-xs text-red-400">
                    Transcription failed: {transcription.error || 'Unknown error'}
                </p>
            )}

            {transcriptReady && (
                <div className="mb-3">
                    <button
                        type="button"
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="flex items-center space-x-2 font-semibold text-text-primary hover:text-white transition-colors"
                    >
                        <svg className={`w-4 h-4 transition-transform ${showTranscript ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span>Transcript</span>
                        <span className="text-[11px] font-normal text-text-muted">
                            {transcription.language || 'auto'} · {transcription.segments.length} segments
                        </span>
                    </button>
                    {showTranscript && (
                        <div className="mt-2 max-h-72 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                            {transcription.segments.map((segment, index) => (
                                <div key={`${segment.start}-${index}`} className="flex items-start space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => onSeek?.(segment.start)}
                                        className="text-xs font-mono text-primary hover:underline flex-shrink-0 pt-0.5"
                                    >
                                        {formatTimestamp(segment.start)}
                                    </button>
                                    <p className="text-text-secondary leading-relaxed">{segment.text}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isAnalyzing && <Spinner label="Generating AI summary and key takeaways with Gemini..." />}

            {analysis?.status === 'failed' && transcriptReady && (
                <p className="text-xs text-red-400">
                    AI summary unavailable: {analysis.error || 'Unknown error'}
                </p>
            )}

            {analysisReady && (
                <div className="space-y-4">
                    {analysis.shortSummary && (
                        <div>
                            <h3 className="font-semibold text-text-primary mb-1">Summary</h3>
                            <p className="text-text-secondary leading-relaxed">{analysis.shortSummary}</p>
                        </div>
                    )}

                    {analysis.detailedSummary && (
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowDetailed(!showDetailed)}
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                {showDetailed ? 'Hide detailed summary' : 'Show detailed summary'}
                            </button>
                            {showDetailed && (
                                <p className="mt-2 text-text-secondary whitespace-pre-wrap leading-relaxed">
                                    {analysis.detailedSummary}
                                </p>
                            )}
                        </div>
                    )}

                    {analysis.takeaways?.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-text-primary mb-2">Key takeaways</h3>
                            <ul className="space-y-1.5">
                                {analysis.takeaways.map((point, index) => (
                                    <li key={index} className="flex items-start space-x-2 text-text-secondary">
                                        <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default VideoInsights;
