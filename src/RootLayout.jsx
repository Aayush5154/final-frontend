import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { login, logout } from './store/authSlice';
import apiClient from './api/axios';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

function RootLayout() {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const location = useLocation();

    // Close sidebar on route change on mobile
    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [location]);

    useEffect(() => {
        // Simple responsive handler to auto-close on mobile initial load
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }

        console.log("RootLayout: Auth check initiated.");

        // Let's create a controller to be able to cancel the request
        const controller = new AbortController();

        apiClient.get('/user/current-user', { signal: controller.signal })
            .then((response) => {
                console.log("RootLayout: API call successful.", response.data);
                if (response.data && response.data.success) {
                    dispatch(login(response.data.data));
                } else {
                    dispatch(logout());
                }
            })
            .catch((error) => {
                if (error.name === 'CanceledError') {
                    console.log("RootLayout: Request canceled.");
                } else {
                    console.error("RootLayout: Auth check failed.", error);
                    dispatch(logout());
                }
            })
            .finally(() => {
                console.log("RootLayout: Auth check finished.");
                setLoading(false);
            });

        // Cleanup function to cancel the request if the component unmounts
        return () => {
            controller.abort();
        };

    }, [dispatch]);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background text-text-primary">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xl font-medium animate-pulse">Loading VideoTweet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-text-primary font-sans">
            <Header toggleSidebar={toggleSidebar} />

            <div className="flex flex-1 pt-[0px]"> {/* Header is sticky top-0, height 64px, so no pt needed if sticky works well. actually sidebar is fixed top-64 */}
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                {/* Main Content Area */}
                <main
                    className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default RootLayout;