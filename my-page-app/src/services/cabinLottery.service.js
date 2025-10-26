// services/cabinLottery.service.js
import axios from 'axios'
import authHeader from './auth-header'

const API_BASE = '/api/cabin-lottery'
const ADMIN_BASE = '/api/cabin-lottery/admin'

// ===== USER ENDPOINTS =====

export const getCurrentDrawing = () => {
  return axios.get(`${API_BASE}/current`, { headers: authHeader() })
}

export const getDrawing = (drawingId) => {
  return axios.get(`${API_BASE}/drawings/${drawingId}`, { headers: authHeader() })
}

export const getPeriods = (drawingId) => {
  return axios.get(`${API_BASE}/drawings/${drawingId}/periods`, { headers: authHeader() })
}

export const submitWishes = (drawingId, wishes) => {
  return axios.post(`${API_BASE}/drawings/${drawingId}/wishes`, { wishes }, { headers: authHeader() })
}

export const getMyWishes = (drawingId) => {
  return axios.get(`${API_BASE}/drawings/${drawingId}/my-wishes`, { headers: authHeader() })
}

export const getMyAllocations = (drawingId) => {
  return axios.get(`${API_BASE}/drawings/${drawingId}/my-allocations`, { headers: authHeader() })
}

export const getAllAllocations = (drawingId) => {
  return axios.get(`${API_BASE}/drawings/${drawingId}/allocations`, { headers: authHeader() })
}

export const getApartments = () => {
  return axios.get(`${API_BASE}/apartments`, { headers: authHeader() })
}

// ===== ADMIN ENDPOINTS =====

export const adminCreateDrawing = (season) => {
  return axios.post(`${ADMIN_BASE}/drawings`, { season }, { headers: authHeader() })
}

export const adminGetAllDrawings = () => {
  return axios.get(`${ADMIN_BASE}/drawings`, { headers: authHeader() })
}

export const adminGetDrawing = (drawingId) => {
  return axios.get(`${ADMIN_BASE}/drawings/${drawingId}`, { headers: authHeader() })
}

export const adminDeleteDrawing = (drawingId) => {
  return axios.delete(`${ADMIN_BASE}/drawings/${drawingId}`, { headers: authHeader() })
}

export const adminAddPeriod = (drawingId, period) => {
  return axios.post(`${ADMIN_BASE}/drawings/${drawingId}/periods`, period, { headers: authHeader() })
}

export const adminGetPeriods = (drawingId) => {
  return axios.get(`${ADMIN_BASE}/drawings/${drawingId}/periods`, { headers: authHeader() })
}

export const adminUpdatePeriod = (drawingId, periodId, period) => {
  return axios.put(`${ADMIN_BASE}/drawings/${drawingId}/periods/${periodId}`, period, { headers: authHeader() })
}

export const adminDeletePeriod = (drawingId, periodId) => {
  return axios.delete(`${ADMIN_BASE}/drawings/${drawingId}/periods/${periodId}`, { headers: authHeader() })
}

export const adminBulkCreatePeriods = (drawingId, startDate, endDate) => {
  return axios.post(`${ADMIN_BASE}/drawings/${drawingId}/periods/bulk`, { startDate, endDate }, { headers: authHeader() })
}

export const adminLockDrawing = (drawingId) => {
  return axios.post(`${ADMIN_BASE}/drawings/${drawingId}/lock`, {}, { headers: authHeader() })
}

export const adminUnlockDrawing = (drawingId) => {
  return axios.post(`${ADMIN_BASE}/drawings/${drawingId}/unlock`, {}, { headers: authHeader() })
}

export const adminOpenDrawing = (drawingId) => {
  return axios.post(`${ADMIN_BASE}/drawings/${drawingId}/open`, {}, { headers: authHeader() })
}

export const adminRevertToDraft = (drawingId) => {
  return axios.post(`${ADMIN_BASE}/drawings/${drawingId}/revert-to-draft`, {}, { headers: authHeader() })
}

export const adminPerformDraw = (drawingId, seed = null) => {
  const url = seed 
    ? `${ADMIN_BASE}/drawings/${drawingId}/draw?seed=${seed}`
    : `${ADMIN_BASE}/drawings/${drawingId}/draw`
  return axios.post(url, {}, { headers: authHeader() })
}

export const adminPublishDrawing = (drawingId, executionId) => {
  return axios.post(`${ADMIN_BASE}/drawings/${drawingId}/publish?executionId=${executionId}`, {}, { headers: authHeader() })
}

export const adminGetAllWishes = (drawingId) => {
  return axios.get(`${ADMIN_BASE}/drawings/${drawingId}/wishes`, { headers: authHeader() })
}

export const adminGetAllocations = (drawingId) => {
  return axios.get(`${ADMIN_BASE}/drawings/${drawingId}/allocations`, { headers: authHeader() })
}

export const adminImportWishes = (drawingId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return axios.post(`${ADMIN_BASE}/drawings/${drawingId}/import`, formData, {
    headers: {
      ...authHeader(),
      'Content-Type': 'multipart/form-data',
    },
  })
}

const cabinLotteryService = {
  getCurrentDrawing,
  getDrawing,
  getPeriods,
  submitWishes,
  getMyWishes,
  getMyAllocations,
  getAllAllocations,
  getApartments,
  adminCreateDrawing,
  adminGetAllDrawings,
  adminGetDrawing,
  adminDeleteDrawing,
  adminAddPeriod,
  adminGetPeriods,
  adminUpdatePeriod,
  adminDeletePeriod,
  adminBulkCreatePeriods,
  adminLockDrawing,
  adminUnlockDrawing,
  adminOpenDrawing,
  adminRevertToDraft,
  adminPerformDraw,
  adminPublishDrawing,
  adminGetAllWishes,
  adminGetAllocations,
  adminImportWishes,
}

export default cabinLotteryService
