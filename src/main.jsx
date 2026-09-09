import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import store from './store/store.js';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import VideoDetail from './pages/VideoDetail.jsx';
import UploadVideo from './pages/UploadVideo.jsx';
import EditVideo from './pages/EditVideo.jsx';
import NotFound from './pages/NotFound.jsx';
import PlaylistDetail from './pages/PlaylistDetail.jsx';
import TweetsPage from './pages/TweetsPage.jsx';
import ChannelPage from './pages/ChannelPage.jsx';
import AuthLayout from './components/AuthLayout.jsx';
import RootLayout from './RootLayout.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import LikedVideos from './pages/LikedVideos.jsx';
import SubscriptionsPage from './pages/SubscriptionsPage.jsx';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <App />,
        children: [
          {
            path: '',
            element: <Home />
          },
          {
            path: 'login',
            element: <Login />
          },
          {
            path: 'signup',
            element: <Signup />
          },
          {
            path: 'video/:videoId',
            element: <VideoDetail />,
          },
          { path: 'playlist/:playlistId', element: <PlaylistDetail /> },
          { path: 'channel/:username', element: <ChannelPage /> },
          {
            path: '*',
            element: <NotFound />
          },
          {
            element: <AuthLayout authentication={true} />,
            children: [
              {
                path: 'dashboard',
                element: <Dashboard />,
              },
              {
                path: 'upload-video',
                element: <UploadVideo />,
              },
              {
                path: 'edit-video/:videoId',
                element: <EditVideo />,
              },
              { path: 'tweets', element: <TweetsPage /> },
              { path: 'history', element: <HistoryPage /> },
              { path: 'liked-videos', element: <LikedVideos /> },
              { path: 'subscriptions', element: <SubscriptionsPage /> },
            ]
          }
        ],
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);