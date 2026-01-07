import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';

function Signup() {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        avatar: null,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'avatar') {
            setFormData({ ...formData, avatar: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.avatar) {
            setError('Avatar is required.');
            return;
        }
        setError('');
        setLoading(true);

        // We use FormData because we are sending a file
        const submissionData = new FormData();
        submissionData.append('fullname', formData.fullName);
        submissionData.append('username', formData.username);
        submissionData.append('email', formData.email);
        submissionData.append('password', formData.password);
        submissionData.append('avatar', formData.avatar);

        try {
            const response = await apiClient.post('/user/register', submissionData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.success) {
                // On successful registration, redirect to the login page
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-8">
            <div className="w-full max-w-md p-8 space-y-6 bg-background-secondary border border-border rounded-xl shadow-2xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">Create Account</h2>
                    <p className="text-text-secondary mt-2">Join VideoTweet today.</p>
                </div>
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Full Name</label>
                        <input type="text" name="fullName" onChange={handleChange} required className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Username</label>
                        <input type="text" name="username" onChange={handleChange} required className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors" placeholder="johndoe" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Email</label>
                        <input type="email" name="email" onChange={handleChange} required className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors" placeholder="john@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary">Password</label>
                        <input type="password" name="password" onChange={handleChange} required className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors" placeholder="••••••••" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Avatar</label>
                        <input type="file" name="avatar" onChange={handleChange} required accept="image/*" className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-primary rounded-full hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] mt-2">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <p className="text-sm text-center text-text-secondary">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Signup;