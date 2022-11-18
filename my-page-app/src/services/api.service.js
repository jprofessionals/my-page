import axios from "axios";
import authHeader from "./auth-header";
const API_URL = "/api/";

const getUsers = () => {
  return axios.get(API_URL + "user", { headers: authHeader() });
};

const getUser = () => {
  return axios.get(API_URL + "me", { headers: authHeader() });
};

const getBudgets = () => {
  return axios.get(API_URL + "me/budgets", { headers: authHeader() });
};

const createBudgetPost = (post, budgetId) => {
  return axios.post(API_URL + "me/budgets/" + budgetId + "/posts", post, {
    headers: authHeader(),
  });
};

const deleteBudgetPost = (postId) => {
  return axios.delete(API_URL + "me/posts/" + postId, {
    headers: authHeader(),
  });
};

const editBudgetPost = (postId, editPostRequest) => {
  return axios.patch(API_URL + "me/posts/" + postId, editPostRequest, {
    headers: authHeader(),
  });
};

const ApiService = {
  getUsers,
  getUser,
  getBudgets,
  createBudgetPost,
  deleteBudgetPost,
  editBudgetPost,
};
export default ApiService;
