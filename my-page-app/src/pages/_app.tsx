import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/providers/AuthProvider'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { QueryClient, QueryClientProvider } from 'react-query'
import NavBar from '@/components/navbar/NavBar'

export default function App({
  Component,
  pageProps: { ...pageProps },
}: AppProps) {
  const queryClient = new QueryClient()

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
