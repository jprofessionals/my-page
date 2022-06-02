import axios from "axios";
import authHeader from "./auth-header";
const API_URL = "/api/";
const getTestApi = () => {
    return axios.get(API_URL + "test", { headers: authHeader() });
};
const getTestApiOpen = () => {
    return axios.get(API_URL + "open/test");
};

const ApiService = {
    getTestApi,
    getTestApiOpen
};
export default ApiService;