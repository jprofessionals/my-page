import React, {useCallback, useEffect, useState} from 'react'
import {MonthCalendar} from './components/month-calendar/monthCalendar'
import ApiService from '@/services/api.service'
import {
    Apartment,
    Booking,
    CabinColorClasses,
    DrawingPeriod,
    InfoBooking,
    LoadingStatus,
    User,
    VacancyKeys
} from '@/types'
import {toast} from 'react-toastify'
import {useAuthContext} from '@/providers/AuthProvider'
import {add, format, isBefore, sub} from 'date-fns'
import {useMutation, useQuery, useQueryClient} from 'react-query'
import CreateBookingPost from '@/components/hyttebooking/CreateBookingPost'
import ConvertPendingBooking from '@/components/hyttebooking/ConvertPendingBooking'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import CreateInfoNotice from '@/components/hyttebooking/CreateInfoNotice'
import getSetting from '@/utils/getSetting'
import MonthOverviewModal from "./components/MonthOverviewModal";
import DeletePendingBooking from "./components/DeletePendingBooking";
import DrawPeriod from "./components/DrawPeriod";
import {
    dateFormat,
    getInfoNotices,
    getInfoNoticeVacancyOnGivenDay,
    getPendingBookingDaysFrom,
    getPendingBookingTrainsOnDay,
    getPendingDrawingPeriodDaysFrom,
    getVacantApartmentsOnDay,
    sortBookingItems,
    sortPendingBookings,
    sortVacantApartment
} from "./monthOverviewUtils";
import BookingItem from "@/components/hyttebooking/month-overview/components/BookingItem";
import InfoNoticeItem from "@/components/hyttebooking/month-overview/components/InfoNoticeItem";
import PendingBookingText from "@/components/hyttebooking/month-overview/components/PendingBookingText";
import InvolvedText from "@/components/hyttebooking/month-overview/components/InvolvedText";
import MonthOverviewButton from "@/components/hyttebooking/month-overview/components/MonthOverviewButton";

