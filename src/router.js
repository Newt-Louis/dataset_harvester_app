import { createRouter, createWebHistory } from 'vue-router';
import Harvester from './pages/Harvester.vue';
import Home from './pages/Home.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/harvesting', component: Harvester }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;