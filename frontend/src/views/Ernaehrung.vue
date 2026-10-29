<template>
  <div v-if="laedt" class="mut">Wird geladen…</div>

  <ZieleForm v-else-if="!profil?.alter" :profil="profil" :ist-setup="true" @gespeichert="nachSpeichern" />

  <template v-else>
    <nav class="subnav">
      <button :class="{ on: tab === 'heute' }" @click="tab = 'heute'">Heute</button>
      <button :class="{ on: tab === 'plan' }" @click="tab = 'plan'">Plan</button>
      <button :class="{ on: tab === 'koerper' }" @click="tab = 'koerper'">Körper</button>
      <button :class="{ on: tab === 'werte' }" @click="tab = 'werte'">Werte</button>
      <button :class="{ on: tab === 'ziele' }" @click="tab = 'ziele'">Ziele</button>
      <button :class="{ on: tab === 'rezepte' }" @click="tab = 'rezepte'">Rezepte</button>
    </nav>

    <HeuteTab v-if="tab === 'heute'" :profil="profil" />
    <PlanTab v-else-if="tab === 'plan'" :profil="profil" />
    <KoerperTab v-else-if="tab === 'koerper'" @aktualisiert="profilLaden" />
    <WerteTab v-else-if="tab === 'werte'" :key="werteKey" :profil="profil" />
    <ZieleForm v-else-if="tab === 'ziele'" :profil="profil" @gespeichert="nachSpeichern" />
    <RezepteTab v-else-if="tab === 'rezepte'" />
  </template>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { profil as profilApi } from '@/api/index.js'
import ZieleForm from '@/components/ernaehrung/ZieleForm.vue'
import HeuteTab from '@/components/ernaehrung/HeuteTab.vue'
import PlanTab from '@/components/ernaehrung/PlanTab.vue'
import KoerperTab from '@/components/ernaehrung/KoerperTab.vue'
import WerteTab from '@/components/ernaehrung/WerteTab.vue'
import RezepteTab from '@/components/ernaehrung/RezepteTab.vue'

const laedt = ref(true)
const profil = ref(null)
const tab = ref('heute')
const werteKey = ref(0)

async function profilLaden() {
  const res = await profilApi.abrufen()
  profil.value = res.data
  werteKey.value++
}

async function nachSpeichern() {
  await profilLaden()
  tab.value = 'heute'
}

onMounted(async () => {
  await profilLaden()
  laedt.value = false
})
</script>

<style scoped>
.subnav { display: flex; gap: 6px; margin-bottom: 16px; border-bottom: 1px solid var(--line); }
.subnav button { background: none; border: 0; padding: 10px 14px; font-size: 14px; color: var(--muted); border-bottom: 2px solid transparent; }
.subnav button.on { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
.mut { color: var(--muted); }
</style>
