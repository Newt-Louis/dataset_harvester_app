<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Slider from 'primevue/slider';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';
import Message from 'primevue/message';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import { api } from '@/api/client';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// ==========================================
// STATE: KHỐI TĨNH (STATIC PROMPTS)
// ==========================================
const rolePrompt = ref('Bạn là một AI Data Engineer cấp Senior. Nhiệm vụ của bạn là sinh ra CHÍNH XÁC {{samples}} mẫu JSON để huấn luyện model Text-to-SQL.');
const constraintsPrompt = ref('1. Phần "reasoning" KHÔNG được viết văn dài. BẮT BUỘC dùng format gạch đầu dòng siêu ngắn (Bullet assumptions + Join plan).\n2. TÍNH ĐA DẠNG: Tuyệt đối không lặp lại câu hỏi của người dùng. Hãy thay đổi văn phong (lịch sự, cộc lốc, sai chính tả nhẹ).');

// Format và Schema
const outputFormat = ref('jsonl');
const formatOptions = [
  { label: 'JSONL (.jsonl)', value: 'jsonl' },
  { label: 'CSV (.csv)', value: 'csv' }
];
const outputSchema = ref('{\n  "data": [\n    {\n      "system": "string",\n      "user": "string",\n      "reasoning": "string",\n      "sql": "string"\n    }\n  ]\n}');

// ==========================================
// STATE: KHỐI ĐỘNG (DYNAMIC SEEDS)
// ==========================================
// Mặc định tạo sẵn 1 khối Seed trống hoặc có data mẫu
const seeds = ref([
  {
    context: 'Sử dụng MySQL. Các bảng lõi gồm:\n- `users` (id, name, phone, created_at)\n- `orders` (id, user_id, total_amount, status)',
    rule: '- Khoảng 80% mẫu: Truy vấn MySQL độ khó cơ bản (SELECT, JOIN, WHERE, GROUP BY).\n- Khoảng 20% mẫu (ít nhất 1): Bài toán đố IQ tính toán phần trăm, lợi nhuận. Phần "sql" trả về rỗng "".'
  }
]);

const numSamples = ref(10);
const isGenerating = ref(false);

// ==========================================
// LOGIC: XỬ LÝ KHỐI ĐỘNG
// ==========================================
const addSeed = () => {
  seeds.value.push({ context: '', rule: '' });
};

const removeSeed = (index) => {
  if (seeds.value.length > 1) {
    seeds.value.splice(index, 1);
  } else {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Phải có ít nhất 1 Hạt giống!', life: 3000 });
  }
};

const cloneSeed = (index) => {
  const cloned = { ...seeds.value[index] };
  seeds.value.splice(index + 1, 0, cloned);
};

// ==========================================
// COMPUTED: DỰ BÁO SẢN LƯỢNG
// ==========================================
const validSeedsCount = computed(() => {
  return seeds.value.filter(s => s.rule.trim() !== '').length;
});

const totalExpectedSamples = computed(() => {
  return validSeedsCount.value * numSamples.value;
});

