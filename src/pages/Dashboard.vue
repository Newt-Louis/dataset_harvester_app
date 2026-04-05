<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const jobs = ref([]);
let pollingInterval = null;
const isStopping = ref(false);
const isCleaning = ref(false);
const logContainers = ref({}); // Lưu tham chiếu đến các khung log để cuộn

// Hàm gọi API lấy dữ liệu
const fetchJobs = async () => {
  try {
    const response = await api.get('/');
    if (response.is_authenticated && response.jobs) {
      jobs.value = response.jobs;
    }
  } catch (error) {
    console.error("Lỗi cập nhật Dashboard:", error);
  }
};

// Theo dõi thay đổi của jobs để tự động cuộn log xuống cuối
watch(jobs, () => {
  nextTick(() => {
    Object.values(logContainers.value).forEach(el => {
      if (el) el.scrollTop = el.scrollHeight;
    });
  });
}, { deep: true });

// Hàm xử lý khi bấm nút Dừng thu hoạch
const stopHarvesting = async () => {
  isStopping.value = true;
  try {
    const response = await api.post('/api/harvesting/stop-harves');

    if (response.status === 'success') {
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: response.message,
        life: 4000
      });
    } else {
      toast.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: response.message,
        life: 4000
      });
    }
  } catch (error) {
    console.error("Lỗi khi dừng thu hoạch:", error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể kết nối đến máy chủ để dừng tác vụ.',
      life: 4000
    });
  } finally {
    isStopping.value = false;
  }
};

// Hàm xử lý khi bấm nút Làm sạch Dashboard
const cleanupDashboard = async () => {
  isCleaning.value = true;
  try {
    const response = await api.delete('/api/dashboard/cleanup');
    if (response.status === 'success') {
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: response.message,
        life: 3000
      });
      // Xóa dữ liệu local để giao diện cập nhật ngay
      jobs.value = [];
    }
  } catch (error) {
    console.error("Lỗi khi làm sạch Dashboard:", error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể làm sạch lịch sử Dashboard.',
      life: 4000
    });
  } finally {
    isCleaning.value = false;
  }
};

// Hàm xử lý download file kết quả
const handleDownloadResultFile = async (jobId) => {
  try {
    const response = await api.get(`/api/harvesting/jobs/${jobId}/download`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    
    const job = jobs.value.find(j => j.id === jobId);
    const fileName = `dataset_${jobId}.${job?.output_format || 'zip'}`;
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Bắt đầu tải xuống dataset...',
      life: 3000
    });
  } catch (error) {
    console.error("Lỗi tải file:", error);
    toast.add({
      severity: 'error',
      summary: 'Lỗi tải file',
      detail: 'Không thể tải file dataset. Vui lòng thử lại sau.',
      life: 4000
    });
  }
};

onMounted(() => {
  fetchJobs();
  pollingInterval = setInterval(fetchJobs, 3000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

const getSeverity = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'running': return 'info';
    case 'failed': return 'danger';
    default: return 'secondary';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'completed': return 'Hoàn thành';
    case 'running': return 'Đang chạy...';
    case 'failed': return 'Thất bại';
    default: return 'Đang chờ';
  }
};

const calculateProgress = (job) => {
  const total = job.total_seeds * job.target_samples_per_seed;
  if (total === 0) return 0;
  return Math.round((job.samples_generated / total) * 100);
};

const parseLogs = (logString) => {
  try {
    if (!logString) return [];
    if (Array.isArray(logString)) return logString;
    return JSON.parse(logString);
  } catch (e) {
    return [{ msg: logString, type: 'info', time: '' }];
  }
};
</script>

<template>
  <div class="dashboard-wrapper">
    <Toast />
    <div class="dash-header">
      <div>
        <div class="header-title">
          <i class="pi pi-objects-column" style="font-size: 1.8rem; color: var(--p-primary-color);"></i>
          <h2 style="margin: 0; color: var(--p-primary-color);">Trạm Điều Khiển</h2>
        </div>
        <p class="welcome-text">
          Xin chào, <strong>{{ authStore.user?.username || authStore.user?.email || 'Kỹ sư' }}</strong>!
        </p>
      </div>
      <div class="header-actions">
        <Button label="Dừng thu hoạch" severity="danger" icon="pi pi-stop-circle" :loading="isStopping" @click="stopHarvesting" />
        <Button label="Làm sạch" severity="success" icon="pi pi-trash" :loading="isCleaning" @click="cleanupDashboard" />
        <Button label="Thu hoạch mới" icon="pi pi-plus" @click="router.push('/harvesting')" />
      </div>
    </div>

    <Card v-if="jobs.length === 0" class="empty-card">
      <template #content>
        <div class="text-center py-5">
          <i class="pi pi-inbox" style="font-size: 3rem; color: var(--p-surface-400);"></i>
          <h3>Chưa có dữ liệu nào đang được thu hoạch</h3>
          <p class="text-secondary">Bạn chưa chạy tiến trình nào trong 24h qua. Hãy bắt đầu ngay!</p>
          <Button label="Đến phòng Thu hoạch" severity="secondary" @click="router.push('/harvesting')" />
        </div>
      </template>
    </Card>

    <div v-else class="job-list">
      <Card v-for="job in jobs" :key="job.id" class="job-card">
        <template #content>
          <div class="job-top">
            <span class="job-id">Tiến trình #{{ job.id }}</span>
            <Tag :severity="getSeverity(job.status)" :value="getStatusLabel(job.status)" />
          </div>

          <div class="job-grid">
            <!-- Thông tin công việc -->
            <div class="job-info-frame">
              <div class="info-content">
                <p><strong>Mục tiêu:</strong> {{ job.prompt }}</p>
                <p><strong>Nguồn cấp:</strong> {{ job.current_provider || '---' }} / {{ job.current_model || '---' }}</p>
                <p><strong>Định dạng yêu cầu:</strong> {{ job.output_format?.toUpperCase() }}</p>
                <p><strong>Tiến độ mẫu:</strong> {{ job.samples_generated }} / {{ job.total_seeds * job.target_samples_per_seed }} mẫu dữ liệu</p>
                <p><strong>Vị trí hạt giống:</strong> {{ job.current_seed_index + 1 }} / {{ job.total_seeds }}</p>
                <p><strong>Ngữ cảnh hạt giống:</strong> {{ job.current_seed_context || '---' }}</p>
                <p><strong>Quy tắc hạt giống:</strong> {{ job.current_seed_rule || '---' }}</p>
              </div>
            </div>

            <!-- Khung Log tuân thủ theme -->
            <div class="log-frame">
              <div class="log-header">Lịch sử thu hoạch</div>
              <div class="log-body" :ref="el => logContainers[job.id] = el">
                <div v-if="parseLogs(job.log_messages).length === 0" class="log-empty">
                  Đang khởi tạo kết nối...
                </div>
                <div v-for="(log, idx) in parseLogs(job.log_messages)" :key="idx" class="log-item">
                  <span class="time" v-if="log.time">[{{ log.time }}]</span>
                  <span :class="['message', log.type || 'info']">{{ log.msg || log.message }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-info">
              <span>Tiến độ tổng thể</span>
              <span>{{ calculateProgress(job) }}%</span>
            </div>
            <ProgressBar :value="calculateProgress(job)" :showValue="false" style="height: 6px;" />
          </div>

          <div v-if="job.status === 'completed' && job.output_file_url" class="job-actions">
            <Button 
              icon="pi pi-download" 
              label="Tải Dataset" 
              severity="success" 
              size="small" 
              outlined
              @click="handleDownloadResultFile(job.id)" 
            />
          </div>
          
          <div v-if="job.status === 'failed'" class="error-notification">
            <i class="pi pi-info-circle mr-2"></i> 
            {{ job.error_message }}
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper { width: 100%; max-width: 1000px; margin: 0 auto; padding-bottom: 2rem; }
.dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.header-title { display: flex; align-items: center; gap: 0.5rem; }
.welcome-text { margin-top: 0.25rem; color: var(--p-text-color-secondary); }
.header-actions { display: flex; gap: 12px; }

.job-list { display: flex; flex-direction: column; gap: 1.5rem; }
.job-card { border: 1px solid var(--p-surface-200); box-shadow: none; border-radius: 8px; }

.job-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--p-surface-100); padding-bottom: 0.5rem; }
.job-id { font-weight: 500; font-size: 0.9rem; color: var(--p-text-color-secondary); }

