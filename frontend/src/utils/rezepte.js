// Gleiches Verkleinerungs-Muster wie bei Fortschrittsfotos/Buchcover (max. 900 px, JPEG).
export function rezeptfotoVerkleinern(datei) {
  return new Promise((resolve) => {
    const bild = new Image()
    bild.onload = () => {
      const faktor = Math.min(1, 900 / Math.max(bild.width, bild.height))
      const canvas = document.createElement('canvas')
      canvas.width = bild.width * faktor
      canvas.height = bild.height * faktor
      canvas.getContext('2d').drawImage(bild, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', .8)
    }
    bild.src = URL.createObjectURL(datei)
  })
}
