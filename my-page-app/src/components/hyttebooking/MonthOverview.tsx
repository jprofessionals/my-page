import React, { useCallback, useEffect, useState } from 'react'
import Modal from 'react-modal'
import { MonthCalendar } from '@/components/ui/monthCalendar'
import ApiService from '@/services/api.service'
import { Apartment, Booking } from '@/types'
import { toast } from 'react-toastify'
import { useAuthContext } from '@/providers/AuthProvider'
import { format } from 'date-fns'
import EditBooking from '@/components/hyttebooking/EditBooking'

export default function MonthOverview() {
  const [date, setDate] = useState<Date | undefined>()
  const [showModal, setShowModal] = useState(false)
  const [bookingItems, setBookingItems] = useState<Booking[]>([])

  const [expandedApartments, setExpandedApartments] = useState<number[]>([])

  const [yourBookings, setYourBookings] = useState<Booking[]>([])
  const getYourBookings = async () => {
    try {
      const yourBookings = await ApiService.getBookingsForUser()
      setYourBookings(yourBookings)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  useEffect(() => {
    getYourBookings()
  }, [])

  const handleDeleteBooking = async (bookingId: number | undefined) => {
    /*try {
      await ApiService.deleteBooking(bookingId)
    } catch (error) {
      console.error('Error:', error)
    }*/
  }
  const [showEditForm, setShowEditForm] = useState(false)
  const handleEditBooking = () => {
    if (showEditForm) {
      setShowEditForm(false)
    } else {
      setShowEditForm(true)
    }
  }

  const handleDateClick = (date: Date) => {
    setShowModal(true)
    setDate(date)
    fetchBookingItems(date)
    getVacancyForDay(date)
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
  }

  const handleApartmentClick = (apartmentId: number) => {
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
  const [vacantApartmentsOnDay, setVacantApartmentsOnDay] = useState<string[]>(
    [],
  )
  const [apartments, setApartments] = useState<Apartment[]>([])

  const refreshVacancies = useCallback(async () => {
    setVacancyLoadingStatus('loading')

    try {
      /*const currentDate = new Date()
            const unformattedStartDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() - 1,
              currentDate.getDate(),
            )
            const unformattedEndDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              currentDate.getDate(),
            )*/
      const startDate = '2023-06-01' //format(unformattedStartDate, 'yyyy-MM-dd')
      const endDate = '2023-08-31' //format(unformattedEndDate, 'yyyy-MM-dd')
      //Todo: change the start and enddates later once booking is in place so it is more than just a month but six months back and twelve months forward. These control the time period in which vacancies will be searched for.

      const loadedVacancies = await ApiService.getAllVacancies(
        startDate,
        endDate,
      )
      setVacancyLoadingStatus('completed')
      setVacancies(loadedVacancies)
    } catch (e) {
      setVacancyLoadingStatus('failed')
      toast.error('Klarte ikke laste ledige bookinger, prøv igjen senere')
    }
  }, [])

  useEffect(() => {
    if (vacancyLoadingStatus !== 'init') return
    if (userFetchStatus === 'fetched') {
      refreshVacancies()
      getAllApartments()
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
    return vacantApartments
  }

  const getVacancyForDay = async (selectedDate: Date) => {
    const availableApartments: string[] = []
    const vacantApartmentsInPeriod = getVacantApartments(selectedDate)
    for (const apartment of apartments) {
      if (vacantApartmentsInPeriod.includes(apartment.id!)) {
        availableApartments.push(apartment.cabin_name)
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
              <h3 className="mt-1 mb-1">{format(date, 'dd-MM-yyyy')}</h3>
              {bookingItems.length > 0 ? (
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
                    .map((booking, index, array) => {
                      const startDate = new Date(booking.startDate)
                      const endDate = new Date(booking.endDate)
                      const formattedStartDate = format(startDate, 'dd-MM-yyyy')
                      const formattedEndDate = format(endDate, 'dd-MM-yyyy')

                      const isYourBooking = yourBookings.some(
                        (yourBooking) => yourBooking.id === booking.id,
                      )

                      const prevCabinName =
                        index > 0 ? array[index - 1].apartment.cabin_name : null
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
                            {isYourBooking ? (
                              <>
                                <div className="flex flex-col">
                                  <p className="flex-row justify-between items-center space-x-2">
                                    <span>
                                      Du har fra {formattedStartDate} til{' '}
                                      {formattedEndDate}.
                                    </span>
                                    <button
                                      onClick={() => handleEditBooking()}
                                      className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md"
                                    >
                                      Rediger
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteBooking(booking.id)
                                      }
                                      className="bg-red-not-available text-white px-2 py-0.5 rounded-md"
                                    >
                                      Slett
                                    </button>
                                  </p>
                                  {showEditForm && (
                                    <EditBooking booking={booking}/>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <span>
                                  {booking.employeeName} har fra{' '}
                                  {formattedStartDate} til {formattedEndDate}.
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div>
                  <p>Ingen bookinger for denne dagen</p>
                </div>
              )}
              <h3 className="mt-3 mb-1">Ledige hytter:</h3>
              {vacantApartmentsOnDay.length === 0 ? (
                <p className="mb-1">Ingen ledige hytter</p>
              ) : (
                vacantApartmentsOnDay.map((apartment, index) => (
                  <div key={index}>
                    <p className="mt-1 mb-1">
                      <span className="apartment-text">{apartment}</span>
                      <button
                        onClick={() => handleApartmentClick(index + 1)}
                        className="mt-2 ml-2 bg-orange-500 text-white px-1.5 py-0.5 rounded-md"
                      >
                        Book
                      </button>
                    </p>
                    {expandedApartments.includes(index + 1) && (
                      <div className="expanded-content">
                        Her vil det komme mulighet for å gjøre en booking
                      </div>
                    )}
                  </div>
                ))
              )}
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
