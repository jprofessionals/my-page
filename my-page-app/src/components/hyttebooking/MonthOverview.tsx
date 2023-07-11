import React, { useCallback, useEffect, useState } from 'react'
import Modal from 'react-modal'
import { MonthCalendar } from '@/components/ui/monthCalendar'
import ApiService from '@/services/api.service'
import { Apartment, Booking } from '@/types'
import { toast } from 'react-toastify'
import { useAuthContext } from '@/providers/AuthProvider'
import { format } from 'date-fns'

export default function MonthOverview() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showModal, setShowModal] = useState(false)
  const [bookingItems, setBookingItems] = useState<Booking[]>([])
  const [expandedApartments, setExpandedApartments] = useState<number[]>([])

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
    { [key: number]: Date[] } | undefined
  >(undefined)
  const [vacantApartments, setVacantApartments] = useState<string[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])

  const refreshVacancies = useCallback(async () => {
    setVacancyLoadingStatus('loading')

    try {
      const currentDate = new Date()
      const unformattedStartDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        currentDate.getDate(),
      )
      const unformattedEndDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate(),
      )
      const startDate = format(unformattedStartDate, 'yyyy-MM-dd')
      const endDate = format(unformattedEndDate, 'yyyy-MM-dd')
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
  const getVacancyForDay = async (selectedDate: Date) => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd')

      if (vacancies) {
        const availableApartments: string[] = []

        for (const key in vacancies) {
          if (vacancies.hasOwnProperty(key)) {
            const vacancy = vacancies[key]

            const vacancyValue = Object.values(vacancy)
            const vacancyDates = vacancyValue[0] as unknown as string[]
            const vacancyKey = Object.keys(vacancy)
            const vacancyApartmentId = vacancyKey[0]

            for (const date of vacancyDates) {
              if (date === formattedDate) {
                for (const apartment of apartments) {
                  if (apartment.id!.toString() === vacancyApartmentId) {
                    availableApartments.push(apartment.cabin_name)
                    break
                  }
                }
                break
              }
            }
          }
        }

        if (availableApartments.length !== 0) {
          setVacantApartments(availableApartments)
          return vacantApartments
        } else {
          setVacantApartments([])
          return
        }
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
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
          {bookingItems.length > 0 ? (
            <div>
              <h2>Bookinger for denne datoen:</h2>
              {bookingItems.map((booking, index) => {
                const startDate = new Date(booking.startDate)
                const endDate = new Date(booking.endDate)
                const formattedStartDate = format(startDate, 'dd-MM-yyyy')
                const formattedEndDate = format(endDate, 'dd-MM-yyyy')

                return (
                  <div key={booking.id}>
                    <p>
                      {booking.employeeName} har booket hytten{' '}
                      {booking.apartment.cabin_name} i perioden{' '}
                      {formattedStartDate} til {formattedEndDate}.
                    </p>
                    {index !== bookingItems.length - 1 && <hr />}
                  </div>
                )
              })}
              <h2>Ledige hytter:</h2>
              {vacantApartments.length === 0 ? (
                <p>Ingen ledige hytter</p>
              ) : (
                vacantApartments.map((apartment, index) => (
                  <div key={index}>
                    <p>
                      <span className="apartment-text">{apartment}</span>
                      <button
                        onClick={() => handleApartmentClick(index + 1)}
                        className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-md"
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
              <h2>Bookinger for denne datoen:</h2>
              <p>Ingen bookinger for denne dagen</p>
              <h3 className="mt-10">Ledige hytter: </h3>
              {vacantApartments.map((apartment, index) => (
                <div key={index}>
                  <p>
                    <span className="apartment-text">{apartment} er ledig</span>
                    <button
                      onClick={() => handleApartmentClick(index + 1)}
                      className="mt-4 ml-2 bg-orange-500 text-white px-4 py-2 rounded-md"
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
              ))}
            </div>
          )}

          <button
            onClick={closeModal}
            className="mt-4 mr-4 bg-orange-500 text-white px-4 py-2 rounded-md"
          >
            Lukk
          </button>
        </div>
      </Modal>
    </div>
  )
}
