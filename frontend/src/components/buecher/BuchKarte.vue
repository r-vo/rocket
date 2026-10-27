<template>
  <div class="karte" @click="$emit('oeffnen')">
    <img v-if="coverSrc" :src="coverSrc" />
    <div v-else class="cover-platzhalter">📖</div>
    <div class="info">
      <strong>{{ buch.titel }}</strong>
      <p class="mut">{{ buch.autor }}</p>
      <div v-if="buch.status === 'am_lesen' && buch.seitenzahl" class="fortschritt">
        <div class="balken"><div class="fuellung" :style="{ width: fortschrittProzent + '%' }"></div></div>
        <span class="mut">{{ buch.aktuelleSeite || 0 }} / {{ buch.seitenzahl }} Seiten</span>
      </div>
      <div v-else-if="buch.status === 'gelesen' && buch.bewertung" class="sterne">
        {{ '★'.repeat(buch.bewertung) }}{{ '☆'.repeat(5 - buch.bewertung) }}
      </div>
      <div v-if="buch.tags?.length" class="tags">
        <span class="tag" v-for="t in buch.tags" :key="t">{{ t }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { buecher as buecherApi } from '@/api/index.js'

const props = defineProps({ buch: { type: Object, required: true } })
defineEmits(['oeffnen'])

const fortschrittProzent = computed(() => {
  if (!props.buch.seitenzahl) return 0
  return Math.min(100, Math.round(((props.buch.aktuelleSeite || 0) / props.buch.seitenzahl) * 100))
})

// Eigene Cover-Fotos sind wie Fortschrittsfotos nur über eine authentifizierte Route
// abrufbar, nicht per direkter URL — deshalb hier als Blob laden statt per <img src>.
const coverSrc = ref(null)
let objectUrl = null

async function coverLaden() {
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null }
  if (props.buch.coverDateiname) {
    try {
      const res = await buecherApi.coverDatei(props.buch.id)
      objectUrl = URL.createObjectURL(res.data)
      coverSrc.value = objectUrl
    } catch (err) {
      coverSrc.value = null
    }
  } else {
    coverSrc.value = props.buch.coverUrl || null
  }
}

watch(() => [props.buch.coverDateiname, props.buch.coverUrl], coverLaden, { immediate: true })
onUnmounted(() => { if (objectUrl) URL.revokeObjectURL(objectUrl) })
</script>

<style scoped>
.karte { display: flex; gap: 12px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px; margin: 10px 0; max-width: 480px; cursor: pointer; }
.karte img { width: 48px; height: 70px; object-fit: cover; border-radius: 5px; flex-shrink: 0; }
.cover-platzhalter { width: 48px; height: 70px; display: flex; align-items: center; justify-content: center; background: var(--bg); border-radius: 5px; font-size: 20px; flex-shrink: 0; }
.info { flex: 1; min-width: 0; }
.mut { color: var(--muted); font-size: 13px; margin: 2px 0; }
.fortschritt { margin-top: 6px; }
.balken { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
.fuellung { height: 100%; background: var(--primary); }
.sterne { color: var(--primary); font-size: 14px; margin-top: 4px; }
.tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.tag { background: var(--bg); border: 1px solid var(--line); color: var(--muted); border-radius: 999px; padding: 2px 8px; font-size: 11px; }
</style>
