import axios from 'axios';
import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import { createPinia } from 'pinia'
import App from './App.vue';
import './style.css';
import router from './router';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice'
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import Tooltip from 'primevue/tooltip';
import 'primeicons/primeicons.css';
import vi from './locales/vi.json';
import en from './locales/en.json';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
axios.defaults.timeout = 60000;

const i18n = createI18n({
  legacy: false,
  locale: 'vi',
  fallbackLocale: 'en',
  messages: { vi, en }
});

const AIPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#ecfeff',
            100: '#cffafe',
            200: '#a5f3fc',
            300: '#67e8f9',
            400: '#22d3ee',
            500: '#00d4ff',
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
            950: '#083344'
        },
        // Định nghĩa surface để PrimeVue tự quản lý màu nền cho Card, Input, v.v.
        colorScheme: {
            light: {
                surface: {
                    0: '#ffffff',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617'
                }
            },
            dark: {
                surface: {
                    0: '#ffffff',
                    50: '#0f172a',
                    100: '#1e293b',
                    200: '#334155',
                    300: '#475569',
                    400: '#64748b',
                    500: '#94a3b8',
                    600: '#cbd5e1',
                    700: '#e2e8f0',
                    800: '#f1f5f9',
                    900: '#f8fafc',
                    950: '#ffffff'
                }
            }
        }
    }
});

const app = createApp(App);
app.use(createPinia())
app.use(router);
app.use(i18n);
app.use(PrimeVue,{
    theme:{
        preset: AIPreset,
        options:{
            darkModeSelector: ".app-dark",
        }
    }
});
app.use(ToastService)
app.directive('tooltip', Tooltip);
app.mount('#root');
