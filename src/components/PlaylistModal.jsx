import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '../api/axios';
import { Link } from 'react-router-dom';

// --- API Functions for this component ---
const fetchUserPlaylists = async (userId) => {
    if (!userId) return [];
    const { data } = await apiClient.get(`/playlist/user/${userId}`);
    return data.data.playlists;
};

// This single function will handle both adding and removing
const toggleVideoInPlaylist = async ({ playlistId, videoId, isCurrentlyInPlaylist }) => {
    const endpoint = isCurrentlyInPlaylist
        ? `/playlist/remove/${videoId}/${playlistId}`
        : `/playlist/add/${videoId}/${playlistId}`;

    const { data } = await apiClient.patch(endpoint);
    return data.data;
};

// --- Component ---
function PlaylistModal({ video, onClose }) {
    const queryClient = useQueryClient();
    const { user } = useSelector((state) => state.auth);

    // 1. Fetch all of the user's playlists
    const { data: playlists, isLoading } = useQuery({
        queryKey: ['playlists', user?._id],
        queryFn: () => fetchUserPlaylists(user?._id),
        enabled: !!user,
    });

    // 2. Set up the mutation to handle adding/removing a video
    const toggleMutation = useMutation({
        mutationFn: toggleVideoInPlaylist,
        onSuccess: () => {
            // After a change, refetch the playlists to update the video counts, etc.
            // This also ensures our check for `isVideoInPlaylist` is fresh.
            queryClient.invalidateQueries({ queryKey: ['playlists', user?._id] });
        },
        onError: (error) => {
            alert(`Error: ${error.response?.data?.message || "Could not update playlist."}`);
        },
    });

    // 3. The handler that gets called when a checkbox is clicked
    const handlePlaylistToggle = (playlist) => {
        // Check if the current video is already in the playlist we just clicked on
        const isCurrentlyInPlaylist = playlist.videos?.some(v => v === video._id);

        toggleMutation.mutate({
            playlistId: playlist._id,
            videoId: video._id,
            isCurrentlyInPlaylist
        });
    };


    return (
        // Modal Backdrop: Covers the whole screen
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={onClose} // Clicking the dark background will close the modal
        >
            {/* Modal Content: The actual popup window */}
            <div
                className="bg-background-secondary border border-border p-6 rounded-xl shadow-2xl w-full max-w-sm"
                onClick={(e) => e.stopPropagation()} // Prevents clicking inside the modal from closing it
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-text-primary">Save to...</h2>
                    <button onClick={onClose} className="text-text-secondary text-2xl hover:text-text-primary transition-colors">&times;</button>
                </div>

                {isLoading ? (
                    <p className="text-text-secondary animate-pulse text-center py-4">Loading playlists...</p>
                ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                        {playlists?.map((playlist) => {
                            // Determine if the video is in the current playlist for the checkbox
                            const isVideoInPlaylist = playlist.videos?.some(v => v === video._id);

                            return (
                                <div key={playlist._id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handlePlaylistToggle(playlist)}>
                                    <input
                                        type="checkbox"
                                        id={playlist._id}
                                        checked={isVideoInPlaylist}
                                        onChange={() => { }} // Handled by div click
                                        disabled={toggleMutation.isPending && toggleMutation.variables?.playlistId === playlist._id}
                                        className="h-5 w-5 rounded border-border text-primary focus:ring-primary bg-background cursor-pointer accent-primary"
                                    />
                                    <label htmlFor={playlist._id} className="text-text-primary flex-grow cursor-pointer group-hover:text-white transition-colors">
                                        {playlist.name}
                                    </label>
                                </div>
                            );
                        })}
                        {playlists?.length === 0 && (
                            <p className="text-text-muted text-center py-4">
                                No playlists found. <Link to="/dashboard" className="text-primary hover:underline" onClick={onClose}>Create one!</Link>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PlaylistModal;