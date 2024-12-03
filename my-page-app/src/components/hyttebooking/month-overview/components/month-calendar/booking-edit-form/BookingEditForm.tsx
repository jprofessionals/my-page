import React, {ChangeEvent, useEffect, useState} from 'react'
import {Booking, BookingPost, User} from '@/types'
import ApiService from '@/services/api.service'
import {Button} from '@/components/ui/button'
import {toast} from 'react-toastify'
import {useQueryClient} from '@tanstack/react-query'

type Props = {
  booking?: Booking
  user?: User
  onBookingSaved: () => void
  onCancel: () => void
}

const BookingEditForm = ({
                           booking,
                           user,
                           onBookingSaved,
                           onCancel,
                         }: Props) => {
  const [startDate, setStartDate] = useState<string | undefined>()
  const [endDate, setEndDate] = useState<string | undefined>()

  const queryClient = useQueryClient()

  useEffect(() => {
    setStartDate(booking?.startDate)
    setEndDate(booking?.endDate)
  }, [booking])

  const deleteBookingByBookingId = async (bookingId: number | null) => {
    try {
      if (booking?.isPending) {
        await ApiService.deletePendingBooking(bookingId)
      } else {
        await ApiService.deleteBooking(bookingId)
      }
      toast.success('Reservasjonen din er slettet')
    } catch (error) {
      toast.error(`Det oppstod en feil ved sletting: ${error}`)
    }
  }

  const patchBookingByBookingId = async (
    bookingId: number | null,
    updatedBooking: BookingPost,
  ) => {
    try {
      if (booking?.isPending) {
        await ApiService.patchPendingBooking(bookingId, updatedBooking)
      } else {
        await ApiService.patchBooking(bookingId, updatedBooking)
      }
      toast.success('Reservasjonen din er oppdatert')
    } catch (error) {
      toast.error(`Det oppstod en feil ved oppdatering: ${error}`)
    }
  }

  const handleDelete = async () => {
    if (booking) {
      await deleteBookingByBookingId(booking.id)
      onBookingSaved()
    }
  }

  const handleConfirm = async () => {
    if (booking && startDate && endDate) {
      const updatedBooking: BookingPost = {
        apartmentID: booking.apartment.id,
        startDate,
        endDate,
      }
      await patchBookingByBookingId(booking.id, updatedBooking)
      onBookingSaved()
    }
  }

  const handleCancel = () => {
    onCancel()
  }

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value)
  }
  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value)
  }

  return <>
    Hei {user?.name}! <br/>
    Endre reservasjon for &quot;{booking?.apartment?.cabin_name}&quot;
    <br/>
    <strong>Startdato:</strong>
    <input
      type="date"
      name="startDate"
      onChange={handleStartDateChange}
      value={startDate}
      placeholder={startDate}
    />
    <br/>
    <strong>Sluttdato:</strong>
    <input
      type="date"
      name="endDate"
      onChange={handleEndDateChange}
      value={endDate}
      placeholder={endDate}
    />

    <div style={{display: "flex", justifyContent: "right", marginTop: "2em"}}>
      <Button onClick={handleDelete} variant="error" style={{marginRight: "auto"}}>Slett</Button>
      <Button onClick={handleCancel} style={{marginLeft: "0.5em"}}>Avbryt</Button>
      <Button onClick={handleConfirm} variant="primary" style={{marginLeft: "0.5em"}}>Bekreft</Button>
    </div>
  </>
}

export default BookingEditForm
