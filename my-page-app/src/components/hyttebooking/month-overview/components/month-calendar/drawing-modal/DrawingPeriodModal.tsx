import React from 'react'
import { DrawingPeriod, PendingBookingTrain, User } from '@/types'
import { Button } from '@/components/ui/button'
import SimpleModal from '@/components/ui/SimpleModal'
import DrawingPeriodItem from './DrawingPeriodItem'

type Props = {
  user?: User
  bookingTrain?: PendingBookingTrain
  onCancel: () => void
  onPerformDrawing: (drawingPeriod: DrawingPeriod) => void
}

const DrawingPeriodModal = ({
  bookingTrain,
  user,
  onCancel,
  onPerformDrawing,
}: Props) => {
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
              onPerformDrawing={onPerformDrawing}
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
