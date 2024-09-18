import {CalendarDay} from "react-day-picker";
import {Booking, CabinType, InfoBooking} from "@/types";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import {format} from 'date-fns';



export const getBookingsOnDayAndCabin = (day: CalendarDay, cabinName: CabinType, bookings: Booking[]): Booking[] => {
    const dateString = format(day.date, dateFormat);
    return bookings.filter((booking: Booking) => (
        dateString >= booking?.startDate &&
        dateString <= booking?.endDate &&
        cabinName === booking?.apartment.cabin_name
    )).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));
};

export const getInfoNoticesOnDay = (day: CalendarDay, infoNotices: InfoBooking[]) => infoNotices.filter(
    (infoNotice) => day.date >= infoNotice.startDate && day.date <= infoNotice.endDate) || [];
