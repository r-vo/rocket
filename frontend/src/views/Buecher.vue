<template>
  <h1>Bücher</h1>

  <nav class="subnav">
    <button v-for="(name, s) in STATUS_NAME" :key="s" :class="{ on: status === s }" @click="status = s">{{ name }}</button>
  </nav>

  <button class="hinzufuegen" @click="zeigeHinzufuegen = true">+ Buch hinzufügen</button>

  <div v-if="laedt" class="mut">Wird geladen…</div>
  <template v-else>
    <BuchKarte v-for="b in buecher" :key="b.id" :buch="b" @oeffnen="buchOeffnen(b)" />
    <p v-if="!buecher.length" class="mut">Noch keine Bücher in „{{ STATUS_NAME[status] }}".</p>
  </template>

  <BuchHinzufuegen v-if="zeigeHinzufuegen" @ausgewaehlt="buchAnlegen" @schliessen="zeigeHinzufuegen = false" />
  <BuchDetail v-if="ausgewaehltesBuch" :buch="ausgewaehltesBuch" @aktualisiert="buchAktualisiert" @geloescht="buchGeloescht" @schliessen="ausgewaehltesBuch = null" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { buecher as buecherApi } from '@/api/index.js'
import { STATUS_NAME } from '@/utils/buecher.js'
import BuchKarte from '@/components/buecher/BuchKarte.vue'
import BuchHinzufuegen from '@/components/buecher/BuchHinzufuegen.vue'
import BuchDetail from '@/components/buecher/BuchDetail.vue'

const status = ref('wunschliste')
const buecher = ref([])
const laedt = ref(true)
const zeigeHinzufuegen = ref(false)
const ausgewaehltesBuch = ref(null)

async function laden() {
  laedt.value = true
  const res = await buecherApi.liste(status.value)
  buecher.value = res.data
  laedt.value = false
}

async function buchAnlegen(daten) {
  const { foto, ...buchDaten } = daten
  const res = await buecherApi.erstellen(buchDaten)
  if (foto) {
    const formData = new FormData()
    formData.append('foto', foto, 'cover.jpg')
    await buecherApi.coverHochladen(res.data.id, formData)
  }
  zeigeHinzufuegen.value = false
  await laden()
}

function buchOeffnen(b) {
  ausgewaehltesBuch.value = b
}

async function buchAktualisiert(aktualisiertesBuch) {
  ausgewaehltesBuch.value = aktualisiertesBuch
  await laden()
}

async function buchGeloescht() {
  ausgewaehltesBuch.value = null
  await laden()
}

watch(status, laden)
onMounted(laden)
</script>

<style scoped>
.subnav { display: flex; gap: 6px; margin-bottom: 14px; border-bottom: 1px solid var(--line); }
.subnav button { background: none; border: 0; padding: 10px 14px; font-size: 14px; color: var(--muted); border-bottom: 2px solid transparent; }
.subnav button.on { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
.hinzufuegen { padding: 9px 16px; border: 1.5px solid var(--primary); border-radius: 8px; background: transparent; color: var(--primary); font-weight: 600; margin-bottom: 8px; }
.mut { color: var(--muted); }
</style>
