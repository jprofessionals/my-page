import React, { useState } from 'react'
import Modal from 'react-modal'
import { MonthCalendar } from '@/components/ui/monthCalendar'
import { PickDate } from '@/components/ui/pickDate'
export default function MonthOverview() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showModal, setShowModal] = useState(false)
  const handleDateClick = (date: Date) => {
    setShowModal(true)
  }
  const closeModal = () => {
    setShowModal(false)
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
      >
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 prose">
          <h1>Booking</h1>
          <h2>Selected Date:</h2>
          <p>{date?.toDateString()}</p>
          <div>{PickDate()}</div>
          <button
            onClick={closeModal}
            className="mt-4 mr-4 bg-orange-500 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  )
}
