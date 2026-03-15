import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client';
import router from '@/router';
import Cookies from 'js-cookie';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(Cookies.get('auth_token') || null)
  const user = ref(null)
  const isProduction = import.meta.env.PROD;
  const isLoggedIn = computed(() => !!token.value)

  // Lưu token vào state + Cookie (Set thời hạn 7 ngày)
  function setToken(newToken) {
    token.value = newToken
    Cookies.set('auth_token', newToken, { expires: 7, secure: isProduction, sameSite: 'Strict' })
  }

  function clearToken() {
    token.value = null
    user.value = null
    Cookies.remove('auth_token')
  }

  async function register(email, password) {
    const data = await api.post('/auth/register', { email, password })
    setToken(data.access_token)
    router.push('/')
  }

  async function login(email, password) {
    const data = await api.post('/auth/login', { login_field: email, password })
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
