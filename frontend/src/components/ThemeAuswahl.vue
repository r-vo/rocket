<template>
  <div class="sw">
    <button v-for="t in THEMEN" :key="t[0]" :style="{ background: t[2] }" :class="{ on: aktiv === t[0] }" @click="waehlen(t[0])">
      {{ t[1] }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { THEMEN, themeAnwenden } from '@/utils/theme.js'

const aktiv = ref(document.documentElement.dataset.theme || 'standard')

function waehlen(name) {
  aktiv.value = name
  themeAnwenden(name)
}
</script>

<style scoped>
.sw { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
.sw button { height: 48px; padding: 0; border-radius: 10px; border: 3px solid transparent; color: #fff; font-size: 11px; text-shadow: 0 1px 2px #0006; }
.sw button.on { border-color: var(--ink); }
</style>
