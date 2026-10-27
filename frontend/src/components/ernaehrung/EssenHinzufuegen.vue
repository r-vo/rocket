<template>
  <div class="sheet" @click="(e) => e.target === e.currentTarget && $emit('schliessen')">
    <div class="box">
      <h2>Essen hinzufügen</h2>

      <label>Mahlzeit</label>
      <select v-model="mahlzeit">
        <option>Frühstück</option>
        <option>Mittagessen</option>
        <option>Abendessen</option>
        <option>Snack</option>
      </select>

      <template v-if="!ausgewaehlt">
        <label>Lebensmittel suchen</label>
        <div class="g2">
          <input v-model="suchbegriff" placeholder="z. B. Avocado" />
          <button class="ghost" @click="onlineSuchen" :disabled="!suchbegriff.trim() || suchtGerade">{{ suchtGerade ? 'Sucht…' : 'Online suchen' }}</button>
        </div>

        <label>Barcode-Nummer</label>
        <div class="g2">
          <input v-model="barcode" inputmode="numeric" placeholder="EAN auf der Packung" />
          <button class="ghost" @click="barcodeAbrufen" :disabled="barcodeLaedt">{{ barcodeLaedt ? 'Lädt…' : 'Abrufen' }}</button>
        </div>

        <div v-if="hinweis" class="hinweis-text">{{ hinweis }}</div>

        <div class="ergebnisse">
          <div v-for="(r, i) in ergebnisse" :key="i" class="eintrag" @click="auswaehlen(r)">
            <span>{{ r.bezeichnung }}</span>
            <span class="mut">{{ Math.round(r.nettoCarbs * 10) / 10 }} g Netto-Carbs/100 g</span>
          </div>
        </div>

        <details>
          <summary class="mut">Manuell eintragen</summary>
          <input v-model="manuell.name" placeholder="Name" style="margin-top: 8px;" />
          <div class="g2">
            <input v-model.number="manuell.kcal" type="number" placeholder="kcal" />
            <input v-model.number="manuell.carbs" type="number" placeholder="Kohlenhydrate g" />
            <input v-model.number="manuell.ballaststoffe" type="number" placeholder="Ballaststoffe g" />
            <input v-model.number="manuell.fett" type="number" placeholder="Fett g" />
            <input v-model.number="manuell.eiweiss" type="number" placeholder="Eiweiß g" />
            <button @click="manuellHinzufuegen" :disabled="!manuell.name?.trim()">Hinzufügen</button>
          </div>
        </details>
      </template>

      <template v-else>
        <div class="card">
          <b>{{ ausgewaehlt.bezeichnung }}</b>
          <div class="g2" style="margin-top: 8px;">
            <div><label>Menge</label><input v-model.number="menge" type="number" step="any" /></div>
            <div><label>Einheit</label>
              <select v-model="einheitWahl">
                <option v-if="ausgewaehlt.portion !== 100" value="stueck">{{ ausgewaehlt.einheit }}</option>
                <option value="g">Gramm</option>
              </select>
            </div>
          </div>
          <p v-if="ausgewaehlt.portion !== 100" class="mut">1 {{ ausgewaehlt.einheit }} = {{ ausgewaehlt.portion }} g</p>
          <p class="mut">{{ vorschauText }}</p>
          <button @click="ausgewaehltHinzufuegen">Hinzufügen</button>
          <button class="ghost" @click="ausgewaehlt = null">Zurück zur Suche</button>
        </div>
      </template>

      <button class="ghost schliessen" @click="$emit('schliessen')">Schließen</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { lebensmittelSuchen } from '@/data/lebensmittel.js'
import { ernaehrung as ernaehrungApi } from '@/api/index.js'

const props = defineProps({ datum: { type: String, required: true } })
const emit = defineEmits(['hinzugefuegt', 'schliessen'])

const mahlzeit = ref('Frühstück')
const suchbegriff = ref('')
const barcode = ref('')
const suchtGerade = ref(false)
const barcodeLaedt = ref(false)
const hinweis = ref('')
const onlineErgebnisse = ref([])
const ausgewaehlt = ref(null)
const menge = ref(100)
const einheitWahl = ref('g')
const manuell = ref({ name: '', kcal: null, carbs: null, ballaststoffe: null, fett: null, eiweiss: null })

const lokaleErgebnisse = computed(() => suchbegriff.value.trim() ? lebensmittelSuchen(suchbegriff.value) : [])
const ergebnisse = computed(() => [...lokaleErgebnisse.value, ...onlineErgebnisse.value])

watch(suchbegriff, () => { onlineErgebnisse.value = []; hinweis.value = '' })

const BLOCKIERT_HINWEIS = 'Online-Abrufe sind hier blockiert oder nicht erreichbar. Nutze die Liste oder „Manuell eintragen".'

