<template>
  <h1>Bücher</h1>

  <nav class="subnav">
    <button v-for="(name, s) in STATUS_NAME" :key="s" :class="{ on: status === s }" @click="status = s">{{ name }}</button>
  </nav>

  <nav v-if="alleTags.length" class="tagleiste">
    <button :class="{ on: !aktiverTag }" @click="aktiverTag = null">Alle</button>
    <button v-for="t in alleTags" :key="t" :class="{ on: aktiverTag === t }" @click="aktiverTag = aktiverTag === t ? null : t">{{ t }}</button>
  </nav>

  <div class="kopfzeile">
    <button class="hinzufuegen" @click="zeigeHinzufuegen = true">+ Buch hinzufügen</button>
    <div class="ansicht-wahl">
      <button :class="{ on: ansicht === 'liste' }" @click="ansichtSetzen('liste')" title="Liste">☰</button>
      <button :class="{ on: ansicht === 'regal' }" @click="ansichtSetzen('regal')" title="Regal">▤</button>
    </div>
  </div>

  <div v-if="laedt" class="mut">Wird geladen…</div>
  <template v-else>
    <template v-if="ansicht === 'liste'">
      <BuchKarte v-for="b in angezeigteBuecher" :key="b.id" :buch="b" @oeffnen="buchOeffnen(b)" />
    </template>
    <BuchRegal v-else :buecher="angezeigteBuecher" @oeffnen="buchOeffnen" />
    <p v-if="!angezeigteBuecher.length" class="mut">
      {{ aktiverTag ? `Kein Buch mit dem Tag „${aktiverTag}" in „${STATUS_NAME[status]}".` : `Noch keine Bücher in „${STATUS_NAME[status]}".` }}
    </p>
  </template>

  <BuchHinzufuegen v-if="zeigeHinzufuegen" @ausgewaehlt="buchAnlegen" @schliessen="zeigeHinzufuegen = false" />
  <BuchDetail v-if="ausgewaehltesBuch" :buch="ausgewaehltesBuch" @aktualisiert="buchAktualisiert" @geloescht="buchGeloescht" @schliessen="ausgewaehltesBuch = null" />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { buecher as buecherApi } from '@/api/index.js'
import { STATUS_NAME } from '@/utils/buecher.js'
import BuchKarte from '@/components/buecher/BuchKarte.vue'
import BuchRegal from '@/components/buecher/BuchRegal.vue'
import BuchHinzufuegen from '@/components/buecher/BuchHinzufuegen.vue'
import BuchDetail from '@/components/buecher/BuchDetail.vue'

const ANSICHT_SCHLUESSEL = 'rocket:buecher-ansicht'

const status = ref('wunschliste')
const buecher = ref([])
const laedt = ref(true)
const zeigeHinzufuegen = ref(false)
const ausgewaehltesBuch = ref(null)
const aktiverTag = ref(null)
const ansicht = ref('liste')

try {
  const gespeichert = localStorage.getItem(ANSICHT_SCHLUESSEL)
  if (gespeichert === 'liste' || gespeichert === 'regal') ansicht.value = gespeichert
} catch (err) { /* Speicher evtl. nicht verfügbar */ }

function ansichtSetzen(wert) {
  ansicht.value = wert
  try { localStorage.setItem(ANSICHT_SCHLUESSEL, wert) } catch (err) { /* Speicher evtl. nicht verfügbar */ }
}

const alleTags = computed(() => [...new Set(buecher.value.flatMap((b) => b.tags || []))].sort((a, b) => a.localeCompare(b, 'de')))
const angezeigteBuecher = computed(() => aktiverTag.value ? buecher.value.filter((b) => (b.tags || []).includes(aktiverTag.value)) : buecher.value)

async function laden() {
  laedt.value = true
  const res = await buecherApi.liste(status.value)
  buecher.value = res.data
  // Falls der aktive Tag-Filter nach dem Neuladen nicht mehr existiert (z. B. letztes Buch mit
  // diesem Tag gelöscht oder umgetaggt), zurücksetzen — sonst bliebe die Liste unsichtbar leer,
  // ohne dass die (dann verschwundene) Filterleiste noch einen Weg zurück auf „Alle" böte.
  if (aktiverTag.value && !alleTags.value.includes(aktiverTag.value)) aktiverTag.value = null
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

watch(status, () => { aktiverTag.value = null; laden() })
onMounted(laden)
</script>

<style scoped>
.subnav { display: flex; gap: 6px; margin-bottom: 14px; border-bottom: 1px solid var(--line); }
.subnav button { background: none; border: 0; padding: 10px 14px; font-size: 14px; color: var(--muted); border-bottom: 2px solid transparent; }
.subnav button.on { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
.tagleiste { display: flex; gap: 6px; margin-bottom: 14px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.tagleiste::-webkit-scrollbar { display: none; }
.tagleiste button { flex-shrink: 0; background: var(--bg); border: 1px solid var(--line); color: var(--muted); border-radius: 999px; padding: 6px 14px; font-size: 13px; }
.tagleiste button.on { background: var(--primary); border-color: var(--primary); color: #fff; font-weight: 600; }
.kopfzeile { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.hinzufuegen { padding: 9px 16px; border: 1.5px solid var(--primary); border-radius: 8px; background: transparent; color: var(--primary); font-weight: 600; }
.ansicht-wahl { display: flex; gap: 4px; flex-shrink: 0; }
.ansicht-wahl button { width: 36px; height: 36px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--muted); font-size: 16px; line-height: 1; }
.ansicht-wahl button.on { border-color: var(--primary); color: var(--primary); background: var(--bg); }
.mut { color: var(--muted); }
</style>
