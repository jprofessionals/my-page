import { dateFormat } from '@/components/hyttebooking/month-overview/monthOverviewUtils'
import { Booking } from '@/types'
import { format } from 'date-fns'

type Props = {
  pendingBooking: Booking
}

const PendingBookingText = ({ pendingBooking }: Props) => (
  <>
    {pendingBooking.employeeName} har meldt interesse for{' '}
    {pendingBooking.apartment.cabin_name} i perioden{' '}
    {format(new Date(pendingBooking.startDate), dateFormat)} til{' '}
    {format(new Date(pendingBooking.endDate), dateFormat)}.
  </>
)

export default PendingBookingText