async function onlineSuchen() {
  const q = suchbegriff.value.trim()
  if (!q) return
  suchtGerade.value = true
  hinweis.value = ''
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=12&lc=de&fields=product_name,nutriments`
    const res = await fetch(url)
    const j = await res.json()
    onlineErgebnisse.value = (j.products || [])
      .filter((x) => x.product_name && x.nutriments)
      .map((p) => offZuEintrag(p))
    if (!ergebnisse.value.length) hinweis.value = 'Nichts gefunden. Probiere die Einzahl oder einen kürzeren Begriff.'
  } catch (err) {
    hinweis.value = ergebnisse.value.length ? '' : BLOCKIERT_HINWEIS
  } finally {
    suchtGerade.value = false
  }
}

function offZuEintrag(p) {
  const n = p.nutriments || {}
  return {
    bezeichnung: p.product_name,
    kcal: n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : 0),
    nettoCarbs: Math.max(0, (n.carbohydrates_100g || 0) - (n.fiber_100g || 0)),
    fett: n.fat_100g || 0,
    eiweiss: n.proteins_100g || 0,
    portion: 100,
    einheit: 'Portion',
  }
}

async function barcodeAbrufen() {
  const code = barcode.value.replace(/\D/g, '')
  if (code.length < 8) { hinweis.value = 'Bitte die ganze Nummer unter dem Strichcode eingeben (8–13 Ziffern).'; return }
  barcodeLaedt.value = true
  hinweis.value = ''
  for (const url of [`https://world.openfoodfacts.org/api/v2/product/${code}.json`, `https://world.openfoodfacts.org/api/v0/product/${code}.json`]) {
    try {
      const res = await fetch(url)
      const j = await res.json()
      if (j.product && j.product.nutriments) {
        const item = offZuEintrag(j.product)
        item.bezeichnung = item.bezeichnung || `Produkt ${code}`
        auswaehlen(item)
        barcodeLaedt.value = false
        return
      }
    } catch (err) { /* nächste URL probieren */ }
  }
  hinweis.value = 'Dieser Code wurde nicht gefunden. Trage das Produkt manuell ein, oder prüfe die Internetverbindung.'
  barcodeLaedt.value = false
}

function auswaehlen(item) {
  ausgewaehlt.value = item
  menge.value = item.portion !== 100 ? 1 : 100
  einheitWahl.value = item.portion !== 100 ? 'stueck' : 'g'
}

const gramm = computed(() => einheitWahl.value === 'stueck' ? (menge.value || 0) * ausgewaehlt.value.portion : (menge.value || 0))
const vorschauText = computed(() => {
  if (!ausgewaehlt.value || !(gramm.value > 0)) return 'Bitte eine Menge eingeben.'
  const f = gramm.value / 100
  const a = ausgewaehlt.value
  return `${Math.round(gramm.value)} g · ${Math.round(a.kcal * f)} kcal · ${(a.nettoCarbs * f).toFixed(1)} g Netto-Carbs · ${(a.fett * f).toFixed(1)} g Fett · ${(a.eiweiss * f).toFixed(1)} g Eiweiß`
})

async function ausgewaehltHinzufuegen() {
  if (!(gramm.value > 0)) return
  const f = gramm.value / 100
  const a = ausgewaehlt.value
  await eintragSpeichern({
    bezeichnung: a.bezeichnung, menge: Math.round(gramm.value), einheit: 'g',
    kcal: Math.round(a.kcal * f), nettoCarbs: +(a.nettoCarbs * f).toFixed(1), fett: +(a.fett * f).toFixed(1), eiweiss: +(a.eiweiss * f).toFixed(1),
  })
}

async function manuellHinzufuegen() {
  const m = manuell.value
  if (!m.name?.trim()) return
  await eintragSpeichern({
    bezeichnung: m.name.trim(), menge: null, einheit: null,
    kcal: m.kcal || 0, nettoCarbs: Math.max(0, (m.carbs || 0) - (m.ballaststoffe || 0)), fett: m.fett || 0, eiweiss: m.eiweiss || 0,
  })
}

async function eintragSpeichern(daten) {
  await ernaehrungApi.erstellen({ ...daten, datum: props.datum, mahlzeit: mahlzeit.value })
  emit('hinzugefuegt')
}
</script>

<style scoped>
.sheet { position: fixed; inset: 0; background: #0006; z-index: 20; display: flex; align-items: flex-end; justify-content: center; }
.box { background: var(--card, #fff); width: 100%; max-width: 480px; max-height: 88vh; overflow: auto; border-radius: 20px 20px 0 0; padding: 20px 18px 28px; }
h2 { margin: 0 0 12px; }
label { display: block; font-size: 13px; color: var(--muted); margin: 12px 0 4px; }
input, select { width: 100%; padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
button { padding: 9px 14px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; margin-top: 10px; width: 100%; }
button.ghost { background: transparent; color: var(--primary); border: 1.5px solid var(--primary); }
.ergebnisse { margin-top: 10px; max-height: 220px; overflow: auto; }
.eintrag { display: flex; justify-content: space-between; gap: 8px; padding: 9px 2px; border-bottom: 1px solid var(--line); cursor: pointer; }
.mut { color: var(--muted); font-size: 13px; }
.hinweis-text { color: var(--muted); font-size: 13px; margin-top: 8px; }
.card { background: var(--bg); border-radius: 12px; padding: 14px; margin-top: 10px; }
.schliessen { margin-top: 16px; }
details summary { cursor: pointer; margin: 16px 0 0; }
</style>
