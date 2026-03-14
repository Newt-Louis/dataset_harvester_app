import { createRouter, createWebHistory } from 'vue-router';
import Harvester from './pages/Harvester.vue';
import Home from './pages/Home.vue';
import Settings from './pages/Settings.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/harvesting', component: Harvester },
  { path: '/settings', component: Settings }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;