// ==========================================
// HÀM GỬI API
// ==========================================
const startHarvesting = async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  // Lọc bỏ những seed mà người dùng quên nhập Rule
  const cleanSeeds = seeds.value.filter(s => s.rule.trim() !== '');
  if (cleanSeeds.length === 0) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Vui lòng nhập Chiến thuật phân bổ cho ít nhất 1 hạt giống!', life: 4000 });
    return;
  }

  isGenerating.value = true;
  
  const payload = {
    role_prompt: rolePrompt.value,
    constraints_prompt: constraintsPrompt.value,
    schema_definition: outputSchema.value,
    seeds: cleanSeeds,
    format: outputFormat.value,
    samples: numSamples.value
  };

  try {
    const response = await api.post('/api/generate', payload);
    // Nếu BE trả về 200 (Thành công đưa vào hàng đợi)
    toast.add({ severity: 'success', summary: 'Thành công', detail: response.message || 'Đã đưa vào hàng đợi chạy nền!', life: 5000 });
    
    // Đẩy người dùng sang trang Dashboard để xem tiến độ luôn!
    setTimeout(() => {
        router.push('/dashboard');
    }, 1500);

  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Lỗi', detail: error.response?.data?.detail || error.message || 'Không thể bắt đầu thu hoạch.', life: 5000 });
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <div class="harvester-page-wrapper">
    <!-- Header Back -->
    <div class="back-nav">
      <Button icon="pi pi-arrow-left" label="Quay lại" text @click="router.push('/')" :disabled="isGenerating" />
    </div>

    <Card class="harvester-card">
      <template #title>
        <div class="card-header">
          <div class="header-title">
            <i class="pi pi-database" style="font-size: 1.5rem; color: var(--p-primary-color);"></i>
            <h2>{{ $t('app.prompt_dataset_harvester') }}</h2>
          </div>
          <Button icon="pi pi-cog" severity="secondary" rounded text size="large" v-tooltip.top="'Cấu hình API Keys'" @click="router.push('/settings')" :disabled="isGenerating" />
        </div>
      </template>

      <template #content>
        <!-- KHỐI 1: KHUNG PHÁP LÝ (STATIC) -->
        <div class="section-block">
          <h3 class="section-title"><i class="pi pi-shield"></i> Khung Pháp Lý (Master Prompts)</h3>
          
          <div class="field">
            <label for="rolePrompt">Vai trò & Nhiệm vụ</label>
            <Textarea id="rolePrompt" v-model="rolePrompt" rows="2" class="w-full" :disabled="isGenerating" />
          </div>

          <div class="field">
            <label for="constraintsPrompt">Ràng buộc Nghiêm ngặt</label>
            <Textarea id="constraintsPrompt" v-model="constraintsPrompt" rows="3" class="w-full" :disabled="isGenerating" />
          </div>
        </div>

        <!-- KHỐI 2: HẠT GIỐNG ĐỘNG (DYNAMIC SEEDS) -->
        <div class="section-block seed-container">
          <div class="seed-header-wrap">
            <h3 class="section-title"><i class="pi pi-sitemap"></i> Danh sách Hạt giống (Seeds)</h3>
            <Button label="Thêm Hạt giống" icon="pi pi-plus" size="small" outlined @click="addSeed" :disabled="isGenerating" />
          </div>
          <p class="hint-text">Mỗi hạt giống tương ứng với 1 lượt gọi API. Hãy chia nhỏ bối cảnh để AI tạo ra dữ liệu đa dạng nhất.</p>

          <div v-for="(seed, index) in seeds" :key="index" class="seed-item">
            <div class="seed-item-header">
              <span class="seed-badge">Hạt giống #{{ index + 1 }}</span>
              <div class="seed-actions">
                <Button icon="pi pi-copy" severity="secondary" text rounded size="small" v-tooltip.top="'Nhân bản'" @click="cloneSeed(index)" :disabled="isGenerating" />
                <Button icon="pi pi-trash" severity="danger" text rounded size="small" v-tooltip.top="'Xóa'" @click="removeSeed(index)" :disabled="isGenerating" />
              </div>
            </div>

            <div class="field">
              <label>Bối cảnh / Schema Context (Có thể bỏ trống)</label>
              <Textarea v-model="seed.context" rows="2" class="w-full" placeholder="VD: Sử dụng MySQL. Bảng: users, orders..." :disabled="isGenerating" />
            </div>

            <div class="field mb-0">
              <label>Chiến thuật Phân bổ (BẮT BUỘC)</label>
              <Textarea v-model="seed.rule" rows="3" class="w-full" placeholder="VD: 80% truy vấn khó, 20% gài bẫy lỗi..." :disabled="isGenerating" />
            </div>
          </div>
        </div>

        <!-- KHỐI 3: SCHEMA & SỐ LƯỢNG -->
        <div class="section-block">
          <h3 class="section-title"><i class="pi pi-box"></i> Định dạng & Khối lượng</h3>

          <div class="field schema-section">
            <div class="schema-header">
              <label for="schema">Cấu trúc JSON đầu ra</label>
              <SelectButton v-model="outputFormat" :options="formatOptions" optionLabel="label" optionValue="value" :allowEmpty="false" class="format-selector" :disabled="isGenerating" />
            </div>
            <Textarea id="schema" v-model="outputSchema" rows="6" class="w-full code-font" :disabled="isGenerating" />
          </div>

          <div class="field slider-field mt-4">
            <label>Số lượng mẫu (Samples) / Mỗi Hạt giống:</label>
            <div class="slider-container">
              <Slider v-model="numSamples" :min="1" :max="100" class="flex-grow" :disabled="isGenerating" />
              <InputNumber v-model="numSamples" :min="1" :max="100" inputClass="fixed-width-input" :disabled="isGenerating" />
            </div>
          </div>
        </div>

        <!-- KHỐI 4: DỰ BÁO VÀ CHẠY -->
        <div class="action-bar">
          <Message severity="info" :closable="false" class="w-full forecast-msg">
            <div class="forecast-content">
              <strong>Dự báo Thu hoạch:</strong> 
              Hệ thống sẽ chạy <b>{{ validSeedsCount }} Hạt giống</b>, mỗi hạt giống sinh <b>{{ numSamples }} mẫu</b>.
              <br>Tổng sản lượng tối đa: <span class="highlight-total">{{ totalExpectedSamples }} dòng dữ liệu</span>.
            </div>
          </Message>

          <Button
            :label="isGenerating ? 'Hệ thống đang chạy...' : (authStore.isLoggedIn ? 'BẮT ĐẦU THU HOẠCH' : 'Đăng nhập để bắt đầu')"
            :icon="isGenerating ? 'pi pi-spin pi-cog' : (authStore.isLoggedIn ? 'pi pi-bolt' : 'pi pi-sign-in')"
            size="large"
            :loading="isGenerating"
            @click="startHarvesting"
            class="w-full run-btn"
            :disabled="isGenerating"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
/* =========================================
   1. LAYOUT CHUNG (WRAPPER & CARD)
   ========================================= */
.harvester-page-wrapper {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.back-nav {
  margin-bottom: 1rem;
}

.harvester-card {
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.08);
  border: 1px solid var(--p-surface-200);
  border-radius: 16px;
}
:global(.app-dark) .harvester-card {
  border-color: var(--p-surface-800);
}

/* =========================================
   2. HEADER COMPONENT
   ========================================= */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.header-title h2 {
  margin: 0;
  color: var(--p-primary-color);
}

/* =========================================
   3. SECTION BLOCKS (KHỐI CHỨA TỪNG PHẦN)
   ========================================= */
.section-block {
  background: var(--p-surface-50);
  border: 1px solid var(--p-surface-200);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
:global(.app-dark) .section-block {
  background: var(--p-surface-900);
  border-color: var(--p-surface-700);
}

.section-title {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: var(--p-text-color);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid var(--p-surface-200);
  padding-bottom: 0.5rem;
}
:global(.app-dark) .section-title {
  border-color: var(--p-surface-700);
}

/* =========================================
   4. HẠT GIỐNG (SEED ITEMS)
   ========================================= */
.seed-header-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.seed-item {
  background: var(--p-surface-0);
  border: 1px dashed var(--p-surface-300);
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
}
.seed-item:hover {
  border-color: var(--p-primary-color);
}
:global(.app-dark) .seed-item {
  background: var(--p-surface-800);
  border-color: var(--p-surface-600);
}

.seed-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.seed-badge {
  background: var(--p-primary-color);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

/* =========================================
   5. FORM ELEMENTS (FIELDS, TEXTAREAS, SLIDERS)
   ========================================= */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
}

.field label {
  display: block;
  margin-bottom: 0.2rem;
  font-weight: 600;
  color: var(--p-text-color);
  font-size: 0.95rem;
}

.w-full {
  width: 100%;
}

.mb-0 { margin-bottom: 0 !important; }
.mt-4 { margin-top: 1rem !important; }

.hint-text {
  color: var(--p-text-color-secondary);
  font-size: 0.85rem;
  font-style: italic;
  margin-bottom: 1rem;
  margin-top: -1rem;
}

/* =========================================
   6. SCHEMA & FORMATTING
   ========================================= */
.schema-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.format-selector {
  transform: scale(0.85);
  transform-origin: right center;
}

.code-font {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  background-color: var(--p-surface-100);
}
:global(.app-dark) .code-font {
  background-color: #08111c;
}

/* =========================================
   7. SLIDER CHO SAMPLES
   ========================================= */
.slider-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
  width: 100%;
}

.flex-grow {
  flex-grow: 1;
}

:deep(.fixed-width-input) {
  width: 6rem !important;
  text-align: center;
}

/* =========================================
   8. DỰ BÁO VÀ NÚT CHẠY (FORECAST & ACTIONS)
   ========================================= */
.action-bar {
  margin-top: 2rem;
}

.forecast-msg {
  border-left: 4px solid var(--p-primary-color);
  margin-bottom: 16px;
}

.forecast-content {
  font-size: 0.95rem;
  line-height: 1.5;
}

.highlight-total {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--p-primary-color);
}

.run-btn {
  height: 3.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 1px;
}

/* =========================================
   9. RESPONSIVE (MOBILE)
   ========================================= */
@media (max-width: 768px) {
  .schema-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .slider-container {
    flex-wrap: wrap;
  }
}
</style>