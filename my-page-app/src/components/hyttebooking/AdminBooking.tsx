import React, { ChangeEvent, useEffect, useState } from 'react'
import ApiService, { API_URL } from '@/services/api.service'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { differenceInDays } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Apartment, BookingPost } from '@/types'
import axios from 'axios'
import authHeader from '@/services/auth-header'
import Loading from '@/components/Loading'
import * as Modal from '@/components/ui/modal'

export default function AdminBooking() {
  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false)
  const [allUsersNames, setAllUsersNames] = useState<string[]>([])
  const [apartments, setApartments] = useState<Apartment[]>([])

  const queryClient = useQueryClient()

  const getAllApartments = async () => {
    const response = await ApiService.getAllApartments()
    setApartments(response)
  }

  const getUserIsAdmin = async () => {
    try {
      const response = await ApiService.getUser()
      const user = response.data
      const adminStatus = user.admin
      setUserIsAdmin(adminStatus)
    } catch {
      toast.error('Kunne ikke hente brukers admin status')
    }
  }

  const fetchAllUsers = async () => {
    const response = await ApiService.getUsers()
    const users = response.data
    const usersNames: string[] = []
    for (const user of users) {
      usersNames.push(user.name)
    }
    setAllUsersNames(usersNames)
  }

  const createBooking = async ({
    bookingPost,
    userIsAdmin,
    bookingOwnerName,
    bookingWithoutDrawing,
  }: {
    bookingPost: BookingPost
    userIsAdmin: boolean
    bookingOwnerName: string
    startDate: string
    bookingWithoutDrawing: boolean
  }) => {
    if (userIsAdmin) {
      if (bookingWithoutDrawing) {
        return axios
          .post(
            API_URL + 'booking/admin/post?bookingOwnerName=' + bookingOwnerName,
            bookingPost,
            {
              headers: authHeader() as Record<string, string>,
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
          .post(
            API_URL +
              'pendingBooking/pendingPostForUser?bookingOwnerName=' +
              bookingOwnerName,
            bookingPost,
            {
              headers: authHeader() as Record<string, string>,
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
      }
    } else {
      return axios
        .post(API_URL + 'pendingBooking/pendingPost', bookingPost, {
          headers: authHeader() as Record<string, string>,
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

  const [startDate, setStartDate] = useState('') //useState(format(date!, 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState('')
  const [bookingOwnerName, setBookingOwnerName] = useState<string>('')
  const [apartmentId, setApartmentId] = useState<number>(0)
  const [bookingWithoutDrawing, setBookingWithoutDrawing] =
    useState<boolean>(false)
  const [isLoadingPost, setIsLoadingPost] = useState(false)

  const isValid =
    startDate < endDate &&
    bookingOwnerName.length > 0 &&
    apartmentId > 0 &&
    differenceInDays(new Date(endDate), new Date(startDate)) <= 7

  const { mutate } = useMutation({
    mutationFn: createBooking,

    onSuccess: () => {
      setIsLoadingPost(false)
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({
        queryKey: ['allPendingBookingTrains'],
      })
      toast.success('Lagret reservasjon')
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
      const bookingPost = {
        apartmentID: apartmentId,
        startDate: startDate,
        endDate: endDate,
      }
      mutate({
        bookingPost,
        userIsAdmin,
        bookingOwnerName,
        startDate,
        bookingWithoutDrawing,
      })
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
  const handleBookingWithoutDrawingChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    setBookingWithoutDrawing(e.target.checked)
  }
  const handleApartmentIdChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setApartmentId(Number(e.target.value))
  }

  useEffect(() => {
    getUserIsAdmin()
  }, [])

  useEffect(() => {
    if (userIsAdmin) {
      fetchAllUsers()
      getAllApartments()
    }
  }, [userIsAdmin])

  return (
    <>
      {userIsAdmin && (
        <Modal.Dialog>
          <Modal.DialogTrigger asChild>
            <Button variant="outline" style={{ width: '40%' }}>
              Admin booking
            </Button>
          </Modal.DialogTrigger>

          <Modal.DialogContent className="bg-white">
            <Modal.DialogHeader>
              <Modal.DialogTitle>Legg til ny booking</Modal.DialogTitle>
            </Modal.DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="overflow-hidden w-full rounded-xl border border-gray-500 shadow-xs">
                <div className="flex flex-col gap-2 items-start p-3">
                  <strong> Navn: </strong>
                  <label>
                    <select
                      className="w-48 input input-bordered input-sm mr-3"
                      name="bookingOwnerName"
                      onChange={handleBookingOwnerNameChange}
                      value={bookingOwnerName}
                    >
                      <option value="">Velg ansatt</option>
                      {allUsersNames.sort().map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <strong> Enhet: </strong>
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
                  <div>
                    <input
                      type="checkbox"
                      onChange={handleBookingWithoutDrawingChange}
                      id="bookingWithoutDrawing"
                      style={{ transform: 'scale(1.3)', marginRight: '10px' }}
                    />
                    <label htmlFor="bookingWithoutDrawing">
                      Book uten trekning
                    </label>
                  </div>
                  <Button
                    type="submit"
                    disabled={!isValid}
                    size="sm"
                    className="mt-4"
                  >
                    <span>
                      Legg til reservasjon
                      <Loading isLoading={isLoadingPost} />
                    </span>
                  </Button>
                </div>
              </div>
            </form>
          </Modal.DialogContent>
        </Modal.Dialog>
      )}
    </>
  )
}
