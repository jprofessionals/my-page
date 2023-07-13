import React, { useState } from 'react'
import Modal from 'react-modal'
import { MonthCalendar } from '@/components/ui/monthCalendar'
//import {PickDate} from '@/components/ui/pickDate';
import ApiService from '@/services/api.service'
import { Booking } from '@/types'

export default function MonthOverview() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showModal, setShowModal] = useState(false)
  const [bookingItems, setBookingItems] = useState<Booking[]>([])
  const handleDateClick = (date: Date) => {
    setShowModal(true)
    setDate(date)
    fetchBookingItems(date)
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

  const fetchBookingItems = async (selectedDate: Date) => {
    try {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      const bookings = await ApiService.getBookingsForDay(formattedDate)
      setBookingItems(bookings)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden gap-4 p-4">
      <MonthCalendar
        onDayClick={handleDateClick}
        mode="single"
        selected={date}
        onSelect={setDate}
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
                const formattedStartDate = `${startDate.getDate()}-${
                  startDate.getMonth() + 1
                }-${startDate.getFullYear()}`
                const formattedEndDate = `${endDate.getDate()}-${
                  endDate.getMonth() + 1
                }-${endDate.getFullYear()}`

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
            </div>
          ) : (
            <div>
              <h2>Bookinger for denne datoen:</h2>
              <p className="mt-10">Det er ingen bookinger på denne dagen</p>
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
