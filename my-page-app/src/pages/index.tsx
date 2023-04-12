import RequireAuth from '../components/auth/RequireAuth'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import ApiService from '@/services/api.service'
import { toast } from 'react-toastify'
import { Budget } from '@/types'
import Loading from '@/components/Loading'
import UserInformation from '@/components/UserInformation'
import { useAuthContext } from '@/providers/AuthProvider'
import ErrorPage from '@/components/ErrorPage'

const BudgetList = dynamic(() => import('@/components/budget/BudgetList'), {
  ssr: false,
})

type BudgetLoadingStatus = 'init' | 'loading' | 'completed' | 'failed'

export default function HomePage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetLoadingStatus, setBudgetLoadingStatus] =
    useState<BudgetLoadingStatus>('init')
  const { userFetchStatus } = useAuthContext()

  const refreshBudgets = useCallback(async () => {
    setBudgetLoadingStatus('loading')

    try {
      const loadedBudgets = await ApiService.getBudgets()
      setBudgetLoadingStatus('completed')
      setBudgets(loadedBudgets)
    } catch (e) {
      setBudgetLoadingStatus('failed')
      toast.error('Klarte ikke laste budsjettene, prøv igjen senere')
    }
  }, [])

  useEffect(() => {
    if (budgets.length > 0) return
    if (userFetchStatus === 'fetched') refreshBudgets()
  }, [userFetchStatus, budgets])

  return (
    <>
      <Head>
        <title>Min side</title>
      </Head>
      <RequireAuth>
        <div>
          <UserInformation />
          <Loading
            isLoading={['loading', 'init'].includes(budgetLoadingStatus)}
            loadingText="Laster inn ditt budsjett..."
          >
            {budgetLoadingStatus === 'completed' ? (
              <BudgetList budgets={budgets} refreshBudgets={refreshBudgets} />
            ) : (
              <ErrorPage errorText="Din bruker er autentisert, men vi klarte likevel ikke å hente ut dine budsjetter. Prøv igjen senere." />
            )}
          </Loading>
        </div>
      </RequireAuth>
    </>
  )
}
