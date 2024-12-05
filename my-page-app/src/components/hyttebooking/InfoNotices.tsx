import * as Modal from '../ui/modal'
import { Button } from '../ui/button'
import React, { useEffect, useState } from 'react'
import ApiService from '../../services/api.service'
import { toast } from 'react-toastify'
import { dateFormat } from './month-overview/monthOverviewUtils'
import { add, format, sub } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { InfoBooking } from '../../types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRefresh } from '@fortawesome/free-solid-svg-icons'

function InfoNotices() {
  const queryClient = useQueryClient()
  const today = format(new Date(), dateFormat)

  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false)
  const [submitInProgress, setSubmitInProgress] = useState<boolean>(false)
  const [description, setDescription] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(today)
  const [endDate, setEndDate] = useState<string>(today)

  const getUserIsAdmin = async () => {
    try {
      const response = await ApiService.getUser()
      setUserIsAdmin(response.data.admin)
    } catch {
      toast.error('Kunne ikke hente brukers admin status')
    }
  }

  useEffect(() => {
    getUserIsAdmin()
  }, [])

  const { data: infoNotices } = useQuery<InfoBooking[]>({
    queryKey: ['infoNotices'],
    queryFn: async () => {
      const startDate = format(sub(new Date(), { months: 1 }), dateFormat)
      const endDate = format(add(new Date(), { years: 1 }), dateFormat)
      return ApiService.getInfoNotices(startDate, endDate)
    },
  })

  function handleDescriptionChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDescription(e.target.value)
  }

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setStartDate(e.target.value)
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEndDate(e.target.value)
  }

  function isValid() {
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isValid()) {
      try {
        setSubmitInProgress(true);
        await ApiService.createInfoNotice({ startDate, endDate, description });
        toast.success('Infonotis opprettet');
        queryClient.invalidateQueries({ queryKey: ['infoNotices'] });
      } catch {
        toast.error('Oppretting av infonotis feilet');
      }
      setSubmitInProgress(false);
    }
  }

  async function deleteInfoNotice(infoNoticeId: number) {
    console.log('deleteInfoNotice(' + infoNoticeId + ')')
    try {
      await ApiService.deleteInfoNotice(infoNoticeId)
      toast.success('Infonotis slettet')
      queryClient.invalidateQueries({ queryKey: ['infoNotices'] })
    } catch {
      toast.error('Sletting av infonotis feilet')
    }
  }

  return (
    <>
      {userIsAdmin && (
        <Modal.Dialog>
          <Modal.DialogTrigger asChild>
            <Button variant="outline" style={{ width: '40%' }}>
              Infonotiser
            </Button>
          </Modal.DialogTrigger>

          <Modal.DialogContent className="bg-white">
            <Modal.DialogHeader>
              <Modal.DialogTitle>Infonotiser</Modal.DialogTitle>
            </Modal.DialogHeader>

            <div>
              {(infoNotices || []).map((infoNotice) => (
                <div
                  key={infoNotice.id}
                  className="grid grid-cols-4 min-h-8 border-solid"
                >
                  <span>{infoNotice.startDate}</span>
                  <span>{infoNotice.endDate}</span>
                  <span>{infoNotice.description}</span>
                  <Button
                    variant="error"
                    className="h-6 min-h-6"
                    onClick={() => deleteInfoNotice(infoNotice.id)}
                  >
                    Slett
                  </Button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '2em' }}>
              <b>Opprett ny infonotis</b>
              <form onSubmit={handleSubmit}>
                <div className="overflow-hidden w-full rounded-xl border border-gray-500 shadow-sm">
                  <div className="flex flex-col gap-2 items-start p-3">
                    <strong>Beskrivelse:</strong>
                    <label>
                      <input
                        type="text"
                        className="w-48 input input-bordered input-sm ml-2"
                        name="description"
                        onChange={handleDescriptionChange}
                        value={description}
                      />
                    </label>
                    <strong>Startdato:</strong>
                    <label>
                      <input
                        type="date"
                        className="w-48 input input-bordered input-sm ml-2"
                        name="startDate"
                        onChange={handleStartDateChange}
                        value={startDate}
                      />
                    </label>
                    <strong>Sluttdato:</strong>
                    <label>
                      <input
                        className="w-48 input input-bordered input-sm ml-2"
                        type="date"
                        name="endDate"
                        onChange={handleEndDateChange}
                        value={endDate}
                      />
                    </label>
                    <Button
                      type="submit"
                      disabled={!isValid || submitInProgress}
                      size="sm"
                      className="mt-4"
                    >
                      <span>Legg til notis</span>
                      {submitInProgress && (
                        <div className="flex justify-center">
                          <FontAwesomeIcon
                            icon={faRefresh}
                            className="animate-spin"
                            size="xl"
                          />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </Modal.DialogContent>
        </Modal.Dialog>
      )}
    </>
  )
}

export default InfoNotices
