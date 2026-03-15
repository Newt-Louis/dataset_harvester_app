<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';

const { t } = useI18n()
const router = useRouter();
const authStore = useAuthStore()
const toast     = useToast()
// Danh sách cấu hình API
const apiConfigs = ref([]);
const loading = ref(false)

// Form thêm mới
const newConfig = ref({
  provider: 'OpenRouter',
  apiKey: '',
  modelName: ''
});

// Danh sách nhà cung cấp
const providers = ref([
  { name: 'OpenRouter', code: 'OpenRouter' },
  { name: 'Groq', code: 'Groq' },
  { name: 'Gemini', code: 'Gemini' },
  { name: 'Cohere', code: 'Cohere' }
]);

// Chạy khi mở trang: Load dữ liệu từ LocalStorage
onMounted(async () => {
  if (authStore.isLoggedIn) {
    await fetchConfigs();
  }
})
const fetchConfigs = async () => {
  loading.value = true
  try {
    apiConfigs.value = await api.get('/api/configs')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.message, life: 3000 })
  } finally {
    loading.value = false
  }
}

const addConfig = async () => {
  // Chưa đăng nhập → chuyển về trang login
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  if (!newConfig.value.apiKey || !newConfig.value.modelName) {
    toast.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: t('settings.alert_missing_fields'), life: 3000 })
    return
  }

  loading.value = true
  try {
    const created = await api.post('/api/configs', {
      provider: newConfig.value.provider,
      api_key: newConfig.value.apiKey,
      model_name: newConfig.value.modelName
    })
    apiConfigs.value.push(created)

    // Reset form
    newConfig.value.apiKey    = ''
    newConfig.value.modelName = ''

    toast.add({ severity: 'success', summary: 'Đã thêm', detail: 'Cấu hình mới đã được lưu.', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.message, life: 3000 })
  } finally {
    loading.value = false
  }
};

// Hàm xóa cấu hình
const removeConfig = async (id) => {
  try {
    await api.delete(`/api/configs/${id}`)
    apiConfigs.value = apiConfigs.value.filter(c => c.id !== id)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.message, life: 3000 })
  }
};

// Hàm bật/tắt cấu hình
const toggleActive = async (config) => {
  try {
    const updated = await api.patch(`/api/configs/${config.id}/toggle`)
    config.is_active = updated.is_active
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.message, life: 3000 })
  }
};
</script>

<template>
  <div class="settings-wrapper">
    <div class="back-nav">
      <Button icon="pi pi-arrow-left" :label="$t('app.home_back')" text @click="router.push('/')" />
    </div>

    <Card class="settings-card">
      <template #title>
        <div class="card-header">
          <div class="header-title">
            <i class="pi pi-cog" style="font-size: 1.5rem; color: var(--p-primary-color);"></i>
            <h2>{{$t('app.keys_models_manage')}}</h2>
          </div>
          
          <Button 
            icon="pi pi-database" 
            severity="secondary" 
            rounded text size="large"
            :v-tooltip.top="$t('settings.harvester_tooltip')"
            @click="router.push('/harvesting')" 
          />
        </div>
        <p class="subtitle">{{ $t('settings.subtitle') }}</p>
      </template>

      <template #content>
        <!-- Banner nhắc đăng nhập nếu chưa auth -->
        <div v-if="!authStore.isLoggedIn" class="login-notice">
          <i class="pi pi-lock"></i>
          <span>Bạn cần <a @click="router.push('/login')">đăng nhập</a> để lưu và quản lý cấu hình.</span>
        </div>

        <div class="add-form-container">
          <div class="form-grid">
            <div class="field">
              <label>{{$t('settings.label_provider')}}</label>
              <Select v-model="newConfig.provider" :options="providers" optionLabel="name" optionValue="code" class="w-full" />
            </div>
            
            <div class="field">
              <label>{{$t('settings.label_api_key')}}</label>
              <Password v-model="newConfig.apiKey" toggleMask :feedback="false" :placeholder="$t('settings.api_key_placeholder')" class="w-full" inputClass="w-full" />
            </div>

            <div class="field">
              <label>{{$t('settings.label_model_name')}}</label>
              <InputText v-model="newConfig.modelName" :placeholder="$t('settings.model_name_placeholder')" class="w-full" />
            </div>
            
            <div class="field btn-field">
              <Button
                :label="authStore.isLoggedIn ? $t('settings.add_btn') : 'Đăng nhập để lưu'"
                :icon="authStore.isLoggedIn ? 'pi pi-plus' : 'pi pi-sign-in'"
                :loading="loading"
                @click="addConfig"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <div class="table-container">
          <DataTable :value="apiConfigs" responsiveLayout="scroll" :emptyMessage="$t('settings.table_empty')">
            <Column field="provider" :header="$t('settings.label_provider')" style="width: 15%"></Column>
            <Column field="modelName" :header="$t('settings.label_model_name')" style="width: 35%"></Column>
            <Column :header="$t('settings.col_status')" style="width: 15%">
              <template #body="slotProps">
                <Tag :severity="slotProps.data.isActive ? 'success' : 'danger'" :value="slotProps.data.isActive ? $t('settings.tag_active') : $t('settings.tag_inactive')" />
              </template>
            </Column>
            <Column :header="$t('settings.col_actions')" style="width: 35%; text-align: right;">
              <template #body="slotProps">
                <Button 
                  :icon="slotProps.data.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'" 
                  :severity="slotProps.data.isActive ? 'secondary' : 'info'"
                  text rounded 
                  :v-tooltip.top="$t('settings.toggle_tooltip')"
                  @click="toggleActive(slotProps.data)" 
                />
                <Button icon="pi pi-trash" severity="danger" text rounded @click="removeConfig(slotProps.data.id)" />
              </template>
            </Column>
          </DataTable>
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
.settings-wrapper {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.back-nav { margin-bottom: 1rem; }

.settings-card {
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.08);
  border: 1px solid var(--p-surface-200);
  border-radius: 16px;
}

:global(.app-dark) .settings-card {
  border: 1px solid var(--p-surface-800);
}

.header-title { display: flex; align-items: center; gap: 0.75rem; }
.header-title h2 {margin: 0; color: var(--p-primary-color);}
.subtitle { color: var(--p-text-color-secondary); font-size: 0.9rem; margin-top: 0.5rem; }

/* Banner nhắc đăng nhập */
.login-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--p-yellow-50);
  border: 1px solid var(--p-yellow-200);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: var(--p-yellow-800);
}

.add-form-container {
  background: var(--p-surface-50);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px dashed var(--p-surface-300);
}

:global(.app-dark) .add-form-container {
  background: rgba(255, 255, 255, 0.02);
  border-color: var(--p-surface-700);
}

.login-notice a {
  font-weight: bold;
  cursor: pointer;
  text-decoration: underline;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr auto;
  gap: 1rem;
  align-items: end;
}

.field { display: flex; flex-direction: column; gap: 0.5rem; }
.field label { font-weight: bold; font-size: 0.85rem; }

.key-masked {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--p-text-color-secondary);
}

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
}

.table-container { margin-top: 1rem; }
</style>