import React from 'react'
import { PendingBookingTrain, User } from '@/types'
import { Button } from '@/components/ui/button'
import SimpleModal from '@/components/ui/SimpleModal'
import DrawingPeriodItem from './DrawingPeriodItem'

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
        <div>
          {bookingTrain?.drawingPeriodList.map((drawingPeriod) => (
            <DrawingPeriodItem
              key={drawingPeriod.id}
              drawingPeriod={drawingPeriod}
              onPerformDrawing={handlePerformDrawing}
              user={user}
            />
          ))}
        </div>
      }
      cancelButton={<Button onClick={onCancel}>Lukk</Button>}
    />
  )
}

export default DrawingPeriodModal
