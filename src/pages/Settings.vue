<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Select from 'primevue/select';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';
import { api } from '@/api/client';

const { t } = useI18n()
const router = useRouter();
const authStore = useAuthStore()
const toast     = useToast()
const apiConfigs = ref([]);
const loading = ref(false)

const filterProvider = ref('All');
const filterStatus = ref('All');
const searchQuery = ref('');

const newConfig = ref({
  provider: 'OpenRouter',
  api_key: '',
  model_name: ''
});

const providers = ref([
  { name: 'OpenRouter', code: 'OpenRouter' },
  { name: 'Groq', code: 'Groq' },
  { name: 'Gemini', code: 'Gemini' },
  { name: 'Cohere', code: 'Cohere' }
]);

const statusOptions = ref([
  { name: 'Tất cả trạng thái', code: 'All' },
  { name: 'Đang bật', code: 'Active' },
  { name: 'Đang tắt', code: 'Inactive' }
]);

const providerFilterOptions = computed(() => {
  return [{ name: 'Tất cả nhà cung cấp', code: 'All' }, ...providers.value];
});

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

const getFuzzyMatch = (text, query) => {
  if (!query) return { matched: true, matches: [] };
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let matches = [];
  let textIdx = 0;
  let queryIdx = 0;

  while (textIdx < text.length && queryIdx < query.length) {
    if (lowerText[textIdx] === lowerQuery[queryIdx]) {
      matches.push(textIdx);
      queryIdx++;
    }
    textIdx++;
  }
  return { matched: queryIdx === query.length, matches };
};

const filteredConfigs = computed(() => {
  return apiConfigs.value.filter(config => {
    const matchProvider = filterProvider.value === 'All' || config.provider === filterProvider.value;
    const matchStatus = filterStatus.value === 'All' || 
                       (filterStatus.value === 'Active' && config.is_active) || 
                       (filterStatus.value === 'Inactive' && !config.is_active);
    const fuzzy = getFuzzyMatch(config.model_name, searchQuery.value);
    return matchProvider && matchStatus && fuzzy.matched;
  });
});

const addConfig = async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  if (!newConfig.value.api_key || !newConfig.value.model_name) {
    toast.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: t('settings.alert_missing_fields'), life: 3000 })
    return
  }

  loading.value = true
  try {
    const created = await api.post('/api/configs', {
      provider: newConfig.value.provider,
      api_key: newConfig.value.api_key,
      model_name: newConfig.value.model_name
    })
    apiConfigs.value.push(created)
    newConfig.value.api_key    = ''
    newConfig.value.model_name = ''
    toast.add({ severity: 'success', summary: 'Đã thêm', detail: 'Cấu hình mới đã được lưu.', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.message, life: 3000 })
  } finally {
    loading.value = false
  }
};

