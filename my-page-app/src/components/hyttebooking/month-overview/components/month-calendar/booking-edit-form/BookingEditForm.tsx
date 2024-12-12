import React, { ChangeEvent, useEffect, useState } from 'react'
import { Apartment, Booking, BookingPost, User } from '@/types'
import ApiService from '@/services/api.service'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'

type Props = {
  booking?: Booking
  user: User | null
  onBookingSaved: () => void
  onCancel: () => void
  showCancelButton: boolean
}

const BookingEditForm = ({
  booking,
  user,
  onBookingSaved,
  onCancel,
  showCancelButton,
}: Props) => {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [apartmentId, setApartmentId] = useState<number>(0)

  useEffect(() => {
    setStartDate(booking?.startDate || '')
    setEndDate(booking?.endDate || '')
    setApartmentId(booking?.apartment.id || 0)
  }, [booking])

  const { data: apartments } = useQuery({
    queryKey: ['apartments'],
    queryFn: () => {
      const allApartments = ApiService.getAllApartments()
      return allApartments
    },
  })

  const deleteBookingByBookingId = async (bookingId: number | null) => {
    try {
      if (booking?.isPending) {
        if (user?.admin) {
          await ApiService.adminDeletePendingBooking(bookingId)
        } else {
          await ApiService.deletePendingBooking(bookingId)
        }
      } else {
        if (user?.admin) {
          await ApiService.adminDeleteBooking(bookingId)
        } else {
          await ApiService.deleteBooking(bookingId)
        }
      }
      toast.success('Reservasjonen er slettet')
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
        if (user?.name === booking?.employeeName) {
          await ApiService.patchPendingBooking(bookingId, updatedBooking)
          toast.success('Reservasjonen er oppdatert')
        } else if (user?.admin) {
          // TODO: Implement backend
          toast.warning('Ikke implementert')
        } else {
          toast.warning('Du er ikke eier av reservasjonen eller admin')
        }
      } else {
        if (user?.admin) {
          await ApiService.adminPatchBooking(bookingId, updatedBooking)
          toast.success('Reservasjonen er oppdatert')
        } else {
          await ApiService.patchBooking(bookingId, updatedBooking)
          toast.success('Reservasjonen er oppdatert')
        }
      }
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
        apartmentID: apartmentId,
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

  const handleApartmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setApartmentId(Number(e.target.value))
  }

  return (
    <div style={{ display: 'grid', rowGap: '8px', marginTop: '8px' }}>
      <label>
        <b>Startdato:</b>
        <input
          type="date"
          name="startDate"
          onChange={handleStartDateChange}
          value={startDate}
          className="w-48 input input-bordered input-sm ml-3 float-end"
        />
      </label>
      <label>
        <b>Sluttdato:</b>
        <input
          type="date"
          name="endDate"
          onChange={handleEndDateChange}
          value={endDate}
          className="w-48 input input-bordered input-sm ml-3 float-end"
        />
      </label>
      {user?.admin && (
        <label>
          <b>Enhet:</b>
          <select
            name="apartment"
            onChange={handleApartmentChange}
            value={apartmentId}
            className="w-48 input input-bordered input-sm ml-3 float-end"
          >
            <option value="">Velg enhet</option>
            {(apartments || []).map((apartment: Apartment) => (
              <option key={apartment.id} value={apartment.id}>
                {apartment.cabin_name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'right',
          marginTop: '2em',
          marginBottom: '2em',
        }}
      >
        <Button
          onClick={handleDelete}
          variant="error"
          style={{ marginRight: 'auto' }}
        >
          Slett
        </Button>
        {showCancelButton && (
          <Button onClick={handleCancel} style={{ marginLeft: '0.5em' }}>
            Avbryt
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          variant="primary"
          style={{ marginLeft: '0.5em' }}
        >
          Bekreft
        </Button>
      </div>
    </div>
  )
}

export default BookingEditForm
