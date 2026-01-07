import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { login as authLogin } from '../store/authSlice';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        // Prepare payload to allow login with either username or email
        const payload = {
            username: formData.email,
            email: formData.email,
            password: formData.password
        };

        try {
            const response = await apiClient.post('/user/login', payload);
            if (response.data && response.data.success) {
                // The backend sends user data inside a 'data' object
                const { user } = response.data.data;
                dispatch(authLogin(user));
                navigate('/'); // Redirect to home page
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="w-full max-w-md p-8 space-y-6 bg-background-secondary border border-border rounded-xl shadow-2xl">
                <style>
                    {`
                        input:-webkit-autofill,
                        input:-webkit-autofill:hover, 
                        input:-webkit-autofill:focus, 
                        input:-webkit-autofill:active{
                            -webkit-box-shadow: 0 0 0 30px #1E1E1E inset !important;
                            -webkit-text-fill-color: white !important;
                            caret-color: white !important;
                        }
                    `}
                </style>
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">Welcome back</h2>
                    <p className="text-text-secondary mt-2">Please enter your details to sign in.</p>
                </div>
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                            Email or Username
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="text"
                            autoComplete="username"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors"
                            placeholder="Enter your email or username"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                                Password
                            </label>
                            {/* Add Forgot Password link here later if needed */}
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 mt-1 text-text-primary bg-background border border-border rounded-lg focus:outline-none focus:border-primary placeholder-text-muted transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3 font-bold text-white bg-primary rounded-full hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                        >
                            {loading ? 'Logging in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
                <p className="text-sm text-center text-text-secondary">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-primary hover:text-primary-hover transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;