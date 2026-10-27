<template>
  <div class="shell">
    <header class="topbar">
      <strong>🚀 Rocket</strong>
      <nav>
        <RouterLink to="/">Heute</RouterLink>
        <RouterLink to="/ernaehrung">Ernährung</RouterLink>
        <RouterLink to="/aufgaben">Aufgaben</RouterLink>
        <RouterLink to="/habits">Habits</RouterLink>
        <RouterLink v-if="authStore.istAdmin" to="/admin/nutzer">Nutzerverwaltung</RouterLink>
      </nav>
      <div class="rechts">
        <span class="name">{{ authStore.user?.name }}</span>
        <button class="abmelden" @click="abmelden">Abmelden</button>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

async function abmelden() {
  await authStore.abmelden()
  router.push('/login')
}
</script>

<style scoped>
.topbar { display: flex; align-items: center; gap: 24px; padding: 12px 20px; background: var(--card); border-bottom: 1px solid var(--line); flex-wrap: wrap; }
nav { display: flex; gap: 16px; flex: 1; }
nav a { color: var(--muted); text-decoration: none; font-size: 14px; padding: 6px 2px; border-bottom: 2px solid transparent; }
nav a.router-link-exact-active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
.rechts { display: flex; align-items: center; gap: 12px; }
.name { font-size: 13px; color: var(--muted); }
.abmelden { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 6px 12px; font-size: 13px; }
main { max-width: 760px; margin: 0 auto; padding: 24px 16px 60px; }
</style>
