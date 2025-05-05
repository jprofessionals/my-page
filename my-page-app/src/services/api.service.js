import axios from 'axios'
import authHeader from './auth-header'

export const API_URL = '/api/'

const getUsers = () => {
  return axios.get(API_URL + 'user', { headers: authHeader() })
}

const getDisabledUsers = () => {
  return axios.get(API_URL + 'user', { headers: authHeader(), params: { isEnabled: false } })
}

const getUser = () => {
  return axios.get(API_URL + 'me', { headers: authHeader() })
}

const getBudgetsForEmployee = (employeeNumber) => {
  return axios.get(API_URL + 'budget/' + employeeNumber, {
    headers: authHeader(),
  })
}

const getBudgets = async () => {
  const response = await axios.get(API_URL + 'me/budgets', {
    headers: authHeader(),
  })

  const budgets = response.data
  return budgets.map((budget) => ({
    ...budget,
    id: String(budget.id),
  }))
}

const createBudgetPost = (post, budgetId) => {
  return axios.post(API_URL + 'budget/' + budgetId + '/posts', post, {
    headers: authHeader(),
  })
}

const deleteBudgetPost = (postId) => {
  return axios.delete(API_URL + 'budget/posts/' + postId, {
    headers: authHeader(),
  })
}

const editBudgetPost = (postId, editPostRequest) => {
  return axios.patch(API_URL + 'budget/posts/' + postId, editPostRequest, {
    headers: authHeader(),
  })
}

const getBookings = (startDate, endDate) => {
  const params = {
    startDate: startDate,
    endDate: endDate,
  }

  return axios
    .get(API_URL + 'booking', {
      headers: authHeader(),
      params: params,
    })
    .then((response) => {
      const bookings = response.data
      return bookings.map((booking) => ({
        id: String(booking.id),
        startDate: booking.startDate,
        endDate: booking.endDate,
        apartment: {
          id: booking.apartment.id,
          cabin_name: booking.apartment.cabin_name,
        },
        employeeName: booking.employeeName,
        isPending: false,
      }))
    })
}

const getBookingsForUser = async () => {
  const response = await axios.get(API_URL + 'me/bookings', {
    headers: authHeader(),
  })

  const bookings = response.data
  return bookings.map((booking) => ({
    ...booking,
    id: String(booking.id),
    isPending: false,
  }))
}

const getAllVacancies = async (startDate, endDate) => {
  const params = {
    startdate: startDate,
    enddate: endDate,
  }
  return axios
    .get(API_URL + 'booking/vacancy', {
      headers: authHeader(),
      params: params,
    })
    .then((response) => {
      const availability = response.data
      return availability
    })
}

const getAllApartments = async () => {
  const response = await axios.get(API_URL + 'booking/apartment', {
    headers: authHeader(),
  })
  const apartments = response.data
  return apartments
}

const deleteBooking = (bookingId) => {
  return axios.delete(API_URL + 'booking/' + bookingId, {
    headers: authHeader(),
  })
}

const adminDeleteBooking = (bookingId) => {
  return axios.delete(API_URL + 'booking/admin/' + bookingId, {
    headers: authHeader(),
  })
}

const getAllPendingBookingTrainsForAllApartments = async () => {
  const response = await axios.get(
    API_URL + 'pendingBooking/pendingBookingInformation',
    {
      headers: authHeader(),
    },
  )
  const allPendingBookingTrainsAllApartments = response.data
  return allPendingBookingTrainsAllApartments
}

const pickWinnerPendingBooking = async (pendingBookingList) => {
  try {
    const response = await axios.post(
      API_URL + 'pendingBooking/pendingBookingWin',
      pendingBookingList,
      {
        headers: authHeader(),
      },
    )

    return response.data
  } catch (error) {
    throw error
  }
}
const getPendingBookingsForUser = async () => {
  const response = await axios.get(API_URL + 'me/pendingBookings', {
    headers: authHeader(),
  })

  const pendingBookings = response.data
  return pendingBookings.map((pendingBooking) => ({
    ...pendingBooking,
    id: String(pendingBooking.id),
    isPending: true,
  }))
}

const deletePendingBooking = (pendingBookingId) => {
  return axios.delete(API_URL + 'pendingBooking/' + pendingBookingId, {
    headers: authHeader(),
  })
}
const adminDeletePendingBooking = (pendingBookingId) => {
  return axios.delete(API_URL + 'pendingBooking/admin/' + pendingBookingId, {
    headers: authHeader(),
  })
}

const getInfoNotices = (startDate, endDate) => {
  const params = {
    startDate: startDate,
    endDate: endDate,
  }

  return axios
    .get(API_URL + 'informationNotice', {
      headers: authHeader(),
      params: params,
    })
    .then((response) => {
      const infoNotices = response.data
      return infoNotices.map((infoNotice) => ({
        id: String(infoNotice.id),
        startDate: infoNotice.startDate,
        endDate: infoNotice.endDate,
        description: infoNotice.description,
      }))
    })
}

const deleteInfoNotice = (infoNoticeId) => {
  return axios.delete(API_URL + 'informationNotice/admin/' + infoNoticeId, {
    headers: authHeader(),
  })
}

const createInfoNotice = (infoNotice) => {
  return axios.post(API_URL + 'informationNotice/post', infoNotice, {
    headers: authHeader(),
  })
}

const getAllInfoNoticeVacancies = async (startDate, endDate) => {
  const params = {
    startdate: startDate,
    enddate: endDate,
  }
  return axios
    .get(API_URL + 'informationNotice/vacancy', {
      headers: authHeader(),
      params: params,
    })
    .then((response) => {
      const availability = response.data
      return availability
    })
}

const getBudgetSummary = async () => {
  const response = await axios.get(API_URL + 'admin/budgetSummary', {
    headers: authHeader(),
  })
  const budgetSummary = response.data
  return budgetSummary
}

const getSettings = async () => {
  const response = await axios.get(API_URL + 'settings', {
    headers: authHeader(),
  })
  const settings = response.data
  return settings
}

const patchSetting = (settingId, updatedSetting) => {
  return axios.patch(API_URL + 'settings/' + settingId, updatedSetting, {
    headers: authHeader(),
  })
}

const patchBooking = (bookingId, updatedBooking) => {
  return axios.patch(API_URL + 'booking/' + bookingId, updatedBooking, {
    headers: authHeader(),
  })
}

const adminPatchBooking = (bookingId, updatedBooking) => {
  return axios.patch(API_URL + 'booking/admin/' + bookingId, updatedBooking, {
    headers: authHeader(),
  })
}

const patchPendingBooking = (bookingId, updatedBooking) => {
  return axios.patch(API_URL + 'pendingBooking/' + bookingId, updatedBooking, {
    headers: authHeader(),
  })
}

const getImage = async (fileName) => {
  const response = await axios.get(API_URL + 'image/' + fileName, {
    headers: authHeader(),
    responseType: 'blob',
  })
  return response.data
}

const toggleAdmin = (email, isAdmin) => {
  return axios.patch(API_URL + 'user', { email: email, isAdmin: isAdmin }, {
    headers: authHeader(),
  })
}

const toggleActive = (email, isActive) => {
  return axios.patch(API_URL + 'user/active', { email: email, isActive: isActive }, {
    headers: authHeader(),
  })
}

const ApiService = {
  getUsers,
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
