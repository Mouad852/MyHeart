import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

// React Query client with sensible defaults for a medical app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 30 seconds — data is considered fresh for 30s
      staleTime: 30_000,
      // Retry failed requests once before showing an error
      retry: 1,
      // Don't refetch when the window is refocused (medical data is sensitive)
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Don't retry mutations (POST/PUT/DELETE)
      retry: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
        <App />
        {/* Global toast notification system */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111D35',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#14B8A6', secondary: '#070B14' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#070B14' },
            },
            duration: 3500,
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
