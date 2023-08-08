import { ChangeEvent, useState } from 'react'
import { API_URL } from '../../services/api.service'
import moment from 'moment'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from '@/components/Loading'
import { Button } from '../ui/button'
import { Booking, EditedBooking } from '@/types'
import axios from 'axios'
import authHeader from '@/services/auth-header'
import { useMutation, useQueryClient } from 'react-query'
import {differenceInDays, isBefore} from "date-fns";

const editExistingBooking = async ({
  editedBooking,
  bookingId,
  userIsAdmin,
}: {
  editedBooking: EditedBooking
  bookingId: number
  userIsAdmin: boolean
}) => {
  if (userIsAdmin) {
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
}: {
  booking: Booking
  closeModal: () => void
  refreshVacancies: () => void
  userIsAdmin: boolean
}) => {
  const [startDate, setStartDate] = useState(booking.startDate)
  const [endDate, setEndDate] = useState(booking.endDate)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  const isValid =
      (isBefore(new Date(startDate), new Date (endDate)) && differenceInDays(new Date (endDate), new Date(startDate)) <= 7)

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

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!isValid) {
      toast.error('Noen av verdiene var ikke gyldig, prøv igjen')
    } else {
      setIsLoadingEdit(true)
      const bookingId = booking.id
      const editedBooking = {
        startDate: startDate,
        endDate: endDate,
      }
      mutate({ editedBooking, bookingId, userIsAdmin: userIsAdmin })
    }
  }

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value)
  }
  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="overflow-hidden w-full rounded-xl border border-gray-500 shadow-sm">
        <div className="flex flex-col gap-2 items-start p-3">
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
