<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Button from 'primevue/button';
import { api } from '@/api/client';

const router = useRouter();
const logs = ref([]);
const loading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  fetchLogs();
});

const fetchLogs = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await api.get('/api/logs?limit=200');
    logs.value = data;
  } catch (error) {
    // Nếu BE trả về 403, nghĩa là user không phải admin
    if (error.response && error.response.status === 403) {
      errorMessage.value = "Bạn không có quyền truy cập khu vực này!";
    } else {
      errorMessage.value = "Lỗi khi tải dữ liệu logs.";
    }
  } finally {
    loading.value = false;
  }
};

const getSeverity = (level) => {
  switch (level) {
    case 'INFO': return 'info';
    case 'WARNING': return 'warn';
    case 'ERROR': return 'danger';
    case 'CRITICAL': return 'danger';
    default: return 'secondary';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN');
};
</script>

<template>
  <div class="logs-wrapper">
    <div class="header-actions">
      <h2><i class="pi pi-receipt"></i> System Logs (Admin Only)</h2>
      <Button icon="pi pi-refresh" label="Làm mới" @click="fetchLogs" :loading="loading" size="small" />
    </div>

    <Message v-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <Card v-else class="logs-card">
      <template #content>
        <DataTable :value="logs" :loading="loading" paginator :rows="15"
                   dataKey="id" class="p-datatable-sm"
                   emptyMessage="Hệ thống đang hoạt động trơn tru, chưa có log nào.">

          <Column field="created_at" header="Thời gian" style="width: 20%">
            <template #body="slotProps">
              {{ formatDate(slotProps.data.created_at) }}
            </template>
          </Column>

          <Column field="level" header="Mức độ" style="width: 15%">
            <template #body="slotProps">
              <Tag :severity="getSeverity(slotProps.data.level)" :value="slotProps.data.level" />
            </template>
          </Column>

          <Column field="source" header="Nguồn (Source)" style="width: 15%"></Column>

          <Column field="message" header="Chi tiết (Message)" style="width: 50%">
            <template #body="slotProps">
              <div class="log-message">{{ slotProps.data.message }}</div>
            </template>
          </Column>

        </DataTable>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.logs-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  color: var(--p-red-500); /* Đổi màu để nhận diện trang nguy hiểm */
}

.logs-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.log-message {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  background-color: var(--p-surface-100);
  padding: 0.5rem;
  border-radius: 4px;
  white-space: pre-wrap; /* Giữ nguyên xuống dòng của lỗi */
  word-wrap: break-word;
  max-height: 150px;
  overflow-y: auto;
}
:global(.app-dark) .log-message {
  background-color: #1e1e1e;
}
</style>