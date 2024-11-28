import React, { useState } from 'react'
import { CalendarDay } from 'react-day-picker'
import { getIsDayOfWeek, getIsToday } from './calendarDateUtil'
import classes from './CalendarDate.module.css'
import { InfoBooking } from '../../../../../../types'

type Props = {
  day: CalendarDay
  infoNotices: InfoBooking[]
}

const CalendarDate = ({ day, infoNotices }: Props) => {
  const style = classes
  const isToday = getIsToday(day)
  const isWednesday = getIsDayOfWeek(day) === 3
  const [showNoticeDescription, setShowNoticeDescription] =
    useState<boolean>(!false)

  return (
    <div className={style.container}>
      {infoNotices.map((infoNotice) => (
        <div key={infoNotice.id} style={{display: 'flex'}}>
          <div
            className={style.info}
            onClick={() => setShowNoticeDescription(!showNoticeDescription)}
          >!</div>
          {showNoticeDescription && (
            <div id="dialog" className={style.dialog}>
              {infoNotice.description}
            </div>
          )}
        </div>
      ))}
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