/* Layout Grid - Đảm bảo chia đều 50/50 và cao bằng nhau */
.job-grid { 
  display: grid; 
  grid-template-columns: repeat(2, minmax(0, 1fr)); 
  gap: 1rem; 
  margin-bottom: 1rem; 
  align-items: stretch; 
}
@media (max-width: 768px) { .job-grid { grid-template-columns: 1fr; } }

/* Khung thông tin đơn giản - SỬ DỤNG BIẾN CUSTOM */
.job-info-frame { 
  border: 1px solid var(--custom-border); 
  border-radius: 6px; 
  padding: 1rem; 
  background-color: var(--custom-bg);
  display: flex;
  flex-direction: column;
  word-break: break-word; 
}
.info-content p { margin: 0.4rem 0; font-size: 0.9rem; line-height: 1.4; color: var(--custom-text); }
.info-content strong { color: var(--p-text-color-secondary); margin-right: 4px; }

/* Khung Log tuân thủ theme - SỬ DỤNG BIẾN CUSTOM */
.log-frame { 
  border: 1px solid var(--custom-border); 
  border-radius: 6px; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden;
  min-height: 200px; 
}

.log-header { 
  padding: 6px 12px; 
  font-size: 0.75rem; 
  font-weight: 600; 
  background-color: var(--custom-bg);
  color: var(--p-text-color-secondary);
  border-bottom: 1px solid var(--custom-border);
}
:global(.app-dark) .log-header { 
  background-color: var(--p-surface-800); 
}

.log-body { 
  flex: 1; 
  padding: 8px 12px; 
  overflow-y: auto; 
  font-size: 0.85rem; 
  background-color: var(--custom-bg);
  color: var(--custom-text);
  max-height: 300px; 
}

.log-item { margin-bottom: 4px; line-height: 1.4; display: flex; gap: 8px; }
.time { color: var(--p-text-color-secondary); font-size: 0.75rem; white-space: nowrap; }
.message { word-break: break-all; } 
.message.error { color: var(--p-red-500); }
.message.success { color: var(--p-green-500); }
.log-empty { color: var(--p-text-color-secondary); text-align: center; margin-top: 2rem; font-style: italic; }

.progress-section { margin-top: 0.5rem; }
.progress-info { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--p-text-color-secondary); }

.job-actions { margin-top: 1rem; display: flex; justify-content: flex-end; }

.error-notification { 
  margin-top: 1rem; 
  padding: 0.5rem 1rem; 
  background-color: var(--p-red-50); 
  color: var(--p-red-600); 
  border-radius: 4px; 
  font-size: 0.85rem; 
}
:global(.app-dark) .error-notification { background-color: rgba(239, 68, 68, 0.1); color: var(--p-red-400); }

.mr-2 { margin-right: 0.5rem; }
.py-5 { padding: 2rem 0; }
.text-center { text-align: center; }
</style>
