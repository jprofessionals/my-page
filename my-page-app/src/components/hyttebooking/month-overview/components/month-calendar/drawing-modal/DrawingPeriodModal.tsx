import React from 'react'
import {PendingBookingTrain, User} from '@/types'
import {Button} from '@/components/ui/button'
import SimpleModal from '@/components/ui/SimpleModal'
import DrawingPeriodPendingBooking from "./DrawingPeriodPendingBooking";

type Props = {
  user?: User
  bookingTrain?: PendingBookingTrain
  onCancel: () => void
  onPerformDrawing: (bookingTrain: PendingBookingTrain) => void
}

const DrawingPeriodModal = ({
  bookingTrain,
  user,
  onCancel,
  onPerformDrawing,
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
        <div style={{display: "grid", rowGap: "1em"}}>
          {bookingTrain?.drawingPeriodList
            .flatMap((drawingPeriod) => drawingPeriod.pendingBookings)
            .map((pendingBooking) => (
              <DrawingPeriodPendingBooking
                key={pendingBooking.id}
                pendingBooking={{...pendingBooking, isPending: true}}
                user={user}
              />))}
        </div>
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
