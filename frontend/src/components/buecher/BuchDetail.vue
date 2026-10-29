<template>
  <div class="sheet" @click="(e) => e.target === e.currentTarget && $emit('schliessen')">
    <div class="box">
      <div class="kopf">
        <div class="cover-box"><BuchCover :buch="buch" /></div>
        <div>
          <h2>{{ buch.titel }}</h2>
          <p class="mut">{{ buch.autor }}</p>
          <label class="foto-link">
            {{ buch.coverDateiname || buch.coverUrl ? 'Foto ändern' : 'Foto zuordnen' }}
            <input type="file" accept="image/*" @change="coverAuswaehlen" />
          </label>
        </div>
      </div>

      <div class="status-wahl">
        <button v-for="(name, s) in STATUS_NAME" :key="s" :class="{ on: buch.status === s }" @click="statusSetzen(s)">{{ name }}</button>
      </div>

      <div class="feld">
        <label>Tags</label>
        <div class="tags" v-if="buch.tags?.length">
          <span class="tag" v-for="t in buch.tags" :key="t">{{ t }} <span class="tag-x" @click="tagEntfernen(t)">×</span></span>
        </div>
        <div class="g2">
          <input v-model="neuerTag" placeholder="z. B. Krimi, Hörbuch" @keyup.enter="tagHinzufuegen" />
          <button @click="tagHinzufuegen" :disabled="!neuerTag.trim()">Hinzufügen</button>
        </div>
      </div>

      <div v-if="buch.status === 'am_lesen'" class="feld">
        <label>Aktuelle Seite{{ buch.seitenzahl ? ` von ${buch.seitenzahl}` : '' }}</label>
        <input v-model.number="aktuelleSeite" type="number" @change="fortschrittSpeichern" />
      </div>

      <div v-if="buch.status === 'gelesen'" class="feld">
        <label>Bewertung</label>
        <div class="sterne-wahl">
          <span v-for="n in 5" :key="n" @click="bewertungSetzen(n)" :class="{ an: buch.bewertung >= n }">★</span>
        </div>
        <p v-if="buch.beendetAm" class="mut">Beendet am {{ formatDatum(buch.beendetAm) }}</p>
      </div>

      <div class="feld">
        <label>Details</label>
        <div class="details-form">
          <div>
            <label class="klein">Seitenzahl</label>
            <input v-model.number="details.seitenzahl" type="number" />
          </div>
          <div>
            <label class="klein">ISBN</label>
            <input v-model="details.isbn" />
          </div>
          <div>
            <label class="klein">Verlag</label>
            <input v-model="details.verlag" />
          </div>
          <div>
            <label class="klein">Ausgabe</label>
            <input v-model="details.ausgabe" placeholder="z. B. Taschenbuch" />
          </div>
        </div>
        <button @click="detailsSpeichern">Details speichern</button>
      </div>

      <h3>Notizen</h3>
      <div v-for="n in notizen" :key="n.id" class="notiz">
        <p>{{ n.text }}</p>
        <div class="notiz-fuss">
          <span class="mut">{{ formatDatum(n.erstelltAm?.slice(0, 10)) }}{{ n.seite ? ` · S. ${n.seite}` : '' }}</span>
          <span class="loeschen" @click="notizLoeschen(n.id)">Löschen</span>
        </div>
      </div>
      <p v-if="!notizen.length" class="mut">Noch keine Notizen.</p>

      <div class="neue-notiz">
        <textarea v-model="neueNotiz.text" placeholder="Gedanken, Zitat, Zusammenfassung…" rows="3"></textarea>
        <div class="g2">
          <input v-model.number="neueNotiz.seite" type="number" placeholder="Seite (optional)" />
          <button @click="notizHinzufuegen" :disabled="!neueNotiz.text.trim()">Notiz speichern</button>
        </div>
      </div>

      <button class="ghost gefahr" @click="buchLoeschen">Buch löschen</button>
      <button class="ghost" @click="$emit('schliessen')">Schließen</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { buecher as buecherApi } from '@/api/index.js'
import { STATUS_NAME, formatDatum, buchfotoVerkleinern } from '@/utils/buecher.js'
import BuchCover from './BuchCover.vue'

const props = defineProps({ buch: { type: Object, required: true } })
const emit = defineEmits(['aktualisiert', 'geloescht', 'schliessen'])

const notizen = ref([])
const aktuelleSeite = ref(props.buch.aktuelleSeite)
const neueNotiz = reactive({ text: '', seite: null })

async function coverAuswaehlen(ev) {
  const datei = ev.target.files[0]
  ev.target.value = ''
  if (!datei) return
  const verkleinert = await buchfotoVerkleinern(datei)
  const formData = new FormData()
  formData.append('foto', verkleinert, 'cover.jpg')
  const res = await buecherApi.coverHochladen(props.buch.id, formData)
  emit('aktualisiert', res.data)
}

async function notizenLaden() {
  const res = await buecherApi.notizen(props.buch.id)
  notizen.value = res.data
}

async function statusSetzen(status) {
  const res = await buecherApi.aktualisieren(props.buch.id, { status })
  emit('aktualisiert', res.data)
}

