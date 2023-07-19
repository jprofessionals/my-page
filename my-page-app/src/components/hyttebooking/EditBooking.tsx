import { useState } from 'react'
import {API_URL} from '../../services/api.service'
import moment from 'moment'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from '@/components/Loading'
import { Button } from '../ui/button'
import {Booking, EditedBooking} from '@/types'
import axios, {AxiosError} from 'axios'
import authHeader from "@/services/auth-header"
import {useMutation} from "react-query"

const editExistingBooking = async ({ editedBooking, bookingId }: { editedBooking: EditedBooking, bookingId: number }) => {
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

const EditBooking = ({ booking }: { booking: Booking }) => {
  const [startDate, setStartDate] = useState(booking.startDate)
  const [endDate, setEndDate] = useState(booking.endDate)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  const isValid =
    startDate < endDate && moment(endDate).diff(startDate, 'days') <= 7

  const {mutate} = useMutation(editExistingBooking, {
    onSuccess: () => {
      setIsLoadingEdit(false)
      toast.success ('Redigert booking')
    },
    onError: (error: AxiosError) => {
      setIsLoadingEdit(false)
      toast.error(`Klarte ikke redigere bookingen ${error.response?.data}`)
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
      mutate({editedBooking, bookingId})
    }
  }

  const handleStartDateChange = (e: any) => {
    setStartDate(e.target.value)
  }
  const handleEndDateChange = (e: any) => {
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
              Rediger booking
              <Loading isLoading={isLoadingEdit} />
            </span>
          </Button>
        </div>
      </div>
    </form>
  )
}

export default EditBooking
