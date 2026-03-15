<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const auth   = useAuthStore()
const router = useRouter()

const email    = ref('')
const password = ref('')
const confirm  = ref('')
const error    = ref('')
const loading  = ref(false)

const handleRegister = async () => {
  error.value = ''

  if (password.value !== confirm.value) {
    error.value = 'Mật khẩu xác nhận không khớp!'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Mật khẩu phải có ít nhất 6 ký tự!'
    return
  }

  loading.value = true
  try {
    await auth.register(email.value, password.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <Card class="auth-card">
      <template #title>
        <div class="auth-header">
          <i class="pi pi-user-plus" style="font-size: 2rem; color: var(--p-primary-color);"></i>
          <h2>Tạo tài khoản</h2>
        </div>
      </template>

      <template #content>
        <div class="auth-form">
          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

          <div class="field">
            <label>Email</label>
            <InputText v-model="email" type="email" placeholder="you@example.com" class="w-full" />
          </div>

          <div class="field">
            <label>Mật khẩu</label>
            <Password v-model="password" toggleMask placeholder="Tối thiểu 6 ký tự" class="w-full" inputClass="w-full" />
          </div>

          <div class="field">
            <label>Xác nhận mật khẩu</label>
            <Password v-model="confirm" toggleMask :feedback="false" placeholder="Nhập lại mật khẩu" class="w-full" inputClass="w-full" />
          </div>

          <Button
            label="Đăng ký"
            icon="pi pi-check"
            :loading="loading"
            @click="handleRegister"
            class="w-full"
          />

          <p class="switch-link">
            Đã có tài khoản?
            <a @click="router.push('/login')">Đăng nhập</a>
          </p>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.08);
  border-radius: 16px;
}

.auth-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.auth-header h2 { margin: 0; }

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label { font-weight: bold; font-size: 0.85rem; }

.switch-link {
  text-align: center;
  font-size: 0.9rem;
  color: var(--p-text-color-secondary);
}

.switch-link a {
  color: var(--p-primary-color);
  cursor: pointer;
  font-weight: bold;
}
</style>
