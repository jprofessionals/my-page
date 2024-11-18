import React from 'react'
import { useQueryClient } from 'react-query'
import ApiService from '@/services/api.service'
import { Booking } from '@/types'
import { toast } from 'react-toastify'

type Props = {
  pendingBookingList: Booking[]
  closeModal: () => void
  refreshVacancies: () => void
  userIsAdmin: boolean
}

const ConvertPendingBooking = ({
  pendingBookingList,
  closeModal,
  refreshVacancies,
  userIsAdmin,
}: Props) => {
  const queryClient = useQueryClient()
  if (userIsAdmin) {
    const handleButtonClick = async () => {
      try {
        await ApiService.pickWinnerPendingBooking(pendingBookingList)
        toast.success('Trekning fullført')
        closeModal()
        queryClient.invalidateQueries('bookings')
        await queryClient.refetchQueries('yourBookingsOutline')
        refreshVacancies()
      } catch {
        toast.error('Trekningen er allerede utført')
      }
    }

    return (
      <button
        onClick={handleButtonClick}
        className="ml-5 mt-3 bg-green-300 text-white px-2 py-1 rounded-md"
      >
        Trekk
      </button>
    )
  } else {
    toast.error('Du har ikke høy nok brukerstatus til å utføre trekningen')
  }
}

export default ConvertPendingBooking
