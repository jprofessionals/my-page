import Head from 'next/head'
import dynamic from 'next/dynamic'
import React, { useCallback, useEffect, useState } from 'react'
import ApiService from '@/services/api.service'
import { toast } from 'react-toastify'
import { Booking, Budget } from '@/types'
import Loading from '@/components/Loading'
import UserInformation from '@/components/UserInformation'
import { useAuthContext } from '@/providers/AuthProvider'
import ErrorPage from '@/components/ErrorPage'
import {
  AccordionContent,
  AccordionItem,
  Accordions,
  AccordionTrigger,
} from '@/components/ui/bookingAccordion'
import { faHotel, faTicket, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import cn from '@/utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { get } from 'radash'
import BookingEditModal
  from '@/components/hyttebooking/month-overview/components/month-calendar/booking-edit-modal/BookingEditModal'

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

  const [bookings, setBookings] = useState<Booking[]>([])
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [bookingLoadingStatus, setBookingLoadingStatus] =
    useState<BookingLoadingStatus>('init')

  const { user } = useAuthContext()
  const [editBooking, setEditBooking] = useState<Booking | undefined>(undefined)
  const handleEditBookingCancelled = () => setEditBooking(undefined)
  const handleEditBookingSaved = async () => {
    setEditBooking(undefined)
    refreshBookings();
  }

  const handleInitEditBooking = (booking: Booking) => {
      setEditBooking(booking)
    }


  const refreshBookings = useCallback(async () => {
    setBookingLoadingStatus('loading')

    try {
      const loadedPendingBookings = await ApiService.getPendingBookingsForUser()
      const loadedBookings = await ApiService.getBookingsForUser()
      setBookingLoadingStatus('completed')
      setPendingBookings(loadedPendingBookings)
      setBookings(loadedBookings)
    } catch {
      setBookingLoadingStatus('failed')
      toast.error('Klarte ikke laste reservasjoner, prøv igjen senere')
    }
  }, [])

  useEffect(() => {
    if (bookingLoadingStatus !== 'init') return
    if (userFetchStatus === 'fetched') refreshBookings()
  }, [userFetchStatus, bookingLoadingStatus, refreshBookings])

  const refreshBudgets = useCallback(async () => {
    setBudgetLoadingStatus('loading')

    try {
      const loadedBudgets = await ApiService.getBudgets()
      setBudgetLoadingStatus('completed')
      setBudgets(loadedBudgets)
    } catch {
      setBudgetLoadingStatus('failed')
      toast.error('Klarte ikke laste budsjettene, prøv igjen senere')
    }
  }, [])

  useEffect(() => {
    if (budgetLoadingStatus !== 'init') return
    if (userFetchStatus === 'fetched') refreshBudgets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFetchStatus, budgetLoadingStatus])

  type CabinColorClasses = {
    [key: string]: string
  }
  const cabinTextColorClasses: CabinColorClasses = {
    'Stor leilighet': 'text-orange-brand',
    'Liten leilighet': 'text-blue-small-appartment',
    Annekset: 'text-teal-annex',
  }

  const bookingConfigs: Record<
    string,
    {
      bgColor: string
      textColor: string
      icon: IconDefinition
    }
  > = {
    default: {
      bgColor: 'bg-yellow-hotel',
      textColor: 'text-white',
      icon: faHotel,
    },
    pendingbookings: {
      bgColor: 'bg-blue-300',
      textColor: 'text-white',
      icon: faTicket,
    },
  }

  const bookingConfig = get(bookingConfigs, 'default', bookingConfigs.default)
  const pendingBookingConfig = get(bookingConfigs, 'pendingbookings', bookingConfigs.pendingbookings)

  return (
    <>
      <Head>
        <title>Min side</title>
      </Head>
      <RequireAuth>
        <div>
          <UserInformation />
          <h3 className="ml-4 mb-6 text-3xl font-light">
            Dine hyttereservasjoner{' '}
          </h3>
          {bookingLoadingStatus === 'completed' ? (
            <>
              {bookings.length > 0 ? (
                <div className="px-4">
                  <Accordions type="multiple" className="mb-3 w-full">
                    <AccordionItem value="bookings" className="border-none">
                      <AccordionTrigger
                        className={cn(
                          'text-sm rounded-lg items-center px-3 gap-2 self-start hover:brightness-90 focus:brightness-90 data-open:brightness-90 data-open:rounded-b-none ',
                          bookingConfig?.textColor,
                          bookingConfig?.bgColor,
                        )}
                      >
                        <div className="flex flex-1 gap-4 justify-between">
                          <span
                            title="Hyttebooking"
                            className="flex flex-wrap gap-2 justify-center uppercase"
                          >
                            {bookingConfig?.icon ? (
                              <FontAwesomeIcon
                                icon={bookingConfig?.icon}
                                size="xl"
                                className="w-8"
                              />
                            ) : null}
                            Reservasjoner
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-2 rounded-b-lg data-open:border-2">
                        {bookings
                          .sort((a, b) => {
                            const startDateComparison =
                              Date.parse(a.startDate) - Date.parse(b.startDate)
                            if (startDateComparison !== 0) {
                              return startDateComparison
                            }
                            return Date.parse(a.endDate) - Date.parse(b.endDate)
                          })
                          .map((booking, index) => {
                            const startDate = new Date(booking.startDate)
                            const endDate = new Date(booking.endDate)
                            const formattedStartDate = `${startDate.getDate()}.${
                              startDate.getMonth() + 1
                            }.${startDate.getFullYear()}`
                            const formattedEndDate = `${endDate.getDate()}.${
                              endDate.getMonth() + 1
                            }.${endDate.getFullYear()}`

                            const old = new Date(booking.endDate) < new Date()

                            return (
                              <div key={booking.id} className="ml-10 mt-3 ">
                                <p className={old ? 'old-booking' : ''}>
                                  <span className='mr-1'>
                                  Du {old ? 'hadde' : 'har reservert'}{' '}
                                  <span
                                    className={
                                      cabinTextColorClasses[
                                        booking.apartment.cabin_name
                                      ]
                                    }
                                  >
                                    {booking.apartment.cabin_name}
                                  </span>{' '}
                                  fra {formattedStartDate} til{' '}
                                    {formattedEndDate}</span>
                                  {old ? '' : <button className="btn btn-sm" onClick={() => handleInitEditBooking(booking)}>Rediger</button>}
                                </p>
                                {index !== bookings.length - 1 && (
                                  <hr className="mt-3" />
                                )}
                              </div>
                            )
                          })}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordions>
                  <BookingEditModal
                    user={user}
                    booking={editBooking}
                    onCancel={handleEditBookingCancelled}
                    onBookingSaved={handleEditBookingSaved}
                  />
                </div>
              ) : (
                <p className="ml-4 prose">
                  Du har ingen hyttereservasjoner. Se oversikt over ledige dager og reserver i kalenderen på firmahyttesiden.
                </p>
              )}

              {pendingBookings.length > 0 ? (
                <div className="px-4">
                  <Accordions type="multiple" className="mb-3 w-full">
                    <AccordionItem value="pendingbookings" className="border-none">
                      <AccordionTrigger
                        className={cn(
                          'text-sm rounded-lg items-center px-3 gap-2 self-start hover:brightness-90 focus:brightness-90 data-open:brightness-90 data-open:rounded-b-none ',
                          pendingBookingConfig?.textColor,
                          pendingBookingConfig?.bgColor,
                        )}
                      >
                        <div className="flex flex-1 gap-4 justify-between">
                          <span
                            title="Hyttebooking"
                            className="flex flex-wrap gap-2 justify-center uppercase"
                          >
                            {pendingBookingConfig?.icon ? (
                              <FontAwesomeIcon
                                icon={pendingBookingConfig?.icon}
                                size="xl"
                                className="w-8"
                              />
                            ) : null}
                            Ønsker
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-2 rounded-b-lg data-open:border-2">
                        {pendingBookings
                          .sort((a, b) => {
                            const startDateComparison =
                              Date.parse(a.startDate) - Date.parse(b.startDate)
                            if (startDateComparison !== 0) {
                              return startDateComparison
                            }
                            return Date.parse(a.endDate) - Date.parse(b.endDate)
                          })
                          .map((booking, index) => {
                            const startDate = new Date(booking.startDate)
                            const endDate = new Date(booking.endDate)
                            const formattedStartDate = `${startDate.getDate()}.${
                              startDate.getMonth() + 1
                            }.${startDate.getFullYear()}`
                            const formattedEndDate = `${endDate.getDate()}.${
                              endDate.getMonth() + 1
                            }.${endDate.getFullYear()}`

                            return (
                              <div key={booking.id} className="ml-10 mt-3 ">
                                <p>
                                  Du har lagt inn ønske om{' '}
                                  <span
                                    className={
                                      cabinTextColorClasses[
                                        booking.apartment.cabin_name
                                        ]
                                    }
                                  >
                                    {booking.apartment.cabin_name}
                                  </span>{' '}
                                  fra {formattedStartDate} til{' '}
                                  {formattedEndDate} - Se kalenderen på firmahyttesiden for informasjon om trekning
                                </p>
                                {index !== bookings.length - 1 && (
                                  <hr className="mt-3" />
                                )}
                              </div>
                            )
                          })}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordions>
                </div>
              ) : (
                <></>
              )}
            </>
          ) : (
            <ErrorPage errorText="Klarte ikke laste reservasjoner, prøv igjen senere." />
          )}
          <Loading
            isLoading={['loading', 'init'].includes(budgetLoadingStatus)}
            loadingText="Laster inn ditt budsjett..."
          >
            {budgetLoadingStatus === 'completed' ? (
              <BudgetList
                type="tiles"
                budgets={budgets}
              />
            ) : (
              <ErrorPage errorText="Din bruker er autentisert, men vi klarte likevel ikke å hente ut dine budsjetter. Prøv igjen senere." />
            )}
          </Loading>
          <div className="p-4 prose">
            <h3 className="mb-6 text-3xl font-light mt-2">
              Bidra til Min side
            </h3>
            <p>
              Min Side er en side som utvikles internt i JPro. Alle bidrag til
              siden mottas med takk, og er i tillegg en fin mulighet til å drive
              med litt egenutvikling.
            </p>
            <p>
              Applikasjonen er en Kotlin/Spring+React+MySQL applikasjon som
              hostes på GCP. Koden er å finne på{' '}
              <a
                href="https://github.com/jprofessionals/my-page"
                className="text-warning"
              >
                GitHub.
              </a>
            </p>
            <p>
              Kontakt Runar eller Steinar for å få rettigheter til å dytte kode til repoet.
            </p>
          </div>
        </div>
      </RequireAuth>
    </>
  )
}
