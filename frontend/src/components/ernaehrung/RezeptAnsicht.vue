<template>
  <div class="sheet" @click="(e) => e.target === e.currentTarget && $emit('schliessen')">
    <div class="box">
      <div class="foto-box"><RezeptFoto :rezept="rezept" /></div>
      <div class="titel-zeile">
        <h2>{{ rezept.titel }}</h2>
        <span class="stern" :class="{ an: rezept.istFavorit }" @click="favoritUmschalten">{{ rezept.istFavorit ? '★' : '☆' }}</span>
      </div>
      <p class="mut">
        {{ rezept.portionen ? `${rezept.portionen} Portionen` : '' }}{{ rezept.portionen && rezept.zeitMinuten ? ' · ' : '' }}{{ rezept.zeitMinuten ? `${rezept.zeitMinuten} Min.` : '' }}
      </p>
      <p v-if="!rezept.istEigenes" class="mut">Geteilt von {{ rezept.nutzerName }}</p>

      <div class="tags" v-if="rezept.tags?.length">
        <span class="tag" v-for="t in rezept.tags" :key="t">{{ t }}</span>
      </div>

      <h3 v-if="rezept.zutaten?.length">Zutaten</h3>
      <ul v-if="rezept.zutaten?.length" class="zutaten">
        <li v-for="z in rezept.zutaten" :key="z.id">{{ z.text }}</li>
      </ul>

      <h3 v-if="rezept.zubereitung">Zubereitung</h3>
      <p v-if="rezept.zubereitung" class="zubereitung">{{ rezept.zubereitung }}</p>

      <h3>Nährwerte pro Portion</h3>
      <p class="mut klein">Jeder, der dieses Rezept sehen kann, darf die Werte erfassen oder korrigieren.</p>
      <div class="g4">
        <div><label class="klein">kcal</label><input v-model.number="naehrwerte.kcal" type="number" min="0" /></div>
        <div><label class="klein">Carbs g</label><input v-model.number="naehrwerte.nettoCarbs" type="number" min="0" step="0.1" /></div>
        <div><label class="klein">Fett g</label><input v-model.number="naehrwerte.fett" type="number" min="0" step="0.1" /></div>
        <div><label class="klein">Eiweiß g</label><input v-model.number="naehrwerte.eiweiss" type="number" min="0" step="0.1" /></div>
      </div>
      <button class="ghost klein" @click="naehrwerteSpeichern">Nährwerte speichern</button>

      <template v-if="rezept.istEigenes">
        <button @click="$emit('bearbeiten', rezept)">Bearbeiten</button>
      </template>
      <button class="ghost" @click="$emit('schliessen')">Schließen</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { rezepte as rezepteApi } from '@/api/index.js'
import RezeptFoto from './RezeptFoto.vue'

const props = defineProps({ rezept: { type: Object, required: true } })
const emit = defineEmits(['bearbeiten', 'schliessen', 'aktualisiert'])

const naehrwerte = reactive({
  kcal: props.rezept.kcal ?? null,
  nettoCarbs: props.rezept.nettoCarbs ?? null,
  fett: props.rezept.fett ?? null,
  eiweiss: props.rezept.eiweiss ?? null,
})

async function naehrwerteSpeichern() {
  const res = await rezepteApi.aktualisieren(props.rezept.id, {
    kcal: naehrwerte.kcal || null,
    nettoCarbs: naehrwerte.nettoCarbs || null,
    fett: naehrwerte.fett || null,
    eiweiss: naehrwerte.eiweiss || null,
  })
  emit('aktualisiert', res.data)
}

async function favoritUmschalten() {
  if (props.rezept.istFavorit) {
    await rezepteApi.favoritEntfernen(props.rezept.id)
  } else {
    await rezepteApi.favoritSetzen(props.rezept.id)
  }
  emit('aktualisiert', { ...props.rezept, istFavorit: !props.rezept.istFavorit })
}
</script>

<style scoped>
.sheet { position: fixed; inset: 0; background: #0006; z-index: 20; display: flex; align-items: flex-end; justify-content: center; }
.box { background: var(--card); width: 100%; max-width: 480px; max-height: 90vh; overflow: auto; border-radius: 20px 20px 0 0; padding: 20px 18px 28px; }
.foto-box { width: 100%; height: 160px; border-radius: 10px; overflow: hidden; font-size: 40px; margin-bottom: 12px; }
.titel-zeile { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
h2 { margin: 0 0 2px; font-size: 19px; }
.stern { font-size: 26px; color: var(--muted); cursor: pointer; line-height: 1; flex-shrink: 0; }
.stern.an { color: #f2b705; }
h3 { margin: 16px 0 6px; font-size: 15px; }
.mut { color: var(--muted); font-size: 13px; margin: 2px 0; }
.mut.klein { font-size: 12px; }
.g4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-top: 6px; }
.g4 label.klein { display: block; font-size: 11px; color: var(--muted); margin-bottom: 2px; }
.g4 input { width: 100%; padding: 7px 6px; border: 1px solid var(--line); border-radius: 6px; font: inherit; font-size: 13px; }
button.ghost.klein { padding: 8px 12px; font-size: 13px; margin-top: 8px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tag { display: inline-flex; align-items: center; background: var(--bg); border: 1px solid var(--line); color: var(--ink); border-radius: 999px; padding: 4px 10px; font-size: 13px; }
.zutaten { margin: 0; padding-left: 18px; }
.zutaten li { margin-bottom: 4px; }
.zubereitung { white-space: pre-wrap; }
button { padding: 9px 14px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; margin-top: 16px; width: 100%; }
button.ghost { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); }
</style>
