<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { api } from '@/api/client';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const configId = route.params.id;
const currentConfig = ref(null);

// Form dữ liệu Test (Mock 1 phần nhỏ của Harvester)
const rolePrompt = ref('Bạn là một AI Data Engineer cấp Senior. Hãy trả về kết quả định dạng JSON.');
const constraintsPrompt = ref('Tuyệt đối không giải thích dài dòng. Chỉ trả về JSON thuần túy.');
const outputSchema = ref('{\n  "test_msg": "string",\n  "status": "string"\n}');

const schemaError = ref(false);
const SUPPORTED_TYPES = ['string', 'number', 'integer', 'float', 'boolean', 'date', 'datetime', 'array', 'object', 'null'];

const validateSchema = () => {
  try {
    const parsed = JSON.parse(outputSchema.value);
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      throw new Error('Schema phải là một JSON Object phẳng. Ví dụ: {"tên_cột": "string", "tuổi": "number"}');
    }
    const keys = Object.keys(parsed);
    if (keys.length === 0) {
      throw new Error('Schema phải có ít nhất 1 cặp "key": "kiểu dữ liệu".');
    }
    for (const key of keys) {
      const val = String(parsed[key]).toLowerCase();
      if (!SUPPORTED_TYPES.includes(val)) {
        throw new Error(`Giá trị "${parsed[key]}" của key "${key}" không hợp lệ.\nKiểu được hỗ trợ: ${SUPPORTED_TYPES.join(', ')}.`);
      }
    }
    schemaError.value = false;
    return true;
  } catch (e) {
    schemaError.value = true;
    toast.add({ severity: 'error', summary: 'Schema không hợp lệ', detail: e.message, life: 5000 });
    return false;
  }
};
const seedContext = ref('Sử dụng bối cảnh: Hệ thống đang được test kết nối API.');
const seedRule = ref('Sinh ra 1 mẫu JSON chào hỏi đơn giản để xác nhận model hoạt động tốt.');

// Trạng thái Test
const isTesting = ref(false);
const testResult = ref('');
const testStatus = ref('idle');

onMounted(async () => {
  currentConfig.value = { id: configId, name: `Config #${configId}` };
});
const extractData = (res) => {
  if (res === null || res === undefined) return null;
  if (typeof res === 'string') {
      try { res = JSON.parse(res); } catch { return res; }
    }
  if (Array.isArray(res)) return res;

  if (res?.data !== undefined) {
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.data !== undefined) return res.data.data;
    return res.data;
  }

  if (typeof res === 'object') return res;

  return null;
};
const runTest = async () => {
  if (!seedRule.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng nhập quy tắc (Rule) để test!', life: 3000 });
    return;
  }

  if (!validateSchema()) return;

  isTesting.value = true;
  testStatus.value = 'idle';
  testResult.value = 'Đang gửi yêu cầu đến LLM... Vui lòng chờ...';

  const payload = {
    role_prompt: rolePrompt.value,
    constraints_prompt: constraintsPrompt.value,
    schema_definition: outputSchema.value,
    seed: {
      context: seedContext.value,
      rule: seedRule.value
    }
  };

  try {
    const response = await api.post(`/api/configs/${configId}/test`, payload);

    testStatus.value = 'success';
    const result = extractData(response);
    testResult.value = JSON.stringify(result, null, 2);

    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Model phản hồi tốt!', life: 3000 });

  } catch (error) {
    testStatus.value = 'error';
    const errorDetail = error.response?.data?.detail || error.message || 'Lỗi không xác định';
    testResult.value = `[THẤT BẠI] - Không thể lấy dữ liệu.\n\nNguyên nhân:\n${JSON.stringify(errorDetail, null, 2)}`;
    toast.add({ severity: 'error', summary: 'Lỗi API', detail: 'Vui lòng xem chi tiết trên màn hình', life: 5000 });
  } finally {
    isTesting.value = false;
  }
};
</script>

