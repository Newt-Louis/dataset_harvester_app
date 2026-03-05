<script setup>
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { onMounted } from 'vue';

const { locale } = useI18n();
// Sử dụng Vue Router để chuyển trang khi bấm nút
const router = useRouter();

const goToHarvester = () => {
  router.push('/harvesting');
};

const getHomeData = async ()=>{
  const response = await axios.get('/');
  if (response.status === 200) {
    console.log(response.data)
  }
}

onMounted(()=>{
  getHomeData();
});
</script>

<template>
  <div class="home-wrapper">
    <div class="hero-section">
      <div class="icon-glow">
        <i class="pi pi-database"></i>
      </div>
      
      <h1 class="main-title">{{ $t('app.title') }}<span class="highlight"> Harvester</span></h1>
      
      <p class="subtitle">
        {{ $t('app.home_subtitle') }}
      </p>

      <div class="features">
        <span class="feature-tag"><i class="pi pi-check-circle"></i> Multi-Model API</span>
        <span class="feature-tag"><i class="pi pi-code"></i> Dynamic Schema JSONL</span>
        <span class="feature-tag"><i class="pi pi-bolt"></i> Async Generation</span>
      </div>

      <Button 
        :label="$t('app.start_btn')" 
        icon="pi pi-power-off" 
        size="large" 
        class="cta-button"
        @click="goToHarvester" 
      />
    </div>
  </div>
</template>

<style scoped>
/* Căn giữa toàn bộ nội dung trang chủ */
.home-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 75vh;
  text-align: center;
  padding: 2rem;
  animation: fadeIn 0.8s ease-out;
}

/* Hiệu ứng Icon phát sáng cực ngầu */
.icon-glow {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(0, 212, 255, 0.05);
  border: 2px solid var(--p-primary-color);
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1);
  margin-bottom: 2rem;
}

.icon-glow i {
  font-size: 4rem;
  color: var(--p-primary-color);
  text-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
}

.main-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  color: var(--p-text-color);
  letter-spacing: -1px;
}

.highlight {
  color: var(--p-primary-color);
  position: relative;
}

/* Gạch chân phát sáng mờ dưới chữ Harvester */
.highlight::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--p-primary-color);
  border-radius: 2px;
  box-shadow: 0 0 10px var(--p-primary-color);
  opacity: 0.6;
}

.subtitle {
  font-size: 1.25rem;
  color: var(--p-text-color-secondary);
  max-width: 700px;
  line-height: 1.6;
  margin-bottom: 2.5rem;
}

.features {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3.5rem;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--p-surface-100);
  border: 1px solid var(--p-surface-200);
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--p-text-color);
  transition: all 0.3s;
}

/* Đổi màu thẻ tag khi ở Dark Mode */
:global(.app-dark) .feature-tag {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--p-surface-700);
}

.cta-button {
  font-size: 1.1rem;
  font-weight: bold;
  padding: 1rem 2.5rem;
  border-radius: 8px;
  letter-spacing: 1px;
  box-shadow: 0 8px 20px rgba(0, 212, 255, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(0, 212, 255, 0.4);
}

/* Animation khi load trang */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive cho điện thoại */
@media (max-width: 768px) {
  .main-title { font-size: 2.5rem; }
  .subtitle { font-size: 1.1rem; }
  .features { flex-direction: column; gap: 0.75rem; }
}
</style>