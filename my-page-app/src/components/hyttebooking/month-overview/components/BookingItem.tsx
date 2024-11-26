import React from 'react'
import MonthOverviewModal from './MonthOverviewModal'
import EditBooking from '@/components/hyttebooking/EditBooking'
import { format } from 'date-fns'
import { Apartment, Booking, CabinColorClasses } from '@/types'
import { dateFormat } from '../monthOverviewUtils'
import MonthOverviewButton from '@/components/hyttebooking/month-overview/components/MonthOverviewButton'

type Props = {
  booking: Booking
  yourBookings: Booking[]
  bookingItems: Booking[]
  bookingItemsIndex: number
  admin: boolean
  onEditBooking: (bookingId: number) => void
  onOpenDeleteModal: (booking: Booking | null) => void
  onCloseModal: () => void
  onConfirmDelete: () => void
  deleteModalIsOpen: boolean
  showEditFormForBooking?: number | null
  apartments: Apartment[]
  cutOffDateVacancies?: string
  onRefreshVacancies: () => void
}

const BookingItem = ({
  bookingItemsIndex,
  booking,
  yourBookings,
  bookingItems,
  admin,
  onEditBooking,
  onOpenDeleteModal,
  onCloseModal,
  onConfirmDelete,
  deleteModalIsOpen,
  showEditFormForBooking,
  apartments,
  cutOffDateVacancies,
  onRefreshVacancies,
}: Props) => {
  const startDate = new Date(booking.startDate)
  const endDate = new Date(booking.endDate)
  const formattedStartDate = format(startDate, dateFormat)
  const formattedEndDate = format(endDate, dateFormat)
  //only pending booking belonging to the user are in bookingItems
  const isYourBooking =
    (!booking.isPending &&
      yourBookings?.some((yourBooking) => yourBooking.id === booking.id)) ||
    booking.isPending
  const prevCabinName =
    bookingItemsIndex > 0
      ? bookingItems[bookingItemsIndex - 1].apartment.cabin_name
      : null
  const currentCabinName = booking.apartment.cabin_name
  const shouldRenderDivider = prevCabinName !== currentCabinName

  const cabinTextColorClasses: CabinColorClasses = {
    Stor_leilighet: 'text-orange-brand',
    'Liten leilighet': 'text-blue-small-appartment',
    Annekset: 'text-teal-annex',
  }

  const cabinBorderColorClasses: CabinColorClasses = {
    'Stor leilighet': 'border-orange-brand',
    'Liten leilighet': 'border-blue-small-appartment',
    Annekset: 'border-teal-annex',
  }

  const cabinPendingBorderColorClasses: CabinColorClasses = {
    'Stor leilighet': 'border-yellow-200',
    'Liten leilighet': 'border-purple-200',
    Annekset: 'border-green-200',
  }

  return (
    <div key={booking.id}>
      {shouldRenderDivider && (
        <h4 className={`mt-2 mb-1 ${cabinTextColorClasses[currentCabinName]}`}>
          {currentCabinName}:
        </h4>
      )}
      <div
        className={`mt-2 mb-1 pl-2 flex ${cabinBorderColorClasses[currentCabinName]} border-l-2`}
      >
        {isYourBooking || admin ? (
          <div className="flex flex-col">
            <div className="flex-row justify-between items-center space-x-2">
              <span
                style={{ fontStyle: booking.isPending ? 'italic' : 'normal' }}
              >
                {isYourBooking
                  ? `Du ${booking.isPending ? 'ønsker' : 'har'} hytten fra ${formattedStartDate} til ${formattedEndDate}.`
                  : `${booking.employeeName} har hytten fra ${formattedStartDate} til ${formattedEndDate}.`}
              </span>

              <MonthOverviewButton
                onClick={() => onEditBooking(booking.id)}
                variant={'yellow'}
                title={'Rediger'}
              />

              <MonthOverviewButton
                onClick={() => onOpenDeleteModal(booking)}
                variant={'red_not_available'}
                title={'Slett'}
              />

              <MonthOverviewModal
                open={deleteModalIsOpen}
                onClose={onCloseModal}
                label="Delete Confirmation"
              >
                <div>
                  <p className="mb-3">
                    Er du sikker på at du vil slette{' '}
                    {booking.isPending ? 'den ønskede ' : ''}reservasjonen?
                  </p>
                  <div className="flex justify-end">
                    <MonthOverviewButton
                      onClick={onConfirmDelete}
                      variant={'red'}
                      title={'Slett reservasjon'}
                    />
                    <MonthOverviewButton
                      onClick={onCloseModal}
                      variant={'gray'}
                      title={'Avbryt'}
                    />
                  </div>
                </div>
              </MonthOverviewModal>
            </div>

            {showEditFormForBooking === booking.id &&
              cutOffDateVacancies != null && (
                <EditBooking
                  booking={booking}
                  closeModal={onCloseModal}
                  refreshVacancies={onRefreshVacancies}
                  userIsAdmin={admin}
                  cutOffDateVacancies={cutOffDateVacancies}
                  apartments={apartments}
                />
              )}
          </div>
        ) : (
          <>
            {!booking.isPending && (
              <span>
                {booking.employeeName} har fra {formattedStartDate} til{' '}
                {formattedEndDate}.
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BookingItem
