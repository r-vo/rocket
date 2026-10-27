<template>
  <div class="sheet" @click="(e) => e.target === e.currentTarget && $emit('schliessen')">
    <div class="box">
      <h2>Buch hinzufügen</h2>

      <input v-model="suchtext" @input="suchen" placeholder="Titel suchen…" />

      <div v-if="suche.laedt" class="mut">Suche…</div>
      <div v-if="suche.fehler" class="mut">Suche gerade nicht möglich — trag das Buch unten manuell ein.</div>

      <div v-for="(t, i) in treffer" :key="i" class="treffer" @click="auswaehlen(t)">
        <img v-if="t.coverUrl" :src="t.coverUrl" />
        <div v-else class="cover-platzhalter">📖</div>
        <div>
          <strong>{{ t.titel }}</strong>
          <p class="mut">{{ t.autor }}</p>
        </div>
      </div>

      <h3>Oder manuell eintragen</h3>
      <label>Titel</label>
      <input v-model="manuell.titel" />
      <label>Autor</label>
      <input v-model="manuell.autor" />
      <label>Seitenzahl</label>
      <input v-model.number="manuell.seitenzahl" type="number" />
      <label>Foto vom Buch (optional)</label>
      <input type="file" accept="image/*" @change="fotoAuswaehlen" />
      <img v-if="fotoVorschau" :src="fotoVorschau" class="foto-vorschau" />
      <button @click="manuellHinzufuegen" :disabled="!manuell.titel.trim()">Buch anlegen</button>
      <button class="ghost" @click="$emit('schliessen')">Abbrechen</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { buchsucheOpenLibrary, buchfotoVerkleinern } from '@/utils/buecher.js'

const emit = defineEmits(['ausgewaehlt', 'schliessen'])

const suchtext = ref('')
const treffer = ref([])
const suche = reactive({ laedt: false, fehler: false })
let timer = null

function suchen() {
  clearTimeout(timer)
  if (!suchtext.value.trim()) { treffer.value = []; return }
  timer = setTimeout(async () => {
    suche.laedt = true
    suche.fehler = false
    try {
      treffer.value = await buchsucheOpenLibrary(suchtext.value)
    } catch (err) {
      suche.fehler = true
      treffer.value = []
    } finally {
      suche.laedt = false
    }
  }, 400)
}

function auswaehlen(t) {
  emit('ausgewaehlt', { titel: t.titel, autor: t.autor, coverUrl: t.coverUrl, seitenzahl: t.seitenzahl })
}

const manuell = reactive({ titel: '', autor: '', seitenzahl: null })
const fotoDatei = ref(null)
const fotoVorschau = ref(null)

async function fotoAuswaehlen(ev) {
  const datei = ev.target.files[0]
  if (!datei) return
  fotoDatei.value = await buchfotoVerkleinern(datei)
  if (fotoVorschau.value) URL.revokeObjectURL(fotoVorschau.value)
  fotoVorschau.value = URL.createObjectURL(fotoDatei.value)
}

function manuellHinzufuegen() {
  if (!manuell.titel.trim()) return
  emit('ausgewaehlt', {
    titel: manuell.titel.trim(),
    autor: manuell.autor.trim() || null,
    coverUrl: null,
    seitenzahl: manuell.seitenzahl,
    foto: fotoDatei.value,
  })
}

onUnmounted(() => { if (fotoVorschau.value) URL.revokeObjectURL(fotoVorschau.value) })
</script>

<style scoped>
.sheet { position: fixed; inset: 0; background: #0006; z-index: 20; display: flex; align-items: flex-end; justify-content: center; }
.box { background: var(--card); width: 100%; max-width: 480px; max-height: 88vh; overflow: auto; border-radius: 20px 20px 0 0; padding: 20px 18px 28px; }
h2 { margin: 0 0 12px; }
h3 { margin: 18px 0 8px; font-size: 15px; }
label { display: block; font-size: 13px; color: var(--muted); margin: 8px 0 2px; }
input { width: 100%; padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; }
button { padding: 9px 14px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; margin-top: 10px; width: 100%; }
button.ghost { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); }
.treffer { display: flex; gap: 10px; align-items: center; padding: 8px 2px; border-bottom: 1px solid var(--line); cursor: pointer; }
.treffer img { width: 36px; height: 52px; object-fit: cover; border-radius: 4px; }
.cover-platzhalter { width: 36px; height: 52px; display: flex; align-items: center; justify-content: center; background: var(--bg); border-radius: 4px; }
.mut { color: var(--muted); font-size: 13px; }
.foto-vorschau { width: 72px; height: 104px; object-fit: cover; border-radius: 5px; margin-top: 8px; }
</style>
