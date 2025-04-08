import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from 'notistack'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { RouterProvider } from 'react-router-dom'
import SocketInitializer from './components/SocketInitializer'
import { AgoraProvider } from './components/video-call/AgoraContext'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import './index.css'
import router from './router'
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <AgoraProvider>
                <SocketInitializer />
                <RouterProvider router={router} />
              </AgoraProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SnackbarProvider>
    </HelmetProvider>
  </StrictMode>,
)
