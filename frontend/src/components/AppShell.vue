<template>
  <div class="shell">
    <header class="topbar">
      <div class="kopfzeile">
        <strong>🚀 Rocket</strong>
        <div class="rechts">
          <span class="name">{{ authStore.user?.name }}</span>
          <button class="abmelden" @click="abmelden">Abmelden</button>
        </div>
      </div>
      <nav>
        <RouterLink to="/">Heute</RouterLink>
        <RouterLink v-if="modulStore.istAktiv('ernaehrung')" to="/ernaehrung">Ernährung</RouterLink>
        <RouterLink v-if="modulStore.istAktiv('aufgaben')" to="/aufgaben">Aufgaben</RouterLink>
        <RouterLink v-if="modulStore.istAktiv('habits')" to="/habits">Habits</RouterLink>
        <RouterLink v-if="modulStore.istAktiv('buecher')" to="/buecher">Bücher</RouterLink>
        <RouterLink v-if="authStore.istAdmin" to="/admin/nutzer">Nutzerverwaltung</RouterLink>
        <RouterLink to="/einstellungen">Einstellungen</RouterLink>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useModulStore } from '@/stores/module.js'

const router = useRouter()
const authStore = useAuthStore()
const modulStore = useModulStore()

async function abmelden() {
  await authStore.abmelden()
  modulStore.zuruecksetzen()
  router.push('/login')
}

onMounted(() => {
  if (!modulStore.geladen) modulStore.laden()
})
</script>

<style scoped>
.topbar { padding: 12px 20px; background: var(--card); border-bottom: 1px solid var(--line); }
.kopfzeile { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
/* Eigene Zeile für die Nav statt gemeinsam mit Name/Abmelden in einer Flex-Zeile — so hat sie
   immer die volle Breite zur Verfügung, um bei Bedarf innerhalb ihrer selbst zu scrollen, statt
   zusammengequetscht zu werden oder die ganze Seite horizontal aufzuziehen (z. B. auf dem Handy,
   wo nicht alle Tabs auf einmal passen). */
nav { display: flex; gap: 16px; margin-top: 10px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
nav::-webkit-scrollbar { display: none; }
nav a { color: var(--muted); text-decoration: none; font-size: 14px; padding: 6px 2px; border-bottom: 2px solid transparent; flex-shrink: 0; }
nav a.router-link-exact-active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
.rechts { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.name { font-size: 13px; color: var(--muted); }
.abmelden { border: 1px solid var(--line); background: #fff; border-radius: 8px; padding: 6px 12px; font-size: 13px; flex-shrink: 0; }
main { max-width: 760px; margin: 0 auto; padding: 24px 16px 60px; }

@media (max-width: 480px) {
  .topbar { padding: 12px 16px; }
  .name { display: none; }
}
</style>
