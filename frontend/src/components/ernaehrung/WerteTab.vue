<template>
  <h1>Werte</h1>

  <div class="card" v-if="weg.status === 'aktiv'">
    <h3>Dein Weg zum Ziel</h3>
    <div class="gross">{{ formatLangDatum(weg.ende) }}</div>
    <p class="mut">voraussichtlich {{ weg.goal }} kg, in rund {{ Math.max(1, Math.round(weg.wochen)) }} {{ Math.round(weg.wochen) <= 1 ? 'Woche' : 'Wochen' }}.</p>

    <svg viewBox="0 0 320 135" class="chart">
      <line x1="15" x2="305" :y1="yZiel" :y2="yZiel" stroke="var(--muted)" opacity=".4" />
      <line :x1="xHeute" :y1="yAktuell" :x2="xEnde" :y2="yZiel" stroke="var(--primary-dark)" stroke-width="3" stroke-dasharray="6 5" stroke-linecap="round" />
      <polyline v-if="gewichtsPunkte.length > 1" :points="gewichtsPunkte.map((p) => p.join(',')).join(' ')" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" />
      <circle v-for="(p, i) in gewichtsPunkte" :key="i" :cx="p[0]" :cy="p[1]" r="4" fill="var(--primary)" />
      <circle :cx="xEnde" :cy="yZiel" r="6" fill="var(--primary-dark)" />
    </svg>
    <p class="mut">Gestrichelt: geplanter Weg. Punkte: dein echtes Gewicht.</p>

    <p v-if="weg.trendDatum" class="info">Nach deinem bisherigen Trend erreichst du dein Ziel am {{ formatLangDatum(weg.trendDatum) }}.</p>
    <p v-else-if="weg.spanneTage >= 14" class="mut">In den letzten Wochen hat sich dein Gewicht kaum verändert.</p>

    <h3 style="margin: 14px 0 2px;">Zwischenziele</h3>
    <div v-for="(m, i) in weg.meilensteine" :key="i" class="eintrag">
      <span>{{ m.kg.toFixed(1) }} kg</span>
      <span class="mut">{{ formatLangDatum(m.datum) }}</span>
    </div>
  </div>
  <div class="card" v-else-if="weg.status === 'erreicht'">
    <h3>Dein Weg zum Ziel</h3>
    <p class="mut">Dein Zielgewicht ({{ weg.goal }} kg) ist erreicht oder du hältst dein Gewicht.</p>
  </div>
  <div class="card" v-else-if="weg.status === 'keinDefizit'">
    <h3>Dein Weg zum Ziel</h3>
    <p class="mut">Mit deinen aktuellen Angaben ergibt sich kein Kaloriendefizit. Prüfe Zielgewicht und Alltag unter „Ziele".</p>
  </div>

  <div class="card">
    <div class="row"><h3>Gewichtsverlauf</h3><span class="mut">{{ diffSeitStart >= 0 ? '+' : '' }}{{ diffSeitStart }} kg seit Start</span></div>
    <svg v-if="gewichtsListe.length > 1" viewBox="0 0 320 130" class="chart">
      <polyline :points="verlaufPunkte.map((p) => p.join(',')).join(' ')" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" />
      <circle v-for="(p, i) in verlaufPunkte" :key="i" :cx="p[0]" :cy="p[1]" r="4" fill="var(--primary-dark)" />
    </svg>
    <p v-else class="mut">Trage mindestens zwei Gewichtswerte ein, dann erscheint der Verlauf.</p>
  </div>

  <div class="card">
    <h3>Netto-Carbs, letzte 7 Tage</h3>
    <svg viewBox="0 0 320 130" class="chart"><g v-for="(b, i) in carbsBalken" :key="i">
      <rect :x="i * 46 + 6" :y="110 - b.v / carbsMax * 100" width="32" :height="b.v / carbsMax * 100" rx="9" :fill="b.v > ziel.carbs ? 'var(--danger)' : 'var(--primary)'" />
      <text :x="i * 46 + 22" y="126" text-anchor="middle" font-size="11" fill="var(--muted)">{{ b.label }}</text>
    </g><line x1="0" x2="320" :y1="110 - ziel.carbs / carbsMax * 100" :y2="110 - ziel.carbs / carbsMax * 100" stroke="var(--primary-dark)" stroke-dasharray="4 4" /></svg>
    <p class="mut">{{ tageImZiel }} von {{ tageMitEintrag }} erfassten Tagen im Ziel</p>
  </div>

  <div class="card">
    <h3>Kalorien, letzte 7 Tage</h3>
    <svg viewBox="0 0 320 130" class="chart"><g v-for="(b, i) in kcalBalken" :key="i">
      <rect :x="i * 46 + 6" :y="110 - b.v / kcalMax * 100" width="32" :height="b.v / kcalMax * 100" rx="9" :fill="b.v > ziel.kcal ? 'var(--danger)' : 'var(--primary)'" />
      <text :x="i * 46 + 22" y="126" text-anchor="middle" font-size="11" fill="var(--muted)">{{ b.label }}</text>
    </g><line x1="0" x2="320" :y1="110 - ziel.kcal / kcalMax * 100" :y2="110 - ziel.kcal / kcalMax * 100" stroke="var(--primary-dark)" stroke-dasharray="4 4" /></svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { gewicht as gewichtApi, ernaehrung as ernaehrungApi } from '@/api/index.js'
