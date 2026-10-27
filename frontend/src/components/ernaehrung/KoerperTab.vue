<template>
  <h1>Körper</h1>

  <div class="card">
    <h3>Gewicht</h3>
    <div class="g2">
      <input v-model.number="neuesGewicht" type="number" step="0.1" placeholder="kg" />
      <button @click="gewichtSpeichern" :disabled="!neuesGewicht">Speichern</button>
    </div>
    <p v-if="letztesGewicht" class="mut">Zuletzt: {{ letztesGewicht.kg }} kg am {{ formatDatum(letztesGewicht.datum) }}</p>
  </div>

  <div class="card">
    <h3>Fortschrittsfotos</h3>
    <p class="mut">Gleiches Licht, gleiche Pose, gleicher Abstand. Fotos sind nur für dich sichtbar.</p>
    <input type="file" accept="image/*" @change="fotoAuswaehlen" />

    <div v-if="fotos.length" class="fotos">
      <div v-for="f in fotos" :key="f.id" class="foto" @click="fotoLoeschen(f)">
        <img v-if="f.url" :src="f.url" />
        <span class="mut">{{ formatDatum(f.datum) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { gewicht as gewichtApi, fotos as fotosApi } from '@/api/index.js'
import { heuteDatum } from '@/utils/ernaehrung.js'

const emit = defineEmits(['aktualisiert'])

const neuesGewicht = ref(null)
const letztesGewicht = ref(null)
const fotos = ref([])

function formatDatum(d) {
  return new Date(d + 'T12:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function gewichtListeLaden() {
  const res = await gewichtApi.liste()
  letztesGewicht.value = res.data[res.data.length - 1] || null
}

async function gewichtSpeichern() {
  if (!neuesGewicht.value) return
  await gewichtApi.eintragen(heuteDatum(), neuesGewicht.value)
  neuesGewicht.value = null
  await gewichtListeLaden()
  emit('aktualisiert')
}

async function fotosLaden() {
  const res = await fotosApi.liste()
  fotos.value = res.data.map((f) => ({ ...f, url: null }))
  for (const f of fotos.value) {
    try {
      const blobRes = await fotosApi.datei(f.id)
      f.url = URL.createObjectURL(blobRes.data)
    } catch (err) { /* Foto konnte nicht geladen werden */ }
  }
}

async function fotoAuswaehlen(ev) {
  const datei = ev.target.files[0]
  if (!datei) return
  const verkleinert = await verkleinern(datei)
  const formData = new FormData()
  formData.append('foto', verkleinert, 'foto.jpg')
  formData.append('datum', heuteDatum())
  await fotosApi.hochladen(formData)
  ev.target.value = ''
  await fotosLaden()
}

// Vor dem Hochladen clientseitig verkleinern (max. 900 px, JPEG) — spart Speicher und
// Übertragungszeit, Qualität bleibt für Fortschrittsvergleiche völlig ausreichend.
function verkleinern(datei) {
  return new Promise((resolve) => {
    const bild = new Image()
    bild.onload = () => {
      const faktor = Math.min(1, 900 / Math.max(bild.width, bild.height))
      const canvas = document.createElement('canvas')
      canvas.width = bild.width * faktor
      canvas.height = bild.height * faktor
      canvas.getContext('2d').drawImage(bild, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', .8)
    }
    bild.src = URL.createObjectURL(datei)
  })
}

async function fotoLoeschen(f) {
  if (!confirm('Foto wirklich löschen?')) return
  await fotosApi.loeschen(f.id)
  if (f.url) URL.revokeObjectURL(f.url)
  fotos.value = fotos.value.filter((x) => x.id !== f.id)
}

onMounted(() => { gewichtListeLaden(); fotosLaden() })
onUnmounted(() => { fotos.value.forEach((f) => f.url && URL.revokeObjectURL(f.url)) })
</script>

<style scoped>
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; margin: 12px 0; max-width: 480px; }
.g2 { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin: 8px 0; }
.g2 input { padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; }
.g2 button { padding: 9px 16px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; }
.mut { color: var(--muted); font-size: 13px; }
.fotos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
.foto { cursor: pointer; text-align: center; }
.foto img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 10px; }
</style>
