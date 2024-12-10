import React from 'react'
import { DrawingPeriod, User } from '@/types'
import DrawingPeriodPendingBooking from './DrawingPeriodPendingBooking'
import style from './DrawingPeriodItem.module.css'
import { Button } from '@/components/ui/button'

type Props = {
  drawingPeriod: DrawingPeriod
  user?: User
  onPerformDrawing: () => void
}

const DrawingPeriodItem = ({
  drawingPeriod,
  user,
  onPerformDrawing,
}: Props) => {
  return (
    <div className={style.drawPeriod}>
      {drawingPeriod.pendingBookings.map((pendingBooking) => (
        <DrawingPeriodPendingBooking
          key={pendingBooking.id}
          pendingBooking={{ ...pendingBooking, isPending: true }}
          user={user}
        />
      ))}
      {user?.admin && (
        <Button variant="primary" onClick={() => onPerformDrawing()}>
          Trekk
        </Button>
      )}
    </div>
  )
}

export default DrawingPeriodItem
