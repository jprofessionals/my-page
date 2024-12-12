import React from 'react'
import { PendingBookingTrain, User } from '@/types'
import { Button } from '@/components/ui/button'
import SimpleModal from '@/components/ui/SimpleModal'
import DrawingPeriodItem from './DrawingPeriodItem'

type Props = {
  user: User | null
  bookingTrain?: PendingBookingTrain
  onCancel: () => void
  onDrawingPerformed: () => void
}

const DrawingPeriodModal = ({
  bookingTrain,
  user,
  onCancel,
  onDrawingPerformed,
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
              onDrawingPerformed={onDrawingPerformed}
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
