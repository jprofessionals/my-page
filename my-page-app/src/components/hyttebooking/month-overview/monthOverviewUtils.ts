import { isAfter, isBefore, sub} from 'date-fns'
import {format, } from 'date-fns';
import {Apartment, Booking, CabinType, InfoBooking, PendingBookingTrain, VacancyKeys} from "@/types";


export const dateFormat = 'yyyy-MM-dd';

export const cabinOrder = [
    CabinType.stor_leilighet.valueOf(),
    CabinType.liten_leilighet.valueOf(),
    CabinType.annekset.valueOf()
];

 const getVacantApartments = (selectedDate: Date, vacancies: VacancyKeys, cutOffDateVacancies: string | undefined, dateFormat: string) => {
    const vacantApartments: number[] = [];
    const apartmentsInVacancies = Object.keys(vacancies!);
    const formattedDate = format(selectedDate, dateFormat);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1);
    const formattedNextDate = format(nextDate, dateFormat);
    const previousDate = new Date(selectedDate);
    previousDate.setDate(selectedDate.getDate() - 1);
    const formattedPreviousDate = format(previousDate, dateFormat);

    if (
        cutOffDateVacancies != null &&
        isBefore(selectedDate, new Date(cutOffDateVacancies)) &&
        isAfter(selectedDate, sub(new Date(), {days: 1}))
    ) {
        for (const apartment of apartmentsInVacancies) {
            const dates = vacancies![Number(apartment)];

            if (
                dates.includes(formattedDate) ||
                dates.includes(formattedNextDate) ||
                dates.includes(formattedPreviousDate)
            ) {
                vacantApartments.push(Number(apartment));
            }
        }
    }
    return vacantApartments
};


export const getVacantApartmentsOnDay = (
    selectedDate: Date,
    vacancies: VacancyKeys,
    cutOffDateVacancies: string | undefined,
    dateFormat: string,
    apartments: Apartment[],
    userIsAdmin: boolean,
    yourPendingBookings: any,
): Apartment[] => {
    const availableApartments: Apartment[] = [];
    const vacantApartmentsInPeriod = getVacantApartments(selectedDate, vacancies, cutOffDateVacancies, dateFormat);

    const pendingBookingIsOnDay = (date: Date, booking: Booking): boolean => {
        const startDate = new Date(booking.startDate)
        startDate.setHours(0)
        const endDate = new Date(booking.endDate)
        endDate.setHours(0)
        return startDate <= date && endDate >= date;
    };

    for (const apartment of apartments) {
        if (vacantApartmentsInPeriod.includes(apartment.id!) && (
            userIsAdmin ||
            !yourPendingBookings?.some(pb => pb.apartment.id == apartment.id && pendingBookingIsOnDay(selectedDate, pb)))) {
            availableApartments.push(apartment)
        }
    }

    return availableApartments;
};

export const getPendingBookingTrainsOnDay = (date: string, allPendingBookingTrains: Booking[]): PendingBookingTrain[] => {
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

    return allPendingBookingTrainsAllApartments.filter((pendingBookingTrain) => {
            const startDate = new Date(pendingBookingTrain.startDate)
            const endDate = new Date(pendingBookingTrain.endDate)
            startDate.setHours(0, 0, 0, 0)
            endDate.setHours(0, 0, 0, 0)
            return currentDate >= startDate && currentDate <= endDate
        }) || [];
};


export const getInfoNotices = (date: string, allInfoNotices: InfoBooking[]):InfoBooking[] => {
    return (
        allInfoNotices?.filter(
            (infoNotice) =>
                date >= infoNotice.startDate && date <= infoNotice.endDate,
        ) || []
    );
};

export const getInfoNoticeVacancyOnGivenDay = (selectedDate: Date, infoNoticeVacancies: string[] | undefined):boolean => {
    if (isAfter(selectedDate, sub(new Date(), {days: 1}))) {
        const dates = infoNoticeVacancies;
        const nextDate = new Date(selectedDate);
        const previousDate = new Date(selectedDate);
        previousDate.setDate(selectedDate.getDate() - 1);
        nextDate.setDate(selectedDate.getDate() + 1);

        const checkOne = !!dates?.includes(format(selectedDate, dateFormat));
        const checkTwo = !!dates?.includes(format(nextDate, dateFormat));
        const checkThree = !!dates?.includes(format(previousDate, dateFormat));
        return checkOne || checkTwo || checkThree;
    }
    return false;
};


export const getPendingBookingDaysFrom = (selectedDate: Date, allPendingBookingTrains: Booking[]) => {
    const pendingBookingsOnDayArrayOfArray = [];
    const selectedDateString = selectedDate.toString();
    const filteredPendingBookingTrainsAllApartments = getPendingBookingTrainsOnDay(selectedDateString, allPendingBookingTrains);

    for (const pendingBookingTrain of filteredPendingBookingTrainsAllApartments) {
        for (const drawingPeriod of pendingBookingTrain.drawingPeriodList) {
            pendingBookingsOnDayArrayOfArray.push(drawingPeriod.pendingBookings);
        }
    }

    return pendingBookingsOnDayArrayOfArray.flat();
};

export const getPendingDrawingPeriodDaysFrom = (selectedDate: Date, allPendingBookingTrains: Booking[]) => {
    const drawingPeriodsOnDayArrayOfArray = [];
    const selectedDateString = selectedDate.toString();
    const filteredPendingBookingTrainsAllApartments = getPendingBookingTrainsOnDay(selectedDateString, allPendingBookingTrains);

    for (const pendingBookingTrain of filteredPendingBookingTrainsAllApartments) {
        for (const drawingPeriod of pendingBookingTrain.drawingPeriodList) {
            drawingPeriodsOnDayArrayOfArray.push(drawingPeriod);
        }
    }

    return drawingPeriodsOnDayArrayOfArray.flat();
}

export const sortBookingItems = (bookingItems: Booking[] ) => {
    if (bookingItems?.length > 0) {
        return bookingItems.sort((a, b) => {
            const cabinIndexA = cabinOrder.indexOf(a.apartment.cabin_name);
            const cabinIndexB = cabinOrder.indexOf(b.apartment.cabin_name);
            const startDateComparison = Date.parse(a.startDate) - Date.parse(b.startDate);

            if (cabinIndexA !== cabinIndexB) {
                return cabinIndexA - cabinIndexB
            }

            if (startDateComparison !== 0) {
                return startDateComparison
            }

            return Date.parse(a.endDate) - Date.parse(b.endDate)
        });
    }

    return [];
};

export const sortVacantApartment = (apartments: Apartment[]) => {
    apartments
        .sort(
            (a, b) =>
                cabinOrder.indexOf(a.cabin_name) -
                cabinOrder.indexOf(b.cabin_name),
        );
    return apartments;
};

export const sortPendingBookings = (pendingBookings: Booking[]) => {
    pendingBookings.sort(
        (a, b) =>
            cabinOrder.indexOf(a.apartment.cabin_name) -
            cabinOrder.indexOf(b.apartment.cabin_name),
    );
    return pendingBookings;
};


