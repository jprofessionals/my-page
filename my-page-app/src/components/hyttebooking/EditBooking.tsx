import React, { ChangeEvent, useState } from 'react'
import { API_URL } from '../../services/api.service'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from '@/components/Loading'
import { Button } from '../ui/button'
import {Apartment, Booking, EditedBooking} from '@/types'
import axios from 'axios'
import authHeader from '@/services/auth-header'
import { useMutation, useQueryClient } from 'react-query'
import { addDays, differenceInDays, isBefore } from 'date-fns'

const editExistingBooking = async ({
  editedBooking,
  bookingId,
  userIsAdmin,
  bookingIsPending,
}: {
  editedBooking: EditedBooking
  bookingId: number
  userIsAdmin: boolean
  bookingIsPending: boolean
}) => {
  if(bookingIsPending){
    return axios
        .patch(API_URL + 'pendingBooking/' + bookingId, editedBooking, {
          headers: authHeader(),
        })
        .then((response) => response.data)
        .catch((error) => {
          if (error.response && error.response.data) {
            throw error.response.data
          } else {
            throw 'En feil skjedde under redigeringen, prøv igjen.'
          }
        })
  } else if (userIsAdmin) {
    return axios
      .patch(API_URL + 'booking/admin/' + bookingId, editedBooking, {
        headers: authHeader(),
      })
      .then((response) => response.data)
      .catch((error) => {
        if (error.response && error.response.data) {
          throw error.response.data
        } else {
          throw 'En feil skjedde under redigeringen, prøv igjen.'
        }
      })
  } else {
    return axios
      .patch(API_URL + 'booking/' + bookingId, editedBooking, {
        headers: authHeader(),
      })
      .then((response) => response.data)
      .catch((error) => {
        if (error.response && error.response.data) {
          throw error.response.data
        } else {
          throw 'En feil skjedde under redigeringen, prøv igjen.'
        }
      })
  }
}

const EditBooking = ({
  booking,
  closeModal,
  refreshVacancies,
  userIsAdmin,
  cutOffDateVacancies,
  apartments,
}: {
  booking: Booking
  closeModal: () => void
  refreshVacancies: () => void
  userIsAdmin: boolean
  cutOffDateVacancies: string,
  apartments: Apartment[],
}) => {
  const [startDate, setStartDate] = useState(booking.startDate)
  const [endDate, setEndDate] = useState(booking.endDate)
  const [apartmentId, setApartmentId] = useState<number>(booking.apartment.id)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  const isValid =
    isBefore(new Date(startDate), new Date(endDate)) &&
    differenceInDays(new Date(endDate), new Date(startDate)) <= 7 &&
      (isBefore(new Date(endDate), addDays(new Date(cutOffDateVacancies), 1)) || userIsAdmin)

  const queryClient = useQueryClient()
  const { mutate } = useMutation(editExistingBooking, {
    onSuccess: () => {
      closeModal()
      queryClient.invalidateQueries('bookings')
      setIsLoadingEdit(false)
      toast.success('Redigert reservasjon')
      refreshVacancies()
    },
    onError: (error: string) => {
      setIsLoadingEdit(false)
      toast.error(error)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid) {
      toast.error('Noen av verdiene var ikke gyldig, prøv igjen')
    } else {
      setIsLoadingEdit(true)
      const bookingId = booking.id
      const editedBooking = {
        startDate: startDate,
        endDate: endDate,
        apartmentId: apartmentId
      }
      mutate({ editedBooking, bookingId, userIsAdmin: userIsAdmin, bookingIsPending: booking.isPending })
    }
  }

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value)
  }
  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value)
  }
  const handleApartmentIdChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setApartmentId(Number(e.target.value))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="overflow-hidden w-full rounded-xl border border-gray-500 shadow-sm">
        <div className="flex flex-col gap-2 items-start p-3">
          {userIsAdmin ? (
              <>
                <strong>Enhet: </strong>
                <label>
                  <select
                      className="w-48 input input-bordered input-sm mr-3"
                      name="apartmentId"
                      onChange={handleApartmentIdChange}
                      value={apartmentId}
                  >
                    <option value="">Velg enhet</option>
                    {apartments.map((apartment) => (
                        <option key={apartment.id} value={apartment.id}>
                          {apartment.cabin_name}
                        </option>
                    ))}
                  </select>
                </label>
              </>
          ) : null}
          <strong>Startdato:</strong>
          <label>
            <input
              type="date"
              className="w-48 input input-bordered input-sm"
              name="startDate"
              onChange={handleStartDateChange}
              value={startDate}
              placeholder={startDate}
            />
          </label>
          <strong>Sluttdato:</strong>
          <label>
            <input
              className="w-48 input input-bordered input-sm"
              type="date"
              name="endDate"
              onChange={handleEndDateChange}
              value={endDate}
              placeholder={endDate}
            />
          </label>
          <Button type="submit" disabled={!isValid} size="sm" className="mt-4">
            <span>
              Lagre
              <Loading isLoading={isLoadingEdit} />
            </span>
          </Button>
        </div>
      </div>
    </form>
  )
}

export default EditBooking