const removeConfig = async (id) => {
  try {
    await api.delete(`/api/configs/${id}`)
    apiConfigs.value = apiConfigs.value.filter(c => c.id !== id)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.message, life: 3000 })
  }
};

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
            v-tooltip.top="$t('settings.harvester_tooltip')"
            @click="router.push('/harvesting')" 
          />
        </div>
        <p class="subtitle">{{ $t('settings.subtitle') }}</p>
      </template>

      <template #content>
        <div v-if="!authStore.isLoggedIn" class="login-notice">
          <i class="pi pi-lock"></i>
          <span>Bạn cần <a @click="router.push('/login')">đăng nhập</a> để lưu và quản lý cấu hình.</span>
        </div>

        <!-- Sử dụng BIẾN CUSTOM -->
        <div class="add-form-container">
          <div class="form-grid">
            <div class="field">
              <label>{{$t('settings.label_provider')}}</label>
              <Select v-model="newConfig.provider" :options="providers" optionLabel="name" optionValue="code" class="w-full" />
            </div>
            <div class="field">
              <label>{{$t('settings.label_api_key')}}</label>
              <Password v-model="newConfig.api_key" toggleMask :feedback="false" :placeholder="$t('settings.api_key_placeholder')" class="w-full" inputClass="w-full" />
            </div>
            <div class="field">
              <label>{{$t('settings.label_model_name')}}</label>
              <InputText v-model="newConfig.model_name" :placeholder="$t('settings.model_name_placeholder')" class="w-full" />
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

        <div class="toolbar-container">
          <div class="filter-group">
            <Select v-model="filterProvider" :options="providerFilterOptions" optionLabel="name" optionValue="code" placeholder="Lọc Nhà cung cấp" class="filter-select" />
            <Select v-model="filterStatus" :options="statusOptions" optionLabel="name" optionValue="code" placeholder="Trạng thái" class="filter-select" />
          </div>
          <IconField iconPosition="left" class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Tìm tên model (Ví dụ: nourse/hemes-3)..." class="w-full" />
          </IconField>
        </div>

        <div class="table-container">
          <DataTable :value="filteredConfigs" responsiveLayout="scroll" :emptyMessage="$t('settings.table_empty')" :loading="loading">
            <Column field="provider" :header="$t('settings.label_provider')" style="width: 20%"></Column>
            <Column :header="$t('settings.label_model_name')" style="width: 40%">
              <template #body="slotProps">
                <div class="model-name-display">
                  <template v-if="!searchQuery">
                    {{ slotProps.data.model_name }}
                  </template>
                  <template v-else>
                    <span v-for="(char, idx) in slotProps.data.model_name" :key="idx" 
                          :class="{ 'highlight': getFuzzyMatch(slotProps.data.model_name, searchQuery).matches.includes(idx) }">
                      {{ char }}
                    </span>
                  </template>
                </div>
              </template>
            </Column>
            <Column :header="$t('settings.col_status')" style="width: 20%">
              <template #body="slotProps">
                <Tag :severity="slotProps.data.is_active ? 'success' : 'danger'" :value="slotProps.data.is_active ? $t('settings.tag_active') : $t('settings.tag_inactive')" />
              </template>
            </Column>
            <Column :header="$t('settings.col_actions')" style="width: 20%; min-width: 150px">
              <template #body="slotProps">
                <Button 
                  :icon="slotProps.data.is_active ? 'pi pi-power-off' : 'pi pi-bolt'"
                  :severity="slotProps.data.is_active ? 'danger' : 'success'"
                  text rounded 
                  v-tooltip.top="$t('settings.toggle_tooltip')"
                  @click="toggleActive(slotProps.data)" 
                />
                <Button icon="pi pi-trash" severity="danger" text rounded @click="removeConfig(slotProps.data.id)" />
                <Button
                  label="Test" size="small" severity="info" outlined
                  style="margin-left: 0.5rem; padding: 0.2rem 0.6rem;"
                  v-tooltip.top="'Test thử kết nối và Model'"
                  @click="router.push(`/test-model/${slotProps.data.id}`)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.settings-wrapper { width: 100%; max-width: 900px; margin: 0 auto; padding-bottom: 2rem; }
.back-nav { margin-bottom: 1rem; }
.settings-card { box-shadow: 0 4px 20px rgba(0, 212, 255, 0.08); border: 1px solid var(--p-surface-200); border-radius: 16px; }
.header-title { display: flex; align-items: center; gap: 0.75rem; }
.header-title h2 { margin: 0; color: var(--p-primary-color); }
.subtitle { color: var(--p-text-color-secondary); font-size: 0.9rem; margin-top: 0.5rem; }

.login-notice { display: flex; align-items: center; gap: 0.5rem; background: var(--p-yellow-50); border: 1px solid var(--p-yellow-200); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--p-yellow-800); }
.login-notice a { font-weight: bold; cursor: pointer; text-decoration: underline; }

/* Sử dụng BIẾN CUSTOM */
.add-form-container { 
  background: var(--custom-bg); 
  padding: 1.5rem; 
  border-radius: 8px; 
  margin-bottom: 1.5rem; 
  border: 1px dashed var(--custom-border); 
}

.form-grid { display: grid; grid-template-columns: 1fr 2fr 2fr auto; gap: 1rem; align-items: end; }
.field { display: flex; flex-direction: column; gap: 0.5rem; }
.field label { font-weight: bold; font-size: 0.85rem; color: var(--custom-text); }

/* Toolbar styles */
.toolbar-container { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 0.5rem 0; border-top: 1px solid var(--custom-border); padding-top: 1.5rem; }
.filter-group { display: flex; gap: 10px; }
.filter-select { min-width: 180px; }
.search-field { flex: 1; max-width: 400px; }

/* Highlight styles */
.model-name-display { font-family: monospace; font-size: 0.95rem; color: var(--custom-text); }
.highlight { background-color: #a5f3fc; color: #000; border-radius: 2px; padding: 0 1px; }
:global(.app-dark) .highlight { background-color: #0e7490; color: #fff; }

.table-container { margin-top: 0.5rem; }
@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .toolbar-container { flex-direction: column; align-items: stretch; }
  .filter-group { flex-direction: column; }
}
</style>
