<template>
  <h1 v-if="istSetup">Ziele einrichten</h1>
  <h1 v-else>Ziele</h1>
  <p class="hinweis">
    <b class="pflicht">Pflicht</b> musst du ausfüllen. Alles andere ist vorbelegt und lässt sich jederzeit ändern.
  </p>
  <div v-if="fehler" class="fehler">{{ fehler }}</div>

  <div class="card">
    <h3 style="margin-top: 0;">Design</h3>
    <ThemeAuswahl />
  </div>

  <div class="card">
    <div class="g2">
      <div class="feld"><label>Alter <b class="pflicht">· Pflicht</b></label><input v-model.number="form.alter" type="number" /></div>
      <div class="feld"><label>Geschlecht</label>
        <select v-model="form.geschlecht">
          <option value="f">weiblich</option>
          <option value="m">männlich</option>
        </select>
      </div>
      <div class="feld"><label>Größe (cm) <b class="pflicht">· Pflicht</b></label><input v-model.number="form.groesseCm" type="number" /></div>
      <div class="feld"><label>Aktuelles Gewicht (kg) <b class="pflicht">· Pflicht, nur beim ersten Mal</b></label>
        <input v-model.number="form.gewichtKg" type="number" step="0.1" :disabled="!istSetup" :placeholder="!istSetup ? 'Eintragen unter Körper' : ''" />
      </div>
    </div>

    <div class="feld"><label>Zielgewicht (kg) <span class="opt">· leer = Gewicht halten</span></label><input v-model.number="form.gewichtZielKg" type="number" step="0.1" /></div>
    <div class="feld"><label>Netto-Carbs pro Tag (g) <span class="opt">· Standard 25</span></label><input v-model.number="form.nettoCarbsZielG" type="number" placeholder="25" /></div>
    <div class="feld"><label>Alltag</label>
      <select v-model.number="form.alltagFaktor">
        <option :value="1.2">Überwiegend sitzend</option>
        <option :value="1.375">Etwas aktiv</option>
        <option :value="1.55">Aktiv</option>
        <option :value="1.725">Sehr aktiv</option>
      </select>
    </div>
    <div class="g2">
      <div class="feld"><label>Trainingstage</label>
        <select v-model.number="form.trainingstage">
          <option v-for="d in [2, 3, 4, 5]" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div class="feld"><label>Equipment</label>
        <select v-model="form.equipment">
          <option value="home">Zuhause</option>
          <option value="gym">Fitnessstudio</option>
        </select>
      </div>
    </div>

    <button @click="speichern" :disabled="!form.alter || !form.groesseCm || (istSetup && !form.gewichtKg) || speichertGerade">
      {{ speichertGerade ? 'Wird gespeichert…' : (istSetup ? 'Speichern und starten' : 'Speichern') }}
    </button>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { profil as profilApi, gewicht as gewichtApi } from '@/api/index.js'
import { heuteDatum } from '@/utils/ernaehrung.js'
import ThemeAuswahl from '@/components/ThemeAuswahl.vue'

const props = defineProps({
  profil: { type: Object, default: null },
  istSetup: { type: Boolean, default: false },
})
const emit = defineEmits(['gespeichert'])

const fehler = ref('')
const speichertGerade = ref(false)
const form = reactive({
  alter: null, geschlecht: 'f', groesseCm: null, gewichtKg: null,
  gewichtZielKg: null, nettoCarbsZielG: null, alltagFaktor: 1.2, trainingstage: 3, equipment: 'home',
})

watch(() => props.profil, (p) => {
  if (!p) return
  form.alter = p.alter
  form.geschlecht = p.geschlecht || 'f'
  form.groesseCm = p.groesseCm
  form.gewichtKg = p.gewichtAktuell
  form.gewichtZielKg = p.gewichtZielKg
  form.nettoCarbsZielG = p.nettoCarbsZielG
  form.alltagFaktor = p.alltagFaktor || 1.2
  form.trainingstage = p.trainingstage || 3
  form.equipment = p.equipment || 'home'
}, { immediate: true })

async function speichern() {
  fehler.value = ''
  speichertGerade.value = true
  try {
    await profilApi.speichern({ ...form })
    if (props.istSetup && form.gewichtKg) {
      await gewichtApi.eintragen(heuteDatum(), form.gewichtKg)
    }
    emit('gespeichert')
  } catch (err) {
    fehler.value = err.response?.data?.error || 'Fehler beim Speichern'
  } finally {
    speichertGerade.value = false
  }
}
</script>

<style scoped>
.hinweis { color: var(--muted); max-width: 480px; }
.pflicht { color: var(--primary); font-weight: 600; }
.opt { color: var(--muted); }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 18px; max-width: 480px; }
.feld { margin-bottom: 12px; }
.feld label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 4px; }
.feld input, .feld select { width: 100%; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
button { margin-top: 6px; padding: 10px 16px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; }
button:disabled { opacity: .6; }
.fehler { background: #fde8ee; color: var(--danger); padding: 8px 10px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; max-width: 480px; }
</style>
