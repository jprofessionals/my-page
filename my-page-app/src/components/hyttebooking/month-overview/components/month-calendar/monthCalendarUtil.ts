import {CalendarDay} from "react-day-picker";
import {Booking, CabinType, DrawingPeriod, InfoBooking, PendingBookingTrain} from "@/types";
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

export const getDrawingPeriodsOnDayAndCabin = (day: CalendarDay, cabinName: CabinType, trains: PendingBookingTrain[]): DrawingPeriod[] => {
    return trains.filter((train: PendingBookingTrain) => (
        !isBefore(day.date, train.startDate) &&
        !isAfter(day.date, train.endDate) &&
        cabinName === train?.apartment.cabin_name
    )).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))
        .flatMap((train, index) => {
            return index == 0 && !!train ? train.drawingPeriodList : [];
        }).filter(dpl => !isBefore(day.date, dpl.startDate) && !isAfter(day.date, dpl.endDate));
};

export const getInfoNoticesOnDay = (day: CalendarDay, infoNotices: InfoBooking[]) => infoNotices.filter(
    (infoNotice) => {
        return !isBefore(day.date, infoNotice.startDate) && !isAfter(day.date, infoNotice.endDate);
    }) || [];
