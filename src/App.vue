<script setup>
import { ref, onMounted, watch } from 'vue';
import SelectButton from 'primevue/selectbutton';

// --- STATE: THEME (Sáng / Tối / Auto) ---
const themeMode = ref('auto');
const themeOptions = [
  { icon: 'pi pi-sun', value: 'light', tooltip: 'Sáng' },
  { icon: 'pi pi-desktop', value: 'auto', tooltip: 'Hệ thống' },
  { icon: 'pi pi-moon', value: 'dark', tooltip: 'Tối' }
];

// Hàm áp dụng màu sắc thực tế
const applyThemeClass = (isDark) => {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('app-dark');
  } else {
    root.classList.remove('app-dark');
  }
};

// Hàm xử lý logic chọn Theme
const handleThemeChange = (mode) => {
  if (mode === 'light') applyThemeClass(false);
  else if (mode === 'dark') applyThemeClass(true);
  else {
    // Auto
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyThemeClass(prefersDark);
  }
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
    <div class="theme-toggle">
      <SelectButton v-model="themeMode" :options="themeOptions" optionValue="value" :allowEmpty="false">
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
.theme-toggle {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100;
}
.main-content {
  padding: 4rem 1rem 2rem 1rem;
}
</style>