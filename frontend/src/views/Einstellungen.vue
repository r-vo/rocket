<template>
  <h1>Einstellungen</h1>

  <h2>Module</h2>
  <p class="mut">Module, die du nicht nutzt, kannst du hier ausblenden. Deine Daten bleiben dabei erhalten — du kannst jederzeit wieder einschalten.</p>

  <div class="card" v-for="m in modulStore.module" :key="m.schluessel">
    <div class="zeile">
      <div>
        <strong>{{ m.name }}</strong>
        <p class="mut">{{ m.beschreibung }}</p>
      </div>
      <label class="schalter">
        <input type="checkbox" :checked="m.aktiv" @change="umschalten(m, $event.target.checked)" />
        <span class="slider"></span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useModulStore } from '@/stores/module.js'

const modulStore = useModulStore()

async function umschalten(m, aktiv) {
  await modulStore.umschalten(m.schluessel, aktiv)
}

onMounted(() => {
  if (!modulStore.geladen) modulStore.laden()
})
</script>

<style scoped>
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; margin: 12px 0; max-width: 480px; }
.zeile { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.mut { color: var(--muted); font-size: 13px; margin: 2px 0 0; }
.schalter { position: relative; display: inline-block; width: 44px; height: 26px; flex-shrink: 0; }
.schalter input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; inset: 0; background: var(--line); border-radius: 999px; transition: .15s; cursor: pointer; }
.slider::before { content: ''; position: absolute; width: 20px; height: 20px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: .15s; }
.schalter input:checked + .slider { background: var(--primary); }
.schalter input:checked + .slider::before { transform: translateX(18px); }
</style>
