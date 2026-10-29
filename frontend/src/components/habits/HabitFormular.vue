<template>
  <div class="sheet" @click="(e) => e.target === e.currentTarget && $emit('schliessen')">
    <div class="box">
      <h2>{{ habit ? 'Habit bearbeiten' : 'Habit hinzufügen' }}</h2>

      <label>Bezeichnung</label>
      <input v-model="form.bezeichnung" placeholder="z. B. Wasser trinken" />

      <label>Art</label>
      <div class="wahl">
        <button :class="{ on: form.art === 'positiv' }" @click="form.art = 'positiv'">👍 Positiv</button>
        <button :class="{ on: form.art === 'negativ' }" @click="form.art = 'negativ'">🚫 Negativ</button>
      </div>
      <p class="mut klein">{{ form.art === 'negativ' ? 'Ich will etwas vermeiden.' : 'Ich will etwas tun.' }}</p>

      <label>Häufigkeit</label>
      <div class="wahl">
        <button :class="{ on: form.frequenz === 'taeglich' }" @click="form.frequenz = 'taeglich'">Täglich</button>
        <button :class="{ on: form.frequenz === 'woechentlich' }" @click="form.frequenz = 'woechentlich'">Wöchentlich</button>
      </div>

      <label>{{ zielLabel }}</label>
      <input v-model.number="form.zielAnzahl" type="number" min="1" />

      <label v-if="habit" class="inline">
        <input type="checkbox" v-model="form.aktiv" /> Aktiv
      </label>

      <button @click="speichern" :disabled="!form.bezeichnung.trim()">Speichern</button>
      <button v-if="habit" class="ghost gefahr" @click="loeschen">Habit löschen</button>
      <button class="ghost" @click="$emit('schliessen')">Abbrechen</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { habits as habitsApi } from '@/api/index.js'

const props = defineProps({ habit: { type: Object, default: null } })
const emit = defineEmits(['gespeichert', 'geloescht', 'schliessen'])

const form = reactive({
  bezeichnung: props.habit?.bezeichnung || '',
  art: props.habit?.art || 'positiv',
  frequenz: props.habit?.frequenz || 'taeglich',
  zielAnzahl: props.habit?.zielAnzahl || 1,
  aktiv: props.habit?.aktiv ?? true,
})

const zielLabel = computed(() => {
  const einheit = form.frequenz === 'woechentlich' ? 'pro Woche' : 'pro Tag'
  return form.art === 'negativ' ? `Erlaubte Häufigkeit ${einheit}` : `Zielanzahl ${einheit}`
})

async function speichern() {
  if (!form.bezeichnung.trim()) return
  const daten = {
    bezeichnung: form.bezeichnung.trim(),
    art: form.art,
    frequenz: form.frequenz,
    zielAnzahl: Math.max(1, form.zielAnzahl || 1),
  }
  if (props.habit) {
    daten.aktiv = form.aktiv
    const res = await habitsApi.aktualisieren(props.habit.id, daten)
    emit('gespeichert', res.data)
  } else {
    const res = await habitsApi.erstellen(daten)
    emit('gespeichert', res.data)
  }
}

async function loeschen() {
  if (!confirm(`"${props.habit.bezeichnung}" wirklich löschen?`)) return
  await habitsApi.loeschen(props.habit.id)
  emit('geloescht', props.habit.id)
}
</script>

<style scoped>
.sheet { position: fixed; inset: 0; background: #0006; z-index: 20; display: flex; align-items: flex-end; justify-content: center; }
.box { background: var(--card); width: 100%; max-width: 480px; max-height: 88vh; overflow: auto; border-radius: 20px 20px 0 0; padding: 20px 18px 28px; }
h2 { margin: 0 0 12px; }
label { display: block; font-size: 13px; color: var(--muted); margin: 10px 0 4px; }
label.inline { display: flex; align-items: center; gap: 6px; margin-top: 14px; }
label.inline input { width: auto; }
input { width: 100%; padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; font: inherit; }
.wahl { display: flex; gap: 6px; }
.wahl button { flex: 1; padding: 9px 8px; border: 1.5px solid var(--line); border-radius: 8px; background: transparent; color: var(--muted); font-size: 13px; }
.wahl button.on { border-color: var(--primary); color: var(--primary); font-weight: 600; }
.mut { color: var(--muted); }
.mut.klein { font-size: 12px; margin: 4px 0 0; }
button { padding: 9px 14px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; margin-top: 14px; width: 100%; }
button:disabled { opacity: .5; }
button.ghost { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); }
button.ghost.gefahr { border-color: var(--danger); color: var(--danger); }
</style>
