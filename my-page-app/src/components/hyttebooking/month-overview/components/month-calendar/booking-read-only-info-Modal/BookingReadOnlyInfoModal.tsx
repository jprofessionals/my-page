import React from 'react'
import { Booking, User } from '@/types'
import { dateFormat } from '@/components/hyttebooking/month-overview/monthOverviewUtils'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import SimpleModal from '@/components/ui/SimpleModal'

type Props = {
  booking?: Booking
  onCancel: () => void
}

const BookingReadOnlyInfoModal = ({ booking, onCancel }: Props) => {
  return (
    <SimpleModal
      header={'Booking-info'}
      open={!!booking}
      onRequestClose={onCancel}
      content={
        <>
          {booking?.employeeName} har booket &quot;
          {booking?.apartment?.cabin_name}&quot; for perioden
          {booking?.startDate &&
            format(booking?.startDate, dateFormat)} til{' '}
          {booking?.endDate && format(booking?.endDate, dateFormat)} ?
        </>
      }
      cancelButton={<Button onClick={onCancel}>Avbryt</Button>}
    />
  )
}

export default BookingReadOnlyInfoModal
