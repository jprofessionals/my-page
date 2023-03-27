import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import React from 'react'
import NavBar from '@/components/navbar/NavBar'
import { AuthProvider } from '@/providers/AuthProvider'

export default function App({
  Component,
  pageProps: { ...pageProps },
}: AppProps) {
  return (
    <>
      <AuthProvider>
        <NavBar />
        <Component {...pageProps} />
      </AuthProvider>
    </>
  )
}
