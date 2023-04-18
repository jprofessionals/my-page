import RequireAuth from '../components/auth/RequireAuth'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { API_URL } from '@/services/api.service'
import Loading from '@/components/Loading'
import UserInformation from '@/components/UserInformation'
import ErrorPage from '@/components/ErrorPage'
import { useQuery } from "react-query";
import axios from "axios";
import authHeader from "@/services/auth-header";
import { Budget } from "@/types";

const BudgetList = dynamic(() => import('@/components/budget/BudgetList'), {
  ssr: false,
})

const getBudgets = async (): Promise<Budget[]> => {
  const response = await axios.get(API_URL + 'me/budgets', {
    headers: authHeader(),
  })

  const budgets: Budget[] = response.data

  return budgets.map((budget) => ({
    ...budget,
    id: String(budget.id),
  }))
}

export default function HomePage() {
  const {
    data: budgets = [],
    isFetched,
    isLoading,
  } = useQuery('budgets', () => getBudgets())

  return (
    <>
      <Head>
        <title>Min side</title>
      </Head>
      <RequireAuth>
        <div>
          <UserInformation />
          <Loading
            isLoading={isLoading}
            loadingText="Laster inn ditt budsjett..."
          >
            {isFetched ? (
              <BudgetList budgets={budgets} />
            ) : (
              <ErrorPage
                errorText="Din bruker er autentisert, men vi klarte likevel ikke å hente ut dine budsjetter. Prøv igjen senere." />
            )}
          </Loading>
        </div>
      </RequireAuth>
    </>
  )
}
