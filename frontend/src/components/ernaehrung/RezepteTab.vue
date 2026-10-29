<template>
  <nav class="filter">
    <button :class="{ on: filter === 'alle' }" @click="filter = 'alle'">Alle</button>
    <button :class="{ on: filter === 'meine' }" @click="filter = 'meine'">Meine</button>
    <button :class="{ on: filter === 'geteilt' }" @click="filter = 'geteilt'">Geteilt</button>
    <button :class="{ on: filter === 'favoriten' }" @click="filter = 'favoriten'">Favoriten</button>
  </nav>

  <button class="hinzufuegen" @click="zeigeFormular = true">+ Rezept hinzufügen</button>

  <div v-if="laedt" class="mut">Wird geladen…</div>
  <template v-else>
    <div class="karte" v-for="r in angezeigteRezepte" :key="r.id" @click="ansehen(r)">
      <div class="foto-box"><RezeptFoto :rezept="r" /></div>
      <div class="info">
        <strong>{{ r.titel }}</strong>
        <p class="mut">
          {{ r.portionen ? `${r.portionen} Port.` : '' }}{{ r.portionen && r.zeitMinuten ? ' · ' : '' }}{{ r.zeitMinuten ? `${r.zeitMinuten} Min.` : '' }}
          {{ !r.istEigenes ? `· von ${r.nutzerName}` : '' }}
        </p>
      </div>
      <span class="stern" :class="{ an: r.istFavorit }">{{ r.istFavorit ? '★' : '☆' }}</span>
    </div>
    <p v-if="!angezeigteRezepte.length" class="mut">Noch keine Rezepte in dieser Ansicht.</p>
  </template>

  <RezeptFormular v-if="zeigeFormular || bearbeitenRezept" :rezept="bearbeitenRezept" @gespeichert="nachSpeichern" @geloescht="nachSpeichern" @schliessen="formularSchliessen" />
  <RezeptAnsicht v-if="ansehenRezept" :rezept="ansehenRezept" @bearbeiten="bearbeiten" @aktualisiert="rezeptAktualisiert" @schliessen="ansehenRezept = null" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { rezepte as rezepteApi } from '@/api/index.js'
import RezeptFoto from './RezeptFoto.vue'
import RezeptFormular from './RezeptFormular.vue'
import RezeptAnsicht from './RezeptAnsicht.vue'

const rezeptListe = ref([])
const laedt = ref(true)
const filter = ref('alle')
const zeigeFormular = ref(false)
const bearbeitenRezept = ref(null)
const ansehenRezept = ref(null)

const angezeigteRezepte = computed(() => {
  if (filter.value === 'meine') return rezeptListe.value.filter((r) => r.istEigenes)
  if (filter.value === 'geteilt') return rezeptListe.value.filter((r) => !r.istEigenes)
  if (filter.value === 'favoriten') return rezeptListe.value.filter((r) => r.istFavorit)
  return rezeptListe.value
})

async function laden() {
  laedt.value = true
  const res = await rezepteApi.liste()
  rezeptListe.value = res.data
  laedt.value = false
}

function ansehen(r) {
  ansehenRezept.value = r
}

function bearbeiten(r) {
  ansehenRezept.value = null
  bearbeitenRezept.value = r
}

function formularSchliessen() {
  zeigeFormular.value = false
  bearbeitenRezept.value = null
}

async function nachSpeichern() {
  formularSchliessen()
  await laden()
}

async function rezeptAktualisiert(aktualisiertesRezept) {
  ansehenRezept.value = aktualisiertesRezept
  const i = rezeptListe.value.findIndex((r) => r.id === aktualisiertesRezept.id)
  if (i !== -1) rezeptListe.value[i] = aktualisiertesRezept
}

onMounted(laden)
</script>

<style scoped>
.filter { display: flex; gap: 6px; margin-bottom: 14px; border-bottom: 1px solid var(--line); }
.filter button { background: none; border: 0; padding: 10px 14px; font-size: 14px; color: var(--muted); border-bottom: 2px solid transparent; }
.filter button.on { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
.hinzufuegen { padding: 9px 16px; border: 1.5px solid var(--primary); border-radius: 8px; background: transparent; color: var(--primary); font-weight: 600; width: 100%; margin-bottom: 12px; }
.karte { display: flex; gap: 12px; align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 10px; margin-bottom: 10px; cursor: pointer; }
.foto-box { width: 56px; height: 56px; border-radius: 8px; overflow: hidden; font-size: 22px; flex-shrink: 0; }
.info { min-width: 0; }
.info strong { display: block; }
.mut { color: var(--muted); font-size: 13px; margin: 2px 0 0; }
.stern { font-size: 20px; color: var(--muted); flex-shrink: 0; }
.stern.an { color: #f2b705; }
</style>
