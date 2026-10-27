<template>
  <div class="row">
    <button class="pfeil" @click="tagWechseln(-1)">‹</button>
    <h2>{{ datum === heute ? 'Heute' : datumFormatiert }}</h2>
    <button class="pfeil" @click="tagWechseln(1)">›</button>
  </div>

  <div class="card center">
    <svg viewBox="0 0 180 180" class="ring">
      <circle cx="90" cy="90" r="72" fill="none" stroke="var(--line)" stroke-width="16" />
      <circle cx="90" cy="90" r="72" fill="none" :stroke="summe.nettoCarbs > ziel.carbs ? 'var(--danger)' : 'var(--primary)'"
              stroke-width="16" stroke-linecap="round"
              :stroke-dasharray="`${Math.min(summe.nettoCarbs / ziel.carbs, 1) * 452.4} 452.4`"
              transform="rotate(-90 90 90)" />
      <text x="90" y="92" text-anchor="middle" font-size="38" font-weight="800" fill="var(--ink)">{{ Math.round(summe.nettoCarbs * 10) / 10 }}</text>
      <text x="90" y="116" text-anchor="middle" font-size="13" fill="var(--muted)">von {{ ziel.carbs }} g</text>
    </svg>
    <p class="mut center-text">Netto-Carbs (Kohlenhydrate minus Ballaststoffe)</p>
  </div>

  <div class="card">
    <div class="balken-zeile" v-for="b in balken" :key="b.label">
      <div class="row"><span>{{ b.label }}</span><span class="mut">{{ Math.round(b.wert) }} / {{ b.ziel }} {{ b.einheit }}</span></div>
      <div class="track"><div class="fill" :style="{ width: Math.min(b.wert / b.ziel * 100, 100) + '%' }"></div></div>
    </div>
  </div>

  <button @click="zeigeModal = true">Essen hinzufügen</button>

  <h2 style="margin-top: 22px;">Mahlzeiten</h2>
  <div v-if="ladenGerade" class="mut">Wird geladen…</div>
  <div v-else class="card">
    <div v-if="!eintraege.length" class="mut" style="text-align: center; padding: 16px;">Noch nichts eingetragen.</div>
    <div v-for="e in eintraege" :key="e.id" class="eintrag">
      <div>
        <b>{{ e.bezeichnung }}</b>
        <div class="mut">{{ e.mahlzeit }} · {{ e.menge ? e.menge + ' g · ' : '' }}{{ e.kcal }} kcal · {{ e.nettoCarbs }} g Netto-Carbs</div>
      </div>
      <button class="x" @click="loeschen(e)">✕</button>
    </div>
  </div>

  <EssenHinzufuegen v-if="zeigeModal" :datum="datum" @hinzugefuegt="nachHinzufuegen" @schliessen="zeigeModal = false" />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ernaehrung as ernaehrungApi } from '@/api/index.js'
import { tagesziel, heuteDatum, datumPlus } from '@/utils/ernaehrung.js'
import EssenHinzufuegen from './EssenHinzufuegen.vue'

const props = defineProps({ profil: { type: Object, required: true } })

const heute = heuteDatum()
const datum = ref(heute)
const eintraege = ref([])
const ladenGerade = ref(false)
const zeigeModal = ref(false)

const ziel = computed(() => tagesziel(props.profil))
const summe = computed(() => eintraege.value.reduce((a, e) => ({
  kcal: a.kcal + e.kcal, nettoCarbs: a.nettoCarbs + e.nettoCarbs, fett: a.fett + e.fett, eiweiss: a.eiweiss + e.eiweiss,
}), { kcal: 0, nettoCarbs: 0, fett: 0, eiweiss: 0 }))

const balken = computed(() => [
  { label: 'Kalorien', wert: summe.value.kcal, ziel: ziel.value.kcal, einheit: 'kcal' },
  { label: 'Fett', wert: summe.value.fett, ziel: ziel.value.fett, einheit: 'g' },
  { label: 'Eiweiß', wert: summe.value.eiweiss, ziel: ziel.value.eiweiss, einheit: 'g' },
])

const datumFormatiert = computed(() => new Date(datum.value + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }))

async function laden() {
  ladenGerade.value = true
  try {
    const res = await ernaehrungApi.tag(datum.value)
    eintraege.value = res.data
  } finally {
    ladenGerade.value = false
  }
}

function tagWechseln(delta) {
  datum.value = datumPlus(datum.value, delta)
}

async function loeschen(e) {
  await ernaehrungApi.loeschen(e.id)
  eintraege.value = eintraege.value.filter((x) => x.id !== e.id)
}

function nachHinzufuegen() {
  zeigeModal.value = false
  laden()
}

watch(datum, laden)
onMounted(laden)
</script>

<style scoped>
.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.pfeil { background: none; border: 0; font-size: 20px; color: var(--muted); padding: 4px 10px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; margin: 12px 0; }
.center { text-align: center; }
.ring { max-width: 200px; margin: 0 auto; display: block; }
.center-text { text-align: center; margin: 4px 0 0; }
.mut { color: var(--muted); font-size: 13px; }
.balken-zeile { margin: 10px 0; }
.track { height: 9px; border-radius: 8px; background: var(--line); margin-top: 4px; overflow: hidden; }
.fill { height: 100%; background: var(--primary); border-radius: 8px; }
button:not(.x):not(.pfeil) { padding: 10px 16px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; width: 100%; }
.eintrag { display: flex; justify-content: space-between; gap: 8px; padding: 9px 0; border-bottom: 1px solid var(--line); }
.eintrag:last-child { border-bottom: none; }
.x { background: none; border: 0; color: var(--muted); width: auto; padding: 2px 8px; }
</style>
