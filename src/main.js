import { createApp } from 'vue'
import App from './App.vue'

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import 'primeicons/primeicons.css';

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
        }
    }
});

const app = createApp(App);
app.use(PrimeVue,{
    theme:{
        preset: AIPreset,
        options:{
            darkModeSelector: ".app-dark",
        }
    }
});

app.mount('#root');