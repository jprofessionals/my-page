import { Inter } from 'next/font/google'
import RequireAuth from '../components/auth/RequireAuth'
import BudgetContainer from '../components/budget/BudgetContainer'
import Head from 'next/head'
import { useAuthContext } from '@/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const { user } = useAuthContext()

  return (
    <>
      <Head>
        <title>Min side</title>
      </Head>
      <RequireAuth>
        <BudgetContainer user={user} />
      </RequireAuth>
    </>
  )
}
