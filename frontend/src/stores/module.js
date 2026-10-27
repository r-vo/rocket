import { defineStore } from 'pinia'
import { ref } from 'vue'
import { einstellungen as einstellungenApi } from '@/api/index.js'

export const useModulStore = defineStore('modul', () => {
  const module = ref([])
  const geladen = ref(false)

  async function laden() {
    const res = await einstellungenApi.module()
    module.value = res.data
    geladen.value = true
  }

  function istAktiv(schluessel) {
    const eintrag = module.value.find((m) => m.schluessel === schluessel)
    return eintrag ? eintrag.aktiv : true
  }

  async function umschalten(schluessel, aktiv) {
    await einstellungenApi.modulSetzen(schluessel, aktiv)
    const eintrag = module.value.find((m) => m.schluessel === schluessel)
    if (eintrag) eintrag.aktiv = aktiv
  }

  function zuruecksetzen() {
    module.value = []
    geladen.value = false
  }

  return { module, geladen, laden, istAktiv, umschalten, zuruecksetzen }
})
