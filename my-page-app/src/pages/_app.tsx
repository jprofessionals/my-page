import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/providers/AuthProvider'
import dynamic from 'next/dynamic'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function App({
  Component,
  pageProps: { ...pageProps },
}: AppProps) {
  const NavBar = dynamic(() => import('@/components/navbar/NavBar'), {
    ssr: false,
  })
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
      <AuthProvider>
        <NavBar />
        <Component {...pageProps} />
      </AuthProvider>
    </>
  )
}
