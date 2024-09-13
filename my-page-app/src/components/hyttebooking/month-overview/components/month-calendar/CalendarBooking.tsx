import {Booking, User} from "@/types";
import React from "react";
import {CalendarDay} from "react-day-picker";
import {dateFormat} from "@/components/hyttebooking/month-overview/monthOverviewUtils";
import { format } from 'date-fns'

type Props = {
    booking?: Booking;
    day: CalendarDay;
    user: User;
}

const CalendarBooking = ({ booking, day, user }: Props) => {

    const getColor = () => {
        const pending = booking?.isPending;
        const todayString = format(new Date(), dateFormat);

        if (booking) {
            const isPast = booking?.endDate < todayString;

            if (isPast) {
                return "#ececec";
            }

            if (user?.name === booking?.employeeName) {
                return pending ? "#d7e6ff" : "#0e90fa";
            } else {
                return pending ? "#fff2d7" : "#fac30e";
            }
        }

        return "#f5f7fa";
    }

    const getNameLabelColor = () => {
        const pending = booking?.isPending;
        const todayString = format(new Date(), dateFormat);
        const isPast = booking?.endDate < todayString;
        return isPast ? "" : "#ffffff";
    }

    const getBorderLeft = () => {
        switch (booking?.apartment.cabin_name) {
            case "Stor leilighet": return "0";
            case "Liten leilighet":  return "0";
            case "Annekset":  return "0";
            default: return "1px solid " + "#e1e1e1";
        }
    }

    const getBorderRadius = () => {
        const dateString = format(day.date, dateFormat);
        switch (dateString) {
            case booking?.startDate : return "0.6rem 0 0 0.6rem";
            case booking?.endDate : return "0 0.7rem 0.7rem 0";
            default: return "0";
        }
    }

    const getEmployeeName = () => {
        const dateString = format(day.date, dateFormat);
        switch (dateString) {
            case booking?.startDate : return booking?.employeeName.split(/\s/).reduce((response,word)=> response+=word.slice(0,1),'');
            default: return "";
        }
    }


    return (
        <div style={{
            height: "2rem",
            marginBottom: "0.2rem",
            padding: "0.25rem 0.25rem",
            width: "100%",
            backgroundColor: getColor(),
            borderRadius: getBorderRadius(),
            borderBottomLeftRadiusRadius: getBorderRadius(),
            borderLeft: getBorderLeft()
        }}>
            <div style={{
                backgroundColor: getNameLabelColor(),
                borderRadius: "0.45rem",
                paddingLeft: "0.5rem",
                width: "2.3rem",
                color: "#646464"
            }}>
                {getEmployeeName()}
            </div>

        </div>
    );
}

export default CalendarBooking;
