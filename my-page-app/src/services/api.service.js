import axios from 'axios'
import authHeader from './auth-header'
export const API_URL = '/api/'

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

const ApiService = {
  createBudgetPost,
  deleteBudgetPost,
  editBudgetPost,
}
export default ApiService
