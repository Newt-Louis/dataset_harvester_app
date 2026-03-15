<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import SelectButton from 'primevue/selectbutton';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

const { locale } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const langOptions = [
  { label: 'VN', value: 'vi' },
  { label: 'EN', value: 'en' }
];
// --- STATE: THEME (Sáng / Tối / Auto) ---
const themeMode = ref('auto');
const themeOptions = [
  { icon: 'pi pi-sun', value: 'light', tooltip: 'Sáng' },
  { icon: 'pi pi-desktop', value: 'auto', tooltip: 'Hệ thống' },
  { icon: 'pi pi-moon', value: 'dark', tooltip: 'Tối' }
];

// Hàm áp dụng màu sắc thực tế
const applyThemeClass = (isDark) => {
  document.documentElement.classList.toggle('app-dark', isDark);
};

// Hàm xử lý logic chọn Theme
const handleThemeChange = (mode) => {
  if (mode === 'light') applyThemeClass(false);
  else if (mode === 'dark') applyThemeClass(true);
  else applyThemeClass(window.matchMedia('(prefers-color-scheme: dark)').matches);
  localStorage.setItem('theme_preference', mode);
};

// Theo dõi khi người dùng bấm nút đổi theme
watch(themeMode, (newMode) => {
  handleThemeChange(newMode);
});

// Chạy khi khởi động app
onMounted(() => {
  const savedMode = localStorage.getItem('theme_preference');
  if (savedMode) {
    themeMode.value = savedMode;
  } else {
    handleThemeChange('auto');
  }

  // Lắng nghe OS thay đổi (chỉ áp dụng nếu đang ở chế độ 'auto')
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (themeMode.value === 'auto') {
      applyThemeClass(event.matches);
    }
  });
});
</script>

<template>
  <div class="app-layout">
    <div class="top-controls">
      <!-- Nút đăng nhập / đăng xuất -->
      <Button
        v-if="authStore.isLoggedIn"
        icon="pi pi-sign-out"
        label="Đăng xuất"
        severity="secondary"
        text
        size="small"
        @click="authStore.logout()"
      />
      <Button
        v-else
        icon="pi pi-sign-in"
        label="Đăng nhập"
        severity="secondary"
        text
        size="small"
        @click="router.push('/login')"
      />
      <SelectButton v-model="locale" :options="langOptions" optionLabel="label" optionValue="value" :allowEmpty="false" class="lang-selector" />
      <SelectButton v-model="themeMode" :options="themeOptions" optionLabel="value" optionValue="value" :allowEmpty="false">
        <template #option="slotProps">
          <i :class="slotProps.option.icon" :title="slotProps.option.tooltip"></i>
        </template>
      </SelectButton>
    </div>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
/* Layout chính */
.app-layout {
  min-height: 100vh;
  position: relative;
}

/* Nút chọn theme ở góc phải */
.top-controls {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  display: flex;
  gap: 0.5rem;
}
:deep(.lang-selector .p-togglebutton) { padding: 0.5rem; font-size: 0.85rem; font-weight: bold; }
.main-content {
  padding: 4rem 1rem 2rem 1rem;
}
</style>