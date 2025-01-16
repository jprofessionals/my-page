import { Booking, User } from '@/types'
import SimpleModal from '@/components/ui/SimpleModal'
import BookingEditForm from '@/components/hyttebooking/month-overview/components/month-calendar/booking-edit-form/BookingEditForm'

type Props = {
  booking?: Booking
  user: User | null
  onBookingSaved: () => void
  onCancel: () => void
}

const BookingEditModal = ({
  booking,
  user,
  onBookingSaved,
  onCancel,
}: Props) => {
  return (
    <SimpleModal
      open={!!booking}
      onRequestClose={onCancel}
      header={`Endre booking for ${booking?.employeeName}`}
      content={
        <BookingEditForm
          user={user}
          booking={booking}
          onCancel={onCancel}
          onBookingSaved={onBookingSaved}
          showCancelButton={true}
        />
      }
      optionalButton={<></>}
      confirmButton={<></>}
      cancelButton={<></>}
    />
  )
}

export default BookingEditModal
