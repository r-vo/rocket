<template>
  <h1>Nutzerverwaltung</h1>

  <div v-if="fehler" class="fehler">{{ fehler }}</div>

  <div class="tabelle-scroll">
    <table class="tabelle">
      <thead>
        <tr><th>Name</th><th>E-Mail</th><th>Admin</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="n in nutzer" :key="n.id">
          <td>{{ n.name }}</td>
          <td>{{ n.email }}</td>
          <td>
            <input type="checkbox" :checked="n.istAdmin" @change="aktualisieren(n, { istAdmin: $event.target.checked })" />
          </td>
          <td>
            <span :class="['badge', n.aktiv ? 'aktiv' : 'gesperrt']">{{ n.aktiv ? 'Aktiv' : 'Gesperrt' }}</span>
          </td>
          <td class="aktionen">
            <button class="klein" @click="aktualisieren(n, { aktiv: !n.aktiv })">{{ n.aktiv ? 'Sperren' : 'Entsperren' }}</button>
            <button class="klein" @click="passwortSetzen(n)">Passwort setzen</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Neuen Nutzer anlegen</h2>
  <div class="formular">
    <div class="feld"><label>Name</label><input v-model="neu.name" /></div>
    <div class="feld"><label>E-Mail</label><input v-model="neu.email" type="email" /></div>
    <div class="feld"><label>Passwort (mind. 8 Zeichen)</label><input v-model="neu.passwort" type="password" /></div>
    <label class="checkbox"><input type="checkbox" v-model="neu.istAdmin" /> Admin-Rechte</label>
    <button @click="erstellen" :disabled="anlegtGerade">{{ anlegtGerade ? 'Wird angelegt…' : 'Nutzer anlegen' }}</button>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { nutzerAdmin } from '@/api/index.js'

const nutzer = ref([])
const fehler = ref('')
const anlegtGerade = ref(false)
const neu = reactive({ name: '', email: '', passwort: '', istAdmin: false })

async function laden() {
  try {
    const res = await nutzerAdmin.liste()
    nutzer.value = res.data
  } catch (err) {
    fehler.value = err.response?.data?.error || 'Fehler beim Laden der Nutzerliste'
  }
}

async function erstellen() {
  fehler.value = ''
  anlegtGerade.value = true
  try {
    await nutzerAdmin.erstellen({ ...neu })
    neu.name = ''; neu.email = ''; neu.passwort = ''; neu.istAdmin = false
    await laden()
  } catch (err) {
    fehler.value = err.response?.data?.error || 'Fehler beim Anlegen'
  } finally {
    anlegtGerade.value = false
  }
}

async function aktualisieren(n, aenderung) {
  fehler.value = ''
  try {
    await nutzerAdmin.aktualisieren(n.id, aenderung)
    await laden()
  } catch (err) {
    fehler.value = err.response?.data?.error || 'Fehler beim Speichern'
  }
}

async function passwortSetzen(n) {
  const passwort = prompt(`Neues Passwort für ${n.name} (mind. 8 Zeichen):`)
  if (!passwort) return
  try {
    await nutzerAdmin.passwortZuruecksetzen(n.id, passwort)
    alert('Passwort gesetzt. Bestehende Sitzungen dieses Nutzers wurden beendet.')
  } catch (err) {
    fehler.value = err.response?.data?.error || 'Fehler beim Zurücksetzen'
  }
}

onMounted(laden)
</script>

<style scoped>
.tabelle-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 16px 0 28px; }
.tabelle { width: 100%; min-width: 580px; border-collapse: collapse; margin: 0; }
.tabelle th, .tabelle td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); font-size: 14px; white-space: nowrap; }
.tabelle .aktionen { white-space: nowrap; }
.badge { padding: 2px 8px; border-radius: 999px; font-size: 12px; }
.badge.aktiv { background: #e3f6ec; color: var(--success); }
.badge.gesperrt { background: #fde8ee; color: var(--danger); }
.aktionen { display: flex; gap: 6px; }
.klein { font-size: 12px; padding: 4px 8px; border: 1px solid var(--line); background: #fff; border-radius: 6px; }
.formular { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; max-width: 360px; }
.feld { margin-bottom: 10px; }
.feld label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 4px; }
.feld input { width: 100%; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; }
.checkbox { display: flex; align-items: center; gap: 6px; font-size: 13px; margin: 6px 0 14px; }
.formular button { padding: 9px 14px; border: 0; border-radius: 8px; background: var(--primary); color: #fff; font-weight: 600; }
.fehler { background: #fde8ee; color: var(--danger); padding: 8px 10px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
</style>
