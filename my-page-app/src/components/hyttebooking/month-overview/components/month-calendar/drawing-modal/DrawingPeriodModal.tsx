import React, { useMemo, useState } from 'react'
import { PendingBookingTrain, User } from '@/types'
import { Button } from '@/components/ui/button'
import SimpleModal from '@/components/ui/SimpleModal'
import { useQueryClient } from '@tanstack/react-query'
import ApiService from '../../../../../../services/api.service'
import { toast } from 'react-toastify'
import style from './DrawingPeriodModal.module.css'
import DrawingPeriodPendingBooking from './DrawingPeriodPendingBooking'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRefresh } from '@fortawesome/free-solid-svg-icons'

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
  const queryClient = useQueryClient()

  const [drawingInProgress, setDrawingInProgress] = useState(false)

  const helpText = useMemo(() => {
    if (!bookingTrain) {
      return ''
    }
    if (!bookingTrain.drawingDate) {
      return 'Oppholdet starter før automatisk trekningsdato. Kontakt Roger for manuell trekning'
    }
    return `Planlagt trekning ${bookingTrain.drawingDate}`
  }, [bookingTrain])

  const handleDrawingClick = async () => {
    try {
      setDrawingInProgress(true)
      console.log('drawingInProgress=' + drawingInProgress)
      await ApiService.pickWinnerPendingBooking(bookingTrain!.pendingBookings)
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
    <SimpleModal
      header={'Trekningsperiode'}
      open={!!bookingTrain}
      onRequestClose={onCancel}
      content={
        <>
          {bookingTrain && (
            <div className={style.drawPeriod}>
              <div>
                Registrerte ønsker i perioden {bookingTrain.startDate} to{' '}
                {bookingTrain.endDate}
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
                {bookingTrain.pendingBookings.map((pendingBooking) => (
                  <DrawingPeriodPendingBooking
                    key={pendingBooking.id}
                    pendingBooking={{ ...pendingBooking, isPending: true }}
                    user={user}
                  />
                ))}
              </table>
              <div>{helpText}</div>
            </div>
          )}
        </>
      }
      cancelButton={<Button onClick={onCancel}>Lukk</Button>}
      confirmButton={
        <>
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
        </>
      }
    />
  )
}

export default DrawingPeriodModal
