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
      </div>

      <div v-if="buch.leserunden?.length" class="feld">
        <label>Leserunden</label>
        <div class="leserunde" v-for="l in buch.leserunden" :key="l.id">
          <input type="date" :value="l.begonnenAm" @change="leserundeAendern(l.id, 'begonnenAm', $event.target.value)" />
          <span class="bis">–</span>
          <input type="date" :value="l.beendetAm" @change="leserundeAendern(l.id, 'beendetAm', $event.target.value)" />
          <span class="loeschen" @click="leserundeEntfernen(l.id)">×</span>
        </div>
        <button v-if="buch.status === 'gelesen'" class="erneut" @click="erneutLesen">Erneut lesen</button>
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

        <div class="notiz-tags" v-if="n.tags?.length">
          <span class="tag klein" v-for="t in n.tags" :key="t">{{ t }} <span class="tag-x" @click="notizTagEntfernen(n, t)">×</span></span>
        </div>
        <input
          class="notiz-tag-eingabe"
          placeholder="Tag hinzufügen + Enter"
          @keyup.enter="notizTagHinzufuegen(n, $event.target.value); $event.target.value = ''"
        />

        <div class="notiz-links" v-if="n.verknuepfungen?.length">
          <div class="notiz-link" v-for="v in n.verknuepfungen" :key="v.verknuepfungId">
            <span>🔗 {{ v.buchTitel }}: {{ v.text.slice(0, 60) }}{{ v.text.length > 60 ? '…' : '' }}</span>
            <span class="loeschen" @click="verknuepfungEntfernen(v.verknuepfungId)">×</span>
          </div>
        </div>

        <div class="notiz-fuss">
          <span class="mut">{{ formatDatum(n.erstelltAm?.slice(0, 10)) }}{{ n.seite ? ` · S. ${n.seite}` : '' }}</span>
          <span class="aktionen">
            <span class="verknuepfen-link" @click="verknuepfenOeffnen(n.id)">Verknüpfen</span>
            <span class="loeschen" @click="notizLoeschen(n.id)">Löschen</span>
          </span>
        </div>

        <div v-if="verknuepfenOffenFuer === n.id" class="verknuepfen-box">
          <input v-model="verknuepfungSuche" placeholder="Notiz suchen…" @input="verknuepfungSuchen" />
          <div class="verknuepfen-ergebnisse">
            <div v-for="e in verknuepfungErgebnisse" :key="e.id" class="verknuepfen-ergebnis" @click="verknuepfungAnlegen(n.id, e.id)">
              <strong>{{ e.buchTitel }}</strong> — {{ e.text.slice(0, 60) }}{{ e.text.length > 60 ? '…' : '' }}
            </div>
            <p v-if="verknuepfungSuche.trim() && !verknuepfungErgebnisse.length" class="mut klein">Keine Treffer.</p>
          </div>
          <button class="ghost" @click="verknuepfenOffenFuer = null">Abbrechen</button>
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

async function erneutLesen() {
  await statusSetzen('am_lesen')
}

async function leserundeAendern(id, feld, wert) {
  const res = await buecherApi.leserundeAktualisieren(id, { [feld]: wert || null })
  emit('aktualisiert', res.data)
}

async function leserundeEntfernen(id) {
  const res = await buecherApi.leserundeLoeschen(id)
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

async function notizTagHinzufuegen(n, wert) {
  const tag = wert.trim()
  if (!tag || (n.tags || []).includes(tag)) return
  await buecherApi.notizAktualisieren(n.id, { tags: [...(n.tags || []), tag] })
  await notizenLaden()
}

async function notizTagEntfernen(n, tag) {
  await buecherApi.notizAktualisieren(n.id, { tags: (n.tags || []).filter((t) => t !== tag) })
  await notizenLaden()
}

const verknuepfenOffenFuer = ref(null)
const verknuepfungSuche = ref('')
const verknuepfungErgebnisse = ref([])

function verknuepfenOeffnen(id) {
  verknuepfenOffenFuer.value = verknuepfenOffenFuer.value === id ? null : id
  verknuepfungSuche.value = ''
  verknuepfungErgebnisse.value = []
}

async function verknuepfungSuchen() {
  const q = verknuepfungSuche.value.trim()
  if (!q) { verknuepfungErgebnisse.value = []; return }
  const res = await buecherApi.notizSuchen(q, verknuepfenOffenFuer.value)
  verknuepfungErgebnisse.value = res.data
}

async function verknuepfungAnlegen(notizId, zielId) {
  await buecherApi.notizVerknuepfen(notizId, zielId)
  verknuepfenOffenFuer.value = null
  await notizenLaden()
}

async function verknuepfungEntfernen(id) {
  await buecherApi.notizVerknuepfungLoeschen(id)
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
.leserunde { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.leserunde input[type="date"] { flex: 1; padding: 7px 8px; font-size: 13px; }
.leserunde .bis { color: var(--muted); }
.leserunde .loeschen { color: var(--danger); font-size: 16px; cursor: pointer; padding: 0 2px; }
button.erneut { width: 100%; margin-top: 6px; padding: 9px 14px; border: 1.5px solid var(--primary); border-radius: 8px; background: transparent; color: var(--primary); font-weight: 600; }
.notiz { border-bottom: 1px solid var(--line); padding: 8px 0; }
.notiz p { margin: 0 0 4px; }
.notiz-fuss { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.notiz-fuss .aktionen { display: flex; gap: 10px; }
.loeschen { color: var(--danger); font-size: 13px; cursor: pointer; }
.notiz-tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 4px 0; }
.tag.klein { padding: 2px 8px; font-size: 11px; }
.notiz-tag-eingabe { width: auto; display: inline-block; padding: 4px 8px; font-size: 12px; border: 1px dashed var(--line); border-radius: 999px; margin-top: 2px; }
.notiz-links { margin: 4px 0; }
.notiz-link { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); background: var(--bg); border-radius: 6px; padding: 4px 8px; margin-bottom: 4px; }
.notiz-link span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.verknuepfen-link { color: var(--primary); font-size: 13px; cursor: pointer; }
.verknuepfen-box { margin: 6px 0 4px; padding: 8px; background: var(--bg); border-radius: 8px; }
.verknuepfen-ergebnisse { max-height: 160px; overflow-y: auto; margin: 6px 0; }
.verknuepfen-ergebnis { font-size: 13px; padding: 6px 4px; border-bottom: 1px solid var(--line); cursor: pointer; }
.verknuepfen-ergebnis:last-child { border-bottom: 0; }
.mut.klein { font-size: 12px; margin: 4px 0; }
.verknuepfen-box button.ghost { margin-top: 6px; }
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
