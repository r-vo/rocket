import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/',
    component: () => import('@/components/AppShell.vue'),
    meta: { auth: true },
    children: [
      { path: '', name: 'Heute', component: () => import('@/views/Heute.vue') },
      { path: 'ernaehrung', name: 'Ernaehrung', component: () => import('@/views/Ernaehrung.vue') },
      { path: 'aufgaben', name: 'Aufgaben', component: () => import('@/views/Aufgaben.vue') },
      { path: 'habits', name: 'Habits', component: () => import('@/views/Habits.vue') },
      { path: 'einstellungen', name: 'Einstellungen', component: () => import('@/views/Einstellungen.vue') },
      { path: 'admin/nutzer', name: 'NutzerVerwaltung', component: () => import('@/views/admin/NutzerVerwaltung.vue'), meta: { admin: true } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.auth && !authStore.istAngemeldet) {
    next('/login')
  } else if (to.path === '/login' && authStore.istAngemeldet) {
    next('/')
  } else if (to.meta.admin && !authStore.istAdmin) {
    next('/')
  } else {
    next()
  }
})

export default router
