import {InfoBooking, PendingBookingTrain} from "@/types";
import {
    isSameDay,
    isWithinInterval,
} from 'date-fns';
import {CalendarDay} from "react-day-picker";

export const getInfoNoticeDateInfo = (date: Date, infoNotice: InfoBooking) => {
    const isFirstDay = isSameDay(new Date(date), new Date(infoNotice.startDate))
    const isLastDay = isSameDay(new Date(date), new Date(infoNotice.endDate))
    const isInInterval =
        isWithinInterval(new Date(date), {
            start: new Date(infoNotice.startDate),
            end: new Date(infoNotice.endDate),
        }) &&
        !isFirstDay &&
        !isLastDay
    return { isFirstDay, isLastDay, isInInterval }
};

export const getPendingBookingDateInfo = (
    date: Date,
    pendingBookingTrain: PendingBookingTrain,
) => {
    const isFirstDay = isSameDay(
        new Date(date),
        new Date(pendingBookingTrain.startDate),
    )
    const isLastDay = isSameDay(
        new Date(date),
        new Date(pendingBookingTrain.endDate),
    )
    const isInInterval =
        isWithinInterval(new Date(date), {
            start: new Date(pendingBookingTrain.startDate),
            end: new Date(pendingBookingTrain.endDate),
        }) &&
        !isFirstDay &&
        !isLastDay
    return { isFirstDay, isLastDay, isInInterval }
};

export const getInitials = (name: string, windowWidth: number): string => {
    if (!name) {
        return ''
    }
    const nameParts = name.split(' ')
    const initials = nameParts.map((part) => part[0].toUpperCase()).join('')
    if (windowWidth >= 800) {
        return initials
    } else {
        return ''
    }
};

export const getIsToday = (day: CalendarDay): boolean => {
    const dayDate = day.date;
    const todayDate = new Date();
    return dayDate.getFullYear() === todayDate.getFullYear() &&
        dayDate.getMonth() === todayDate.getMonth() &&
        dayDate.getDate() === todayDate.getDate();
};

export const getIsDayOfWeek = (day: CalendarDay): number => {
    return day.date.getDay();
}