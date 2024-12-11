import React from 'react'
import { DrawingPeriod, User } from '@/types'
import DrawingPeriodPendingBooking from './DrawingPeriodPendingBooking'
import style from './DrawingPeriodItem.module.css'
import { Button } from '@/components/ui/button'

type Props = {
  drawingPeriod: DrawingPeriod
  user?: User
  onPerformDrawing: (drawingPeriod: DrawingPeriod) => void
}

const DrawingPeriodItem = ({
  drawingPeriod,
  user,
  onPerformDrawing,
}: Props) => {
  return (
    <div className={style.drawPeriod}>
      <div>
        Ønsker i perioden {drawingPeriod.startDate} to {drawingPeriod.endDate}
      </div>
      <table className={style.drawPeriodTable}>
        <thead>
          <tr>
            <th>Ansatt</th>
            <th>Enhet</th>
            <th>Fra</th>
            <th>Til</th>
            <th></th>
          </tr>
        </thead>
        {drawingPeriod.pendingBookings.map((pendingBooking) => (
          <DrawingPeriodPendingBooking
            key={pendingBooking.id}
            pendingBooking={{ ...pendingBooking, isPending: true }}
            user={user}
          />
        ))}
        {user?.admin && (
          <Button
            variant="primary"
            onClick={() => onPerformDrawing(drawingPeriod)}
          >
            Trekk
          </Button>
        )}
      </table>
    </div>
  )
}

export default DrawingPeriodItem
