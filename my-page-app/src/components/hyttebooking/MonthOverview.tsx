import React, { useCallback, useEffect, useState } from 'react'
import Modal from 'react-modal'
import { MonthCalendar } from '@/components/ui/monthCalendar'
import ApiService from '@/services/api.service'
import { Apartment, Booking } from '@/types'
import { toast } from 'react-toastify'
import { useAuthContext } from '@/providers/AuthProvider'
import { format, isBefore, sub } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import EditBooking from '@/components/hyttebooking/EditBooking'
import CreateBookingPost from '@/components/hyttebooking/CreateBookingPost'

export default function MonthOverview() {
  const [date, setDate] = useState<Date | undefined>()
  const [showModal, setShowModal] = useState(false)
  const [bookingItems, setBookingItems] = useState<Booking[]>([])
  const [expandedApartments, setExpandedApartments] = useState<number[]>([])
  const [userAdminStatus, setUserAdminStatus] = useState<boolean>(false)

  const { data: yourBookings } = useQuery<Booking[]>(
    'yourBookingsButton',
    async () => {
      const yourBookings = await ApiService.getBookingsForUser()
      return yourBookings
    },
  )
  const userIsAdmin = async () => {
    try {
      const response = await ApiService.getUser()
      const user = response.data
      const adminStatus = user.admin
      setUserAdminStatus(adminStatus)
    } catch (e) {
      toast.error('Kunne ikke hente brukers admin status')
    }
  }

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

  const confirmDelete = () => {
    handleDeleteBooking(bookingIdToDelete)
    closeDeleteModal()
  }

  const handleDeleteBooking = async (bookingId: number | null) => {
    deleteBooking.mutate(bookingId)
  }

  const deleteBookingByBookingId = async (bookingId: number | null) => {
    try {
      await ApiService.deleteBooking(bookingId)
      toast.success('Reservasjonen din er slettet')
      closeModal()
    } catch (error) {
      toast.error(
        `Reservasjonen din ble ikke slettet med følgende feil: ${error}`,
      )
    }
  }

  const [showEditFormForBooking, setShowEditFormForBookingId] = useState<
    number | null
  >(null)

  const handleEditBooking = (bookingId: number) => {
    if (showEditFormForBooking !== bookingId) {
      setShowEditFormForBookingId(bookingId)
    } else setShowEditFormForBookingId(null)
  }

  const queryClient = useQueryClient()
  const deleteBooking = useMutation(deleteBookingByBookingId, {
    onSuccess: () => {
      queryClient.invalidateQueries('bookings')
      refreshVacancies()
    },
    onError: (error) => {
      console.error('Error:', error)
    },
  })

  const [isDateValidForReservation, setIsDateValidForReservation] =
    useState(true)
  const handleDateClick = (date: Date) => {
    setDate(date)
    fetchBookingItems(date)
    getVacancyForDay(date)
    setShowModal(true)

    if (isBefore(date, new Date(cutOffDateVacancies))) {
      setIsDateValidForReservation(true)
    } else {
      setIsDateValidForReservation(false)
    }
  }

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
  const closeModal = () => {
    setShowModal(false)
    setDate(undefined)
    setShowEditFormForBookingId(null)
    setExpandedApartments([])
    setDeleteModalIsOpen(false)
  }

  const handleBookClick = (apartmentId: number) => {
    setExpandedApartments((prevExpandedApartments) => {
      const isExpanded = prevExpandedApartments.includes(apartmentId)
      if (isExpanded) {
        return prevExpandedApartments.filter((id) => id !== apartmentId)
      } else {
        return [...prevExpandedApartments, apartmentId]
      }
    })
  }

  const fetchBookingItems = async (selectedDate: Date) => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd')
      const bookings = await ApiService.getBookingsForDay(formattedDate)
      setBookingItems(bookings)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  type VacancyLoadingStatus = 'init' | 'loading' | 'completed' | 'failed'
  const [vacancyLoadingStatus, setVacancyLoadingStatus] =
    useState<VacancyLoadingStatus>('init')
  const { userFetchStatus } = useAuthContext()

  const [vacancies, setVacancies] = useState<
    { [key: number]: string[] } | undefined
  >({})

  const [vacantApartmentsOnDay, setVacantApartmentsOnDay] = useState<
    Apartment[]
  >([])
  const [apartments, setApartments] = useState<Apartment[]>([])

  const startDateVacancies = format(sub(new Date(), { days: 1 }), 'yyyy-MM-dd')
  //const endDateVacancies = format(add(new Date(), { months: 12 }), 'yyyy-MM-dd')
  const cutOffDateVacancies: string = '2023-10-01'
  //TODO: Hardkodet cutoff date som styrer hva man kan booke.
  const refreshVacancies = useCallback(async () => {
    setVacancyLoadingStatus('loading')

    try {
      const loadedVacancies = await ApiService.getAllVacancies(
        startDateVacancies,
        cutOffDateVacancies,
      )
      setVacancyLoadingStatus('completed')
      setVacancies(loadedVacancies)
    } catch (e) {
      setVacancyLoadingStatus('failed')
      toast.error('Klarte ikke laste ledige reservasjoner, prøv igjen senere')
    }
  }, [])

  useEffect(() => {
    if (vacancyLoadingStatus !== 'init') return
    if (userFetchStatus === 'fetched') {
      refreshVacancies()
      getAllApartments()
      userIsAdmin()
    }
  }, [userFetchStatus, vacancyLoadingStatus])

  const getAllApartments = async () => {
    const response = await ApiService.getAllApartments()
    setApartments(response)
  }
  const getVacantApartments = (selectedDate: Date) => {
    const vacantApartments: number[] = []
    const apartmentsInVacancies = Object.keys(vacancies!)

    const formattedDate = format(selectedDate, 'yyyy-MM-dd')
    const nextDate = new Date(selectedDate)
    nextDate.setDate(selectedDate.getDate() + 1)
    const formattedNextDate = format(nextDate, 'yyyy-MM-dd')
    const previousDate = new Date(selectedDate)
    previousDate.setDate(selectedDate.getDate() - 1)
    const formattedPreviousDate = format(previousDate, 'yyyy-MM-dd')

    if (isBefore(selectedDate, new Date(cutOffDateVacancies))) {
      for (const apartment of apartmentsInVacancies) {
        const dates = vacancies![Number(apartment)]
        if (
          dates.includes(formattedDate) ||
          dates.includes(formattedNextDate) ||
          dates.includes(formattedPreviousDate)
        ) {
          vacantApartments.push(Number(apartment))
        }
      }
    }
    return vacantApartments
  }

  const getVacancyForDay = async (selectedDate: Date) => {
    const availableApartments: Apartment[] = []
    const vacantApartmentsInPeriod = getVacantApartments(selectedDate)
    for (const apartment of apartments) {
      if (vacantApartmentsInPeriod.includes(apartment.id!)) {
        availableApartments.push(apartment)
      }
    }
    setVacantApartmentsOnDay(availableApartments)
    return vacantApartmentsOnDay
  }

  type CabinColorClasses = {
    [key: string]: string
  }
  const cabinTextColorClasses: CabinColorClasses = {
    'Stor leilighet': 'text-orange-brand',
    'Liten leilighet': 'text-blue-small-appartment',
    Annekset: 'text-teal-annex',
  }

  const cabinBorderColorClasses: CabinColorClasses = {
    'Stor leilighet': 'border-orange-brand',
    'Liten leilighet': 'border-blue-small-appartment',
    Annekset: 'border-teal-annex',
  }

  const cabinOrder = ['Stor leilighet', 'Liten leilighet', 'Annekset']

  return (
    <div className="flex flex-col overflow-hidden gap-4 p-4">
      <MonthCalendar
        onDayClick={handleDateClick}
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
      <Modal
        className=""
        isOpen={showModal}
        onRequestClose={closeModal}
        contentLabel="Selected Date"
        style={customModalStyles}
      >
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 prose">
          {date ? (
            <div>
              <h3 className="mt-1 mb-1">{format(date, 'dd.MM.yyyy')}</h3>
              {isDateValidForReservation ? (
                ''
              ) : (
                <p> Denne dagen er ikke åpnet for reservasjon enda.</p>
              )}
              <div>
                {bookingItems
                  .sort((a, b) => {
                    const cabinIndexA = cabinOrder.indexOf(
                      a.apartment.cabin_name,
                    )
                    const cabinIndexB = cabinOrder.indexOf(
                      b.apartment.cabin_name,
                    )

                    if (cabinIndexA !== cabinIndexB) {
                      return cabinIndexA - cabinIndexB
                    }
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
                    const formattedStartDate = format(startDate, 'dd.MM.yyyy')
                    const formattedEndDate = format(endDate, 'dd.MM.yyyy')

                    const isYourBooking = yourBookings?.some(
                      (yourBooking) => yourBooking.id === booking.id,
                    )

                    const prevCabinName =
                      index > 0
                        ? bookingItems[index - 1].apartment.cabin_name
                        : null
                    const currentCabinName = booking.apartment.cabin_name
                    const shouldRenderDivider =
                      prevCabinName !== currentCabinName

                    return (
                      <div key={booking.id}>
                        {shouldRenderDivider && (
                          <h4
                            className={`mt-2 mb-1 ${cabinTextColorClasses[currentCabinName]}`}
                          >
                            {currentCabinName}:
                          </h4>
                        )}
                        <p
                          className={`mt-2 mb-1 pl-2 flex ${cabinBorderColorClasses[currentCabinName]} border-l-2`}
                        >
                          {isYourBooking || userAdminStatus ? (
                            <>
                              <div className="flex flex-col">
                                <p className="flex-row justify-between items-center space-x-2">
                                  <span>
                                    {isYourBooking
                                      ? `Du har hytten fra ${formattedStartDate} til ${formattedEndDate}.`
                                      : `${booking.employeeName} har hytten fra ${formattedStartDate} til ${formattedEndDate}.`}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleEditBooking(booking.id)
                                    }
                                    className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md"
                                  >
                                    Rediger
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(booking.id)}
                                    className="bg-red-not-available text-white px-2 py-0.5 rounded-md"
                                  >
                                    Slett
                                  </button>
                                  <Modal
                                    isOpen={deleteModalIsOpen}
                                    onRequestClose={closeModal}
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
                                {showEditFormForBooking === booking.id && (
                                  <EditBooking
                                    booking={booking}
                                    closeModal={closeModal}
                                    refreshVacancies={refreshVacancies}
                                  />
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <span>
                                {booking.employeeName} har hytten fra{' '}
                                {formattedStartDate} til {formattedEndDate}.
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    )
                  })}
              </div>
              {vacantApartmentsOnDay.length !== 0 ? (
                <h3 className="mt-3 mb-1">Ledige hytter:</h3>
              ) : (
                ''
              )}
              {vacantApartmentsOnDay
                .sort(
                  (a, b) =>
                    cabinOrder.indexOf(a.cabin_name) -
                    cabinOrder.indexOf(b.cabin_name),
                )
                .map((apartment, index) => (
                  <div key={index}>
                    <p
                      className={`mt-1 mb-1 ${
                        cabinBorderColorClasses[apartment.cabin_name]
                      } pl-2 border-l-2 `}
                    >
                      <span className="apartment-text">
                        {apartment.cabin_name}
                      </span>
                      <button
                        onClick={() => handleBookClick(apartment.id)}
                        className="mt-2 ml-2 bg-orange-500 text-white px-1.5 py-0.5 rounded-md"
                      >
                        Reserver
                      </button>
                    </p>
                    {expandedApartments.includes(apartment.id) && (
                      <div className="expanded-content">
                        <CreateBookingPost
                          apartmentId={apartment.id}
                          date={date}
                          closeModal={closeModal}
                          refreshVacancies={refreshVacancies}
                          cutOffDateVacancies={cutOffDateVacancies}
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div>
              <p>Ingen valgt dato</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={closeModal}
              className="mt-3 bg-red-not-available text-white px-2 py-1 rounded-md"
            >
              Lukk
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
