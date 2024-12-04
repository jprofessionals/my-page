import React, { useState } from 'react'
import { Booking, DrawingPeriod, PendingBookingTrain, User } from '@/types'
import { Button } from '@/components/ui/button'
import SimpleModal from '@/components/ui/SimpleModal'
import BookingEditForm from '../booking-edit-form/BookingEditForm'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  pendingBooking: Booking
  user?: User
}

const DrawingPeriodPendingBooking = ({ pendingBooking, user }: Props) => {
  const [showForm, setShowForm] = useState<boolean>(false)

  const queryClient = useQueryClient()

  return (
    <div>
      <span>
        {pendingBooking.employeeName} ønsker{' '}
        {pendingBooking.apartment.cabin_name} fra {pendingBooking.startDate} til{' '}
        {pendingBooking.endDate}
      </span>
      <Button
        variant="error"
        style={{ marginLeft: '8px', height: '2em', minHeight: '2em' }}
        onClick={() => setShowForm(!showForm)}
      >
        Endre
      </Button>
      {showForm && (
        <BookingEditForm
          booking={pendingBooking}
          user={user}
          onBookingSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] })
            queryClient.invalidateQueries({
              queryKey: ['allPendingBookingsAllApartments'],
            })
          }}
          onCancel={() => {}}
        />
      )}
    </div>
  )
}

export default DrawingPeriodPendingBooking