async function fortschrittSpeichern() {
  const res = await buecherApi.aktualisieren(props.buch.id, { aktuelleSeite: aktuelleSeite.value })
  emit('aktualisiert', res.data)
}

async function bewertungSetzen(n) {
  const res = await buecherApi.aktualisieren(props.buch.id, { bewertung: n })
  emit('aktualisiert', res.data)
}

const details = reactive({
  seitenzahl: props.buch.seitenzahl,
  isbn: props.buch.isbn,
  verlag: props.buch.verlag,
  ausgabe: props.buch.ausgabe,
})

async function detailsSpeichern() {
  const res = await buecherApi.aktualisieren(props.buch.id, { ...details })
  emit('aktualisiert', res.data)
}

const neuerTag = ref('')

async function tagHinzufuegen() {
  const tag = neuerTag.value.trim()
  if (!tag) return
  if ((props.buch.tags || []).includes(tag)) { neuerTag.value = ''; return }
  const res = await buecherApi.aktualisieren(props.buch.id, { tags: [...(props.buch.tags || []), tag] })
  neuerTag.value = ''
  emit('aktualisiert', res.data)
}

async function tagEntfernen(tag) {
  const res = await buecherApi.aktualisieren(props.buch.id, { tags: (props.buch.tags || []).filter((t) => t !== tag) })
  emit('aktualisiert', res.data)
}

async function notizHinzufuegen() {
  if (!neueNotiz.text.trim()) return
  await buecherApi.notizErstellen(props.buch.id, { text: neueNotiz.text.trim(), seite: neueNotiz.seite })
  neueNotiz.text = ''
  neueNotiz.seite = null
  await notizenLaden()
}

async function notizLoeschen(id) {
  if (!confirm('Notiz wirklich löschen?')) return
  await buecherApi.notizLoeschen(id)
  await notizenLaden()
}

async function buchLoeschen() {
  if (!confirm(`"${props.buch.titel}" wirklich löschen? Notizen gehen dabei verloren.`)) return
  await buecherApi.loeschen(props.buch.id)
  emit('geloescht', props.buch.id)
}

onMounted(notizenLaden)
</script>

<style scoped>
.sheet { position: fixed; inset: 0; background: #0006; z-index: 20; display: flex; align-items: flex-end; justify-content: center; }
.box { background: var(--card); width: 100%; max-width: 480px; max-height: 90vh; overflow: auto; border-radius: 20px 20px 0 0; padding: 20px 18px 28px; }
.kopf { display: flex; gap: 12px; align-items: flex-start; }
.cover-box { width: 56px; height: 82px; border-radius: 5px; overflow: hidden; font-size: 24px; flex-shrink: 0; }
h2 { margin: 0 0 2px; font-size: 19px; }
.foto-link { display: inline-block; margin-top: 6px; font-size: 13px; color: var(--primary); cursor: pointer; }
.foto-link input { display: none; }
h3 { margin: 20px 0 8px; font-size: 15px; }
.mut { color: var(--muted); font-size: 13px; margin: 2px 0; }
.status-wahl { display: flex; gap: 6px; margin-top: 16px; }
.status-wahl button { flex: 1; padding: 8px 4px; border: 1.5px solid var(--line); border-radius: 8px; background: transparent; color: var(--muted); font-size: 13px; }
.status-wahl button.on { border-color: var(--primary); color: var(--primary); font-weight: 600; }
.feld { margin-top: 14px; }
label { display: block; font-size: 13px; color: var(--muted); margin: 4px 0; }
input, textarea { width: 100%; padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; font: inherit; }
.sterne-wahl { font-size: 24px; color: var(--line); }
.sterne-wahl span { cursor: pointer; }
.sterne-wahl span.an { color: var(--primary); }
.notiz { border-bottom: 1px solid var(--line); padding: 8px 0; }
.notiz p { margin: 0 0 4px; }
.notiz-fuss { display: flex; justify-content: space-between; }
.loeschen { color: var(--danger); font-size: 13px; cursor: pointer; }
.neue-notiz { margin-top: 10px; }
.g2 { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-top: 8px; }
.g2 button { padding: 9px 14px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; }
.g2 button:disabled { opacity: .5; }
.details-form { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; }
.details-form label.klein { margin: 0 0 2px; font-size: 12px; }
.feld > button { padding: 9px 14px; border: 1.5px solid var(--primary); border-radius: 8px; background: transparent; color: var(--primary); font-weight: 600; margin-top: 10px; width: 100%; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.tag { display: inline-flex; align-items: center; gap: 4px; background: var(--bg); border: 1px solid var(--line); color: var(--ink); border-radius: 999px; padding: 4px 10px; font-size: 13px; }
.tag-x { color: var(--muted); cursor: pointer; font-size: 14px; line-height: 1; }
button.ghost { padding: 9px 14px; border: 1.5px solid var(--primary); border-radius: 8px; background: transparent; color: var(--primary); font-weight: 600; margin-top: 16px; width: 100%; }
button.ghost.gefahr { border-color: var(--danger); color: var(--danger); margin-bottom: 8px; }
</style>
