import React, { useState } from 'react'
import { DrawingPeriod, User } from '@/types'
import DrawingPeriodPendingBooking from './DrawingPeriodPendingBooking'
import style from './DrawingPeriodItem.module.css'
import { Button } from '@/components/ui/button'
import ApiService from '../../../../../../services/api.service'
import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRefresh } from '@fortawesome/free-solid-svg-icons'

type Props = {
  drawingPeriod: DrawingPeriod
  user: User | null
  onDrawingPerformed: () => void
}

const DrawingPeriodItem = ({
  drawingPeriod,
  user,
  onDrawingPerformed,
}: Props) => {
  const queryClient = useQueryClient()

  const [drawingInProgress, setDrawingInProgress] = useState(false)

  function getText() {
    return drawingPeriod.drawingDate
      ? `Planlagt trekning ${drawingPeriod.drawingDate}`
      : 'Oppholdet starter før automatisk trekningsdato. Kontakt Roger for manuell trekning'
  }

  const handleDrawingClick = async () => {
    try {
      setDrawingInProgress(true)
      console.log('drawingInProgress=' + drawingInProgress)
      await ApiService.pickWinnerPendingBooking(drawingPeriod.pendingBookings)
      toast.success('Trekning fullført')
      onDrawingPerformed()
    } catch {
      toast.error('Trekning feilet')
    } finally {
      setDrawingInProgress(false)
      console.log('drawingInProgress=' + drawingInProgress)
    }
    await queryClient.invalidateQueries({ queryKey: ['bookings'] })
    await queryClient.invalidateQueries({
      queryKey: ['allPendingBookingTrains'],
    })
  }

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
      </table>
      <div>{getText()}</div>
      {user?.admin && (
        <Button
          variant="primary"
          onClick={handleDrawingClick}
          disabled={drawingInProgress}
        >
          Trekk
          {drawingInProgress && (
            <div className="flex justify-center">
              <FontAwesomeIcon
                icon={faRefresh}
                className="animate-spin"
                size="xl"
              />
            </div>
          )}
        </Button>
      )}
    </div>
  )
}

export default DrawingPeriodItem
