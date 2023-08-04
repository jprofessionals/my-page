import { ChangeEvent, useState } from 'react'
import { API_URL } from '../../services/api.service'
import moment from 'moment'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from '@/components/Loading'
import { Button } from '../ui/button'
import { BookingPost } from '@/types'
import axios from 'axios'
import authHeader from '@/services/auth-header'
import { useMutation, useQueryClient } from 'react-query'
import {add, isBefore, isEqual} from 'date-fns'

type Props = {
  apartmentId: number
  date: Date
  closeModal: () => void
  refreshVacancies: Function
  userIsAdmin: boolean
  allUsersNames: string[]
  cutOffDateVacancies: string
}
const createBooking = async ({
  bookingPost,
  userIsAdmin,
  bookingOwnerName,
}: {
  bookingPost: BookingPost
  userIsAdmin: boolean
  bookingOwnerName: string
}) => {
  if (userIsAdmin) {
    return axios
      .post(
        API_URL + 'booking/admin/post?bookingOwnerName=' + bookingOwnerName,
        bookingPost,
        {
          headers: authHeader(),
        },
      )
      .then((response) => response.data)
      .catch((error) => {
        if (error.response && error.response.data) {
          throw error.response.data
        } else {
          throw 'En feil skjedde under oppretting, sjekk input verdier og prøv igjen.'
        }
      })
  } else {
    return axios
      .post(API_URL + 'booking/post', bookingPost, {
        headers: authHeader(),
      })
      .then((response) => response.data)
      .catch((error) => {
        if (error.response && error.response.data) {
          throw error.response.data
        } else {
          throw 'En feil skjedde under oppretting, sjekk input verdier og prøv igjen.'
        }
      })
  }
}

const CreateBookingPost = ({
  apartmentId,
  date,
  closeModal,
  refreshVacancies,
  userIsAdmin,
  allUsersNames,
  cutOffDateVacancies,
}: Props) => {
  const [startDate, setStartDate] = useState(moment(date).format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(
    moment(date).add(7, 'days').format('YYYY-MM-DD'),
  )
  const [isLoadingPost, setIsLoadingPost] = useState(false)
  const [bookingOwnerName, setBookingOwnerName] = useState<string>('')

  const isValid =
    startDate < endDate &&
    moment(endDate).diff(startDate, 'days') <= 7 &&
    isBefore(new Date(endDate), add(new Date(cutOffDateVacancies), {days: 1})) &&
    bookingOwnerName!== ''

  const queryClient = useQueryClient()
  const { mutate } = useMutation(createBooking, {
    onSuccess: () => {
      closeModal()
      queryClient.invalidateQueries('yourBookingsOutline')
      queryClient.invalidateQueries('bookings')
      queryClient.invalidateQueries('yourBookingsButton')
      setIsLoadingPost(false)
      toast.success('Lagret reservasjon')
      refreshVacancies()
    },
    onError: (error: string) => {
      setIsLoadingPost(false)
      toast.error(error)
    },
  })

  const handleSubmit = (e: any) => {
    e.preventDefault()
    if (!isValid) {
      toast.error('Noen av verdiene var ikke gyldig, prøv igjen')
    } else {
      setIsLoadingPost(true)
      const bookingPost = {
        apartmentID: apartmentId,
        startDate: startDate,
        endDate: endDate,
      }
      mutate({ bookingPost, userIsAdmin, bookingOwnerName })
    }
  }

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value)
  }
  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value)
  }
  const handleBookingOwnerNameChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setBookingOwnerName(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="overflow-hidden w-full rounded-xl border border-gray-500 shadow-sm">
        <div className="flex flex-col gap-2 items-start p-3">
          {userIsAdmin ? (
            <>
              <strong> Navn: </strong>
              <label>
                <select
                  className="w-48 input input-bordered input-sm"
                  name="bookingOwnerName"
                  onChange={handleBookingOwnerNameChange}
                  value={bookingOwnerName}
                >
                  <option value="">Velg ansatt</option>
                  {allUsersNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
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
              Legg til reservasjon
              <Loading isLoading={isLoadingPost} />
            </span>
          </Button>
        </div>
      </div>
    </form>
  )
}

export default CreateBookingPost
