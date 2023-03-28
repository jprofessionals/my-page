import { Inter } from 'next/font/google'
import RequireAuth from '../components/auth/RequireAuth'
import BudgetContainer from '../components/budget/BudgetContainer'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <>
      <Head>
        <title>Min side</title>
      </Head>
      <RequireAuth>
        <BudgetContainer />
      </RequireAuth>
    </>
  )
}
