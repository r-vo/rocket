<template>
  <div class="karte" @click="$emit('oeffnen')">
    <div class="cover-box"><BuchCover :buch="buch" /></div>
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
import { computed } from 'vue'
import BuchCover from './BuchCover.vue'

const props = defineProps({ buch: { type: Object, required: true } })
defineEmits(['oeffnen'])

const fortschrittProzent = computed(() => {
  if (!props.buch.seitenzahl) return 0
  return Math.min(100, Math.round(((props.buch.aktuelleSeite || 0) / props.buch.seitenzahl) * 100))
})
</script>

<style scoped>
.karte { display: flex; gap: 12px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px; margin: 10px 0; max-width: 480px; cursor: pointer; }
.cover-box { width: 48px; height: 70px; border-radius: 5px; overflow: hidden; font-size: 20px; flex-shrink: 0; }
.info { flex: 1; min-width: 0; }
.mut { color: var(--muted); font-size: 13px; margin: 2px 0; }
.fortschritt { margin-top: 6px; }
.balken { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
.fuellung { height: 100%; background: var(--primary); }
.sterne { color: var(--primary); font-size: 14px; margin-top: 4px; }
.tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.tag { background: var(--bg); border: 1px solid var(--line); color: var(--muted); border-radius: 999px; padding: 2px 8px; font-size: 11px; }
</style>