<template>
  <div class="test-page-wrapper">
    <div class="back-nav">
      <Button icon="pi pi-arrow-left" label="Trở về Cấu hình" text @click="router.push('/settings')" :disabled="isTesting" />
    </div>

    <div class="layout-grid">
      <div class="input-panel">
        <Card class="harvester-card h-full">
          <template #title>
            <div class="card-header">
              <div class="header-title">
                <i class="pi pi-wrench" style="font-size: 1.5rem; color: var(--p-primary-color);"></i>
                <h2>Mock Test Thu Hoạch</h2>
              </div>
              <Tag severity="info" :value="`Config ID: ${configId}`" />
            </div>
            <p class="subtitle">Chạy thử nghiệm Model để kiểm tra độ ổn định và định dạng trả về.</p>
          </template>

          <template #content>
            <div class="field">
              <label>Vai trò (Role)</label>
              <Textarea v-model="rolePrompt" rows="2" class="w-full" :disabled="isTesting" />
            </div>

            <div class="field">
              <label>Ràng buộc (Constraints)</label>
              <Textarea v-model="constraintsPrompt" rows="2" class="w-full" :disabled="isTesting" />
            </div>

            <div class="field">
              <label>Schema JSON Mong muốn</label>
              <Textarea v-model="outputSchema" rows="4" class="w-full code-font" :class="{ 'schema-error': schemaError }" :disabled="isTesting" />
              <small class="schema-hint">Chỉ nhập 1 object phẳng. VD: <code>{"tên": "string", "điểm": "number"}</code></small>
            </div>

            <div class="seed-block">
              <h4 class="seed-title">Hạt giống Đơn (Single Seed)</h4>
              <div class="field">
                <label>Bối cảnh (Context)</label>
                <Textarea v-model="seedContext" rows="2" class="w-full" :disabled="isTesting" />
              </div>
              <div class="field mb-0">
                <label>Quy tắc test (Rule)</label>
                <Textarea v-model="seedRule" rows="2" class="w-full border-primary" :disabled="isTesting" />
              </div>
            </div>

            <div class="mt-4">
              <Button
                label="GỬI YÊU CẦU TEST"
                icon="pi pi-send"
                class="w-full test-btn"
                size="large"
                :loading="isTesting"
                @click="runTest"
              />
            </div>
          </template>
        </Card>
      </div>

      <div class="output-panel">
        <Card class="harvester-card h-full console-card">
          <template #title>
            <h3>Kết quả trả về (Raw Response)</h3>
          </template>
          <template #content>
            <div
              class="console-box"
              :class="{ 'status-success': testStatus === 'success', 'status-error': testStatus === 'error' }"
            >
              <pre v-if="testResult">{{ testResult }}</pre>
              <div v-else class="empty-console">
                <i class="pi pi-code"></i>
                <p>Nhấn "Gửi yêu cầu test" để xem Model trả về gì nhé!</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-page-wrapper {
  width: 100%;
  max-width: 1200px; /* To hơn chút để chia 2 cột */
  margin: 0 auto;
  padding-bottom: 2rem;
}

.back-nav { margin-bottom: 1rem; }

.layout-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: stretch;
}

@media (max-width: 992px) {
  .layout-grid {
    grid-template-columns: 1fr; /* Mobile rớt xuống 1 cột */
  }
}

.harvester-card {
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.08);
  border: 1px solid var(--p-surface-200);
  border-radius: 16px;
}
:global(.app-dark) .harvester-card { border-color: var(--p-surface-800); }

.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-title { display: flex; align-items: center; gap: 0.75rem; }
.header-title h2 { margin: 0; color: var(--p-primary-color); font-size: 1.3rem; }
.subtitle { color: var(--p-text-color-secondary); font-size: 0.9rem; margin-top: 0.5rem; }

.field { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.field label { font-weight: 600; font-size: 0.9rem; color: var(--p-text-color); }
.w-full { width: 100%; }
.mt-4 { margin-top: 1.5rem; }
.mb-0 { margin-bottom: 0; }

.code-font {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  background-color: var(--p-surface-100);
}
:global(.app-dark) .code-font { background-color: var(--p-surface-950); }

:deep(.schema-error.p-textarea) {
  border-color: var(--p-red-500) !important;
  box-shadow: 0 0 0 1px var(--p-red-500);
}

.schema-hint {
  color: var(--p-text-color-secondary);
  font-size: 0.8rem;
  margin-top: -0.3rem;
}

.seed-block {
  background: var(--p-surface-50);
  padding: 1rem;
  border-radius: 8px;
  border: 1px dashed var(--p-surface-300);
  margin-top: 1rem;
}
:global(.app-dark) .seed-block { background: var(--p-surface-900); border-color: var(--p-surface-700); }

.seed-title { margin-top: 0; margin-bottom: 1rem; font-size: 1rem; color: var(--p-primary-color); }
.border-primary { border-left: 3px solid var(--p-primary-color); }

/* ==== CONSOLE OUTPUT STYLING ==== */
.console-card :deep(.p-card-body) { height: 100%; display: flex; flex-direction: column; }
.console-card :deep(.p-card-content) { flex-grow: 1; display: flex; flex-direction: column; padding-bottom: 0;}

.console-box {
  flex-grow: 1;
  min-height: 400px;
  background-color: var(--p-surface-950);
  border-radius: 8px;
  padding: 1rem;
  overflow-y: auto;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

/* Hiệu ứng màu viền theo trạng thái */
.console-box.status-success { border-color: var(--p-green-500); }
.console-box.status-error { border-color: var(--p-red-500); }

.console-box pre {
  margin: 0;
  color: #d4d4d4;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap; /* Tự động xuống dòng nếu JSON quá dài */
  word-wrap: break-word;
}

/* Chữ đỏ nếu có lỗi */
.console-box.status-error pre { color: #ff6b6b; }

.empty-console {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6e6e6e;
}
.empty-console i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
</style>