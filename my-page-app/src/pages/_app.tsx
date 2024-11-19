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

export default function App({
  Component,
  pageProps: { ...pageProps },
}: AppProps) {
  const [queryClient] = useState(() => new QueryClient())

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
        <AuthProvider>
          <main data-theme="jpro">
            <NavBar />
            <Component {...pageProps} />
          </main>
        </AuthProvider>
      </QueryClientProvider>
    </>
  )
}