export default function MonthOverview() {
    const queryClient = useQueryClient();
    const {userFetchStatus, settings} = useAuthContext();
    const [date, setDate] = useState<Date | undefined>();
    const [showModal, setShowModal] = useState(false);
    const [bookingItems, setBookingItems] = useState<Booking[]>([]);
    const [expandedApartments, setExpandedApartments] = useState<number[]>([]);
    const [user, setUser] = useState<User>(null);
    const [infoNotices, setInfoNotices] = useState<InfoBooking[]>([]);
    const [pendingBookingDeleteModalIsOpen, setPendingBookingDeleteModalIsOpen] = useState(false);
    const [pendingBookingIdToDelete, setPendingBookingIdToDelete] = useState<number | null>(null);
    const [showEditFormForInfoNotice, setShowEditFormForInfoNoticeId] = useState<number | null>(null);
    const [cutOffDateVacancies, setCutOffDateVacancies] = useState<string | undefined>(getSetting(settings, 'CUTOFF_DATE_VACANCIES'))
    const [vacancyLoadingStatus, setVacancyLoadingStatus] = useState<LoadingStatus>(LoadingStatus.init);
    const [vacancies, setVacancies] = useState<VacancyKeys>({});
    const [vacantApartmentsOnDay, setVacantApartmentsOnDay] = useState<Apartment[]>([]);
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [infoNoticeVacancyLoadingStatus, setInfoNoticeVacancyLoadingStatus] = useState<LoadingStatus>(LoadingStatus.init);
    const [infoNoticeVacancies, setInfoNoticeVacancies] = useState<string[] | undefined>([]);
    const [pendingBookingsOnDay, setPendingBookingsOnDay] = useState<Booking[]>([]);
    const [pendingBookingList, setPendingBookingList] = useState<Booking[][]>([]);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [drawingPeriodListOnDay, setDrawingPeriodListOnDay] = useState<DrawingPeriod[]>([]);
    const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
    const [showEditFormForBooking, setShowEditFormForBookingId] = useState<number | null>(null);
    const [infoNoticeDeleteModalIsOpen, setInfoNoticeDeleteModalIsOpen] = useState(false);
    const [infoNoticeIdToDelete, setInfoNoticeIdToDelete] = useState<number | null>(null);
    const [showCreateFormForInfoNotice, setShowCreateFormForInfoNotice] = useState<boolean>(false);
    const [prevSettings, setPrevSettings] = useState(settings);
    const [isDayVacantForInfoNotice, setIsDayVacantForInfoNotice] = useState(false);
    const [allUsersNames, setAllUsersNames] = useState<string[]>([]);
    const startDateVacancies = format(new Date(), dateFormat);
    const startDateBookings = format(sub(new Date(), {months: 6, days: 7}), dateFormat);
    const endDateBookings = format(add(new Date(), {months: 12, days: 7}), dateFormat);

    const cabinBorderColorClasses: CabinColorClasses = {
        'Stor leilighet': 'border-orange-brand',
        'Liten leilighet': 'border-blue-small-appartment',
        'Annekset': 'border-teal-annex',
    };

    const cabinPendingBorderColorClasses: CabinColorClasses = {
        'Stor leilighet': 'border-yellow-200',
        'Liten leilighet': 'border-purple-200',
        'Annekset': 'border-green-200',
    };


    const {data: yourBookings} = useQuery<Booking[]>('yourBookingsOutline', async () => {
        const yourBookings: Booking[] = await ApiService.getBookingsForUser();
        return yourBookings;
    })

    const {
        data: yourPendingBookings,
        refetch: refetchYourPendingBookings
    } = useQuery<Booking[]>('yourPendingBookingsOutline', async () => {
        const yourPendingBookings: Booking[] = await ApiService.getPendingBookingsForUser();
        return yourPendingBookings;
    })

    const {data: bookings} = useQuery<Booking[]>('bookings', async () => {
        const fetchedBookings: Booking[] = await ApiService.getBookings(startDateBookings, endDateBookings);
        return fetchedBookings;
    })

    const {data: allInfoNotices} = useQuery<InfoBooking[]>('infoNotices', async () => {
        const fetchedInfoNotices: InfoBooking[] = await ApiService.getInfoNotices(startDateBookings, endDateBookings);
        return fetchedInfoNotices;
    });

    const {
        data: allPendingBookingTrains,
        refetch: refetchPendingBookings
    } = useQuery('allPendingBookingsAllApartments', async () => {
        return await ApiService.getAllPendingBookingTrainsForAllApartments()
    });

    const refreshInfoNoticeVacancies = useCallback(async () => {
        try {
            setInfoNoticeVacancyLoadingStatus(LoadingStatus.loading);
            const loadedInfoNoticeVacancies = await ApiService.getAllInfoNoticeVacancies(startDateBookings, endDateBookings);
            setInfoNoticeVacancyLoadingStatus(LoadingStatus.completed);
            setInfoNoticeVacancies(loadedInfoNoticeVacancies);
        } catch (e) {
            setInfoNoticeVacancyLoadingStatus(LoadingStatus.failed);
            toast.error('Klarte ikke laste dager ledige for informasjonsnotiser, prøv igjen senere');
        }
    }, []);

    const refreshVacancies = useCallback(async () => {
        try {
            if (cutOffDateVacancies != null) {
                setVacancyLoadingStatus(LoadingStatus.loading);
                const loadedVacancies = await ApiService.getAllVacancies(startDateVacancies, cutOffDateVacancies);
                await refetchPendingBookings();
                await refetchYourPendingBookings();
                setVacancyLoadingStatus(LoadingStatus.completed);
                setVacancies(loadedVacancies);
            }
        } catch (e) {
            setVacancyLoadingStatus(LoadingStatus.failed);
            toast.error('Klarte ikke laste ledige reservasjoner, prøv igjen senere');
        }
    }, [cutOffDateVacancies]);

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        if (vacancyLoadingStatus === LoadingStatus.init && userFetchStatus === 'fetched') {
            refreshVacancies();
            getAllApartments();
        }
    }, [userFetchStatus, vacancyLoadingStatus]);


    useEffect(() => {
        if (infoNoticeVacancyLoadingStatus === LoadingStatus.init && !!user?.admin) {
            fetchAllUsers();
            refreshInfoNoticeVacancies();
        }
    }, [user, infoNoticeVacancyLoadingStatus]);

    useEffect(() => {
        if (settings != prevSettings) {
            setPrevSettings(settings);
            setCutOffDateVacancies(getSetting(settings, 'CUTOFF_DATE_VACANCIES'));
            refreshVacancies();
        }
    }, [settings]);

    const pendingBookingIsOnDay = (date: Date, booking: Booking): boolean => {
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        startDate.setHours(0);
        endDate.setHours(0);
        return startDate <= date && endDate >= date;
    };

    const fetchUser = async () => {
        const response = await ApiService.getUser();
        const user = response.data;
        setAllUsersNames(usersNames);
    };


    const fetchAllUsers = async () => {
        const response = await ApiService.getUsers();
        const usersNames = response.data.map(user => user.name);
        setAllUsersNames(usersNames);
    };

    const openDeleteModal = (booking: Booking | null) => {
        setBookingToDelete(booking);
        setDeleteModalIsOpen(true);
    }

    const confirmDelete = () => {
        const id = bookingToDelete?.id;
        if (bookingToDelete?.isPending) {
            handleDeletePendingBooking(id || null);
        } else {
            user.admin ? adminDeleteBooking.mutate(id) : deleteBooking.mutate(id);
        }
        setDeleteModalIsOpen(false);
    }

    const getUser = async () => {
        try {
            const response = await ApiService.getUser();
            const user = response.data;
            setUser(user);
        } catch (e) {
            toast.error("Kunne ikke hente bruker");
        }
    }

    const deleteBookingByBookingId = async (bookingId: number | null) => {
        try {
            await ApiService.deleteBooking(bookingId);
            toast.success('Reservasjonen din er slettet');
            closeModal();
        } catch (error) {
            toast.error(`Reservasjonen din ble ikke slettet med følgende feil: ${error}`);
        }
    };

    const adminDeleteBookingByBookingId = async (bookingId: number | null) => {
        try {
            await ApiService.adminDeleteBooking(bookingId);
            toast.success('Bookingen er slettet');
            closeModal();
        } catch (error) {
            toast.error(`Bookingen ble ikke slettet med følgende feil: ${error}`);
        }
    };

    const deletePendingBookingById = async (pendingBookingId: number | null) => {
        try {
            if (user.admin) {
                await ApiService.adminDeletePendingBooking(pendingBookingId);
            } else {
                await ApiService.deletePendingBooking(pendingBookingId);
            }
            toast.success('Ønsket reservasjon er slettet');
            closeModal();
        } catch (error) {
            toast.error(`Ønsket reservasjon ble ikke slettet med følgende feil: ${error}`);
        }
    };

    const deleteBooking = useMutation(deleteBookingByBookingId, {
        onSuccess: () => {
            queryClient.invalidateQueries('bookings');
            refreshVacancies();
        },
        onError: (error) => {
            console.error('Error:', error);
        },
    });

    const adminDeleteBooking = useMutation(adminDeleteBookingByBookingId, {
        onSuccess: () => {
            queryClient.invalidateQueries('bookings');
            refreshVacancies();
        },
        onError: (error) => {
            console.error('Error:', error);
        },
    });

    const deletePendingBooking = useMutation(deletePendingBookingById, {
        onSuccess: () => {
            queryClient.invalidateQueries('allPendingBookingsAllApartments');
        },
        onError: (error) => {
            console.error('Error:', error);
        },
    });

    const handleOpenPendingBookingDeleteModal = (pendingBooking: number | null) => {
        setPendingBookingIdToDelete(pendingBooking);
        setPendingBookingDeleteModalIsOpen(true);
    }

    const handleClosePendingBookingDeleteModal = () => {
        setPendingBookingDeleteModalIsOpen(false);
    }

    const handleConfirmPendingBookingDelete = () => {
        handleDeletePendingBooking(pendingBookingIdToDelete);
        handleClosePendingBookingDeleteModal();
    }

    const getBookings = (date: string): Booking[] => {
        const all = bookings as Booking[] || [];
        return all.filter((booking: Booking) => date >= booking.startDate && date <= booking.endDate) || [];
    }

    const getBookingsOnDay = (date: Date) => {
        const dateString = format(date, dateFormat);
        const bookingsOnDay = getBookings(dateString);
        if (yourPendingBookings) {
            bookingsOnDay.push(...yourPendingBookings.filter(pb => pendingBookingIsOnDay(date, pb) &&
                !bookingsOnDay.some(book => book.apartment.id == pb.apartment.id)));
        }
        setBookingItems(bookingsOnDay)
    };

    const getInfoNoticesOnDay = (date: Date) => {
        const all = allInfoNotices as InfoBooking[] || [];
        const infoNoticesOnDay = all.filter((infoNotice) => date >= infoNotice.startDate && date <= infoNotice.endDate) || [];
        setInfoNotices(infoNoticesOnDay);
    };

    const closeModal = () => {
        setShowModal(false);
        setDate(undefined);
        setShowEditFormForBookingId(null);
        setExpandedApartments([]);
        setDeleteModalIsOpen(false);
        setShowCreateFormForInfoNotice(false);
        setInfoNoticeDeleteModalIsOpen(false);
        setShowEditFormForInfoNoticeId(null);
        setIsDayVacantForInfoNotice(false);
        setPendingBookingDeleteModalIsOpen(false);
    };

    const deleteInfoNoticeByNoticeId = async (infoNoticeId: number | null) => {
        try {
            await ApiService.deleteInfoNotice(infoNoticeId);
            toast.success('Informasjonsnotisen er slettet');
            closeModal();
        } catch (error) {
            toast.error(`Informasjonsnotisen ble ikke slettet med følgende feil: ${error}`);
        }
    };

    const deleteInfoNotice = useMutation(deleteInfoNoticeByNoticeId, {
        onSuccess: () => {
            queryClient.invalidateQueries('infoNotices');
            refreshInfoNoticeVacancies();
        },
        onError: (error) => {
            console.error('Error:', error);
        },
    });

    const getAllApartments = async () => {
        const response = await ApiService.getAllApartments();
        setApartments(response);
    };

    const getVacancyForDay = async (selectedDate: Date) => {
        const vacantApartmentsOnDay: Apartment[] = getVacantApartmentsOnDay(
            selectedDate,
            vacancies,
            cutOffDateVacancies,
            dateFormat,
            apartments,
            !!user?.admin,
            yourPendingBookings
        );
        setVacantApartmentsOnDay(vacantApartmentsOnDay);
        return vacantApartmentsOnDay;
    };

    const getPendingBookingsOnDay = (selectedDate: Date) => {
        const pendingBookingsOnDayList = getPendingBookingDaysFrom(selectedDate, allPendingBookingTrains);
        setPendingBookingsOnDay(pendingBookingsOnDayList);
        return pendingBookingsOnDayList;
    };

    const getDrawingPeriodsOnDay = (selectedDate: Date) => {
        const drawingPeriodsOnDayList = getPendingDrawingPeriodDaysFrom(selectedDate, allPendingBookingTrains);
        setDrawingPeriodListOnDay(drawingPeriodsOnDayList);
        return drawingPeriodsOnDayList;
    };

    const getPendBookingListFromDrawPeriod = (selectedDate: Date) => {
        const drawingPeriodsOnDay = getDrawingPeriodsOnDay(selectedDate);
        const pendingBookings = drawingPeriodsOnDay.map(pendingBooking => ((pendingBooking.valueOf()) as DrawingPeriod).pendingBookings);
        setPendingBookingList(pendingBookings);
        return pendingBookings;
    }

    const getInfoNoticeVacancyOnDay = (selectedDate: Date) => {
        const vacant = getInfoNoticeVacancyOnGivenDay(selectedDate, infoNoticeVacancies);
        setIsDayVacantForInfoNotice(vacant);
        return vacant;
    };

    const handleDateClick = (date: Date) => {
        setDate(date);
        setShowModal(true);
        getVacancyForDay(date);
        getBookingsOnDay(date);
        getPendingBookingsOnDay(date);
        getDrawingPeriodsOnDay(date);
        getPendBookingListFromDrawPeriod(date);
        getInfoNoticesOnDay(date);
        getInfoNoticeVacancyOnDay(date);
    }

    const handleDeletePendingBooking = (pendingBookingId: number | null) => {
        deletePendingBooking.mutate(pendingBookingId);
    };

    const handleEditBooking = (bookingId: number) => {
        const id = showEditFormForBooking !== bookingId ? bookingId : null;
        setShowEditFormForBookingId(id);
    };

    const handleBookClick = (apartmentId: number) => {
        setExpandedApartments((prevExpandedApartments) =>
            prevExpandedApartments.includes(apartmentId) ?
                prevExpandedApartments.filter((id) => id !== apartmentId) :
                [...prevExpandedApartments, apartmentId])
    };

    const handleAddInfoNoticeClick = () => {
        setShowCreateFormForInfoNotice(!showCreateFormForInfoNotice);
    };

    const handleOpenInfoNoticeDeleteModal = (infoNotice: number | null) => {
        setInfoNoticeIdToDelete(infoNotice);
        setInfoNoticeDeleteModalIsOpen(true);
    };

    const handleCloseInfoNoticeDeleteModal = () => {
        setInfoNoticeDeleteModalIsOpen(false);
    };

    const handleConfirmInfoNoticeDelete = () => {
        handleDeleteNotice(infoNoticeIdToDelete);
        handleCloseInfoNoticeDeleteModal();
    };

    const handleDeleteNotice = (infoNoticeId: number | null) => {
        deleteInfoNotice.mutate(infoNoticeId);
    };

    const handleEditInfoNotice = (infoNoticeId: number) => {
        const id = showEditFormForInfoNotice !== infoNoticeId ? infoNoticeId : null;
        setShowEditFormForInfoNoticeId(id);
    };

    return (
        <div className="flex flex-col overflow-hidden gap-4 p-4">
            {cutOffDateVacancies == null ? "Fant ikke innstilling for siste reserverbare dato" : (
                <div>
                <MonthCalendar
                    bookings={
                        (bookings as Booking[] || [])
                        .concat(pendingBookingList)
                        .concat(yourPendingBookings)
                        .concat(allPendingBookingTrains)}
                    infoNotices={infoNotices}
                    user={user}
                />
                </div>
            )}

            <MonthOverviewModal open={showModal} onClose={closeModal} label="Selected Date">
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
                            {date && (
                                <div>
                                    <h3 className="mt-1 mb-1">{format(date!, dateFormat)}</h3>

                                    {cutOffDateVacancies != null && isBefore(date!, new Date(cutOffDateVacancies)) ? null : (
                                        <p> Denne dagen er ikke åpnet for reservasjon enda.</p>
                                    )}

                                    {infoNotices.length > 0 ? (
                                        <div>
                                            <h3 className="mt-3 mb-1">Informasjon for dagen:</h3>

                                            {infoNotices.map((infoNotice, index) => (
                                                <InfoNoticeItem
                                                    key={infoBooking.id}
                                                    infoNoticeIndex={index}
                                                    infoNotice={infoNotice}
                                                    admin={!!user?.admin}
                                                    isDayVacantForInfoNotice={isDayVacantForInfoNotice}
                                                    onCloseModal={closeModal}
                                                    onRefreshNoticeVacancies={refreshInfoNoticeVacancies}
                                                    infoNoticeDeleteModalIsOpen={infoNoticeDeleteModalIsOpen}
                                                    infoNoticeVacancies={infoNoticeVacancies}
                                                    onAddInfoNoticeClick={handleAddInfoNoticeClick}
                                                    onCloseInfoNoticeDeleteModal={handleCloseInfoNoticeDeleteModal}
                                                    onConfirmInfoNoticeDelete={handleConfirmInfoNoticeDelete}
                                                    onEditInfoNotice={handleEditInfoNotice}
                                                    onInfoNoticeDeleteModal={handleOpenInfoNoticeDeleteModal}
                                                    date={date}
                                                    showCreateFormForInfoNotice={showCreateFormForInfoNotice}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        !!user?.admin && (
                                            <div>
                                                <h3 className="mt-3 mb-1">Informasjon for dagen:</h3>
                                                <div>
                                                    {' '}Legg til en informasjonsnotis
                                                    <MonthOverviewButton
                                                        onClick={() => handleAddInfoNoticeClick()}
                                                        variant={"blue"}
                                                        title={"Legg til"}
                                                    />
                                                    {showCreateFormForInfoNotice && (
                                                        <CreateInfoNotice
                                                            date={date}
                                                            closeModal={closeModal}
                                                            userIsAdmin={!!user?.admin}
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

                                    {bookingItems.length === 0 ? (
                                        <div>
                                            <p>Ingen valgt dato</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {sortBookingItems(bookingItems).map((booking, index) => (
                                                <BookingItem
                                                    key={booking.id}
                                                    booking={booking}
                                                    yourBookings={yourBookings as Booking[]}
                                                    bookingItems={bookingItems}
                                                    bookingItemsIndex={index}
                                                    admin={!!user?.admin}
                                                    onEditBooking={handleEditBooking}
                                                    onOpenDeleteModal={() => openDeleteModal(booking)}
                                                    onCloseModal={closeModal}
                                                    onConfirmDelete={confirmDelete}
                                                    deleteModalIsOpen={deleteModalIsOpen}
                                                    showEditFormForBooking={showEditFormForBooking}
                                                    apartments={apartments}
                                                    cutOffDateVacancies={cutOffDateVacancies}
                                                    onRefreshVacancies={refreshVacancies}
                                                />
                                            ))}

                                            {vacantApartmentsOnDay.length !== 0 && (
                                                <h3 className="mt-3 mb-1">Ledige hytter:</h3>
                                            )}

                                            {sortVacantApartment(vacantApartmentsOnDay).map((apartment, index) => (
                                                    <div key={index}>
                                                        <div
                                                            className={`mt-1 mb-1 ${cabinBorderColorClasses[apartment.cabin_name]} pl-2 border-l-2 `}>
                                                            <span className="apartment-text">
                                                                {apartment.cabin_name}
                                                            </span>

                                                            <MonthOverviewButton
                                                                onClick={() => handleBookClick(apartment.id)}
                                                                variant={"orange"}
                                                                title={"Reserver"}
                                                            />
                                                        </div>

                                                        {expandedApartments.includes(apartment.id) && cutOffDateVacancies != null && (
                                                            <div className="expanded-content">
                                                                <CreateBookingPost
                                                                    apartmentId={apartment.id}
                                                                    date={date}
                                                                    closeModal={closeModal}
                                                                    refreshVacancies={refreshVacancies}
                                                                    userIsAdmin={!!user?.admin}
                                                                    allUsersNames={allUsersNames}
                                                                    cutOffDateVacancies={cutOffDateVacancies}
                                                                    vacancies={vacancies}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <MonthOverviewButton
                                            onClick={closeModal}
                                            variant={"blue_small"}
                                            title={"Lukk"}
                                        />
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="trekning">
                            {pendingBookingsOnDay.length !== 0 && (
                                <h3 className="mt-3 mb-1">Meldt interesse:</h3>
                            )}

                            {sortPendingBookings(pendingBookingsOnDay).map((pendingBooking, index) => (
                                    <div key={index}>
                                        <div
                                            className={`mt-1 mb-1 ${
                                                cabinPendingBorderColorClasses[
                                                    pendingBooking.apartment.cabin_name
                                                    ]
                                            } pl-2 border-l-2 `}
                                        >
                                          <span className="pendingBooking-text">
                                              <PendingBookingText
                                                  pendingBooking={pendingBooking}
                                              />

                                              <DeletePendingBooking
                                                  open={pendingBookingDeleteModalIsOpen}
                                                  onClose={handleClosePendingBookingDeleteModal}
                                                  onOpenConfirm={() => handleOpenPendingBookingDeleteModal(pendingBooking.id)}
                                                  onConfirmDelete={handleConfirmPendingBookingDelete}
                                                  admin={!!user?.admin}
                                              />
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
                                        className={`mt-1 mb-1 ${cabinPendingBorderColorClasses[drawingPeriod.pendingBookings[0].apartment.cabin_name]} pl-2 border-l-2 `}>
                                        <span>
                                            <DrawPeriod drawingPeriod={drawingPeriod} dateFormat={dateFormat}/>
                                            <br/>
                                            <InvolvedText drawingPeriod={drawingPeriod}/>
                                        </span>

                                        {pendingBookingList[index] && !!user?.admin && (
                                            <ConvertPendingBooking
                                                pendingBookingList={pendingBookingList[index]}
                                                closeModal={closeModal}
                                                refreshVacancies={refreshVacancies}
                                                userIsAdmin={!!user?.admin}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end">
                                <MonthOverviewButton
                                    onClick={closeModal}
                                    variant={"blue_small"}
                                    title={"Lukk"}
                                />
                            </div>

                        </TabsContent>
                    </Tabs>
                </div>
            </MonthOverviewModal>
        </div>
    )
}
