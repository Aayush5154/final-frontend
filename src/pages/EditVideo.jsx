import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';

const fetchVideoById = async (videoId) => {
    const { data } = await apiClient.get(`/videos/${videoId}`);
    return data.data;
};

const updateVideoDetails = async ({ videoId, formData }) => {
    const { data } = await apiClient.patch(`/videos/${videoId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data.data;
};

function EditVideo() {
    const { videoId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail: null,
    });
    const [error, setError] = useState('');

    const { data: video, isLoading } = useQuery({
        queryKey: ['video', videoId],
        queryFn: () => fetchVideoById(videoId),
        enabled: !!videoId,
    });

    useEffect(() => {
        if (video) {
            setFormData({
                title: video.title,
                description: video.description,
                thumbnail: null,
            });
        }
    }, [video]);

    const updateMutation = useMutation({
        mutationFn: updateVideoDetails,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardVideos'] });
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
            navigate('/dashboard');
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Update failed. Please try again.');
        }
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const submissionData = new FormData();
        submissionData.append('title', formData.title);
        submissionData.append('description', formData.description);
        if (formData.thumbnail) {
            submissionData.append('thumbnail', formData.thumbnail);
        }

        updateMutation.mutate({ videoId, formData: submissionData });
    };

    if (isLoading) {
        return <div className="text-center p-8 text-text-secondary animate-pulse">Loading video details...</div>;
    }

    return (
        <div className="flex justify-center items-start py-10 bg-background min-h-[calc(100vh-80px)]">
            <div className="w-full max-w-2xl p-8 space-y-6 bg-background-secondary border border-border rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-center text-text-primary">Edit Video</h2>
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows="4"
                            className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Current Thumbnail</label>
                        <img src={video?.thumbnail} alt="Current Thumbnail" className="w-48 h-27 object-cover rounded-lg border border-border mt-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Upload New Thumbnail (Optional)</label>
                        <input
                            type="file"
                            name="thumbnail"
                            onChange={handleChange}
                            accept="image/*"
                            className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors"
                        />
                    </div>
                    <button type="submit" disabled={updateMutation.isPending} className="w-full px-4 py-3 font-bold text-white bg-primary rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors">
                        {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditVideo;