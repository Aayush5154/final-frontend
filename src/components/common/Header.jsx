import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../store/authSlice';
import apiClient from '../../api/axios';

function Header({ toggleSidebar }) {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        // We will show a loading state on the button if needed, but for now, this is robust.
        try {
            // 1. Await the API call. We will not proceed until the server
            //    confirms that the session has been destroyed.
            await apiClient.post('/user/logout');

            // 2. Once the server confirms, THEN we update the frontend state.
            dispatch(logout());

            // 3. Navigate to a safe page like home or login.
            navigate('/login');

        } catch (error) {
            // If the API call fails for some reason (e.g., network error),
            // it's safest to still log the user out on the frontend.
            console.error("Logout API call failed, but logging out on frontend anyway.", error);
            dispatch(logout());
            navigate('/login');
        }
    };

    const navItems = [
        { name: 'Home', path: '/', active: true },
        { name: 'Tweets', path: '/tweets', active: true },
    ];

    return (
        <header className="bg-background-secondary border-b border-border sticky top-0 z-50 h-[64px]">
            <nav className="container-fluid px-4 h-full">
                <div className="flex justify-between items-center h-full">
                    {/* Left side: Hamburger, Logo */}
                    <div className="flex items-center space-x-4">
                        {!['/login', '/signup'].includes(location.pathname) && (
                            <button
                                onClick={toggleSidebar}
                                className="p-2 rounded-full hover:bg-white/10 text-text-primary focus:outline-none"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                            </button>
                        )}

                        <Link to="/" className="flex items-center space-x-1 group">
                            {/* Custom Red Play Icon */}
                            <div className="w-8 h-6 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary-hover transition-colors">
                                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[8px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                            </div>
                            <span className="text-xl font-bold text-text-primary tracking-tighter hidden sm:block">VideoTweet</span>
                        </Link>
                    </div>

                    {/* Center: Desktop Nav (Optional, mostly moved to sidebar but keeping top links if needed) */}
                    {/* For YouTube style, main nav is in sidebar. We can keep search here later. */}
                    <div className="hidden md:flex flex-1 justify-center max-w-xl mx-4">
                        {/* Placeholder for future search bar */}

                    </div>


                    {/* Right side: Desktop Auth Buttons */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/upload-video"
                                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-black bg-primary rounded-full hover:bg-primary-hover transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="white">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-white hidden sm:inline">Create</span>
                                </Link>

                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm font-medium text-text-secondary hover:text-white transition-colors hidden sm:block"
                                    >
                                        Log out
                                    </button>

                                    <Link to="/dashboard" className="relative group">
                                        <img
                                            src={user?.avatar}
                                            alt={user?.username}
                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-colors"
                                        />
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-primary border border-border rounded-full hover:bg-white/10 transition-colors">Log in</Link>
                                <Link to="/signup" className="px-4 py-2 text-sm font-medium text-black bg-white rounded-full hover:bg-gray-200 transition-colors hidden sm:inline-block">Sign up</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;