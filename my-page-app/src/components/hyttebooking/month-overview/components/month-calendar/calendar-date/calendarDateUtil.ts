import { CalendarDay } from 'react-day-picker'

export const getIsToday = (day: CalendarDay): boolean => {
  const dayDate = day.date
  const todayDate = new Date()
  return (
    dayDate.getFullYear() === todayDate.getFullYear() &&
    dayDate.getMonth() === todayDate.getMonth() &&
    dayDate.getDate() === todayDate.getDate()
  )
}

export const getIsDayOfWeek = (day: CalendarDay): number => {
  return day.date.getDay()
}
