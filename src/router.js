import { createRouter, createWebHistory } from 'vue-router';
import Harvester from './pages/Harvester.vue'; // Trang ta sắp tạo
import App from './App.vue';

const routes = [
  // Truy cập trang chủ ('/') sẽ tự động chuyển hướng sang '/harvester'
  { path: '/', component: App },
  { path: '/harvester', component: Harvester }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;