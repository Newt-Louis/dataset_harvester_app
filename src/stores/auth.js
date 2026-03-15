import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || null)
  const user  = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  // Lưu token vào state + localStorage
  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
  }

  function clearToken() {
    token.value = null
    user.value  = null
    localStorage.removeItem('auth_token')
  }

  async function register(email, password) {
    const data = await api.post('/auth/register', { email, password })
    setToken(data.access_token)
    router.push('/')
  }

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password })
    setToken(data.access_token)
    router.push('/')
  }

  async function logout() {
    clearToken()
    router.push('/login')
  }

  // Kiểm tra token còn hợp lệ không khi mở app
  async function checkAuth() {
    if (!token.value) return false
    try {
      user.value = await api.get('/auth/me')
      return true
    } catch {
      clearToken()
      return false
    }
  }

  return { token, user, isLoggedIn, register, login, logout, checkAuth }
})
