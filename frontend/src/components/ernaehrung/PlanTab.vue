<template>
  <h1>Dein Plan</h1>
  <div class="card">
    <h3 style="margin-top: 0;">Tagesziele</h3>
    <p>{{ ziel.kcal }} kcal · {{ ziel.carbs }} g Netto-Carbs · {{ ziel.fett }} g Fett · {{ ziel.eiweiss }} g Eiweiß</p>
  </div>
  <div class="hinweis">Das ist eine Orientierung, kein medizinischer Rat. Sprich eine längere Keto-Phase mit deiner Ärztin oder deinem Arzt ab. Trinke genug und achte auf Salz.</div>

  <h2>Training</h2>
  <div class="card" v-for="t in training" :key="t.tag">
    <h3 style="margin-top: 0;">{{ WOCHENTAGE[t.tag] }}: {{ t.bezeichnung }}</h3>
    <ul><li v-for="(e, i) in t.uebungen" :key="i">{{ e }}</li></ul>
  </div>
  <p class="mut">Dazu täglich 8.000 bis 10.000 Schritte.</p>

  <h2>Ernährungswoche</h2>
  <p class="mut">Morgens: Eier, Gemüse und Milchprodukt. Mittags: Fleisch und Gemüse. Abends: Gemüse und, wenn dein Eiweißziel es braucht, noch etwas Fleisch oder Fisch.</p>

  <div class="card">
    <h3 style="margin-top: 0;">Das isst du gern</h3>
    <p v-if="favoritenGesamt.length" class="mut">{{ favoritenGesamt.map((f) => `${f.bezeichnung} (${f.anzahl}×)`).join(', ') }}</p>
    <p v-else class="mut">Trage ein paar Mahlzeiten ein, dann erkenne ich deine Favoriten.</p>
    <button class="ghost" @click="ausFavoritenFuellen" :disabled="!favoritenGesamt.length">Plan aus meinen Favoriten füllen</button>
    <p class="mut" style="margin: 8px 0 0;">Tippe auf eine Mahlzeit, um sie zu ändern.</p>
  </div>

  <div class="card" v-for="(tag, i) in WOCHENTAGE" :key="tag">
    <h3 style="margin-top: 0;">{{ tag }}</h3>
    <div v-for="k in ['B', 'L', 'D']" :key="k" class="slot">
      <span class="slot-text" @click="slotOeffnen(i, k)">
        <span class="mut">{{ MAHLZEIT_KURZ[k] }}</span><br>{{ slotText(i, k) }}
      </span>
      <span v-if="slotRezept(i, k)" class="rezept-link" @click="rezeptAnsehen(slotRezept(i, k))" title="Rezept anzeigen">🍲</span>
      <span class="mut" @click="slotOeffnen(i, k)">✎</span>
    </div>
  </div>

  <button class="ghost" @click="planZuruecksetzen">Plan zurücksetzen</button>

  <PlanSlotBearbeiten
    v-if="bearbeiteSlot"
    :wochentag="bearbeiteSlot.i" :mahlzeit="bearbeiteSlot.k"
    :aktueller-text="slotText(bearbeiteSlot.i, bearbeiteSlot.k)"
    :aktuelles-rezept="slotRezept(bearbeiteSlot.i, bearbeiteSlot.k)"
    :favoriten="(favoritenJeMahlzeit[bearbeiteSlot.k] || []).slice(0, 6).map((f) => f.bezeichnung)"
    :vorschlaege="[1, 2, 3, 4, 5].map((j) => planVorschlag(bearbeiteSlot.i + j, bearbeiteSlot.k, ziel.eiweiss))"
    :rezepte="rezepte"
    @gespeichert="slotSpeichern" @zurueckgesetzt="slotZuruecksetzen" @schliessen="bearbeiteSlot = null"
  />

  <RezeptAnsicht v-if="angesehenesRezept" :rezept="angesehenesRezept" @schliessen="angesehenesRezept = null" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { plan as planApi, ernaehrung as ernaehrungApi, rezepte as rezepteApi } from '@/api/index.js'
import { tagesziel, trainingsplan, planVorschlag, WOCHENTAGE, MAHLZEIT_KURZ, MAHLZEIT_NAME } from '@/utils/ernaehrung.js'
import PlanSlotBearbeiten from './PlanSlotBearbeiten.vue'
import RezeptAnsicht from './RezeptAnsicht.vue'

