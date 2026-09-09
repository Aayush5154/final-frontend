import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

function AuthLayout({ authentication = true }) {
    const { isAuthenticated } = useSelector((state) => state.auth);

    if (authentication && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default AuthLayout;