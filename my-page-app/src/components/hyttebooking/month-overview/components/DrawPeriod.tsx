import React from 'react'
import { DrawingPeriod } from '@/types'
import { format } from 'date-fns'

type Props = {
  drawingPeriod: DrawingPeriod
  dateFormat: string
}

const DrawPeriod = ({ drawingPeriod, dateFormat }: Props) => {
  const autoDrawingDate: Date = drawingPeriod.pendingBookings.reduce(
    (earliest, booking) => {
      let bookingCreatedDate: Date
      if (booking.createdDate) {
        bookingCreatedDate = new Date(booking.createdDate)
      } else {
        bookingCreatedDate = new Date()
      }
      return earliest < bookingCreatedDate ? earliest : bookingCreatedDate
    },
    new Date(),
  )

  autoDrawingDate.setDate(autoDrawingDate.getDate() + 7)

  const earliestStartDate = drawingPeriod.pendingBookings.reduce(
    (earliest, booking) => {
      const bookingStartDate = new Date(booking.startDate)
      return earliest < bookingStartDate ? earliest : bookingStartDate
    },
    new Date(drawingPeriod.pendingBookings[0].startDate),
  )

  const manualDrawingNotice =
    autoDrawingDate >= earliestStartDate
      ? 'Oppholdet starter før automatisk trekningsdato. Kontakt Roger for manuell trekning'
      : ''

  return (
    <>
      {drawingPeriod.pendingBookings[0].apartment.cabin_name} fra{' '}
      {format(new Date(drawingPeriod.startDate), dateFormat)} til{' '}
      {format(new Date(drawingPeriod.endDate), dateFormat)}. Planlagt trekning{' '}
      {format(autoDrawingDate, dateFormat)}{' '}
      {manualDrawingNotice && (
        <>
          <br />
          <i>
            <b>{manualDrawingNotice}</b>
          </i>
        </>
      )}
    </>
  )
}

export default DrawPeriod
