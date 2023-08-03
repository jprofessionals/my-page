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
import { faHotel, IconDefinition } from '@fortawesome/free-solid-svg-icons'
import cn from '@/utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { get } from 'radash'
import Modal from "react-modal"
import {useMutation, useQuery, useQueryClient} from "react-query"
import { useRouter } from 'next/router'

const BudgetList = dynamic(() => import('@/components/budget/BudgetList'), {
  ssr: false,
})
const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

type BudgetLoadingStatus = 'init' | 'loading' | 'completed' | 'failed'
type BookingLoadingStatus = 'init' | 'loading' | 'completed' | 'failed'

export default function HomePage() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetLoadingStatus, setBudgetLoadingStatus] =
    useState<BudgetLoadingStatus>('init')
  const { userFetchStatus } = useAuthContext()
  const [activeBudget, setActiveBudget] = useState<string | null>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingLoadingStatus, setBookingLoadingStatus] =
    useState<BookingLoadingStatus>('init')

  const customModalStyles = {
    content: {
      width: 'auto',
      minWidth: '300px',
      margin: 'auto',
      maxHeight: '80vh',
      overflow: 'auto',
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
    },
  }

  const refreshBookings = useCallback(async () => {
    setBookingLoadingStatus('loading')

    try {
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

  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false)
  const [bookingIdToDelete, setBookingIdToDelete] = useState<number | null>(
      null,
  )

  const openDeleteModal = (bookingId: number | null) => {
    setBookingIdToDelete(bookingId)
    setDeleteModalIsOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalIsOpen(false)
  }

  const confirmDelete = async () => {
    if (bookingIdToDelete) {
      await handleDeleteBooking(bookingIdToDelete)
      closeDeleteModal()
    }
  }

  const handleDeleteBooking = async (bookingId: number | null) => {
    deleteBooking.mutate(bookingId)
  }

  const deleteBookingByBookingId = async (bookingId: number | null) => {
    try {
      await ApiService.deleteBooking(bookingId)
      toast.success('Reservasjonen din er slettet')
    } catch (error) {
      toast.error(
          `Reservasjonen din ble ikke slettet med følgende feil: ${error}`,
      )
    }
  }

  const deleteBooking = useMutation(deleteBookingByBookingId, {
    onSuccess: () => {
      refreshBookings()
    },
    onError: (error) => {
      console.error('Error:', error)
    },
  })

  const handleEditBooking = () => {
    router.push('http://localhost:3000/hyttebooking')
  }

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
  }

  const bookingConfig = get(bookingConfigs, 'default', bookingConfigs.default)

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

                            return (
                              <div key={booking.id} className="ml-10 mt-3">
                                <p>
                                  Du har reservert{' '}
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
                                  {formattedEndDate}
                                  <button
                                      onClick={handleEditBooking}
                                      className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md ml-3"
                                  >
                                    Rediger
                                  </button>
                                  <button
                                      onClick={() => openDeleteModal(booking.id)}
                                      className="bg-red-not-available text-white px-2 py-0.5 rounded-md ml-2"
                                  >
                                    Slett
                                  </button>
                                  <Modal
                                      isOpen={deleteModalIsOpen}
                                      onRequestClose={closeDeleteModal}
                                      contentLabel="Delete Confirmation"
                                      style={customModalStyles}
                                  >
                                    <p className="mb-3">
                                      Er du sikker på at du vil slette
                                      reservasjonen?
                                    </p>
                                    <div className="flex justify-end">
                                      <button
                                          onClick={confirmDelete}
                                          className="ml-3 bg-red-500 text-white px-2 py-0.5 rounded-md"
                                      >
                                        Slett reservasjon
                                      </button>
                                      <button
                                          onClick={closeDeleteModal}
                                          className="ml-3 bg-gray-300 text-black-nav px-2 py-0.5 rounded-md"
                                      >
                                        Avbryt
                                      </button>
                                    </div>
                                  </Modal>
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
                <p className="ml-4 prose">
                  Du har ingen hyttereservasjoner. Se oversikt over ledige dager
                  og reserver i kalenderen på firmahyttesiden.
                </p>
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
                refreshBudgets={refreshBudgets}
                activeBudgetId={activeBudget}
                updateActiveBudget={setActiveBudget}
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
              Kontakt Roger for å få rettigheter til å dytte kode til repoet.
            </p>
          </div>
        </div>
      </RequireAuth>
    </>
  )
}
