<template>
  <div class="sheet" @click="(e) => e.target === e.currentTarget && $emit('schliessen')">
    <div class="box">
      <h2>{{ wochentagName }}: {{ mahlzeitName }}</h2>
      <label>Dein Gericht</label>
      <input v-model="text" @keyup.enter="speichern" />
      <button @click="speichern">Speichern</button>

      <template v-if="favoriten.length">
        <h3>Deine Favoriten</h3>
        <p class="mut">Tippen fügt sie hinzu.</p>
        <div v-for="f in favoriten" :key="f" class="eintrag" @click="anhaengen(f)">
          <span>{{ f }}</span><span class="mut">＋</span>
        </div>
      </template>

      <h3>Vorschläge</h3>
      <div v-for="(v, i) in vorschlaege" :key="i" class="eintrag" @click="text = v">
        <span>{{ v }}</span>
      </div>

      <button class="ghost" @click="zuruecksetzen">Auf Vorschlag zurücksetzen</button>
      <button class="ghost" @click="$emit('schliessen')">Schließen</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { WOCHENTAGE, MAHLZEIT_NAME } from '@/utils/ernaehrung.js'

const props = defineProps({
  wochentag: { type: Number, required: true },
  mahlzeit: { type: String, required: true },
  aktuellerText: { type: String, default: '' },
  favoriten: { type: Array, default: () => [] },
  vorschlaege: { type: Array, default: () => [] },
})
const emit = defineEmits(['gespeichert', 'zurueckgesetzt', 'schliessen'])

const text = ref(props.aktuellerText)
const wochentagName = WOCHENTAGE[props.wochentag]
const mahlzeitName = MAHLZEIT_NAME[props.mahlzeit]

function anhaengen(f) {
  text.value = text.value.trim() ? `${text.value.trim()} + ${f}` : f
}

function speichern() {
  if (text.value.trim()) emit('gespeichert', text.value.trim())
}

function zuruecksetzen() {
  emit('zurueckgesetzt')
}
</script>

<style scoped>
.sheet { position: fixed; inset: 0; background: #0006; z-index: 20; display: flex; align-items: flex-end; justify-content: center; }
.box { background: var(--card); width: 100%; max-width: 480px; max-height: 88vh; overflow: auto; border-radius: 20px 20px 0 0; padding: 20px 18px 28px; }
h2 { margin: 0 0 12px; }
h3 { margin: 18px 0 4px; font-size: 15px; }
label { display: block; font-size: 13px; color: var(--muted); margin: 4px 0; }
input { width: 100%; padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; }
button { padding: 9px 14px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; margin-top: 10px; width: 100%; }
button.ghost { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); }
.eintrag { display: flex; justify-content: space-between; gap: 8px; padding: 9px 2px; border-bottom: 1px solid var(--line); cursor: pointer; }
.mut { color: var(--muted); font-size: 13px; }
</style>
