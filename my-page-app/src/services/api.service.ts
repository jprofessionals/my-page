/**
 * API Service
 *
 * Uses OpenAPI-generated SDK (type-safe)
 */

import {
  getMe,
  getMyBudgets,
  getMyBookings,
  getUsers,
  updateUser as updateUserSDK,
  getBookings as getBookingsSDK,
  getApartments as getApartmentsSDK,
  deleteBooking as deleteBookingSDK,
  updateBooking as updateBookingSDK,
  getBudgetsForEmployee as getBudgetsForEmployeeSDK,
  createBudgetPost as createBudgetPostSDK,
  deleteBudgetPost as deleteBudgetPostSDK,
  updateBudgetPost as updateBudgetPostSDK,
  getPendingBookingInformation as getPendingBookingInformationSDK,
  pickWinnerPendingBooking as pickWinnerPendingBookingSDK,
  getMyPendingBookings as getMyPendingBookingsSDK,
  deleteMyPendingBooking as deleteMyPendingBookingSDK,
  adminDeletePendingBooking as adminDeletePendingBookingSDK,
  getInformationNotices as getInformationNoticesSDK,
  createInformationNotice as createInformationNoticeSDK,
  deleteInformationNotice as deleteInformationNoticeSDK,
  getInformationNoticeVacancies as getInformationNoticeVacanciesSDK,
  getBookingVacancies as getBookingVacanciesSDK,
  adminDeleteBooking as adminDeleteBookingSDK,
  getBudgetSummary as getBudgetSummarySDK,
  getSettings as getSettingsSDK,
  updateSetting as updateSettingSDK,
  adminUpdateBooking as adminUpdateBookingSDK,
  updatePendingBooking as updatePendingBookingSDK,
  getImage as getImageSDK,
} from '@/data/types/sdk.gen'
import {
  type BudgetReadable,
  type CreatePost,
  type UpdatePost,
  type Booking as BookingDto,
  type BookingUpdate,
  type PendingBookingDto,
  type InformationNotice,
  type CreateInformationNotice,
  type Setting,
} from '@/data/types/types.gen'

// Conditionally import openapi-client only in browser environment
if (typeof window !== 'undefined') {
  import('@/services/openapi-client')
}

export const API_URL = '/api/'

// ===== USER ENDPOINTS (OpenAPI SDK) =====

const getUser = async () => {
  const { data } = await getMe()
  return { data }
}

const getUsersAll = async () => {
  const { data } = await getUsers()
  return { data }
}

const getDisabledUsers = async () => {
  const { data } = await getUsers({
    query: { isEnabled: false },
  })
  return { data }
}

// ===== BUDGET ENDPOINTS (OpenAPI SDK) =====

const getBudgets = async () => {
  const { data } = await getMyBudgets()
  const budgets = data || []
  return budgets.map((budget: BudgetReadable) => ({
    ...budget,
    id: String(budget.id),
  }))
}

const getBudgetsForEmployee = async (employeeNumber: number) => {
  const { data } = await getBudgetsForEmployeeSDK({
    path: { employeeNumber },
  })
  return { data }
}

const createBudgetPost = async (post: CreatePost, budgetId: number) => {
  const { data } = await createBudgetPostSDK({
    path: { budgetId },
    body: post,
  })
  return { data }
}

const deleteBudgetPost = async (postId: number) => {
  const { data } = await deleteBudgetPostSDK({
    path: { postId },
  })
  return { data }
}

const editBudgetPost = async (postId: number, editPostRequest: UpdatePost) => {
  const { data } = await updateBudgetPostSDK({
    path: { postId },
    body: editPostRequest,
  })
  return { data }
}

// ===== BOOKING ENDPOINTS (OpenAPI SDK) =====

const getBookings = async (startDate: string, endDate: string) => {
  const { data } = await getBookingsSDK({
    query: { startDate, endDate },
  })
  const bookings = data || []
  return bookings.map((booking: BookingDto) => ({
    id: Number(booking.id),
    startDate: booking.startDate,
    endDate: booking.endDate,
    apartment: {
      id: booking.apartment.id,
      cabin_name: booking.apartment.cabin_name,
    },
    employeeName: booking.employeeName || '',
    isPending: false,
  }))
}

const getBookingsForUser = async () => {
  const { data } = await getMyBookings()
  const bookings = data || []
  return bookings.map((booking: BookingDto) => ({
    id: Number(booking.id),
    startDate: booking.startDate,
    endDate: booking.endDate,
    apartment: {
      id: booking.apartment.id,
      cabin_name: booking.apartment.cabin_name,
    },
    employeeName: booking.employeeName || '',
    isPending: false,
  }))
}

const getAllApartments = async () => {
  const { data } = await getApartmentsSDK()
  return data || []
}

const deleteBooking = async (bookingId: number) => {
  const { data } = await deleteBookingSDK({
    path: { bookingId },
  })
  return { data }
}

const patchBooking = async (
  bookingId: number,
  updatedBooking: BookingUpdate,
) => {
  const { data } = await updateBookingSDK({
    path: { bookingId },
    body: updatedBooking,
  })
  return { data }
}

// ===== USER ADMIN ENDPOINTS (OpenAPI SDK) =====

const toggleAdmin = async (email: string, isAdmin: boolean) => {
  const { data } = await updateUserSDK({
    body: { email, isAdmin },
  })
  return { data }
}

