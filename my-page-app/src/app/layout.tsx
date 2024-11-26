import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.scss'
import { ToastContainer } from 'react-toastify'
import Providers from '@/app/providers'
import NavBar from '@/components/navbar/NavBar'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Min side',
  description: 'Informasjon og verktøykasse for ansatte i JPro',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          closeOnClick={true}
          pauseOnHover={true}
          draggable={true}
          theme="colored"
        />
        <main data-theme="jpro">
          <Providers>
            <NavBar />
            {children}
          </Providers>
        </main>
      </body>
    </html>
  )
}
