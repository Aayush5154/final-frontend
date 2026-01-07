import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';

// --- API Functions ---
const fetchChannelStats = async () => {
    const { data } = await apiClient.get('/dashboard/stats');
    return data.data;
};

const fetchChannelVideos = async () => {
    const { data } = await apiClient.get('/dashboard/videos');
    return data.data.videos; // The videos are inside data.data.videos
};

const togglePublishStatus = async (videoId) => {
    const { data } = await apiClient.patch(`/videos/toggle/publish/${videoId}`);
    return data.data;
};

const deleteVideo = async (videoId) => {
    const { data } = await apiClient.delete(`/videos/${videoId}`);
    return data;
};

const fetchUserPlaylists = async (userId) => {
    if (!userId) return [];
    const { data } = await apiClient.get(`/playlist/user/${userId}`);
    return data.data.playlists;
};

const createPlaylist = async (playlistData) => {
    const { data } = await apiClient.post('/playlist', playlistData);
    return data.data;
};

const deletePlaylist = async (playlistId) => {
    const { data } = await apiClient.delete(`/playlist/${playlistId}`);
    return data;
};

const updateUserCoverImage = async (coverImage) => {
    const formData = new FormData();
    formData.append('coverImage', coverImage);
    const { data } = await apiClient.patch('/user/cover-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
};

// --- Component ---
function Dashboard() {
    const queryClient = useQueryClient();
    const { user } = useSelector((state) => state.auth);
    const [playlistName, setPlaylistName] = useState('');
    const [playlistDescription, setPlaylistDescription] = useState('');
    const [coverImageFile, setCoverImageFile] = useState(null);

    // Fetch channel stats
    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: fetchChannelStats,
    });

    // Fetch channel videos
    const { data: videos, isLoading: isLoadingVideos } = useQuery({
        queryKey: ['dashboardVideos'],
        queryFn: fetchChannelVideos,
    });

    const { data: playlists, isLoading: isLoadingPlaylists } = useQuery({
        queryKey: ['playlists', user?._id],
        queryFn: () => fetchUserPlaylists(user?._id),
        enabled: !!user, // Only run this query if the user is loaded
    });

    // Mutation for toggling publish status
    const togglePublishMutation = useMutation({
        mutationFn: togglePublishStatus,
        onSuccess: () => {
            // When successful, refetch the videos to show the updated status
            queryClient.invalidateQueries({ queryKey: ['dashboardVideos'] });
        },
    });

    const deleteVideoMutation = useMutation({
        mutationFn: deleteVideo,
        onSuccess: () => {
            // When a video is deleted, refetch both stats and videos
            // to keep everything on the page up-to-date.
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardVideos'] });
            alert('Video deleted successfully!');
        },
        onError: (error) => {
            console.error('Failed to delete video', error);
            alert('Failed to delete video. Please try again.');
        }
    });

    const createPlaylistMutation = useMutation({
        mutationFn: createPlaylist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists', user?._id] });
            setPlaylistName('');
            setPlaylistDescription('');
            alert('Playlist created!');
        },
        onError: (error) => {
            alert(`Failed to create playlist: ${error.response?.data?.message || error.message}`);
        }
    });

    const deletePlaylistMutation = useMutation({
        mutationFn: deletePlaylist,
        onSuccess: () => {
            // When a playlist is deleted, refetch the playlist list
            queryClient.invalidateQueries({ queryKey: ['playlists', user?._id] });
            alert('Playlist deleted successfully!');
        },
        onError: (error) => {
            alert(`Failed to delete playlist: ${error.response?.data?.message || error.message}`);
        }
    });

    const coverImageMutation = useMutation({
        mutationFn: updateUserCoverImage,
        onSuccess: () => {
            // Refetch the user's data everywhere to show the new image
            queryClient.invalidateQueries({ queryKey: ['channel', user.username] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }); // Stats includes channel info
            alert('Cover image updated successfully!');
            setCoverImageFile(null); // Clear the file input
        },
        onError: (error) => {
            alert(`Failed to update cover image: ${error.response?.data?.message || error.message}`);
        }
    });

    const handleTogglePublish = (videoId) => {
        togglePublishMutation.mutate(videoId);
    };

    const handleDeleteVideo = (videoId) => {
        // Show a simple browser confirmation dialog
        if (window.confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
            deleteVideoMutation.mutate(videoId);
        }
    };

    const handleCreatePlaylist = (e) => {
        e.preventDefault();
        if (!playlistName.trim()) {
            alert('Playlist name is required.');
            return;
        }
        createPlaylistMutation.mutate({ name: playlistName, description: playlistDescription });
    };

    const handleDeletePlaylist = (playlistId) => {
        if (window.confirm("Are you sure you want to delete this playlist?")) {
            deletePlaylistMutation.mutate(playlistId);
        }
    };

    const handleCoverImageChange = (e) => {
        setCoverImageFile(e.target.files[0]);
    };

    const handleCoverImageSubmit = (e) => {
        e.preventDefault();
        if (!coverImageFile) {
            alert('Please select a file to upload.');
            return;
        }
        coverImageMutation.mutate(coverImageFile);
    };

    if (isLoadingStats || isLoadingVideos) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-text-primary mb-6">Your Dashboard</h1>

            {/* Channel Settings */}
            <div className="bg-background-secondary border border-border p-6 rounded-xl mb-8">
                <h2 className="text-xl font-bold text-text-primary mb-4">Channel Settings</h2>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">Current Cover Image</label>
                    <div className="w-full aspect-video bg-background rounded-lg overflow-hidden border border-border">
                        {user?.coverImage ? (
                            <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex justify-center items-center h-full">
                                <p className="text-text-muted">No cover image uploaded.</p>
                            </div>
                        )}
                    </div>
                </div>
                <form onSubmit={handleCoverImageSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Change Cover Image</label>
                        <div className="mt-2 flex items-center space-x-4">
                            <input type="file" onChange={handleCoverImageChange} accept="image/*" className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors" />
                            <button type="submit" disabled={!coverImageFile || coverImageMutation.isPending} className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                {coverImageMutation.isPending ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-background-secondary border border-border p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-text-primary">{stats?.totalSubscribers || 0}</p>
                    <p className="text-text-secondary text-sm">Subscribers</p>
                </div>
                <div className="bg-background-secondary border border-border p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-text-primary">{stats?.totalViews || 0}</p>
                    <p className="text-text-secondary text-sm">Total Views</p>
                </div>
                <div className="bg-background-secondary border border-border p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-text-primary">{stats?.totalVideos || 0}</p>
                    <p className="text-text-secondary text-sm">Total Videos</p>
                </div>
                <div className="bg-background-secondary border border-border p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-text-primary">{stats?.totalLikes || 0}</p>
                    <p className="text-text-secondary text-sm">Total Likes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Create Playlist Form */}
                <div className="bg-background-secondary border border-border p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-text-primary mb-4">Create New Playlist</h2>
                    <form onSubmit={handleCreatePlaylist} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Playlist Name</label>
                            <input
                                type="text"
                                value={playlistName}
                                onChange={(e) => setPlaylistName(e.target.value)}
                                className="w-full px-3 py-2 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted"
                                placeholder="Enter playlist name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary">Description</label>
                            <textarea
                                value={playlistDescription}
                                onChange={(e) => setPlaylistDescription(e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted"
                                placeholder="Enter description"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={createPlaylistMutation.isPending}
                            className="w-full px-4 py-2 font-bold text-black bg-white rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            {createPlaylistMutation.isPending ? 'Creating...' : 'Create Playlist'}
                        </button>
                    </form>
                </div>

                {/* List of Playlists */}
                <div className="bg-background-secondary border border-border p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-text-primary mb-4">Your Playlists</h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {playlists?.map((playlist) => (
                            <div key={playlist._id} className="bg-background border border-border p-3 rounded-lg flex justify-between items-center group">
                                <Link to={`/playlist/${playlist._id}`} className="flex-grow">
                                    <p className="font-semibold text-text-primary group-hover:text-primary transition-colors">{playlist.name}</p>
                                    <p className="text-xs text-text-secondary">{playlist.videoCount} videos</p>
                                </Link>
                                <button
                                    onClick={() => handleDeletePlaylist(playlist._id)}
                                    className="ml-4 px-3 py-1.5 text-xs font-medium text-white bg-red-600/20 text-red-500 rounded-full hover:bg-red-600/30 transition-colors disabled:opacity-50"
                                    disabled={deletePlaylistMutation.isPending}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                        {playlists?.length === 0 && <p className="text-text-muted text-center py-4">You haven't created any playlists yet.</p>}
                    </div>
                </div>
            </div>

            {/* Videos Table */}
            <h2 className="text-2xl font-bold text-text-primary mb-4">Your Videos</h2>
            <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-border">
                        <tr>
                            <th className="p-4 text-text-secondary font-medium">Thumbnail</th>
                            <th className="p-4 text-text-secondary font-medium">Title</th>
                            <th className="p-4 text-text-secondary font-medium">Status</th>
                            <th className="p-4 text-text-secondary font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {videos?.map((video) => (
                            <tr key={video._id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <img src={video.thumbnail} alt={video.title} className="w-24 h-14 object-cover rounded-lg" />
                                </td>
                                <td className="p-4 font-medium text-text-primary">{video.title}</td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${video.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {video.isPublished ? 'Published' : 'Unpublished'}
                                    </span>
                                </td>
                                <td className="p-4 space-x-2">
                                    <button
                                        onClick={() => handleTogglePublish(video._id)}
                                        className="px-3 py-1.5 text-xs font-medium bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        Toggle
                                    </button>
                                    <Link
                                        to={`/edit-video/${video._id}`}
                                        className="px-3 py-1.5 text-xs font-medium bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors inline-block"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteVideo(video._id)}
                                        className="px-3 py-1.5 text-xs font-medium bg-red-600/20 text-red-500 rounded-full hover:bg-red-600/30 transition-colors disabled:opacity-50"
                                        disabled={deleteVideoMutation.isPending}
                                    >
                                        {deleteVideoMutation.isPending && deleteVideoMutation.variables === video._id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {videos?.length === 0 && <p className="p-8 text-center text-text-muted">You haven't uploaded any videos yet.</p>}
            </div>
        </div>
    );
}

export default Dashboard;