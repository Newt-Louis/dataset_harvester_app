import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';
import Harvester from './pages/Harvester.vue';
import Home from './pages/Home.vue';
import Settings from './pages/Settings.vue';
import Login from './pages/Login.vue';
import Register from './pages/Register.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/harvesting', component: Harvester },
  { path: '/settings', component: Settings },
  { path: '/login', component: Login },
  { path:'/register', component: Register }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth) {
    const valid = await auth.checkAuth()
    if (!valid) return { name: 'Login' }
  }

  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { name: 'Home' }
  }
})

export default router;