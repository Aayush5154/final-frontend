import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

function UploadVideo() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        videoFile: null,
        thumbnail: null,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.videoFile || !formData.thumbnail) {
            setError('All fields are required.');
            return;
        }
        setError('');
        setLoading(true);

        const submissionData = new FormData();
        submissionData.append('title', formData.title);
        submissionData.append('description', formData.description);
        submissionData.append('videoFile', formData.videoFile);
        submissionData.append('thumbnail', formData.thumbnail);

        try {
            const response = await apiClient.post('/videos', submissionData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.success) {
                // On success, navigate to the new video's detail page
                const newVideoId = response.data.data._id;
                navigate(`/video/${newVideoId}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-start py-10 bg-background min-h-[calc(100vh-80px)]">
            <div className="w-full max-w-2xl p-8 space-y-6 bg-background-secondary border border-border rounded-xl shadow-2xl">
                <h2 className="text-2xl font-bold text-center text-text-primary">Upload a New Video</h2>
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Title</label>
                        <input type="text" name="title" onChange={handleChange} required className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Description</label>
                        <textarea name="description" onChange={handleChange} required rows="4" className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Video File</label>
                        <input type="file" name="videoFile" onChange={handleChange} required accept="video/*" className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Thumbnail Image</label>
                        <input type="file" name="thumbnail" onChange={handleChange} required accept="image/*" className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-primary rounded-full hover:bg-primary-hover disabled:opacity-50 transition-colors">
                        {loading ? 'Uploading...' : 'Upload Video'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default UploadVideo;