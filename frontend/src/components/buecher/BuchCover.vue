<template>
  <img v-if="coverSrc" :src="coverSrc" />
  <div v-else class="cover-platzhalter"><slot name="platzhalter">📖</slot></div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { buecher as buecherApi } from '@/api/index.js'

const props = defineProps({ buch: { type: Object, required: true } })

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
img, .cover-platzhalter { width: 100%; height: 100%; object-fit: cover; display: flex; align-items: center; justify-content: center; background: var(--bg); }
</style>
