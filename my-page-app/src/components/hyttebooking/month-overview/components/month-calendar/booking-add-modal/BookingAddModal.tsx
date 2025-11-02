import React, { ChangeEvent, useEffect, useState } from 'react'
import { Apartment, BookingPost, User } from '@/types'
import ApiService from '@/services/api.service'
import { createPendingBooking } from '@/data/types/sdk.gen'
import '@/services/openapi-client'
import { Button } from '@/components/ui/button'
import SimpleModal from '@/components/ui/SimpleModal'
import { toast } from 'react-toastify'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRefresh } from '@fortawesome/free-solid-svg-icons'

type Props = {
  bookingPost?: BookingPost
  user: User | null
  onBookingCreated: () => void
  onCancel: () => void
}

const BookingAddModal = ({
  bookingPost,
  user,
  onBookingCreated,
  onCancel,
}: Props) => {
  const [allApartments, setAllApartments] = useState<Apartment[]>([])
  const selectedApartment = allApartments.find(
    (apartment) => apartment.id === bookingPost?.apartmentID,
  )
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const [confirmInProgress, setConfirmInProgress] = useState(false)

  useEffect(() => {
    const fetchAllApartments = async () => {
      const response = await ApiService.getAllApartments()
      setAllApartments(response)
    }
    fetchAllApartments()
  }, [])

  useEffect(() => {
    setStartDate(bookingPost?.startDate || '')
    setEndDate(bookingPost?.endDate || '')
  }, [bookingPost])

  const createBooking = async ({
    bookingPost,
  }: {
    bookingPost: BookingPost
  }) => {
    try {
      const { data } = await createPendingBooking({
        body: {
          apartmentID: bookingPost.apartmentID,
          startDate,
          endDate,
        },
      })
      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error.message
      }
      throw 'En feil oppstod ved lagring'
    }
  }

  const handleConfirm = async () => {
    if (bookingPost) {
      try {
        setConfirmInProgress(true)
        await createBooking({ bookingPost })
        onBookingCreated()
        toast.success('Booking opprettet')
      } catch (e) {
        toast.error(`Booking feilet: ${e}`)
      } finally {
        setConfirmInProgress(false)
      }
    }
  }

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value)
  }

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value)
  }

  return (
    <SimpleModal
      header={'Ny booking'}
      open={!!bookingPost}
      onRequestClose={onCancel}
      content={
        <>
          {user?.name}, ønsker du &quot;{selectedApartment?.cabin_name}&quot; i
          perioden
          <br />
          <strong>Startdato:</strong>
          <input
            type="date"
            name="startDate"
            onChange={handleStartDateChange}
            value={startDate}
          />
          <br />
          <strong>Sluttdato:</strong>
          <input
            type="date"
            name="endDate"
            onChange={handleEndDateChange}
            value={endDate}
          />
        </>
      }
      cancelButton={<Button onClick={onCancel}>Avbryt</Button>}
      confirmButton={
        <Button
          onClick={handleConfirm}
          variant="primary"
          disabled={confirmInProgress}
        >
          Bekreft
          {confirmInProgress && (
            <div className="flex justify-center">
              <FontAwesomeIcon
                icon={faRefresh}
                className="animate-spin"
                size="xl"
              />
            </div>
          )}
        </Button>
      }
    />
  )
}

export default BookingAddModal
