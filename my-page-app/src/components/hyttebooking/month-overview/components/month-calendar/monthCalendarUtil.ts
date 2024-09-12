import {InfoBooking, PendingBookingTrain} from "@/types";
import {
    add,
    sub,
    format,
    isMonday,
    isSameDay,
    isSunday,
    isWithinInterval,
    isAfter,
} from 'date-fns';

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