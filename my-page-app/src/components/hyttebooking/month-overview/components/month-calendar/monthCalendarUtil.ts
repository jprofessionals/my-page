import {CalendarDay} from "react-day-picker";
import {Booking, CabinType, InfoBooking, PendingBookingTrain} from "@/types";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import {format, isAfter, isBefore} from 'date-fns';

export const getBookingsOnDayAndCabin = (day: CalendarDay, cabinName: CabinType, bookings: Booking[]): Booking[] => {
    const dateString = format(day.date, dateFormat);
    return bookings.filter((booking: Booking) => (
        dateString >= booking?.startDate &&
        dateString <= booking?.endDate &&
        cabinName === booking?.apartment.cabin_name
    )).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
};

export const getFirstBookingTrainOnDayAndCabin = (day: CalendarDay, cabinName: CabinType, trains: PendingBookingTrain[]): PendingBookingTrain | undefined => {
    const dateString = format(day.date, dateFormat);
    const trainsOnDay = trains.filter((train: PendingBookingTrain) => {
        return dateString >= train.startDate &&
            dateString <= train.endDate &&
        cabinName === train?.apartment.cabin_name
    });
    return trainsOnDay.length > 0 ? trainsOnDay[0] : undefined;
};

export const getInfoNoticesOnDay = (day: CalendarDay, infoNotices: InfoBooking[]) => infoNotices.filter(
    (infoNotice) => {
        return !isBefore(day.date, infoNotice.startDate) && !isAfter(day.date, infoNotice.endDate);
    }) || [];
