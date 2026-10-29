<template>
  <img v-if="fotoSrc" :src="fotoSrc" />
  <div v-else class="platzhalter"><slot name="platzhalter">🍲</slot></div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { rezepte as rezepteApi } from '@/api/index.js'

const props = defineProps({ rezept: { type: Object, required: true } })

// Foto ist wie Buchcover/Fortschrittsfoto nur über eine authentifizierte Route abrufbar,
// nicht per direkter URL — deshalb hier als Blob laden statt per <img src>.
const fotoSrc = ref(null)
let objectUrl = null

async function fotoLaden() {
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null }
  if (props.rezept.fotoDateiname) {
    try {
      const res = await rezepteApi.fotoDatei(props.rezept.id)
      objectUrl = URL.createObjectURL(res.data)
      fotoSrc.value = objectUrl
    } catch (err) {
      fotoSrc.value = null
    }
  } else {
    fotoSrc.value = null
  }
}

watch(() => [props.rezept.id, props.rezept.fotoDateiname], fotoLaden, { immediate: true })
onUnmounted(() => { if (objectUrl) URL.revokeObjectURL(objectUrl) })
</script>

<style scoped>
img, .platzhalter { width: 100%; height: 100%; object-fit: cover; display: flex; align-items: center; justify-content: center; background: var(--bg); }
</style>
