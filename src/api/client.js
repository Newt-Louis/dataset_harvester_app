// Wrapper gọn cho fetch — tự động đính kèm Bearer token vào mọi request
import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token') // Đọc từ Cookie thay vì localStorage
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
});

api.interceptors.response.use((response) => {
  return response.data
}, (error) => {
  if (error.response && error.response.status === 401) {
    Cookies.remove('auth_token')
    window.location.href = '/login' // Ép văng ra trang login
  }
  
  const errorMsg = error.response?.data?.detail || 'Lỗi server không xác định'
  return Promise.reject(new Error(errorMsg))
});
