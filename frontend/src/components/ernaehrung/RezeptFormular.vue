<template>
  <div class="sheet" @click="(e) => e.target === e.currentTarget && $emit('schliessen')">
    <div class="box">
      <h2>{{ rezept ? 'Rezept bearbeiten' : 'Rezept hinzufügen' }}</h2>

      <label>Titel</label>
      <input v-model="form.titel" placeholder="z. B. Hähnchen-Curry" />

      <div class="g2">
        <div>
          <label>Portionen</label>
          <input v-model.number="form.portionen" type="number" min="1" />
        </div>
        <div>
          <label>Zeit (Minuten)</label>
          <input v-model.number="form.zeitMinuten" type="number" min="1" />
        </div>
      </div>

      <label>Foto (optional)</label>
      <input type="file" accept="image/*" @change="fotoAuswaehlen" />
      <img v-if="fotoVorschau" :src="fotoVorschau" class="foto-vorschau" />

      <label>Zutaten</label>
      <div class="zutat-zeile" v-for="(z, i) in form.zutaten" :key="i">
        <input v-model="form.zutaten[i]" placeholder="z. B. 200 g Hähnchenbrust" />
        <span class="loeschen" @click="form.zutaten.splice(i, 1)">×</span>
      </div>
      <button class="ghost klein" @click="form.zutaten.push('')">+ Zutat</button>

      <label>Zubereitung</label>
      <textarea v-model="form.zubereitung" rows="5" placeholder="Schritt für Schritt…"></textarea>

      <label>Nährwerte pro Portion (optional)</label>
      <div class="g4">
        <div><input v-model.number="form.kcal" type="number" min="0" placeholder="kcal" /></div>
        <div><input v-model.number="form.nettoCarbs" type="number" min="0" step="0.1" placeholder="Carbs g" /></div>
        <div><input v-model.number="form.fett" type="number" min="0" step="0.1" placeholder="Fett g" /></div>
        <div><input v-model.number="form.eiweiss" type="number" min="0" step="0.1" placeholder="Eiweiß g" /></div>
      </div>

      <label>Tags</label>
      <div class="tags" v-if="form.tags.length">
        <span class="tag" v-for="t in form.tags" :key="t">{{ t }} <span class="tag-x" @click="form.tags = form.tags.filter((x) => x !== t)">×</span></span>
      </div>
      <div class="g2">
        <input v-model="neuerTag" placeholder="z. B. Vegetarisch, Schnell" @keyup.enter="tagHinzufuegen" />
        <button @click="tagHinzufuegen" :disabled="!neuerTag.trim()">Hinzufügen</button>
      </div>

      <label class="inline">
        <input type="checkbox" v-model="form.oeffentlich" /> Für andere Rocket-Nutzer sichtbar
      </label>

      <button @click="speichern" :disabled="!form.titel.trim()">Speichern</button>
      <button v-if="rezept" class="ghost gefahr" @click="loeschen">Rezept löschen</button>
      <button class="ghost" @click="$emit('schliessen')">Abbrechen</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { rezepte as rezepteApi } from '@/api/index.js'
import { rezeptfotoVerkleinern } from '@/utils/rezepte.js'

const props = defineProps({ rezept: { type: Object, default: null } })
const emit = defineEmits(['gespeichert', 'geloescht', 'schliessen'])

const form = reactive({
  titel: props.rezept?.titel || '',
  portionen: props.rezept?.portionen || null,
  zeitMinuten: props.rezept?.zeitMinuten || null,
  zutaten: props.rezept?.zutaten?.map((z) => z.text) || [''],
  zubereitung: props.rezept?.zubereitung || '',
  kcal: props.rezept?.kcal ?? null,
  nettoCarbs: props.rezept?.nettoCarbs ?? null,
  fett: props.rezept?.fett ?? null,
  eiweiss: props.rezept?.eiweiss ?? null,
  tags: props.rezept?.tags ? [...props.rezept.tags] : [],
  oeffentlich: props.rezept?.oeffentlich || false,
})

const neuerTag = ref('')
function tagHinzufuegen() {
  const tag = neuerTag.value.trim()
  if (!tag || form.tags.includes(tag)) { neuerTag.value = ''; return }
  form.tags.push(tag)
  neuerTag.value = ''
}

const fotoDatei = ref(null)
const fotoVorschau = ref(null)

async function fotoAuswaehlen(ev) {
  const datei = ev.target.files[0]
  if (!datei) return
  fotoDatei.value = await rezeptfotoVerkleinern(datei)
  if (fotoVorschau.value) URL.revokeObjectURL(fotoVorschau.value)
  fotoVorschau.value = URL.createObjectURL(fotoDatei.value)
}

async function speichern() {
  if (!form.titel.trim()) return
  const daten = {
    titel: form.titel.trim(),
    portionen: form.portionen || null,
    zeitMinuten: form.zeitMinuten || null,
    zutaten: form.zutaten,
    zubereitung: form.zubereitung,
    kcal: form.kcal || null,
    nettoCarbs: form.nettoCarbs || null,
    fett: form.fett || null,
    eiweiss: form.eiweiss || null,
    tags: form.tags,
    oeffentlich: form.oeffentlich,
  }
  const res = props.rezept
    ? await rezepteApi.aktualisieren(props.rezept.id, daten)
    : await rezepteApi.erstellen(daten)
  let gespeichertesRezept = res.data
  if (fotoDatei.value) {
    const formData = new FormData()
    formData.append('foto', fotoDatei.value, 'rezept.jpg')
    const fotoRes = await rezepteApi.fotoHochladen(gespeichertesRezept.id, formData)
    gespeichertesRezept = fotoRes.data
  }
  emit('gespeichert', gespeichertesRezept)
}

async function loeschen() {
  if (!confirm(`"${props.rezept.titel}" wirklich löschen?`)) return
  await rezepteApi.loeschen(props.rezept.id)
  emit('geloescht', props.rezept.id)
}

onUnmounted(() => { if (fotoVorschau.value) URL.revokeObjectURL(fotoVorschau.value) })
</script>

<style scoped>
.sheet { position: fixed; inset: 0; background: #0006; z-index: 20; display: flex; align-items: flex-end; justify-content: center; }
.box { background: var(--card); width: 100%; max-width: 480px; max-height: 88vh; overflow: auto; border-radius: 20px 20px 0 0; padding: 20px 18px 28px; }
h2 { margin: 0 0 12px; }
label { display: block; font-size: 13px; color: var(--muted); margin: 10px 0 4px; }
label.inline { display: flex; align-items: center; gap: 6px; margin-top: 14px; }
label.inline input { width: auto; }
input, textarea { width: 100%; padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; font: inherit; }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; }
.g2 button { margin-top: 0; }
.g4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; }
.foto-vorschau { width: 100%; max-height: 160px; object-fit: cover; border-radius: 8px; margin-top: 8px; }
.zutat-zeile { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.zutat-zeile .loeschen { color: var(--danger); font-size: 16px; cursor: pointer; padding: 0 2px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.tag { display: inline-flex; align-items: center; gap: 4px; background: var(--bg); border: 1px solid var(--line); color: var(--ink); border-radius: 999px; padding: 4px 10px; font-size: 13px; }
.tag-x { color: var(--muted); cursor: pointer; font-size: 14px; line-height: 1; }
button { padding: 9px 14px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; margin-top: 14px; width: 100%; }
button:disabled { opacity: .5; }
button.ghost { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); }
button.ghost.klein { padding: 7px 12px; font-size: 13px; margin-top: 4px; }
button.ghost.gefahr { border-color: var(--danger); color: var(--danger); }
</style>
