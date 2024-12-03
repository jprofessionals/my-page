import React from 'react'
import {Booking, DrawingPeriod, PendingBookingTrain, User} from '@/types'
import { Button } from '@/components/ui/button'
import SimpleModal from '@/components/ui/SimpleModal'

type Props = {
  user?: User
  bookingTrain?: PendingBookingTrain
  onCancel: () => void
  onPerformDrawing: (bookingTrain: PendingBookingTrain) => void
  onEdit: (pendingBooking: Booking) => void
}

const DrawingPeriodModal = ({
  bookingTrain,
  user,
  onCancel,
  onPerformDrawing,
  onEdit,
}: Props) => {
  function handlePerformDrawing() {
    if (bookingTrain) {
      onPerformDrawing(bookingTrain)
    }
  }

  return (
    <SimpleModal
      header={'Trekningsperiode'}
      open={!!bookingTrain}
      onRequestClose={onCancel}
      content={
        <>
          {bookingTrain?.drawingPeriodList
            .flatMap((drawingPeriod) => drawingPeriod.pendingBookings)
            .map((pendingBooking) => {
              return (
                <div key={pendingBooking.id}>
                  <span>
                    {pendingBooking.employeeName} ønsker{' '}
                    {pendingBooking.apartment.cabin_name} fra{' '}
                    {pendingBooking.startDate} til {pendingBooking.endDate}
                  </span>
                  <Button
                    variant="error"
                    style={{marginLeft: '8px', height: '1rem'}}
                    onClick={() => onEdit(pendingBooking)}
                  >
                    Endre
                  </Button>
                  <br />
                </div>
              )
            })}
        </>
      }
      confirmButton={
        (!!user?.admin || undefined) && (
          <Button variant="primary" onClick={handlePerformDrawing}>
            Trekk
          </Button>
        )
      }
      cancelButton={<Button onClick={onCancel}>Lukk</Button>}
    />
  )
}

export default DrawingPeriodModal
