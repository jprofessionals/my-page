import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import React from 'react'
import { AuthProvider } from '@/providers/AuthProvider'
import dynamic from 'next/dynamic'

export default function App({
  Component,
  pageProps: { ...pageProps },
}: AppProps) {
  const NavBar = dynamic(() => import('@/components/navbar/NavBar'), {
    ssr: false,
  })
  return (
    <>
      <AuthProvider>
        <NavBar />
        <Component {...pageProps} />
      </AuthProvider>
    </>
  )
}