const props = defineProps({ profil: { type: Object, required: true } })

const ziel = computed(() => tagesziel(props.profil))
const training = computed(() => trainingsplan(props.profil))

const planPunkte = ref([])
const favoritenGesamt = ref([])
const favoritenJeMahlzeit = ref({})
const bearbeiteSlot = ref(null)
const rezepte = ref([])
const angesehenesRezept = ref(null)

function slotText(i, k) {
  const punkt = planPunkte.value.find((p) => p.wochentag === i && p.mahlzeit === k)
  return punkt ? punkt.text : planVorschlag(i, k, ziel.value.eiweiss)
}

function slotRezept(i, k) {
  const punkt = planPunkte.value.find((p) => p.wochentag === i && p.mahlzeit === k)
  return punkt?.rezept || null
}

async function rezeptAnsehen(rezeptStub) {
  const vollesRezept = rezepte.value.find((r) => r.id === rezeptStub.id)
  angesehenesRezept.value = vollesRezept || rezeptStub
}

async function laden() {
  const [planRes, favGesamtRes, favB, favL, favD, rezepteRes] = await Promise.all([
    planApi.liste(),
    ernaehrungApi.favoriten(),
    ernaehrungApi.favoriten(MAHLZEIT_NAME.B),
    ernaehrungApi.favoriten(MAHLZEIT_NAME.L),
    ernaehrungApi.favoriten(MAHLZEIT_NAME.D),
    rezepteApi.liste(),
  ])
  planPunkte.value = planRes.data
  favoritenGesamt.value = favGesamtRes.data
  favoritenJeMahlzeit.value = { B: favB.data, L: favL.data, D: favD.data }
  rezepte.value = rezepteRes.data
}

function slotOeffnen(i, k) {
  bearbeiteSlot.value = { i, k }
}

async function slotSpeichern({ text, rezeptId }) {
  const { i, k } = bearbeiteSlot.value
  await planApi.setzen(i, k, text, rezeptId)
  bearbeiteSlot.value = null
  await laden()
}

async function slotZuruecksetzen() {
  const { i, k } = bearbeiteSlot.value
  await planApi.entfernen(i, k)
  bearbeiteSlot.value = null
  await laden()
}

async function ausFavoritenFuellen() {
  if (!confirm('Bisherige Änderungen im Plan werden dabei ersetzt. Fortfahren?')) return
  const aufgaben = []
  for (let i = 0; i < 7; i++) {
    for (const k of ['B', 'L', 'D']) {
      const f = (favoritenJeMahlzeit.value[k] || []).map((x) => x.bezeichnung)
      if (!f.length) continue
      const text = [...new Set([0, 1, 2].map((j) => f[(i + j) % f.length]))].join(' + ')
      aufgaben.push(planApi.setzen(i, k, text))
    }
  }
  if (!aufgaben.length) { alert('Trage zuerst ein paar Mahlzeiten ein, dann kann ich den Plan daraus füllen.'); return }
  await Promise.all(aufgaben)
  await laden()
}

async function planZuruecksetzen() {
  if (!confirm('Alle Änderungen am Plan zurücksetzen?')) return
  await planApi.alleEntfernen()
  await laden()
}

onMounted(laden)
</script>

<style scoped>
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; margin: 12px 0; max-width: 480px; }
.hinweis { border-left: 4px solid var(--primary-dark); padding: 6px 12px; font-size: 14px; color: var(--muted); margin: 12px 0; max-width: 460px; }
.mut { color: var(--muted); font-size: 13px; }
ul { margin: 8px 0 0; padding-left: 18px; }
.slot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 0; border-bottom: 1px solid var(--line); }
.slot:last-child { border-bottom: none; }
.slot-text { flex: 1; min-width: 0; cursor: pointer; }
.rezept-link { cursor: pointer; flex-shrink: 0; }
.slot > .mut { cursor: pointer; flex-shrink: 0; }
button.ghost { padding: 9px 16px; border: 1.5px solid var(--primary); border-radius: 8px; background: transparent; color: var(--primary); font-weight: 600; margin-top: 8px; }
button.ghost:disabled { opacity: .5; cursor: default; }
</style>
