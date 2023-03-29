import RequireAuth from '../components/auth/RequireAuth'
import Head from 'next/head'
import dynamic from 'next/dynamic'

const BudgetContainer = dynamic(
  () => import('@/components/budget/BudgetContainer'),
  {
    ssr: false,
  },
)

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
