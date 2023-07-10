import axios from 'axios'
import authHeader from './auth-header'
export const API_URL = '/api/'

const getUsers = () => {
  return axios.get(API_URL + 'user', { headers: authHeader() })
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
  }))
}

const getBookingsForDay = (selectedDate) => {
  const params = {
    date: selectedDate
  }

  return axios
      .get(API_URL + 'booking/date', {
        headers: authHeader(),
        params: params
      })
      .then((response) => {
        const bookings = response.data;
        return bookings.map((booking) => ({
          id: String(booking.id),
          startDate: booking.startDate,
          endDate: booking.endDate,
          apartment: {
            id: booking.apartment.id,
            cabin_name: booking.apartment.cabin_name,
          },
          employeeName: booking.employeeName,
        }))
      })
}

const deleteBooking = (bookingId) => {
  return axios.delete(API_URL + 'booking/' + bookingId, {
    headers: authHeader(),
  })
}

const ApiService = {
  getUsers,
  getUser,
  getBudgets,
  getBudgetsForEmployee,
  createBudgetPost,
  deleteBudgetPost,
  editBudgetPost,
  getBookings,
  getBookingsForUser,
  getBookingsForDay,
  deleteBooking,
}
export default ApiService
