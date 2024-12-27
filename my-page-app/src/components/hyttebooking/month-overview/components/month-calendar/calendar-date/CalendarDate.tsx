import React from 'react'
import { CalendarDay } from 'react-day-picker'
import classes from './CalendarDate.module.css'
import { InfoBooking } from '../../../../../../types'
import CalendarInfoNotice from '../calendar-info-notice/CalendarInfoNotice'
import { isToday as isTodayFn, isWednesday as isWednesdayFn } from 'date-fns'

type Props = {
  day: CalendarDay
  infoNotices: InfoBooking[]
}

const CalendarDate = ({ day, infoNotices }: Props) => {
  const style = classes
  const isToday = isTodayFn(day.date)
  const isWednesday = isWednesdayFn(day.date)

  return (
    <div className={style.container}>
      {infoNotices && infoNotices.length > 0 && (
        <CalendarInfoNotice infoNotices={infoNotices} />
      )}
      <div
        className={`
                ${style.date}
                ${isToday && style.today}
                ${isWednesday && style.wednesday}  
            `}
      >
        {day.date.getDate()}.
      </div>
    </div>
  )
}

export default CalendarDate
