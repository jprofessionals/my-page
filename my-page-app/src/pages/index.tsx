import Head from 'next/head'
import dynamic from 'next/dynamic'
import {useCallback, useEffect, useState} from 'react'
import ApiService from '@/services/api.service'
import {toast} from 'react-toastify'
import {Booking, Budget} from '@/types'
import Loading from '@/components/Loading'
import UserInformation from '@/components/UserInformation'
import {useAuthContext} from '@/providers/AuthProvider'
import ErrorPage from '@/components/ErrorPage'

const BudgetList = dynamic(() => import('@/components/budget/BudgetList'), {
  ssr: false,
})
const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

type BudgetLoadingStatus = 'init' | 'loading' | 'completed' | 'failed'
type BookingLoadingStatus = 'init' | 'loading' | 'completed' | 'failed'

export default function HomePage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetLoadingStatus, setBudgetLoadingStatus] =
    useState<BudgetLoadingStatus>('init')
  const { userFetchStatus } = useAuthContext()
  const [activeBudget, setActiveBudget] = useState<string | null>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingLoadingStatus, setBookingLoadingStatus] =
      useState<BookingLoadingStatus>('init')

  const refreshBookings = useCallback(async () => {
    setBookingLoadingStatus('loading')

    try{
      const loadedBookings = await ApiService.getBookingsForUser()
      setBookingLoadingStatus('completed')
      setBookings(loadedBookings)
    } catch (e) {
      setBookingLoadingStatus('failed')
      toast.error('Klarte ikke laste bookings, prøv igjen senere')
    }
  }, [])

  useEffect(() => {
    if (bookingLoadingStatus !== 'init') return
    if (userFetchStatus === 'fetched') refreshBookings()
  }, [userFetchStatus, bookingLoadingStatus])

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
    if (budgetLoadingStatus !== 'init') return
    if (userFetchStatus === 'fetched') refreshBudgets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFetchStatus, budgetLoadingStatus])


  return (
    <>
      <Head>
        <title>Min side</title>
      </Head>
      <RequireAuth>
        <div>
          <UserInformation />
          <h3 className="ml-4 mb-6 text-3xl font-light">Dine hyttebookinger: </h3>
          {bookingLoadingStatus === 'completed' ? (
              <>
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <div key={booking.id} className="ml-10 mb-3">
                          <p>Hytte: {booking.apartment.cabin_name}</p>
                          <p>Start dato: {booking.startDate}</p>
                          <p>Slutt dato: {booking.endDate}</p>
                        </div>
                    ))
                ) : (
                    <p className = "ml-10">Du har ingen hyttebookinger. Se oversikt over ledige dager og book i kalenderen på hyttebookingsiden.</p>
                )}
              </>
          ) : (
              <ErrorPage errorText="Klarte ikke laste bookinger, prøv igjen senere." />
          )}
          <Loading
            isLoading={['loading', 'init'].includes(budgetLoadingStatus)}
            loadingText="Laster inn ditt budsjett..."
          >
            {budgetLoadingStatus === 'completed' ? (
              <BudgetList
                type="tiles"
                budgets={budgets}
                refreshBudgets={refreshBudgets}
                activeBudgetId={activeBudget}
                updateActiveBudget={setActiveBudget}
              />
            ) : (
              <ErrorPage errorText="Din bruker er autentisert, men vi klarte likevel ikke å hente ut dine budsjetter. Prøv igjen senere." />
            )}
          </Loading>
          <div className="p-4 prose">
            <h3 className="mb-6 text-3xl font-light mt-2">Bidra til Min side</h3>
            <p>
              Min Side er en side som utvikles internt i JPro. Alle bidrag til siden
              mottas med takk, og er i tillegg en fin mulighet til å drive med litt
              egenutvikling.
            </p>
            <p>
              Applikasjonen er en Kotlin/Spring+React+MySQL applikasjon som hostes på
              GCP. Koden er å finne på{' '}
              <a
                  href="https://github.com/jprofessionals/my-page"
                  className="text-warning"
              >
                GitHub.
              </a>
            </p>
            <p>Kontakt Roger for å få rettigheter til å dytte kode til repoet.</p>
          </div>
        </div>
      </RequireAuth>
    </>
  )
}
