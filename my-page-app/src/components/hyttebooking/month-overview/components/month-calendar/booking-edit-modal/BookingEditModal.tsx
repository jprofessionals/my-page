import { Booking, User } from '@/types'
import SimpleModal from '@/components/ui/SimpleModal'
import BookingEditForm from '@/components/hyttebooking/month-overview/components/month-calendar/booking-edit-form/BookingEditForm'

type Props = {
  booking?: Booking
  user?: User
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
      header={'Endre booking'}
      content={
        <BookingEditForm
          user={user}
          booking={booking}
          onCancel={onCancel}
          onBookingSaved={onBookingSaved}
        />
      }
      optionalButton={<></>}
      confirmButton={<></>}
      cancelButton={<></>}
    />
  )
}

export default BookingEditModal
