import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/providers/AuthProvider'
import dynamic from 'next/dynamic'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { QueryClient, QueryClientProvider } from "react-query";

export default function App({
  Component,
  pageProps: { ...pageProps },
}: AppProps) {
  const NavBar = dynamic(() => import('@/components/navbar/NavBar'), {
    ssr: false,
  })

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
          <NavBar/>
          <Component {...pageProps} />
        </AuthProvider>
      </QueryClientProvider>
    </>
  )
}
