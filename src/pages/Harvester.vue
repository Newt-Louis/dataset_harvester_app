<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Slider from 'primevue/slider';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import axios from 'axios';

const router = useRouter();
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
  console.log(payload);
  const response = await axios.post('/api/generate',payload);
  if (response.status === 200) {
    console.log(response.data);
  }
};
</script>

<template>
    <div class="harvester-page-wrapper">
        <div class="back-nav">
        <Button icon="pi pi-arrow-left" :label="$t('app.home_back')" text @click="router.push('/')" />
    </div>
    <Card class="harvester-card">
      <template #title>
        <div class="card-header">
          <div class="header-title">
            <i class="pi pi-database" style="font-size: 1.5rem; color: var(--p-primary-color);"></i>
            <h2>{{ $t('app.prompt_dataset_harvester') }}</h2>
          </div>
          
          <Button 
            icon="pi pi-cog" 
            severity="secondary" 
            rounded 
            text 
            size="large"
            v-tooltip.top="'Cấu hình API Keys'"
            @click="router.push('/settings')" 
          />
        </div>
      </template>

      <template #content>
        <div class="field">
          <label for="prompt">{{ $t('harvester.step1_label') }}</label>
          <Textarea id="prompt" v-model="promptStage" rows="4" :placeholder="$t('harvester.step1_placeholder')" class="w-full" />
        </div>

        <div class="field">
          <label for="seeds">{{ $t('harvester.step2_label') }}</label>
          <Textarea id="seeds" v-model="seeds" rows="3" :placeholder="$t('harvester.step2_placeholder')" class="w-full" />
        </div>

        <div class="field schema-section">
          <div class="schema-header">
            <label for="schema">{{ $t('harvester.step3_label') }}</label>
            <SelectButton v-model="outputFormat" :options="formatOptions" optionLabel="label" optionValue="value" :allowEmpty="false" class="format-selector" />
          </div>
          <Textarea id="schema" v-model="outputSchema" rows="5" class="w-full code-font" />
          <small class="hint-text">{{ $t('harvester.step3_hint') }}</small>
        </div>

        <div class="field slider-field">
          <label>{{ $t('harvester.step4_label') }}</label>
          <div class="slider-container">
            <Slider v-model="numSamples" :min="1" :max="100" class="flex-grow" />
            <InputNumber v-model="numSamples" :min="1" :max="100" inputClass="fixed-width-input" />
          </div>
        </div>

        <div class="action-bar">
          <Button 
            :label="$t('harvester.run_btn')" 
            icon="pi pi-bolt" 
            size="large"
            :loading="isGenerating"
            @click="startHarvesting" 
            class="w-full run-btn"
          />
        </div>
      </template>
    </Card>
    </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.harvester-page-wrapper {
  width: 100%;
  max-width: 800px;
  margin: 0 auto; /* Tự động căn giữa màn hình */
}
.back-nav {
  margin-bottom: 1rem;
}
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
@media (max-width: 768px) {
  .schema-header {
    flex-direction: column; /* Đẩy cục chọn định dạng xuống dòng mới */
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .slider-container {
    flex-wrap: wrap; /* Nếu thanh trượt bị kẹt, cho phép nó rớt dòng */
  }
}
</style>