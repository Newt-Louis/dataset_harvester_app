<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
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

// Hàm xử lý khi bấm nút Dừng thu hoạch
const stopHarvesting = async () => {
  isStopping.value = true; // Bật icon loading
  try {
    const response = await api.post('/api/harvesting/stop-harves');

    if (response.status === 'success') {
      toast.add({
        severity: 'success',
        summary: 'Thành công',
        detail: response.message,
        life: 4000
      });
      fetchJobs();
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

// Khi vào trang: Lấy dữ liệu liền, sau đó lặp lại mỗi 3 giây
onMounted(() => {
  fetchJobs();
  pollingInterval = setInterval(fetchJobs, 3000);
});

// Khi rời khỏi trang: Tắt lặp để tiết kiệm tài nguyên
onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

// Các hàm tiện ích cho Giao diện
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
      <div>
        <Button label="Dừng thu hoạch" severity="danger" icon="pi pi-stop-circle" :loading="isStopping" @click="stopHarvesting" style="margin-right: 12px"/>
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

          <div class="job-details">
            <p><strong>Model đang chạy:</strong> {{ job.current_model || 'Đang nạp...' }}</p>
            <p><strong>Tiến độ:</strong> {{ job.samples_generated }} / {{ job.total_seeds * job.target_samples_per_seed }} mẫu</p>
          </div>

          <ProgressBar :value="calculateProgress(job)" :showValue="true" style="height: 12px; margin-top: 1rem;" />

          <div v-if="job.status === 'completed' && job.output_file_url" class="job-actions">
            <Button icon="pi pi-download" label="Tải Dataset" severity="success" size="small" outlined />
          </div>
          
          <div v-if="job.status === 'failed'" class="error-box">
            <i class="pi pi-exclamation-triangle"></i> Lỗi: {{ job.error_message }}
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper { width: 100%; max-width: 900px; margin: 0 auto; }
.dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.welcome-text {
  margin-top: 0.5rem;
  font-size: 1.1rem; /* Phóng to chữ */
  color: var(--p-text-color-secondary);
}
.text-center { text-align: center; }
.text-secondary { color: var(--p-text-color-secondary); margin-bottom: 1.5rem;}
.py-5 { padding-top: 2rem; padding-bottom: 2rem; }

.job-list { display: flex; flex-direction: column; gap: 1rem; }
.job-card { border: 1px solid var(--p-surface-200); box-shadow: none; transition: transform 0.2s; }
.job-card:hover { border-color: var(--p-primary-color); }
:global(.app-dark) .job-card { border-color: var(--p-surface-700); background: var(--p-surface-900); }

.job-top { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.job-id { font-weight: bold; color: var(--p-text-color-secondary); font-size: 0.9rem; }
.job-details p { margin: 0.25rem 0; font-size: 0.95rem; }

.job-actions { margin-top: 1rem; display: flex; justify-content: flex-end; }
.error-box { margin-top: 1rem; padding: 0.5rem; background: var(--p-red-50); color: var(--p-red-600); border-radius: 6px; font-size: 0.85rem; }
:global(.app-dark) .error-box { background: rgba(255, 99, 132, 0.1); }
</style>