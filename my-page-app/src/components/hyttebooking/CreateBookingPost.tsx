import { ChangeEvent, useEffect, useState } from 'react'
import { API_URL } from '../../services/api.service'
import { format, addDays, differenceInDays, isBefore } from 'date-fns'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from '@/components/Loading'
import { Button } from '../ui/button'
import { BookingPost } from '@/types'
import axios from 'axios'
import authHeader from '@/services/auth-header'
import { useMutation, useQueryClient } from 'react-query'

type Props = {
  apartmentId: number
  date: Date
  closeModal: () => void
  refreshVacancies: Function
  cutOffDateVacancies: string
  vacancies: { [key: number]: string[] } | undefined
}
const createBooking = async ({ bookingPost }: { bookingPost: BookingPost }) => {
  return axios
    .post(API_URL + 'booking/post', bookingPost, {
      headers: authHeader(),
    })
    .then((response) => response.data)
    .catch((error) => {
      if (error.response && error.response.data) {
        throw error.response.data
      } else {
        throw 'En feil skjedde under oppretting, prøv igjen.'
      }
    })
}

const CreateBookingPost = ({
  apartmentId,
  date,
  closeModal,
  refreshVacancies,
  cutOffDateVacancies,
  vacancies,
}: Props) => {
  const [startDate, setStartDate] = useState(format(date, 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState('')

  const vacantDaysForApartmentWithoutTakeoverDates =
    vacancies![Number(apartmentId)]

  useEffect(() => {
    const startDateFns = new Date(startDate)
    const maxAvailableDatesInBooking = []
    const endFns = addDays(startDateFns, 8)

    for (
        let currentFns = startDateFns;
        isBefore(currentFns, endFns);
        currentFns = addDays(currentFns, 1)
    ) {
      const currentDate = format(currentFns, 'yyyy-MM-dd')
      const previousFns = addDays(currentFns, -1)
      const previousDate = format(previousFns, 'yyyy-MM-dd')
      const nextFns = addDays(currentFns, 1)
      const nextDate = format(nextFns, 'yyyy-MM-dd')
      if (
          (vacantDaysForApartmentWithoutTakeoverDates.includes(currentDate) ||
              vacantDaysForApartmentWithoutTakeoverDates.includes(previousDate) ||
              vacantDaysForApartmentWithoutTakeoverDates.includes(nextDate)) && isBefore(new Date(currentDate), addDays(new Date(cutOffDateVacancies), 1))
      ) {
        maxAvailableDatesInBooking.push(currentDate)
      } else {
        break
      }
    }

    if (maxAvailableDatesInBooking.length > 0) {
      setEndDate(
          maxAvailableDatesInBooking[maxAvailableDatesInBooking.length - 1],
      )
    } else {
      setEndDate(startDate)
    }
  }, [vacantDaysForApartmentWithoutTakeoverDates])

  const [isLoadingPost, setIsLoadingPost] = useState(false)

  const isValid =
    startDate < endDate &&
    differenceInDays(new Date(endDate), new Date(startDate)) <= 7 &&
    isBefore(new Date(endDate), new Date(cutOffDateVacancies))

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
      mutate({ bookingPost })
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