const toggleActive = async (email: string, isActive: boolean) => {
  const { data } = await updateUserSDK({
    body: { email, isActive },
  })
  return { data }
}

// ===== MORE BOOKING ENDPOINTS (OpenAPI SDK) =====

const getAllVacancies = async (startDate: string, endDate: string) => {
  const { data } = await getBookingVacanciesSDK({
    query: { startdate: startDate, enddate: endDate },
  })
  return data || {}
}

const adminDeleteBooking = async (bookingId: number) => {
  const { data } = await adminDeleteBookingSDK({
    path: { bookingId },
  })
  return { data }
}

const getAllPendingBookingTrainsForAllApartments = async () => {
  const { data } = await getPendingBookingInformationSDK()
  return data || []
}

const pickWinnerPendingBooking = async (
  pendingBookingList: PendingBookingDto[],
) => {
  const { data } = await pickWinnerPendingBookingSDK({
    body: pendingBookingList,
  })
  return data
}

const getPendingBookingsForUser = async () => {
  const { data } = await getMyPendingBookingsSDK()
  const pendingBookings = data || []
  return pendingBookings.map((pendingBooking: PendingBookingDto) => ({
    id: Number(pendingBooking.id),
    startDate: pendingBooking.startDate,
    endDate: pendingBooking.endDate,
    apartment: {
      id: pendingBooking.apartment?.id || 0,
      cabin_name: pendingBooking.apartment?.cabin_name || '',
    },
    employeeName: pendingBooking.employeeName || '',
    createdDate: pendingBooking.createdDate,
    isPending: true,
  }))
}

const deletePendingBooking = async (pendingBookingId: number) => {
  const { data } = await deleteMyPendingBookingSDK({
    path: { pendingBookingId },
  })
  return { data }
}

const adminDeletePendingBooking = async (pendingBookingId: number) => {
  const { data } = await adminDeletePendingBookingSDK({
    path: { pendingBookingId },
  })
  return { data }
}

// ===== INFORMATION NOTICE ENDPOINTS (OpenAPI SDK) =====

const getInfoNotices = async (startDate: string, endDate: string) => {
  const { data } = await getInformationNoticesSDK({
    query: { startDate, endDate },
  })
  const infoNotices = data || []
  return infoNotices
    .filter((infoNotice: InformationNotice) => infoNotice.id !== undefined)
    .map((infoNotice: InformationNotice) => ({
      id: infoNotice.id!,
      startDate: infoNotice.startDate,
      endDate: infoNotice.endDate,
      description: infoNotice.description,
    }))
}

const deleteInfoNotice = async (infoNoticeId: number) => {
  const { data } = await deleteInformationNoticeSDK({
    path: { infoNoticeId },
  })
  return { data }
}

const createInfoNotice = async (infoNotice: CreateInformationNotice) => {
  const { data } = await createInformationNoticeSDK({
    body: infoNotice,
  })
  return { data }
}

const getAllInfoNoticeVacancies = async (
  startDate: string,
  endDate: string,
) => {
  const { data } = await getInformationNoticeVacanciesSDK({
    query: { startdate: startDate, enddate: endDate },
  })
  return data || []
}

// ===== ADMIN & SETTINGS ENDPOINTS (OpenAPI SDK) =====

const getBudgetSummary = async () => {
  const { data } = await getBudgetSummarySDK()
  return data || []
}

const getSettings = async () => {
  const { data } = await getSettingsSDK()
  return data || []
}

const patchSetting = async (settingId: string, updatedSetting: Setting) => {
  const { data } = await updateSettingSDK({
    path: { settingId },
    body: updatedSetting,
  })
  return { data }
}

const adminPatchBooking = async (
  bookingId: number,
  updatedBooking: BookingUpdate,
) => {
  const { data } = await adminUpdateBookingSDK({
    path: { bookingId },
    body: updatedBooking,
  })
  return { data }
}

const patchPendingBooking = async (
  pendingBookingId: number,
  updatedBooking: BookingUpdate,
) => {
  const { data } = await updatePendingBookingSDK({
    path: { pendingBookingId },
    body: updatedBooking,
  })
  return { data }
}

// ===== IMAGE ENDPOINT (OpenAPI SDK) =====

const getImage = async (fileName: string) => {
  const { data } = await getImageSDK({
    path: { fileName },
  })
  return data
}

const ApiService = {
  getUsers: getUsersAll,
  getDisabledUsers,
  getUser,
  getBudgets,
  getBudgetsForEmployee,
  createBudgetPost,
  deleteBudgetPost,
  editBudgetPost,
  getBookings,
  getBookingsForUser,
  getAllVacancies,
  getAllApartments,
  deleteBooking,
  adminDeleteBooking,
  getAllPendingBookingTrainsForAllApartments,
  pickWinnerPendingBooking,
  getPendingBookingsForUser,
  deletePendingBooking,
  adminDeletePendingBooking,
  getInfoNotices,
  createInfoNotice,
  deleteInfoNotice,
  getAllInfoNoticeVacancies,
  getBudgetSummary,
  getSettings,
  patchSetting,
  patchBooking,
  patchPendingBooking,
  adminPatchBooking,
  getImage,
  toggleAdmin,
  toggleActive,
}

export default ApiService
