import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';
import Cookies from 'js-cookie';
import Harvester from './pages/Harvester.vue';
import Home from './pages/Home.vue';
import Settings from './pages/Settings.vue';
import Login from './pages/Login.vue';
import Register from './pages/Register.vue';
import Dashboard from './pages/Dashboard.vue';
import TestHarvester from "@/pages/TestHarvester.vue";

const routes = [
  { path: '/', component: Home },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/harvesting', component: Harvester },
  { path: '/settings', component: Settings },
  { path: '/login', component: Login, meta: { requiresGuest: true } },
  { path:'/register', component: Register, meta: { requiresGuest: true } },
    { path: '/test-model/:id', component: TestHarvester, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from) => {
    const hasToken = !!Cookies.get('auth_token');

    if (to.meta.requiresAuth && !hasToken) {
      return '/login';
    } else if (to.meta.requiresGuest && hasToken) {
      return '/dashboard';
    } else if (to.path === '/' && hasToken) {
      return '/dashboard';
    }
    return true;
})

export default router;