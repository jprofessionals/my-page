import axios from "axios";
import authHeader from "./auth-header";
const API_URL = "/api/";

const getTestApi = () => {
  return axios.get(API_URL + "test", { headers: authHeader() });
};
const getTestApiOpen = () => {
  return axios.get(API_URL + "open/test");
};

const getEmployees = () => {
  return axios.get(API_URL + "open/employees");
};
const postEmployees = (data) => {
  return axios.post(API_URL + "open/employees", data);
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

const getBudgetType = (budgetTypeId) => {
  return axios.get(API_URL + "budgetTypes/" + budgetTypeId, {
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


const getEmployeeSummary = () => {
  return axios.get(API_URL + "admin/summary", { headers: authHeader() });
};

const ApiService = {
  getTestApi,
  getTestApiOpen,
  getEmployees,
  postEmployees,
  getUser,
  getBudgets,
  createBudgetPost,
  getBudgetType,
  deleteBudgetPost,
  editBudgetPost,
  getEmployeeSummary
};
export default ApiService;
