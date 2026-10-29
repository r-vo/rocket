<template>
  <h1>Habits</h1>

  <div v-if="laedt" class="mut">Wird geladen…</div>

  <template v-else>
    <div class="habit-karte" v-for="h in habitListe" :key="h.id" :class="{ inaktiv: !h.aktiv }">
      <div class="kopf" @click="bearbeiten(h)">
        <strong>{{ h.art === 'negativ' ? '🚫' : '👍' }} {{ h.bezeichnung }}</strong>
        <p class="mut">{{ frequenzLabel(h) }}{{ !h.aktiv ? ' · inaktiv' : '' }}</p>
      </div>
      <div class="fortschritt">
        <button class="schritt" @click="aendern(h, -1)" :disabled="h.heutigeAnzahl <= 0">−</button>
        <span class="zahl" :class="{ erfolg: erfolgreich(h) }">{{ h.aktuelleAnzahl }} / {{ h.zielAnzahl }}</span>
        <button class="schritt" @click="aendern(h, 1)">+</button>
      </div>
    </div>
    <p v-if="!habitListe.length" class="mut">Noch keine Habits angelegt.</p>

    <button class="hinzufuegen" @click="zeigeFormular = true">+ Habit hinzufügen</button>
  </template>

  <HabitFormular
    v-if="zeigeFormular || bearbeitenHabit"
    :habit="bearbeitenHabit"
    @gespeichert="nachSpeichern"
    @geloescht="nachSpeichern"
    @schliessen="schliessen"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { habits as habitsApi } from '@/api/index.js'
import { frequenzLabel } from '@/utils/habits.js'
import HabitFormular from '@/components/habits/HabitFormular.vue'

const habitListe = ref([])
const laedt = ref(true)
const zeigeFormular = ref(false)
const bearbeitenHabit = ref(null)

function erfolgreich(h) {
  return h.art === 'negativ' ? h.aktuelleAnzahl <= h.zielAnzahl : h.aktuelleAnzahl >= h.zielAnzahl
}

async function laden() {
  laedt.value = true
  const res = await habitsApi.liste()
  habitListe.value = res.data
  laedt.value = false
}

function bearbeiten(h) {
  bearbeitenHabit.value = h
}

function schliessen() {
  zeigeFormular.value = false
  bearbeitenHabit.value = null
}

async function nachSpeichern() {
  schliessen()
  await laden()
}

async function aendern(h, richtung) {
  const neuHeute = Math.max(0, h.heutigeAnzahl + richtung)
  await habitsApi.eintragSetzen(h.id, h.heute, neuHeute)
  h.aktuelleAnzahl += neuHeute - h.heutigeAnzahl
  h.heutigeAnzahl = neuHeute
}

onMounted(laden)
</script>

<style scoped>
.habit-karte { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.habit-karte.inaktiv { opacity: .55; }
.kopf { cursor: pointer; flex: 1; min-width: 0; }
.kopf strong { display: block; }
.mut { color: var(--muted); font-size: 13px; margin: 2px 0 0; }
.fortschritt { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.schritt { width: 32px; height: 32px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); font-size: 18px; line-height: 1; padding: 0; }
.schritt:disabled { opacity: .4; }
.zahl { min-width: 48px; text-align: center; font-weight: 700; font-size: 14px; color: var(--muted); }
.zahl.erfolg { color: var(--success); }
.hinzufuegen { padding: 9px 16px; border: 1.5px solid var(--primary); border-radius: 8px; background: transparent; color: var(--primary); font-weight: 600; margin-top: 10px; width: 100%; }
</style>
