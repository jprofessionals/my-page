import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import ApiService from '@/services/api.service'
import { PendingBooking } from '@/types'
import { toast } from 'react-toastify'

type Props = {
  pendingBookingList: PendingBooking[]
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
  if (userIsAdmin) {
    const queryClient = useQueryClient()
    const handleButtonClick = async () => {
      try {
        await ApiService.pickWinnerPendingBooking(pendingBookingList)
        toast.success('Trekning fullført')
        closeModal()
        queryClient.invalidateQueries('bookings') // Invalidate booking data
        await queryClient.refetchQueries('yourBookingsOutline') // Refetch your bookings data
        refreshVacancies()
      } catch (error) {
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
