<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Slider from 'primevue/slider';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';

// --- CÁC BIẾN DỮ LIỆU (STATE) ---
// Chứa nội dung Prompt (Mặc định để trống hoặc bạn có thể gán sẵn text STAGE 0 vào đây)
const promptStage = ref('');

// Chứa danh sách hạt giống (Mỗi dòng 1 hạt giống)
const seeds = ref('');

// Số lượng mẫu muốn sinh cho mỗi hạt giống (Mặc định là 10)
const numSamples = ref(10);

// Trạng thái nút bấm (Đang chạy hay đang nghỉ)
const isGenerating = ref(false);

// --- HÀM XỬ LÝ KHI BẤM NÚT START ---
const startHarvesting = async () => {
  // Bật trạng thái loading cho nút bấm
  isGenerating.value = true;

  // Xử lý dữ liệu trước khi gửi: Cắt chuỗi seeds thành mảng (array) dựa trên dấu xuống dòng
  const seedArray = seeds.value.split('\n').filter(s => s.trim() !== '');

  // Cấu trúc gói dữ liệu (Payload) sẽ gửi sang FastAPI
  const payload = {
    prompt: promptStage.value,
    seeds: seedArray,
    samples_per_seed: numSamples.value
  };

  console.log("Dữ liệu chuẩn bị gửi sang Backend:", payload);

  // Tạm thời giả lập thời gian chờ gọi API (2 giây), sau này ta sẽ dùng fetch() hoặc axios ở đây
  setTimeout(() => {
    isGenerating.value = false;
    alert("Đã gửi yêu cầu thành công! (Vui lòng bật F12 xem Console Log)");
  }, 2000);
};
</script>

<template>
  <div class="app-container">
    <Card class="harvester-card">
      <template #title>
        <h2>AI Dataset Harvester</h2>
        <p class="subtitle">Khung điều khiển sinh dữ liệu tự động</p>
      </template>

      <template #content>
        <div class="field">
          <label for="prompt">1. Yêu cầu Hệ thống & Cấu trúc (Prompt STAGE):</label>
          <Textarea 
            id="prompt" 
            v-model="promptStage" 
            rows="8" 
            placeholder="Ví dụ: Bạn là AI Data Engineer. Hãy sinh dữ liệu chuẩn JSON..." 
            class="w-full"
          />
        </div>

        <div class="field">
          <label for="seeds">2. Tập Hạt giống (Seeds - Mỗi giá trị 1 dòng):</label>
          <Textarea 
            id="seeds" 
            v-model="seeds" 
            rows="5" 
            placeholder="Ví dụ:&#10;Quản lý bệnh viện&#10;Hệ thống Logistics&#10;Siêu thị E-commerce" 
            class="w-full"
          />
        </div>

        <div class="field slider-field">
          <label>3. Số lượng mẫu cho mỗi Hạt giống:</label>
          <div class="slider-container">
            <Slider v-model="numSamples" :min="1" :max="100" class="flex-grow" />
            <InputNumber v-model="numSamples" :min="1" :max="100" class="input-num" />
          </div>
        </div>

        <div class="action-bar">
          <Button 
            label="BẮT ĐẦU THU HOẠCH" 
            icon="pi pi-play" 
            size="large"
            :loading="isGenerating"
            @click="startHarvesting" 
            class="w-full"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
/* Trang trí một chút CSS cơ bản cho ứng dụng gọn gàng */
.app-container {
  display: flex;
  justify-content: center;
  padding: 2rem;
  font-family: sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.harvester-card {
  width: 100%;
  max-width: 800px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

h2 { margin-top: 0; margin-bottom: 0.5rem; color: #334155; }
.subtitle { color: #64748b; margin-top: 0; margin-bottom: 1.5rem; font-size: 0.9rem; }

.field {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label { font-weight: 600; color: #475569; }

.w-full { width: 100%; }
.flex-grow { flex-grow: 1; }

.slider-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.input-num { width: 4rem; }

.action-bar { margin-top: 2.5rem; }
</style>