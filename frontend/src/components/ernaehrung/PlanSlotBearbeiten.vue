<template>
  <div class="sheet" @click="(e) => e.target === e.currentTarget && $emit('schliessen')">
    <div class="box">
      <h2>{{ wochentagName }}: {{ mahlzeitName }}</h2>
      <label>Dein Gericht</label>
      <input v-model="text" @keyup.enter="speichern" />

      <div v-if="rezeptId" class="verknuepft">
        <span>🍲 Verknüpft mit „{{ verknuepftesTitel }}"</span>
        <span class="loeschen" @click="rezeptId = null">Entfernen</span>
      </div>
      <template v-else>
        <h3>Mit Rezept verknüpfen</h3>
        <input v-model="rezeptSuche" placeholder="Rezept suchen…" />
        <div class="eintrag" v-for="r in rezeptTreffer" :key="r.id" @click="rezeptWaehlen(r)">
          <span>{{ r.titel }}{{ !r.istEigenes ? ` (von ${r.nutzerName})` : '' }}</span><span class="mut">＋</span>
        </div>
        <p v-if="rezeptSuche.trim() && !rezeptTreffer.length" class="mut">Keine Treffer.</p>
      </template>

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
import { ref, computed } from 'vue'
import { WOCHENTAGE, MAHLZEIT_NAME } from '@/utils/ernaehrung.js'

const props = defineProps({
  wochentag: { type: Number, required: true },
  mahlzeit: { type: String, required: true },
  aktuellerText: { type: String, default: '' },
  aktuellesRezept: { type: Object, default: null },
  favoriten: { type: Array, default: () => [] },
  vorschlaege: { type: Array, default: () => [] },
  rezepte: { type: Array, default: () => [] },
})
const emit = defineEmits(['gespeichert', 'zurueckgesetzt', 'schliessen'])

const text = ref(props.aktuellerText)
const rezeptId = ref(props.aktuellesRezept?.id || null)
const verknuepftesTitel = ref(props.aktuellesRezept?.titel || '')
const rezeptSuche = ref('')
const wochentagName = WOCHENTAGE[props.wochentag]
const mahlzeitName = MAHLZEIT_NAME[props.mahlzeit]

const rezeptTreffer = computed(() => {
  const begriff = rezeptSuche.value.trim().toLowerCase()
  if (!begriff) return []
  return props.rezepte.filter((r) => r.titel.toLowerCase().includes(begriff)).slice(0, 10)
})

function rezeptWaehlen(r) {
  rezeptId.value = r.id
  verknuepftesTitel.value = r.titel
  text.value = r.titel
  rezeptSuche.value = ''
}

function anhaengen(f) {
  text.value = text.value.trim() ? `${text.value.trim()} + ${f}` : f
}

function speichern() {
  if (text.value.trim()) emit('gespeichert', { text: text.value.trim(), rezeptId: rezeptId.value })
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
.verknuepft { display: flex; justify-content: space-between; align-items: center; gap: 8px; background: var(--bg); border-radius: 8px; padding: 8px 10px; margin-top: 10px; font-size: 13px; }
.verknuepft .loeschen { color: var(--danger); cursor: pointer; flex-shrink: 0; }
</style>
