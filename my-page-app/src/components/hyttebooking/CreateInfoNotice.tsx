import { ChangeEvent, useCallback, useEffect, useState } from 'react'
import { API_URL } from '../../services/api.service'
import { addDays, format } from 'date-fns'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from '@/components/Loading'
import { Button } from '../ui/button'
import { InfoBookingPost } from '@/types'
import axios from 'axios'
import authHeader from '@/services/auth-header'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  date: Date | undefined
  closeModal: () => void
  userIsAdmin: boolean
  infoNoticeVacancies: string[] | undefined
  refreshInfoNoticeVacancies: () => void
}
const createInfoNotice = async ({
  userIsAdmin,
  infoNoticePost,
}: {
  userIsAdmin: boolean
  infoNoticePost: InfoBookingPost
}) => {
  if (userIsAdmin) {
    return axios
      .post(API_URL + 'informationNotice/post', infoNoticePost, {
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
  } else {
    throw 'Du har ikke høy nok brukerstatus til å utføre denne handlingen'
  }
}

const CreateInfoNoticePost = ({
  date,
  closeModal,
  userIsAdmin,
  infoNoticeVacancies,
  refreshInfoNoticeVacancies,
}: Props) => {
  const [startDate, setStartDate] = useState(format(date!, 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(date!, 'yyyy-MM-dd'))

  const [isLoadingPost, setIsLoadingPost] = useState(false)
  const [description, setDescription] = useState<string>('')

  const vacantDaysForInfoNoticesWithoutTakeoverDates = infoNoticeVacancies!
  const [isEndDateValid, setIsEndDateValid] = useState(false)
  const evaluateEndDateValidity = useCallback(
    (newEndDate: string) => {
      const endDateDate = new Date(newEndDate)
      const previousFns = addDays(endDateDate, -1)
      const previousDate = format(previousFns, 'yyyy-MM-dd')
      const nextFns = addDays(endDateDate, 1)
      const nextDate = format(nextFns, 'yyyy-MM-dd')

      const isValid =
        vacantDaysForInfoNoticesWithoutTakeoverDates?.includes(newEndDate) ||
        vacantDaysForInfoNoticesWithoutTakeoverDates?.includes(previousDate) ||
        vacantDaysForInfoNoticesWithoutTakeoverDates?.includes(nextDate)
      setIsEndDateValid(isValid)
    },
    [vacantDaysForInfoNoticesWithoutTakeoverDates],
  )

  useEffect(() => {
    evaluateEndDateValidity(endDate)
  }, [infoNoticeVacancies, endDate, evaluateEndDateValidity])

  const isValid = startDate < endDate && description !== '' && isEndDateValid
  const queryClient = useQueryClient()
  const { mutate } = useMutation({
    mutationFn: createInfoNotice,

    onSuccess: () => {
      closeModal()
      queryClient.invalidateQueries({ queryKey: ['infoNotices'] })
      setIsLoadingPost(false)
      toast.success('Lagret notisen')
      refreshInfoNoticeVacancies()
    },

    onError: (error: string) => {
      setIsLoadingPost(false)
      toast.error(error)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isValid) {
      toast.error('Noen av verdiene var ikke gyldig, prøv igjen')
    } else {
      setIsLoadingPost(true)
      const infoNoticePost = {
        startDate: startDate,
        endDate: endDate,
        description: description,
      }
      mutate({ infoNoticePost, userIsAdmin })
    }
  }

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value)
  }
  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value)
    evaluateEndDateValidity(e.target.value)
  }
  const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value)
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
          <strong> Beskrivelse: </strong>
          <label>
            <input
              className="w-48 input input-bordered input-sm"
              type="text"
              name="description"
              onChange={handleDescriptionChange}
              value={description}
              placeholder="Legg til beskrivelse her"
            />
          </label>
          <Button type="submit" disabled={!isValid} size="sm" className="mt-4">
            <span>
              Legg til informasjonsnotis
              <Loading isLoading={isLoadingPost} />
            </span>
          </Button>
        </div>
      </div>
    </form>
  )
}

export default CreateInfoNoticePost
