import React, { useCallback, useEffect, useState } from 'react'
import Modal from 'react-modal'
import { MonthCalendar } from '@/components/ui/monthCalendar'
import ApiService from '@/services/api.service'
import {
  Apartment,
  Booking,
  DrawingPeriod,
  InfoBooking,
  Settings
} from '@/types'
import { toast } from 'react-toastify'
import { useAuthContext } from '@/providers/AuthProvider'
import { add, format, isAfter, isBefore, sub } from 'date-fns'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import EditBooking from '@/components/hyttebooking/EditBooking'
import CreateBookingPost from '@/components/hyttebooking/CreateBookingPost'
import ConvertPendingBooking from '@/components/hyttebooking/ConvertPendingBooking'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CreateInfoNotice from '@/components/hyttebooking/CreateInfoNotice'
import EditInfoNotice from '@/components/hyttebooking/EditInfoNotice'
import getSetting from '@/utils/getSetting'

export default function MonthOverview() {
  const [date, setDate] = useState<Date | undefined>()
  const [showModal, setShowModal] = useState(false)
  const [bookingItems, setBookingItems] = useState<Booking[]>([])
  const [expandedApartments, setExpandedApartments] = useState<number[]>([])
  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false)
  const [infoNotices, setInfoNotices] = useState<InfoBooking[]>([])

  const { data: yourBookings } = useQuery<Booking[]>(
    'yourBookingsOutline',
    async () => {
      const yourBookings = await ApiService.getBookingsForUser()
      return yourBookings
    },
  )

  const { data: yourPendingBookings, refetch: refetchYourPendingBookings } = useQuery<Booking[]>(
    'yourPendingBookingsOutline',
    async () => {
      const yourPendingBookings = await ApiService.getPendingBookingsForUser()
      return yourPendingBookings
    },
  )

  const startDateBookings = format(
    sub(new Date(), { months: 6, days: 7 }),
    'yyyy-MM-dd',
  )
  const endDateBookings = format(
    add(new Date(), { months: 12, days: 7 }),
    'yyyy-MM-dd',
  )

  const { data: bookings } = useQuery<Booking[]>('bookings', async () => {
    const fetchedBookings = await ApiService.getBookings(
      startDateBookings,
      endDateBookings,
    )
    return fetchedBookings
  })

  const getBookings = (date: string) => {
    return (
      bookings?.filter(
        (booking) => date >= booking.startDate && date <= booking.endDate,
      ) || []
    )
  }

  const getBookingsOnDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const bookingsOnDay = getBookings(dateString)
    if(yourPendingBookings) {
      bookingsOnDay.push(...yourPendingBookings.filter(pb => pendingBookingIsOnDay(date, pb) &&
          !bookingsOnDay.some(book => book.apartment.id == pb.apartment.id)));
    }
    setBookingItems(bookingsOnDay)
  }

  function pendingBookingIsOnDay(date: Date, booking: Booking){
    const startDate = new Date(booking.startDate)
    startDate.setHours(0)
    const endDate = new Date(booking.endDate)
    endDate.setHours(0)

    let b = startDate<=date && endDate>=date;
    return b;
  }

  const { data: allInfoNotices } = useQuery<InfoBooking[]>(
    'infoNotices',
    async () => {
      const fetchedInfoNotices = await ApiService.getInfoNotices(
        startDateBookings,
        endDateBookings,
      )
      return fetchedInfoNotices
    },
  )

  const getInfoNotices = (date: string) => {
    return (
      allInfoNotices?.filter(
        (infoNotice) =>
          date >= infoNotice.startDate && date <= infoNotice.endDate,
      ) || []
    )
  }

  const getInfoNoticesOnDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const infoNoticesOnDay = getInfoNotices(dateString)
    setInfoNotices(infoNoticesOnDay)
  }

  const getUserIsAdmin = async () => {
    try {
      const response = await ApiService.getUser()
      const user = response.data
      const adminStatus = user.admin
      setUserIsAdmin(adminStatus)
    } catch (e) {
      toast.error('Kunne ikke hente brukers admin status')
    }
  }

  const [allUsersNames, setAllUsersNames] = useState<string[]>([])
  const fetchAllUsers = async () => {
    const response = await ApiService.getUsers()
    const users = response.data
    const usersNames: string[] = []
    for (const user of users) {
      usersNames.push(user.name)
    }
    setAllUsersNames(usersNames)
  }

  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(
    null,
  )

  const openDeleteModal = (booking: Booking | null) => {
    setBookingToDelete(booking)
    setDeleteModalIsOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalIsOpen(false)
  }

  const confirmDelete = () => {
    if(bookingToDelete?.isPending){
        handleDeletePendingBooking(bookingToDelete?.id || null)
    } else {
      if (userIsAdmin) {
        handleAdminDeleteBooking(bookingToDelete?.id || null)
      } else {
        handleDeleteBooking(bookingToDelete?.id || null)
      }
    }
    closeDeleteModal()
  }

  const handleDeleteBooking = async (bookingId: number | null) => {
    deleteBooking.mutate(bookingId)
  }

  const handleAdminDeleteBooking = async (bookingId: number | null) => {
    adminDeleteBooking.mutate(bookingId)
  }

  const deleteBookingByBookingId = async (bookingId: number | null) => {
    try {
      await ApiService.deleteBooking(bookingId)
      toast.success('Reservasjonen din er slettet')
      closeModal()
    } catch (error) {
      toast.error(
        `Reservasjonen din ble ikke slettet med følgende feil: ${error}`,
      )
    }
  }
  const adminDeleteBookingByBookingId = async (bookingId: number | null) => {
    try {
      await ApiService.adminDeleteBooking(bookingId)
      toast.success('Bookingen er slettet')
      closeModal()
    } catch (error) {
      toast.error(`Bookingen ble ikke slettet med følgende feil: ${error}`)
    }
  }

  const queryClient = useQueryClient()
  const deleteBooking = useMutation(deleteBookingByBookingId, {
    onSuccess: () => {
      queryClient.invalidateQueries('bookings')
      refreshVacancies()
    },
    onError: (error) => {
      console.error('Error:', error)
    },
  })

  const adminDeleteBooking = useMutation(adminDeleteBookingByBookingId, {
    onSuccess: () => {
      queryClient.invalidateQueries('bookings')
      refreshVacancies()
    },
    onError: (error) => {
      console.error('Error:', error)
    },
  })

  const [pendingBookingDeleteModalIsOpen, setPendingBookingDeleteModalIsOpen] =
    useState(false)
  const [pendingBookingIdToDelete, setPendingBookingIdToDelete] = useState<
    number | null
  >(null)

  const openPendingBookingDeleteModal = (pendingBooking: number | null) => {
    setPendingBookingIdToDelete(pendingBooking)
    setPendingBookingDeleteModalIsOpen(true)
  }

  const closePendingBookingDeleteModal = () => {
    setPendingBookingDeleteModalIsOpen(false)
  }

  const confirmPendingBookingDelete = () => {
    handleDeletePendingBooking(pendingBookingIdToDelete)
    closePendingBookingDeleteModal()
  }

  const deletePendingBookingById = async (pendingBookingId: number | null) => {
    try {
      if(userIsAdmin){
        await ApiService.adminDeletePendingBooking(pendingBookingId)
      } else {
        await ApiService.deletePendingBooking(pendingBookingId)
      }
      toast.success('Ønsket reservasjon er slettet')
      closeModal()
    } catch (error) {
      toast.error(
        `Ønsket reservasjon ble ikke slettet med følgende feil: ${error}`,
      )
    }
  }

  const deletePendingBooking = useMutation(deletePendingBookingById, {
    onSuccess: () => {
      queryClient.invalidateQueries('allPendingBookingsAllApartments')
    },
    onError: (error) => {
      console.error('Error:', error)
    },
  })

  const handleDeletePendingBooking = (pendingBookingId: number | null) => {
    deletePendingBooking.mutate(pendingBookingId)
  }

  const [showEditFormForBooking, setShowEditFormForBookingId] = useState<
    number | null
  >(null)

  const handleEditBooking = (bookingId: number) => {
    if (showEditFormForBooking !== bookingId) {
      setShowEditFormForBookingId(bookingId)
    } else setShowEditFormForBookingId(null)
  }

  const handleDateClick = (date: Date) => {
    setDate(date)
    getVacancyForDay(date)
    setShowModal(true)
    getBookingsOnDay(date)
    getPendingBookingsOnDay(date)
    getDrawingPeriodsOnDay(date)
    getPendBookingListFromDrawPeriod(date)
    getInfoNoticesOnDay(date)
    getInfoNoticeVacancyOnDay(date)
  }

  const customModalStyles = {
    content: {
      width: 'auto',
      minWidth: '300px',
      margin: 'auto',
      maxHeight: '80vh',
      overflow: 'auto',
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
    },
  }

  const closeModal = () => {
    setShowModal(false)
    setDate(undefined)
    setShowEditFormForBookingId(null)
    setExpandedApartments([])
    setDeleteModalIsOpen(false)
    setShowCreateFormForInfoNotice(false)
    setInfoNoticeDeleteModalIsOpen(false)
    setShowEditFormForInfoNoticeId(null)
    setIsDayVacantForInfoNotice(false)
    setPendingBookingDeleteModalIsOpen(false)
  }

  const handleBookClick = (apartmentId: number) => {
    setExpandedApartments((prevExpandedApartments) => {
      const isExpanded = prevExpandedApartments.includes(apartmentId)
      if (isExpanded) {
        return prevExpandedApartments.filter((id) => id !== apartmentId)
      } else {
        return [...prevExpandedApartments, apartmentId]
      }
    })
  }

  const [showCreateFormForInfoNotice, setShowCreateFormForInfoNotice] =
    useState<boolean>(false)

  const handleAddInfoNoticeClick = () => {
    if (!showCreateFormForInfoNotice) {
      setShowCreateFormForInfoNotice(true)
    } else setShowCreateFormForInfoNotice(false)
  }

  const [infoNoticeDeleteModalIsOpen, setInfoNoticeDeleteModalIsOpen] =
    useState(false)
  const [infoNoticeIdToDelete, setInfoNoticeIdToDelete] = useState<
    number | null
  >(null)

  const openInfoNoticeDeleteModal = (infoNotice: number | null) => {
    setInfoNoticeIdToDelete(infoNotice)
    setInfoNoticeDeleteModalIsOpen(true)
  }

  const closeInfoNoticeDeleteModal = () => {
    setInfoNoticeDeleteModalIsOpen(false)
  }

  const confirmInfoNoticeDelete = () => {
    handleDeleteNotice(infoNoticeIdToDelete)
    closeInfoNoticeDeleteModal()
  }

  const deleteInfoNoticeByNoticeId = async (infoNoticeId: number | null) => {
    try {
      await ApiService.deleteInfoNotice(infoNoticeId)
      toast.success('Informasjonsnotisen er slettet')
      closeModal()
    } catch (error) {
      toast.error(
        `Informasjonsnotisen ble ikke slettet med følgende feil: ${error}`,
      )
    }
  }

  const deleteInfoNotice = useMutation(deleteInfoNoticeByNoticeId, {
    onSuccess: () => {
      queryClient.invalidateQueries('infoNotices')
      refreshInfoNoticeVacancies()
    },
    onError: (error) => {
      console.error('Error:', error)
    },
  })

  const handleDeleteNotice = (infoNoticeId: number | null) => {
    deleteInfoNotice.mutate(infoNoticeId)
  }

  const [showEditFormForInfoNotice, setShowEditFormForInfoNoticeId] = useState<
    number | null
  >(null)

  const handleEditInfoNotice = (infoNoticeId: number) => {
    if (showEditFormForInfoNotice !== infoNoticeId) {
      setShowEditFormForInfoNoticeId(infoNoticeId)
    } else setShowEditFormForInfoNoticeId(null)
  }

  type VacancyLoadingStatus = 'init' | 'loading' | 'completed' | 'failed'
  const [vacancyLoadingStatus, setVacancyLoadingStatus] =
    useState<VacancyLoadingStatus>('init')
  const { userFetchStatus, settings } = useAuthContext()

  const [cutOffDateVacancies, setCutOffDateVacancies] = useState<string | undefined>(getSetting(settings, 'CUTOFF_DATE_VACANCIES'))

  const [vacancies, setVacancies] = useState<
    { [key: number]: string[] } | undefined
  >({})

  const [vacantApartmentsOnDay, setVacantApartmentsOnDay] = useState<
    Apartment[]
  >([])
  const [apartments, setApartments] = useState<Apartment[]>([])

  const startDateVacancies = format(new Date(), 'yyyy-MM-dd')
  const refreshVacancies = useCallback(async () => {
    if (cutOffDateVacancies != null) {
      setVacancyLoadingStatus('loading')
      try {
        const loadedVacancies = await ApiService.getAllVacancies(
          startDateVacancies,
          cutOffDateVacancies,
        )
        await refetchPendingBookings()
        await refetchYourPendingBookings()
        setVacancyLoadingStatus('completed')
        setVacancies(loadedVacancies)
      } catch (e) {
        setVacancyLoadingStatus('failed')
        toast.error('Klarte ikke laste ledige reservasjoner, prøv igjen senere')
      }
    }
  }, [cutOffDateVacancies])

  type InfoNoticeVacancyLoadingStatus =
    | 'init'
    | 'loading'
    | 'completed'
    | 'failed'
  const [infoNoticeVacancyLoadingStatus, setInfoNoticeVacancyLoadingStatus] =
    useState<InfoNoticeVacancyLoadingStatus>('init')

  const [infoNoticeVacancies, setInfoNoticeVacancies] = useState<
    string[] | undefined
  >([])

  const refreshInfoNoticeVacancies = useCallback(async () => {
    setInfoNoticeVacancyLoadingStatus('loading')

    try {
      const loadedInfoNoticeVacancies =
        await ApiService.getAllInfoNoticeVacancies(
          startDateBookings,
          endDateBookings,
        )
      setInfoNoticeVacancyLoadingStatus('completed')
      setInfoNoticeVacancies(loadedInfoNoticeVacancies)
    } catch (e) {
      setInfoNoticeVacancyLoadingStatus('failed')
      toast.error(
        'Klarte ikke laste dager ledige for informasjonsnotiser, prøv igjen senere',
      )
    }
  }, [])

  useEffect(() => {
    if (vacancyLoadingStatus !== 'init') return
    if (userFetchStatus === 'fetched') {
      refreshVacancies()
      getAllApartments()
      getUserIsAdmin()
    }
  }, [userFetchStatus, vacancyLoadingStatus])

  useEffect(() => {
    if (infoNoticeVacancyLoadingStatus !== 'init') return
    if (userIsAdmin) {
      fetchAllUsers()
      refreshInfoNoticeVacancies()
    }
  }, [userIsAdmin, infoNoticeVacancyLoadingStatus])

  const [prevSettings, setPrevSettings] = useState(settings)
  if (settings != prevSettings) {
    setPrevSettings(settings)
    setCutOffDateVacancies(getSetting(settings, 'CUTOFF_DATE_VACANCIES'))
    refreshVacancies()
  }

  const getAllApartments = async () => {
    const response = await ApiService.getAllApartments()
    setApartments(response)
  }
  const getVacantApartments = (selectedDate: Date) => {
    const vacantApartments: number[] = []
    const apartmentsInVacancies = Object.keys(vacancies!)

    const formattedDate = format(selectedDate, 'yyyy-MM-dd')
    const nextDate = new Date(selectedDate)
    nextDate.setDate(selectedDate.getDate() + 1)
    const formattedNextDate = format(nextDate, 'yyyy-MM-dd')
    const previousDate = new Date(selectedDate)
    previousDate.setDate(selectedDate.getDate() - 1)
    const formattedPreviousDate = format(previousDate, 'yyyy-MM-dd')

    if (
      cutOffDateVacancies != null &&
      isBefore(selectedDate, new Date(cutOffDateVacancies)) &&
      isAfter(selectedDate, sub(new Date(), { days: 1 }))
    ) {
      for (const apartment of apartmentsInVacancies) {
        const dates = vacancies![Number(apartment)]
        if (
          dates.includes(formattedDate) ||
          dates.includes(formattedNextDate) ||
          dates.includes(formattedPreviousDate)
        ) {
          vacantApartments.push(Number(apartment))
        }
      }
    }
    return vacantApartments
  }

  const getVacancyForDay = async (selectedDate: Date) => {
    const availableApartments: Apartment[] = []
    const vacantApartmentsInPeriod = getVacantApartments(selectedDate)
    for (const apartment of apartments) {
      if (vacantApartmentsInPeriod.includes(apartment.id!) &&(
          userIsAdmin ||
          !yourPendingBookings?.some(pb=> pb.apartment.id == apartment.id && pendingBookingIsOnDay(selectedDate, pb) ))) {
        availableApartments.push(apartment)
      }
    }
    setVacantApartmentsOnDay(availableApartments)
    return vacantApartmentsOnDay
  }

  const { data: allPendingBookingTrains, refetch: refetchPendingBookings } = useQuery(
    'allPendingBookingsAllApartments',
    async () => {
      const fetchedPendingBookingsTrains =
        await ApiService.getAllPendingBookingTrainsForAllApartments()
      return fetchedPendingBookingsTrains
    },
  )
  const getPendingBookingTrainsOnDay = (date: string) => {
    if (!allPendingBookingTrains) {
      return []
    }
    const allPendingBookingTrainsAllApartments = []
    for (const apartmentPendingTrain of allPendingBookingTrains) {
      for (const pendingTrain of apartmentPendingTrain) {
        allPendingBookingTrainsAllApartments.push(pendingTrain)
      }
    }
    const currentDate = new Date(date)
    currentDate.setHours(0, 0, 0, 0)
    const filteredPendingBookingTrainsAllApartments =
      allPendingBookingTrainsAllApartments.filter((pendingBookingTrain) => {
        const startDate = new Date(pendingBookingTrain.startDate)
        const endDate = new Date(pendingBookingTrain.endDate)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(0, 0, 0, 0)

        return currentDate >= startDate && currentDate <= endDate
      }) || []
    return filteredPendingBookingTrainsAllApartments
  }

  const [pendingBookingsOnDay, setPendingBookingsOnDay] = useState<
    Booking[]
  >([])
  const getPendingBookingsOnDay = (selectedDate: Date) => {
    const pendingBookingsOnDayArrayOfArray = []
    const selectedDateString = selectedDate.toString()
    const filteredPendingBookingTrainsAllApartments =
      getPendingBookingTrainsOnDay(selectedDateString)

    for (const pendingBookingTrain of filteredPendingBookingTrainsAllApartments) {
      for (const drawingPeriod of pendingBookingTrain.drawingPeriodList) {
        pendingBookingsOnDayArrayOfArray.push(drawingPeriod.pendingBookings)
      }
    }
    const pendingBookingsOnDayList = pendingBookingsOnDayArrayOfArray.flat()
    setPendingBookingsOnDay(pendingBookingsOnDayList)
    return pendingBookingsOnDayList
  }

  const [drawingPeriodListOnDay, setDrawingPeriodListOnDay] = useState<
    DrawingPeriod[]
  >([])
  const getDrawingPeriodsOnDay = (selectedDate: Date) => {
    const drawingPeriodsOnDayArrayOfArray = []
    const selectedDateString = selectedDate.toString()
    const filteredPendingBookingTrainsAllApartments =
      getPendingBookingTrainsOnDay(selectedDateString)

    for (const pendingBookingTrain of filteredPendingBookingTrainsAllApartments) {
      for (const drawingPeriod of pendingBookingTrain.drawingPeriodList) {
        drawingPeriodsOnDayArrayOfArray.push(drawingPeriod)
      }
    }
    const drawingPeriodsOnDayList = drawingPeriodsOnDayArrayOfArray.flat()
    setDrawingPeriodListOnDay(drawingPeriodsOnDayList)
    return drawingPeriodsOnDayList
  }

  const [pendingBookingList, setPendingBookingList] = useState<
    Booking[][]
  >([])

  const getPendBookingListFromDrawPeriod = (selectedDate: Date) => {
    const drawingPeriodsOnDay = getDrawingPeriodsOnDay(selectedDate)
    const pendingBookingList: Booking[][] = []

    for (const pendingBooking of drawingPeriodsOnDay) {
      const value = pendingBooking.valueOf()
      const pendingBookings = value.pendingBookings

      pendingBookingList.push(pendingBookings)
    }
    setPendingBookingList(pendingBookingList)
    return pendingBookingList
  }

  const [isDayVacantForInfoNotice, setIsDayVacantForInfoNotice] =
    useState(false)
  const getInfoNoticeVacancyOnDay = (selectedDate: Date) => {
    let vacant: boolean = false
    const formattedDate = format(selectedDate, 'yyyy-MM-dd')
    const nextDate = new Date(selectedDate)
    nextDate.setDate(selectedDate.getDate() + 1)
    const formattedNextDate = format(nextDate, 'yyyy-MM-dd')
    const previousDate = new Date(selectedDate)
    previousDate.setDate(selectedDate.getDate() - 1)
    const formattedPreviousDate = format(previousDate, 'yyyy-MM-dd')

    if (isAfter(selectedDate, sub(new Date(), { days: 1 }))) {
      const dates = infoNoticeVacancies
      if (
        dates?.includes(formattedDate) ||
        dates?.includes(formattedNextDate) ||
        dates?.includes(formattedPreviousDate)
      ) {
        vacant = true
        setIsDayVacantForInfoNotice(vacant)
      }
    }
    return vacant
  }

  type CabinColorClasses = {
    [key: string]: string
  }
  const cabinTextColorClasses: CabinColorClasses = {
    'Stor leilighet': 'text-orange-brand',
    'Liten leilighet': 'text-blue-small-appartment',
    Annekset: 'text-teal-annex',
  }

  const cabinBorderColorClasses: CabinColorClasses = {
    'Stor leilighet': 'border-orange-brand',
    'Liten leilighet': 'border-blue-small-appartment',
    Annekset: 'border-teal-annex',
  }

  const cabinPendingBorderColorClasses: CabinColorClasses = {
    'Stor leilighet': 'border-yellow-200',
    'Liten leilighet': 'border-purple-200',
    Annekset: 'border-green-200',
  }

  const cabinOrder = ['Stor leilighet', 'Liten leilighet', 'Annekset']

  function formatDrawing(drawingPeriod: DrawingPeriod) {

    let autoDrawingDate: Date = drawingPeriod.pendingBookings.reduce((earliest, booking) => {
      let bookingCreatedDate : Date
      if(booking.createdDate){
        bookingCreatedDate= new Date(booking.createdDate)
      } else {
        bookingCreatedDate= new Date()
      }
      return earliest < bookingCreatedDate ? earliest : bookingCreatedDate;
    }, new Date());
    autoDrawingDate.setDate(autoDrawingDate.getDate()+7)

    let earliestStartDate = drawingPeriod.pendingBookings.reduce((earliest, booking) => {
      const bookingStartDate = new Date(booking.startDate);
      return earliest < bookingStartDate ? earliest : bookingStartDate;
    }, new Date(drawingPeriod.pendingBookings[0].startDate));

    let manualDrawingNotice='';
    if(autoDrawingDate >= earliestStartDate){
      manualDrawingNotice = 'Oppholdet starter før automatisk trekningsdato. Kontakt Roger for manuell trekning'
    }

    return <>
      {drawingPeriod.pendingBookings[0].apartment.cabin_name}{' '}
      fra{' '}
      {format(new Date(drawingPeriod.startDate), 'dd.MM.yyyy')}{' '}
      til{' '}
      {format(new Date(drawingPeriod.endDate), 'dd.MM.yyyy')}.{' '}
      Planlagt trekning{' '}
      {format(autoDrawingDate, 'dd.MM.yyyy')}{' '}
      {manualDrawingNotice && <><br /><i><b>{manualDrawingNotice}</b></i></>}
    </>;
  }

  return (
    <div className="flex flex-col overflow-hidden gap-4 p-4">
      {cutOffDateVacancies==null ? "Fant ikke innstilling for siste reserverbare dato" : (
      <MonthCalendar
        onDayClick={handleDateClick}
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
        cutOffDateVacancies={cutOffDateVacancies}
        getBookings={getBookings}
        yourBookings={yourBookings}
        bookings={bookings}
        getPendingBookingTrainsOnDay={getPendingBookingTrainsOnDay}
        getInfoNotices={getInfoNotices}
      /> )}
      <Modal
        className=""
        isOpen={showModal}
        onRequestClose={closeModal}
        contentLabel="Selected Date"
        style={customModalStyles}
      >
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 prose">
          <Tabs defaultValue="oversikt" className="">
            <TabsList>
              <TabsTrigger value="oversikt" className="text-lg">
                Oversikt
              </TabsTrigger>
              <TabsTrigger value="trekning" className="text-lg">
                Trekning
              </TabsTrigger>
            </TabsList>
            <TabsContent value="oversikt">
              {date ? (
                <div>
                  <h3 className="mt-1 mb-1">{format(date!, 'dd.MM.yyyy')}</h3>
                  {cutOffDateVacancies!=null && isBefore(date!, new Date(cutOffDateVacancies)) ? null : (
                    <p> Denne dagen er ikke åpnet for reservasjon enda.</p>
                  )}
                  {infoNotices.length > 0 ? (
                    <div>
                      <h3 className="mt-3 mb-1">Informasjon for dagen:</h3>
                      {infoNotices.map((infoNotice, index) => (
                        <div
                          key={index}
                          className="mt-1 mb-1 pl-2 border-l-2 border-blue-500"
                        >
                          <span className="information-text ">
                            {infoNotice.description}
                          </span>
                          {userIsAdmin && (
                            <>
                              {isDayVacantForInfoNotice && (
                                <>
                                  <button
                                    onClick={() => handleAddInfoNoticeClick()}
                                    className="mb-1 ml-3 bg-blue-500 text-white px-2 py-0.5 rounded-md"
                                  >
                                    Legg til
                                  </button>
                                  {showCreateFormForInfoNotice && (
                                    <CreateInfoNotice
                                      date={date}
                                      closeModal={closeModal}
                                      userIsAdmin={userIsAdmin}
                                      infoNoticeVacancies={infoNoticeVacancies}
                                      refreshInfoNoticeVacancies={
                                        refreshInfoNoticeVacancies
                                      }
                                    />
                                  )}
                                </>
                              )}
                              <button
                                onClick={() =>
                                  handleEditInfoNotice(infoNotice.id)
                                }
                                className="mt-3 ml-2 bg-yellow-hotel text-white px-2 py-0.5 rounded-md"
                              >
                                Rediger
                              </button>
                              <button
                                onClick={() =>
                                  openInfoNoticeDeleteModal(infoNotice.id)
                                }
                                className="mb-1 ml-2 bg-red-500 text-white px-2 py-0.5 rounded-md"
                              >
                                Slett
                              </button>
                            </>
                          )}
                          <Modal
                            isOpen={infoNoticeDeleteModalIsOpen}
                            onRequestClose={closeModal}
                            contentLabel="Delete Confirmation"
                            style={customModalStyles}
                          >
                            <p className="mb-3">
                              Er du sikker på at du vil slette notisen?
                            </p>
                            <div className="flex justify-end">
                              <button
                                onClick={confirmInfoNoticeDelete}
                                className="ml-3 bg-red-500 text-white px-2 py-0.5 rounded-md"
                              >
                                Slett notis
                              </button>
                              <button
                                onClick={closeInfoNoticeDeleteModal}
                                className="ml-3 bg-gray-300 text-black-nav px-2 py-0.5 rounded-md"
                              >
                                Avbryt
                              </button>
                            </div>
                          </Modal>
                          {showEditFormForInfoNotice === infoNotice.id && (
                            <EditInfoNotice
                              infoNotice={infoNotice}
                              closeModal={closeModal}
                              userIsAdmin={userIsAdmin}
                              refreshInfoNoticeVacancies={
                                refreshInfoNoticeVacancies
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    userIsAdmin && (
                      <div>
                        <h3 className="mt-3 mb-1">Informasjon for dagen:</h3>
                        <div>
                          {' '}
                          Legg til en informasjonsnotis
                          <button
                            onClick={() => handleAddInfoNoticeClick()}
                            className="mb-1 ml-3 bg-blue-500 text-white px-2 py-0.5 rounded-md"
                          >
                            Legg til
                          </button>
                          {showCreateFormForInfoNotice && (
                            <CreateInfoNotice
                              date={date}
                              closeModal={closeModal}
                              userIsAdmin={userIsAdmin}
                              infoNoticeVacancies={infoNoticeVacancies}
                              refreshInfoNoticeVacancies={
                                refreshInfoNoticeVacancies
                              }
                            />
                          )}
                        </div>
                      </div>
                    )
                  )}
                  {bookingItems.length > 0 ? (
                    <div>
                      {bookingItems
                        .sort((a, b) => {
                          const cabinIndexA = cabinOrder.indexOf(
                            a.apartment.cabin_name,
                          )
                          const cabinIndexB = cabinOrder.indexOf(
                            b.apartment.cabin_name,
                          )

                          if (cabinIndexA !== cabinIndexB) {
                            return cabinIndexA - cabinIndexB
                          }
                          const startDateComparison =
                            Date.parse(a.startDate) - Date.parse(b.startDate)
                          if (startDateComparison !== 0) {
                            return startDateComparison
                          }
                          return Date.parse(a.endDate) - Date.parse(b.endDate)
                        })
                        .map((booking, index) => {
                          const startDate = new Date(booking.startDate)
                          const endDate = new Date(booking.endDate)
                          const formattedStartDate = format(
                            startDate,
                            'dd.MM.yyyy',
                          )
                          const formattedEndDate = format(endDate, 'dd.MM.yyyy')

                          const isYourBooking = !booking.isPending && yourBookings?.some(
                            (yourBooking) => yourBooking.id === booking.id,
                          ) || booking.isPending //only pending booking belonging to the user are in bookingItems


                          const prevCabinName =
                            index > 0
                              ? bookingItems[index - 1].apartment.cabin_name
                              : null
                          const currentCabinName = booking.apartment.cabin_name
                          const shouldRenderDivider =
                            prevCabinName !== currentCabinName

                          return (
                            <div key={booking.id}>
                              {shouldRenderDivider && (
                                <h4
                                  className={`mt-2 mb-1 ${cabinTextColorClasses[currentCabinName]}`}
                                >
                                  {currentCabinName}:
                                </h4>
                              )}
                              <div
                                className={`mt-2 mb-1 pl-2 flex ${cabinBorderColorClasses[currentCabinName]} border-l-2`}
                              >
                                {isYourBooking || userIsAdmin ? (
                                  <>
                                    <div className="flex flex-col">
                                      <div className="flex-row justify-between items-center space-x-2">
                                        <span style={{ fontStyle: booking.isPending ? 'italic' : 'normal' }}>
                                          {isYourBooking
                                            ? `Du ${booking.isPending ? 'ønsker' : 'har'} hytten fra ${formattedStartDate} til ${formattedEndDate}.`
                                            : `${booking.employeeName} har hytten fra ${formattedStartDate} til ${formattedEndDate}.`}
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleEditBooking(booking.id)
                                          }
                                          className="bg-yellow-hotel text-white px-2 py-0.5 rounded-md"
                                        >
                                          Rediger
                                        </button>
                                        <button
                                          onClick={() =>
                                            openDeleteModal(booking)
                                          }
                                          className="bg-red-not-available text-white px-2 py-0.5 rounded-md"
                                        >
                                          Slett
                                        </button>
                                        <Modal
                                          isOpen={deleteModalIsOpen}
                                          onRequestClose={closeModal}
                                          contentLabel="Delete Confirmation"
                                          style={customModalStyles}
                                        >
                                          <p className="mb-3">
                                            Er du sikker på at du vil slette {booking.isPending ? 'den ønskede ':''}
                                            reservasjonen?
                                          </p>
                                          <div className="flex justify-end">
                                            <button
                                              onClick={confirmDelete}
                                              className="ml-3 bg-red-500 text-white px-2 py-0.5 rounded-md"
                                            >
                                              Slett reservasjon
                                            </button>
                                            <button
                                              onClick={closeDeleteModal}
                                              className="ml-3 bg-gray-300 text-black-nav px-2 py-0.5 rounded-md"
                                            >
                                              Avbryt
                                            </button>
                                          </div>
                                        </Modal>
                                      </div>
                                      {showEditFormForBooking===booking.id && cutOffDateVacancies!=null && (
                                        <EditBooking
                                          booking={booking}
                                          closeModal={closeModal}
                                          refreshVacancies={refreshVacancies}
                                          userIsAdmin={userIsAdmin}
                                          cutOffDateVacancies={cutOffDateVacancies}
                                          apartments={apartments}
                                        />
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {!booking.isPending && (
                                      <span>
                                        {booking.employeeName} har fra{' '}
                                        {formattedStartDate} til{' '}
                                        {formattedEndDate}.
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : null}
                  {vacantApartmentsOnDay.length !== 0 ? (
                    <h3 className="mt-3 mb-1">Ledige hytter:</h3>
                  ) : null}
                  {vacantApartmentsOnDay
                    .sort(
                      (a, b) =>
                        cabinOrder.indexOf(a.cabin_name) -
                        cabinOrder.indexOf(b.cabin_name),
                    )
                    .map((apartment, index) => (
                      <div key={index}>
                        <div
                          className={`mt-1 mb-1 ${
                            cabinBorderColorClasses[apartment.cabin_name]
                          } pl-2 border-l-2 `}
                        >
                          <span className="apartment-text">
                            {apartment.cabin_name}
                          </span>
                          <button
                            onClick={() => handleBookClick(apartment.id)}
                            className="mt-2 ml-2 bg-orange-500 text-white px-1.5 py-0.5 rounded-md"
                          >
                            Reserver
                          </button>
                        </div>
                        {expandedApartments.includes(apartment.id) && cutOffDateVacancies!=null && (
                          <div className="expanded-content">
                            <CreateBookingPost
                              apartmentId={apartment.id}
                              date={date}
                              closeModal={closeModal}
                              refreshVacancies={refreshVacancies}
                              userIsAdmin={userIsAdmin}
                              allUsersNames={allUsersNames}
                              cutOffDateVacancies={cutOffDateVacancies}
                              vacancies={vacancies}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div>
                  <p>Ingen valgt dato</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="mt-3 bg-blue-small-appartment text-white px-2 py-1 rounded-md"
                >
                  Lukk
                </button>
              </div>
            </TabsContent>
            <TabsContent value="trekning">
              {pendingBookingsOnDay.length !== 0 ? (
                <h3 className="mt-3 mb-1">Meldt interesse:</h3>
              ) : null}
              {pendingBookingsOnDay
                .sort(
                  (a, b) =>
                    cabinOrder.indexOf(a.apartment.cabin_name) -
                    cabinOrder.indexOf(b.apartment.cabin_name),
                )
                .map((pendingBooking, index) => (
                  <div key={index}>
                    <div
                      className={`mt-1 mb-1 ${
                        cabinPendingBorderColorClasses[
                          pendingBooking.apartment.cabin_name
                        ]
                      } pl-2 border-l-2 `}
                    >
                      <span className="pendingBooking-text">
                        {pendingBooking.employeeName} har meldt interesse for{' '}
                        {pendingBooking.apartment.cabin_name} i perioden{' '}
                        {format(
                          new Date(pendingBooking.startDate),
                          'dd.MM.yyyy',
                        )}{' '}
                        til{' '}
                        {format(new Date(pendingBooking.endDate), 'dd.MM.yyyy')}
                        .
                        {userIsAdmin && (
                          <div>
                            <button
                              onClick={() =>
                                openPendingBookingDeleteModal(pendingBooking.id)
                              }
                              className="mt-2 ml-2 bg-red-not-available text-white px-1.5 py-0.5 rounded-md"
                            >
                              Slett
                            </button>
                            <Modal
                              isOpen={pendingBookingDeleteModalIsOpen}
                              onRequestClose={closeModal}
                              contentLabel="Delete Confirmation"
                              style={customModalStyles}
                            >
                              <p className="mb-3">
                                Er du sikker på at du vil slette den ønskede
                                reservasjonen?
                              </p>
                              <div className="flex justify-end">
                                <button
                                  onClick={confirmPendingBookingDelete}
                                  className="ml-3 bg-red-500 text-white px-2 py-0.5 rounded-md"
                                >
                                  Slett ønsket reservasjon
                                </button>
                                <button
                                  onClick={closePendingBookingDeleteModal}
                                  className="ml-3 bg-gray-300 text-black-nav px-2 py-0.5 rounded-md"
                                >
                                  Avbryt
                                </button>
                              </div>
                            </Modal>
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              {drawingPeriodListOnDay.length !== 0 ? (
                <h3 className="mt-3 mb-1">Trekning:</h3>
              ) : (
                <p>Det er ingen som har meldt interesse for denne datoen.</p>
              )}
              {drawingPeriodListOnDay.map((drawingPeriod, index) => (
                <div key={index}>
                  <div
                      className={`mt-1 mb-1 ${
                          cabinPendingBorderColorClasses[
                              drawingPeriod.pendingBookings[0].apartment.cabin_name
                              ]
                      } pl-2 border-l-2 `}
                  >
                    <span>
                      {formatDrawing(drawingPeriod)}
                      <br/>
                      Involverte er:{' '}
                      {drawingPeriod.pendingBookings.map(
                          (pendingBooking, bookingIndex) => (
                              <span key={bookingIndex}>
                            {pendingBooking.employeeName}
                                {bookingIndex !==
                                    drawingPeriod.pendingBookings.length - 1 && ', '}
                          </span>
                          ),
                      )}
                    </span>

                    {pendingBookingList[index] && userIsAdmin && (
                        <ConvertPendingBooking
                            pendingBookingList={pendingBookingList[index]}
                            closeModal={closeModal}
                            refreshVacancies={refreshVacancies}
                            userIsAdmin={userIsAdmin}
                        />
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="mt-3 bg-blue-small-appartment text-white px-2 py-1 rounded-md"
                >
                  Lukk
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Modal>
    </div>
  )
}
