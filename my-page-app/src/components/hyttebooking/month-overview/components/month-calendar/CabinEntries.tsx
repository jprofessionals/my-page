import {Booking, DrawingPeriod, PendingBookingTrain} from "@/types";
import React from "react";
import {cabinOrder} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import cn from "@/utils/cn";
import {get} from "radash";
import {clsx} from "clsx";


type Props = {
    drawingPeriod: DrawingPeriod;
    date
}

const CabinEntries = ({ drawingPeriod, date }: Props) => {


    const renderBookingsAndPendingBookings = (cabin: string) => {
        const cabinBookings = bookingsByCabin[cabin] || [];
        const cabinPendingBookingTrains = pendingBookingsByCabin[cabin] || [];
        const combinedEntries: (Booking | PendingBookingTrain)[] = [...cabinBookings, ...cabinPendingBookingTrains];

        if (combinedEntries.length === 0) {
            return (
                <div key={cabin} className="grid grid-cols-2 gap-3 w-full h-4 md:h-8">
                    {cabinPendingBookingTrains.map((pendingBookingTrain) => (
                        <span
                            key={pendingBookingTrain.id}
                            className={cn(getPendingBookingCabinStyle(date, pendingBookingTrain),
                                isAfter(add(props.date, { days: 1 }), new Date())
                                    ? get(
                                        pendingBookingCabinColors,
                                        pendingBookingTrain.apartment.cabin_name,
                                    )
                                    : get(
                                        pendingBookingCabinColors,
                                        pendingBookingTrain.apartment.cabin_name,
                                    ),
                                'normal-case',
                                'bg-repeat',
                            )}
                        ></span>
                    ))}
                </div>
            )
        }

        return (

            <div
                key={cabin}
                className="grid grid-cols-2 gap-3 w-full h-4 md:h-8"
            >
                {combinedEntries.map((entry) => {
                    if ('employeeName' in entry) {
                        const booking = entry as Booking
                        const isYourBooking = yourBookings?.some(
                            (yourBooking) => yourBooking.id === booking.id,
                        )
                        const {isFirstDay, isLastDay} = getBookingDateInfo(
                            date,
                            booking,
                        )
                        return (
                            <span
                                key={booking.id}
                                className={cn(
                                    'p-2 text-white tooltip tooltip-top shadow-xl',
                                    getCabinBookingStyle(date, booking),
                                    isYourBooking && 'shadow-y-2',
                                    isAfter(add(date, {days: 1}), new Date())
                                        ? get(cabinColors, booking.apartment?.cabin_name)
                                        : get(
                                            cabinColorsOpacity,
                                            booking.apartment?.cabin_name,
                                        ),
                                    'normal-case',
                                )}
                                {...(windowWidth > 800 && {
                                    'data-tip': `Reservert av: ${booking.employeeName}`,
                                })}
                            >
                        {(isFirstDay || isLastDay) &&
                            getInitials(booking.employeeName, windowWidth)}
                      </span>
                        )
                    } else {

                        const pendingBookingTrain = entry as PendingBookingTrain
                        const hasOverlapWithBooking = cabinBookings.some((booking) => hasOverlap(booking, pendingBookingTrain))


                        return (
                            <span
                                key={pendingBookingTrain.id}
                                className={clsx(
                                    getPendingBookingCabinStyle(date, pendingBookingTrain),
                                    isAfter(add(date, {days: 1}), new Date())
                                        ? get(pendingBookingCabinColors, pendingBookingTrain.apartment.cabin_name)
                                        : get(pendingBookingCabinColors, pendingBookingTrain.apartment.cabin_name),
                                    'normal-case',
                                    'bg-pattern',
                                    hasOverlapWithBooking && 'hidden',
                                )}
                            ></span>
                        )
                    }
                })}
            </div>
        )
    }

    return (
        <>
            { cabinOrder.map((cabin) => renderBookingsAndPendingBookings(cabin))}
        </>
    );
}

export default CabinEntries;