import { tagesziel, wegZumZiel, heuteDatum, datumPlus } from '@/utils/ernaehrung.js'

const props = defineProps({ profil: { type: Object, required: true } })

const gewichtsListe = ref([])
const eintraege7Tage = ref([])

const ziel = computed(() => tagesziel(props.profil))
const weg = computed(() => wegZumZiel(props.profil, gewichtsListe.value))

function formatLangDatum(d) {
  return new Date(d + 'T12:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

const diffSeitStart = computed(() => {
  if (gewichtsListe.value.length < 2) return 0
  return +(gewichtsListe.value[gewichtsListe.value.length - 1].kg - gewichtsListe.value[0].kg).toFixed(1)
})

function punkteBerechnen(werte) {
  if (werte.length < 2) return []
  const W = 320, H = 110
  const mn = Math.min(...werte) - 1, mx = Math.max(...werte) + 1
  return werte.map((v, i) => [i * W / (werte.length - 1), H - (v - mn) / (mx - mn) * H])
}
const verlaufPunkte = computed(() => punkteBerechnen(gewichtsListe.value.map((x) => x.kg)))

// Chart für "Weg zum Ziel": x-Achse von Start-Datum bis geplantem Enddatum, y-Achse Gewicht.
const xStart = 15, xRange = 290
const x0 = computed(() => weg.value.status === 'aktiv' ? new Date(weg.value.start.datum + 'T12:00').getTime() : 0)
const dx = computed(() => weg.value.status === 'aktiv' ? Math.max(new Date(weg.value.ende + 'T12:00').getTime() - x0.value, 1) : 1)
const xVon = (d) => xStart + (new Date(d + 'T12:00').getTime() - x0.value) / dx.value * xRange
const yGrenzen = computed(() => {
  if (weg.value.status !== 'aktiv') return { mn: 0, mx: 1 }
  const werte = [...gewichtsListe.value.map((x) => x.kg), weg.value.goal, weg.value.cur]
  return { mn: Math.min(...werte) - 1, mx: Math.max(...werte) + 1 }
})
const yVon = (v) => 110 - (v - yGrenzen.value.mn) / (yGrenzen.value.mx - yGrenzen.value.mn) * 100
const gewichtsPunkte = computed(() => weg.value.status === 'aktiv' ? gewichtsListe.value.map((x) => [xVon(x.datum), yVon(x.kg)]) : [])
const xHeute = computed(() => weg.value.status === 'aktiv' ? xVon(heuteDatum()) : 0)
const xEnde = computed(() => weg.value.status === 'aktiv' ? xVon(weg.value.ende) : 0)
const yAktuell = computed(() => weg.value.status === 'aktiv' ? yVon(weg.value.cur) : 0)
const yZiel = computed(() => weg.value.status === 'aktiv' ? yVon(weg.value.goal) : 0)

const letzte7Tage = computed(() => [...Array(7)].map((_, i) => datumPlus(heuteDatum(), i - 6)))
const tagLabel = (d) => ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(d + 'T12:00').getDay()]

function tagessumme(datum) {
  return eintraege7Tage.value.filter((e) => e.datum === datum).reduce((a, e) => ({ kcal: a.kcal + e.kcal, nettoCarbs: a.nettoCarbs + e.nettoCarbs }), { kcal: 0, nettoCarbs: 0 })
}
const carbsBalken = computed(() => letzte7Tage.value.map((d) => ({ label: tagLabel(d), v: tagessumme(d).nettoCarbs })))
const kcalBalken = computed(() => letzte7Tage.value.map((d) => ({ label: tagLabel(d), v: tagessumme(d).kcal })))
const carbsMax = computed(() => Math.max(ziel.value.carbs * 1.3, ...carbsBalken.value.map((b) => b.v), 1))
const kcalMax = computed(() => Math.max(ziel.value.kcal * 1.3, ...kcalBalken.value.map((b) => b.v), 1))

const tageMitEintrag = computed(() => letzte7Tage.value.filter((d) => eintraege7Tage.value.some((e) => e.datum === d)).length)
const tageImZiel = computed(() => letzte7Tage.value.filter((d) => eintraege7Tage.value.some((e) => e.datum === d) && tagessumme(d).nettoCarbs <= ziel.value.carbs).length)

onMounted(async () => {
  const [gewichtRes, eintraegeRes] = await Promise.all([
    gewichtApi.liste(),
    ernaehrungApi.bereich(datumPlus(heuteDatum(), -6), heuteDatum()),
  ])
  gewichtsListe.value = gewichtRes.data
  eintraege7Tage.value = eintraegeRes.data
})
</script>

<style scoped>
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; margin: 12px 0; max-width: 480px; }
.row { display: flex; justify-content: space-between; align-items: center; }
.gross { font-size: 28px; font-weight: 800; }
.mut { color: var(--muted); font-size: 13px; }
.info { color: var(--primary-dark); font-weight: 600; font-size: 14px; }
.chart { width: 100%; height: auto; display: block; margin: 10px 0; }
.eintrag { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
.eintrag:last-child { border-bottom: none; }
</style>
