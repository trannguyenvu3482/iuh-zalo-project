import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import IncomingCallNotification from '../components/IncomingCallNotification'
import LoadingSpinner from '../components/LoadingSpinner'
import MainLayout from '../layout/MainLayout'
import { ErrorPage } from '../pages'
import PrivateRoute from './PrivateRoute'

// Lazy load components
const LoginPage = lazy(() => import('../pages/Login'))
const WelcomePage = lazy(() => import('../pages/Welcome'))
const ChatsPage = lazy(() => import('../pages/Chats'))
const ErrorPagePage = lazy(() => import('../pages/ErrorPage'))
const VideoCallPage = lazy(() => import('../pages/VideoCallPage'))
const ContactsPage = lazy(() => import('../pages/Contacts'))
const FriendRequestsPage = lazy(
  () => import('../pages/contacts/FriendRequests'),
)
// Main app routes
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout>
          <IncomingCallNotification />
        </MainLayout>
      </PrivateRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: '/',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <WelcomePage />
          </Suspense>
        ),
      },
      {
        path: '/chat/:id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <PrivateRoute>
              <ChatsPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '/chat',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <PrivateRoute>
              <ChatsPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '/contacts',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <PrivateRoute>
              <ContactsPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      {
        path: '/contacts/requests',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <PrivateRoute>
              <FriendRequestsPage />
            </PrivateRoute>
          </Suspense>
        ),
      },
      //   {
      //     path: "/register",
      //     element: <Register />,
      //   },
      //   {
      //     path: "/dashboard",
      //     element: <Dashboard />,
      //   },
    ],
  },
  // Video call route (standalone)
  {
    path: '/call/:channelId',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <PrivateRoute>
          <VideoCallPage />
        </PrivateRoute>
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <ErrorPagePage />
      </Suspense>
    ),
  },
])

export default router
