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
const postEmployees = () => {
  return axios.post(API_URL + "open/employees", {});
};

const ApiService = {
  getTestApi,
  getTestApiOpen,
  getEmployees,
  postEmployees,
};
export default ApiService;
