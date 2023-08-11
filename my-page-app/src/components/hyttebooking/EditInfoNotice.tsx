import { ChangeEvent, useState } from 'react'
import { API_URL } from '../../services/api.service'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from '@/components/Loading'
import { Button } from '../ui/button'
import { EditedInfoNotice, InfoBooking } from '@/types'
import axios from 'axios'
import authHeader from '@/services/auth-header'
import { useMutation, useQueryClient } from 'react-query'
import { isBefore } from 'date-fns'

const editExistingInfoNotice = async ({
  editedInfoNotice,
  infoNoticeId,
  userIsAdmin,
}: {
  editedInfoNotice: EditedInfoNotice
  infoNoticeId: number
  userIsAdmin: boolean
}) => {
  if (userIsAdmin) {
    return axios
      .patch(
        API_URL + 'informationNotice/admin/' + infoNoticeId,
        editedInfoNotice,
        {
          headers: authHeader(),
        },
      )
      .then((response) => response.data)
      .catch((error) => {
        if (error.response && error.response.data) {
          throw error.response.data
        } else {
          throw 'En feil skjedde under redigeringen, prøv igjen.'
        }
      })
  } else {
    throw 'Du har ikke høy nok brukerstatus til å utføre denne handlingen'
  }
}

const EditInfoNotice = ({
  infoNotice,
  closeModal,
  userIsAdmin,
}: {
  infoNotice: InfoBooking
  closeModal: () => void
  userIsAdmin: boolean
}) => {
  const [startDate, setStartDate] = useState(infoNotice.startDate)
  const [endDate, setEndDate] = useState(infoNotice.endDate)
  const [description, setDescription] = useState(infoNotice.description)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  const isValid =
    isBefore(new Date(startDate), new Date(endDate)) && description !== ''

  const queryClient = useQueryClient()
  const { mutate } = useMutation(editExistingInfoNotice, {
    onSuccess: () => {
      closeModal()
      queryClient.invalidateQueries('infoNotices')
      setIsLoadingEdit(false)
      toast.success('Redigert notisen')
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
      const infoNoticeId = infoNotice.id
      const editedInfoNotice = {
        startDate: startDate,
        endDate: endDate,
        description: description,
      }
      mutate({ editedInfoNotice, infoNoticeId, userIsAdmin: userIsAdmin })
    }
  }

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value)
  }
  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value)
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
          <strong>Beskrivelse:</strong>
          <label>
            <input
              className="w-48 input input-bordered input-sm"
              type="text"
              name="description"
              onChange={handleDescriptionChange}
              value={description}
              placeholder={description}
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

export default EditInfoNotice
