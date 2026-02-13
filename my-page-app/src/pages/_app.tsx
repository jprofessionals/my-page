import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/providers/AuthProvider'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NavBar from '@/components/navbar/NavBar'
import { useState } from 'react'
import { useRouter } from 'next/router'

// Routes that should not show the navigation bar (public pages)
const publicRoutes = ['/ktu/survey/', '/ktu/resultater']

export default function App({
  Component,
  pageProps: { ...pageProps },
}: AppProps) {
  const [queryClient] = useState(() => new QueryClient())
  const router = useRouter()

  // Check if current route is a public route (no nav bar)
  const isPublicRoute = publicRoutes.some((route) =>
    router.pathname.startsWith(route),
  )

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick={true}
        pauseOnHover={true}
        draggable={true}
        theme="colored"
      />
      <QueryClientProvider client={queryClient}>
        {isPublicRoute ? (
          // Public routes: no auth provider or nav bar
          <Component {...pageProps} />
        ) : (
          // Protected routes: with auth provider and nav bar
          <AuthProvider>
            <main data-theme="jpro">
              <NavBar />
              <Component {...pageProps} />
            </main>
          </AuthProvider>
        )}
      </QueryClientProvider>
    </>
  )
}
