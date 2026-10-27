import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth as authApi } from '@/api/index.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const istAngemeldet = computed(() => !!token.value)
  const istAdmin = computed(() => !!user.value?.istAdmin)

  async function anmelden(email, passwort) {
    const res = await authApi.login(email, passwort)
    token.value = res.data.token
    user.value = res.data.nutzer
    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  async function abmelden() {
    try { await authApi.logout() } catch {}
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, istAngemeldet, istAdmin, anmelden, abmelden }
})
