<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Slider from 'primevue/slider';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';

// --- STATE: DỮ LIỆU FORM ---
const promptStage = ref('');
const seeds = ref('');
const numSamples = ref(10);
const isGenerating = ref(false);

// Format và Schema
const outputFormat = ref('jsonl');
const formatOptions = [
  { label: 'JSONL (.jsonl)', value: 'jsonl' },
  { label: 'CSV (.csv)', value: 'csv' }
];

const outputSchema = ref('{\n  "system": "string",\n  "user": "string",\n  "reasoning": "string",\n  "sql": "string"\n}');

// --- HÀM GỬI API ---
const startHarvesting = async () => {
  isGenerating.value = true;
  const seedArray = seeds.value.split('\n').filter(s => s.trim() !== '');
  
  const payload = { 
    prompt: promptStage.value, 
    seeds: seedArray, 
    schema: outputSchema.value,
    format: outputFormat.value,
    samples: numSamples.value 
  };
  
  console.log("Đang gửi Payload siêu xịn:", payload);
  setTimeout(() => { isGenerating.value = false; }, 2000);
};
</script>

<template>
    <Card class="harvester-card">
      <template #title>
        <div class="header-title">
          <i class="pi pi-database" style="font-size: 1.5rem; color: var(--p-primary-color);"></i>
          <h2>AI Dataset Harvester</h2>
        </div>
      </template>

      <template #content>
        <div class="field">
          <label for="prompt">1. Yêu cầu Hệ thống & Vai trò (System Prompt):</label>
          <Textarea id="prompt" v-model="promptStage" rows="4" placeholder="VD: Bạn là chuyên gia SQL..." class="w-full" />
        </div>

        <div class="field">
          <label for="seeds">2. Tập Hạt giống (Seeds - Mỗi giá trị 1 dòng):</label>
          <Textarea id="seeds" v-model="seeds" rows="3" placeholder="VD: Bệnh viện&#10;Trường học" class="w-full" />
        </div>

        <div class="field schema-section">
          <div class="schema-header">
            <label for="schema">3. Cấu trúc đầu ra (JSON Keys):</label>
            <SelectButton v-model="outputFormat" :options="formatOptions" optionLabel="label" optionValue="value" :allowEmpty="false" class="format-selector" />
          </div>
          <Textarea id="schema" v-model="outputSchema" rows="5" class="w-full code-font" />
          <small class="hint-text">*Hệ thống sẽ luôn ép AI sinh JSON theo cấu trúc này. Nếu bạn chọn CSV, hệ thống tự động lấy các Keys làm tiêu đề cột.*</small>
        </div>

        <div class="field slider-field">
          <label>4. Số lượng mẫu (Samples) / Hạt giống:</label>
          <div class="slider-container">
            <Slider v-model="numSamples" :min="1" :max="100" class="flex-grow" />
            <InputNumber v-model="numSamples" :min="1" :max="100" inputClass="fixed-width-input" />
          </div>
        </div>

        <div class="action-bar">
          <Button 
            label="BẮT ĐẦU THU HOẠCH" 
            icon="pi pi-bolt" 
            size="large"
            :loading="isGenerating"
            @click="startHarvesting" 
            class="w-full run-btn"
          />
        </div>
      </template>
    </Card>
</template>

<style scoped>

.harvester-card {
  width: 100%;
  max-width: 800px;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.08);
  border: 1px solid var(--p-surface-200);
  border-radius: 16px;
}

:global(.app-dark) .harvester-card {
  border: 1px solid var(--p-surface-800);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.header-title h2 { margin: 0; }

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.field label { font-weight: 600; font-size: 0.95rem; }

.w-full { width: 100%; }
.flex-grow { flex-grow: 1; }

/* Khu vực Schema */
.schema-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.format-selector { transform: scale(0.85); transform-origin: right center; }
.code-font {
  font-family: 'Courier New', Courier, monospace;
  background-color: var(--p-surface-100);
}
.app-dark .code-font {
  background-color: #08111c;
}
.hint-text { color: var(--p-text-color-secondary); font-style: italic; }

.slider-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
  width: 100%;
}

:deep(.fixed-width-input) {
  width: 6rem !important;
  text-align: center;
}

.action-bar { margin-top: 2rem; }
.run-btn { font-weight: bold; letter-spacing: 1px; }
</style>