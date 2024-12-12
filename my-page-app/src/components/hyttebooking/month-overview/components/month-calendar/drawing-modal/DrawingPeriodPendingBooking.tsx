import React, { useMemo, useState } from 'react'
import { Booking, User } from '@/types'
import { Button } from '@/components/ui/button'
import BookingEditForm from '../booking-edit-form/BookingEditForm'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  pendingBooking: Booking
  user: User | null
}

const DrawingPeriodPendingBooking = ({ pendingBooking, user }: Props) => {
  const [showForm, setShowForm] = useState<boolean>(false)

  const adminOrOwner = useMemo(() => {
    return user?.admin || pendingBooking.employeeName === user?.name
  }, [pendingBooking, user])

  const queryClient = useQueryClient()

  const onBookingSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
    queryClient.invalidateQueries({
      queryKey: ['allPendingBookingTrains'],
    })
  }

  return (
    <tbody>
      <tr>
        <td>{pendingBooking.employeeName}</td>
        <td>{pendingBooking.apartment.cabin_name}</td>
        <td>{pendingBooking.startDate}</td>
        <td>{pendingBooking.endDate}</td>
        <td>
          {adminOrOwner && (
            <Button
              style={{ marginLeft: '8px', height: '2em', minHeight: '2em' }}
              onClick={() => setShowForm(!showForm)}
            >
              Endre
            </Button>
          )}
        </td>
      </tr>
      {showForm && (
        <tr>
          <td colSpan={5}>
            <BookingEditForm
              booking={pendingBooking}
              user={user}
              onBookingSaved={onBookingSaved}
              onCancel={() => {}}
              showCancelButton={false}
            />
          </td>
        </tr>
      )}
    </tbody>
  )
}

export default DrawingPeriodPendingBooking
