<template>
  <div class="rahmen">
    <div class="regal">
      <div class="buch" v-for="b in buecher" :key="b.id" @click="$emit('oeffnen', b)" :title="b.titel">
        <div class="cover-box"><BuchCover :buch="b"><template #platzhalter>{{ b.titel }}</template></BuchCover></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BuchCover from './BuchCover.vue'

defineProps({ buecher: { type: Array, required: true } })
defineEmits(['oeffnen'])
</script>

<style scoped>
/* Rustikaler Holzrahmen als "Möbelstück" um das Regal — feste Maße (Cover 124px hoch,
   Zeilenabstand 22px) erlauben es, Böden, Maserung und Kontaktschatten als einen
   durchgehenden Hintergrund-Farbverlauf über die volle Breite zu zeichnen, statt sie pro
   Buch einzeln zu zeichnen oder Zeilen per JS zu vermessen. Zwei Schatten-Bänder je Zeile
   (oben: Schatten des Bodens darüber, unten: Kontaktschatten vorm Boden darunter) sorgen
   dafür, dass die Bücher im Fach zu stehen scheinen statt davor zu schweben. */
.rahmen {
  background: linear-gradient(175deg, #5c3b1f, #3f2712);
  border: 14px solid #3a2410;
  border-radius: 3px;
  box-shadow:
    inset 0 0 0 3px #1f140a,
    inset 0 0 18px 4px #00000066,
    0 8px 20px #00000040;
}
.regal {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 22px 12px;
  padding: 18px 16px;
  background-image:
    /* Holzmaserung: feine, unregelmäßig wirkende dunkle Streifen über die gesamte Fläche */
    repeating-linear-gradient(95deg, #00000014 0 2px, transparent 2px 9px, #ffffff0a 9px 10px, transparent 10px 17px),
    repeating-linear-gradient(
      to bottom,
      #00000059 0, transparent 16px,
      transparent 104px, #00000040 124px,
      #8a5a30 124px, #6e4320 132px, #4a2c15 138px,
      transparent 138px, transparent 146px
    );
}
.buch { width: 84px; cursor: pointer; }
.cover-box {
  width: 84px; height: 124px; border-radius: 2px 4px 4px 2px; overflow: hidden;
  box-shadow: inset 0 7px 9px -6px #00000080, 1px 2px 3px #00000040;
  font-size: 11px; font-weight: 600; line-height: 1.25; text-align: center;
}
.cover-box :deep(.cover-platzhalter) { padding: 8px 6px; color: var(--muted); }
</style>
