import React, { useState } from 'react'
import Modal from 'react-modal'
import { MonthCalendar } from '@/components/ui/monthCalendar'
import { PickDate } from '@/components/ui/pickDate'
export default function MonthOverview() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [showModal, setShowModal] = useState(false)
  const handleDateClick = (date: Date) => {
    console.log('Clicked date:', date)
    setShowModal(true)
  }
  const closeModal = () => {
    setShowModal(false)
  }
  return (
    <div>
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
      <div className="flex flex-col gap-3 mt-7">
        <div className="flex gap-2 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-orange-brand" />
          <span>
            Stor leilighet: 13 sengeplasser (dyr <strong>ikke</strong> tilatt)
          </span>
        </div>

        <div className="flex gap-2 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-blue-small-appartment" />
          Liten leilighet: 11 sengeplasser (dyr tilatt, men ikke på soverom)
        </div>

        <div className="flex gap-2 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-teal-annex" />
          <span>
            Annekset: 10 sengeplasser (dyr <strong>ikke</strong> tilatt)
          </span>
        </div>

        <div className="flex gap-2 p-0 mb-10 bg-gray-100 rounded-lg">
          <div className="w-6 rounded-l-lg bg-red-not-available" />
          Ikke tilgjengelig - arbeid på hytta
        </div>
      </div>
    </div>
  )
}
