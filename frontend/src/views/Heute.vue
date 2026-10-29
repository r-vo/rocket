<template>
  <h1>Heute</h1>

  <nav class="perioden">
    <button v-for="(name, p) in PERIODEN_NAME" :key="p" :class="{ on: periode === p }" @click="periode = p">{{ name }}</button>
  </nav>

  <div class="row zeitraum-zeile">
    <button class="pfeil" @click="verschieben(-1)">‹</button>
    <h2>{{ zr.label }}</h2>
    <button class="pfeil" @click="verschieben(1)">›</button>
  </div>

  <div v-if="laedt" class="mut">Wird geladen…</div>

  <template v-else>
    <div v-if="modulStore.istAktiv('ernaehrung')" class="card">
      <h2>🍽️ Ernährung</h2>
      <p class="zahl">{{ daten.ernaehrung.kcal }} kcal</p>
      <p class="mut">{{ Math.round(daten.ernaehrung.nettoCarbs * 10) / 10 }} g Netto-Carbs</p>
    </div>

    <div v-if="modulStore.istAktiv('buecher')" class="card">
      <h2>📖 Bücher</h2>
      <div v-if="daten.buecher.length" class="buch-zeile" v-for="b in daten.buecher" :key="b.id + '-' + b.begonnenAm">
        <div class="row"><span>{{ b.titel }}</span><span class="mut">{{ b.aktuelleSeite ?? 0 }}{{ b.seitenzahl ? ` / ${b.seitenzahl}` : '' }} Seiten</span></div>
        <div v-if="b.seitenzahl" class="track"><div class="fill" :style="{ width: Math.min((b.aktuelleSeite ?? 0) / b.seitenzahl * 100, 100) + '%' }"></div></div>
        <p class="mut klein">{{ b.begonnenAm ? formatLang(b.begonnenAm) : '?' }} – {{ b.beendetAm ? formatLang(b.beendetAm) : 'läuft noch' }}</p>
      </div>
      <p v-else class="mut">Kein Buch in diesem Zeitraum in Arbeit.</p>
    </div>

    <div v-if="modulStore.istAktiv('habits')" class="card">
      <h2>✅ Habits</h2>
      <p class="zahl">{{ daten.habits.erledigt }} / {{ daten.habits.gesamt }}</p>
      <p class="mut">erledigt</p>
    </div>

    <div v-if="modulStore.istAktiv('aufgaben')" class="card">
      <h2>📝 Aufgaben</h2>
      <p class="zahl">{{ daten.aufgaben.erledigt }} / {{ daten.aufgaben.gesamt }}</p>
      <p class="mut">von allen fälligen erledigt</p>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { heute as heuteApi } from '@/api/index.js'
import { useModulStore } from '@/stores/module.js'
import { heuteDatum, datumVerschieben, zeitraum, formatLang } from '@/utils/heute.js'

const PERIODEN_NAME = { tag: 'Tag', woche: 'Woche', monat: 'Monat', jahr: 'Jahr' }

const modulStore = useModulStore()
const periode = ref('tag')
const datum = ref(heuteDatum())
const laedt = ref(true)
const daten = ref({
  ernaehrung: { kcal: 0, nettoCarbs: 0 },
  buecher: [],
  habits: { erledigt: 0, gesamt: 0 },
  aufgaben: { erledigt: 0, gesamt: 0 },
})

const zr = computed(() => zeitraum(datum.value, periode.value))

function verschieben(richtung) {
  datum.value = datumVerschieben(datum.value, periode.value, richtung)
}

async function laden() {
  laedt.value = true
  const res = await heuteApi.uebersicht(zr.value.von, zr.value.bis)
  daten.value = res.data
  laedt.value = false
}

watch(() => [zr.value.von, zr.value.bis], laden)

onMounted(async () => {
  if (!modulStore.geladen) await modulStore.laden()
  await laden()
})
</script>

<style scoped>
.perioden { display: flex; gap: 6px; margin-bottom: 14px; border-bottom: 1px solid var(--line); }
.perioden button { background: none; border: 0; padding: 10px 14px; font-size: 14px; color: var(--muted); border-bottom: 2px solid transparent; }
.perioden button.on { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }
.row { display: flex; justify-content: space-between; gap: 10px; font-size: 14px; }
.zeitraum-zeile { justify-content: center; align-items: center; gap: 14px; margin-bottom: 10px; }
.zeitraum-zeile h2 { margin: 0; font-size: 16px; }
.pfeil { background: none; border: 0; font-size: 20px; color: var(--primary); padding: 4px 10px; cursor: pointer; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; margin: 12px 0; }
.card h2 { margin: 0 0 8px; font-size: 16px; }
.zahl { font-size: 28px; font-weight: 800; margin: 2px 0; }
.mut { color: var(--muted); font-size: 13px; margin: 2px 0; }
.mut.klein { font-size: 11px; margin-top: 3px; }
.buch-zeile { margin-bottom: 10px; }
.buch-zeile:last-child { margin-bottom: 0; }
.track { height: 6px; background: var(--bg); border-radius: 999px; margin-top: 4px; overflow: hidden; }
.fill { height: 100%; background: var(--primary); border-radius: 999px; }
</style>
