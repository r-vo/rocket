<template>
  <div class="shell">
    <div class="card">
      <h1>Rocket</h1>
      <p class="sub">Anmelden</p>
      <div v-if="fehler" class="fehler">{{ fehler }}</div>
      <label>E-Mail</label>
      <input v-model="email" type="email" autocomplete="username" @keyup.enter="anmelden" />
      <label>Passwort</label>
      <input v-model="passwort" type="password" autocomplete="current-password" @keyup.enter="anmelden" />
      <button :disabled="laedt" @click="anmelden">{{ laedt ? 'Wird geprüft…' : 'Anmelden' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const passwort = ref('')
const fehler = ref('')
const laedt = ref(false)

async function anmelden() {
  if (!email.value || !passwort.value) return
  fehler.value = ''
  laedt.value = true
  try {
    await authStore.anmelden(email.value, passwort.value)
    router.push('/')
  } catch (err) {
    fehler.value = err.response?.data?.error || 'Anmeldung fehlgeschlagen'
  } finally {
    laedt.value = false
  }
}
</script>

<style scoped>
.shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
.card { background: var(--card); border-radius: 16px; padding: 28px 24px; width: 100%; max-width: 360px; box-shadow: 0 8px 24px #0001; }
h1 { margin: 0 0 4px; font-size: 26px; }
.sub { color: var(--muted); margin: 0 0 18px; }
label { display: block; font-size: 13px; color: var(--muted); margin: 14px 0 4px; }
input { width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; }
button { width: 100%; margin-top: 20px; padding: 11px; border: 0; border-radius: 10px; background: var(--primary); color: #fff; font-weight: 600; }
button:disabled { opacity: .6; }
.fehler { background: #fde8ee; color: var(--danger); padding: 8px 10px; border-radius: 8px; font-size: 13px; margin-bottom: 6px; }
</style>
