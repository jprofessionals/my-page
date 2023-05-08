import Holidays from 'date-holidays'
import moment from 'moment'

const hd = new Holidays('NO')

// Based on provided year and month, filter out all business days that are
// public holidays.
// Note: Not taking half days during easter or xmas into consideration, as it is
// not a forced holiday to take half the day off.
export default function getBillableHours(year?: string, month?: string) {
  const holidays = hd
    .getHolidays(year)
    // Filter out only public holidays... And the kings birthday (02-21)
    .filter(({ type, rule }) => type === 'public' && rule !== '02-21')
    // The format from hd is yyyy-MM-DD 00:00:00, where the time is irrelevant
    .map(({ date }) => date.split(' ')[0])

  // Filter out all holidays
  const businessDaysInMonth = getBusinessDaysInMonth(year, month).filter(
    (date) => !holidays.includes(date),
  )
  // Multiply by hours per billable day
  return businessDaysInMonth.length * 7.5
}

export function getBillabeHoursEntireYear(year?: string) {
  const holidays = hd
    .getHolidays(year)
    // Filter out only public holidays... And the kings birthday (02-21)
    .filter(({ type, rule }) => type === 'public' && rule !== '02-21')
    // The format from hd is yyyy-MM-DD 00:00:00, where the time is irrelevant
    .map(({ date }) => date.split(' ')[0])

  const months = Array.from({ length: 12 })
    .map((_x, i) => (i < 9 ? `0${i + 1}` : `${i + 1}`))
    .flatMap((month) => getBusinessDaysInMonth(year, month))
    .filter((date) => !holidays.includes(date))

  return (months.length - 25) * 7.5
}

// Generate an array of all mondays through fridays of a given month. Will
// default to current year and month if params not supplied.
function getBusinessDaysInMonth(
  year: string = moment().format('yyyy'),
  month: string = moment().format('MM'),
) {
  const firstDayInMonth = `${year}-${month}-01`
  return (
    Array.from({
      length: moment(firstDayInMonth).daysInMonth(),
    })
      .map((_x, i) => moment(firstDayInMonth).add(i, 'days'))
      // Remove all saturdays and sundays
      .filter((date) => ![0, 6].includes(date.day()))
      .map((date) => date.format('yyyy-MM-DD'))
  )
}
