// Lokale Lebensmittel-Datenbank (Werte je 100 g, bzw. je Stück/Scheibe bei pt).
// [Name, kcal, NettoCarbs, Fett, Eiweiß, Portionsgröße in g (oder 100 für "pro 100g"), Suchbegriffe]
export const LEBENSMITTEL = [
  ['Ei (Hühnerei)', 143, .7, 9.5, 12.6, 55, 'eier spiegelei gekochtes frühstücksei'],
  ['Rührei aus Ei und Butter', 190, 1, 15, 12, 150, 'rührei omelett omelette'],
  ['Avocado', 160, 1.8, 14.7, 2, 100, 'avocados guacamole'],
  ['Gouda', 356, .1, 27.4, 24.9, 30, 'käse käsescheibe edamer emmentaler cheddar'],
  ['Feta', 264, 1.5, 21, 14, 50, 'käse schafskäse'],
  ['Mozzarella', 253, 1, 19, 18, 125, 'käse'],
  ['Bacon / Speck', 417, 1, 41, 13, 20, 'frühstücksspeck'],
  ['Kochschinken', 110, .5, 4, 19, 20, 'schinken'],
  ['Naturjoghurt 3,5 %', 62, 4.7, 3.5, 3.5, 150, 'joghurt jogurt yoghurt'],
  ['Griechischer Joghurt 10 %', 130, 4, 10, 5.5, 150, 'joghurt jogurt yoghurt skyr'],
  ['Magerquark', 67, 4, .3, 12, 125, 'quark'],
  ['Hüttenkäse', 98, 3.4, 4.3, 11, 100, 'käse körniger frischkäse'],
  ['Butter', 741, .6, 82, .7, 10, 'margarine'],
  ['Sahne 30 %', 292, 3.4, 30, 2.4, 30, 'schlagsahne rahm'],
  ['Mandeln', 579, 9, 50, 21, 25, 'mandel nüsse nuss'],
  ['Walnüsse', 654, 7, 65, 15, 25, 'walnuss nüsse nuss'],
  ['Chiasamen', 486, 8, 31, 17, 15, 'chia samen'],
  ['Leinsamen', 534, 1.6, 42, 18, 10, 'lein samen'],
  ['Himbeeren', 52, 5.5, .7, 1.2, 100, 'himbeere beeren'],
  ['Erdbeeren', 32, 5.7, .3, .7, 100, 'erdbeere beeren'],
  ['Haferflocken', 370, 50, 7, 13, 40, 'hafer müsli porridge'],
  ['Räucherlachs', 180, 0, 11, 21, 50, 'lachs fisch'],
  ['Lachs', 208, 0, 13, 20, 150, 'fisch'],
  ['Hähnchenbrust', 110, 0, 1.5, 23, 150, 'hähnchen huhn hühnchen pute geflügel'],
  ['Rinderhack', 250, 0, 20, 17, 150, 'hackfleisch rind hack fleisch'],
  ['Spinat', 23, 1.4, .4, 2.9, 100, 'gemüse'],
  ['Olivenöl', 884, 0, 100, 0, 10, 'öl'],
  ['Kokosmilch', 197, 2.8, 21, 2, 100, 'kokos'],
  ['Cheddar', 403, .1, 33, 25, 30, 'käse'],
  ['Parmesan', 392, 0, 28, 36, 10, 'käse parmigiano'],
  ['Frischkäse', 250, 3, 23, 6, 30, 'käse doppelrahm'],
  ['Skyr', 63, 4, .2, 11, 150, 'joghurt'],
  ['Quark 40 %', 160, 3, 11, 10, 125, 'speisequark'],
  ['Salami', 430, 1, 36, 24, 15, 'wurst'],
  ['Leberkäse', 280, 1, 24, 12, 100, 'fleisch wurst'],
  ['Bratwurst', 300, 1.5, 26, 14, 100, 'wurst'],
  ['Gurke', 12, 2, .1, .6, 100, 'salatgurke gemüse'],
  ['Tomate', 18, 2.6, .2, .9, 100, 'tomaten gemüse'],
  ['Paprika', 26, 4, .3, 1, 100, 'gemüse'],
  ['Brokkoli', 34, 2.6, .4, 2.8, 100, 'gemüse'],
  ['Blumenkohl', 25, 2.8, .3, 1.9, 100, 'gemüse'],
  ['Zucchini', 17, 2.1, .3, 1.2, 100, 'gemüse'],
  ['Champignons', 22, .5, .3, 3, 100, 'pilze'],
  ['Oliven', 145, .5, 15, 1, 30, 'olive'],
  ['Thunfisch (Dose, im Wasser)', 116, 0, 1, 26, 100, 'fisch'],
  ['Garnelen', 99, 0, .3, 24, 100, 'shrimps meeresfrüchte'],
  ['Hähnchenschenkel', 190, 0, 12, 19, 150, 'hähnchen huhn'],
  ['Schweinefilet', 110, 0, 3, 22, 150, 'schwein fleisch'],
  ['Steak (Rind)', 150, 0, 6, 23, 200, 'rind fleisch rumpsteak'],
  ['Erdnussbutter', 600, 9, 50, 25, 15, 'erdnuss'],
  ['Mandelmehl', 600, 10, 50, 21, 20, 'mehl'],
  ['Kokosöl', 900, 0, 100, 0, 10, 'öl'],
  ['Eiweißbrot (Low Carb)', 230, 5, 9, 25, 40, 'brot brötchen'],
  ['Heidelbeeren', 57, 10, .3, .7, 100, 'blaubeeren beeren'],
  ['Mayonnaise', 700, 1, 77, 1, 15, 'mayo'],
  ['Pesto', 460, 4, 45, 5, 20, 'basilikum'],
  ['Haselnüsse', 628, 6, 61, 15, 25, 'nüsse nuss haselnuss'],
  ['Macadamia', 718, 5, 76, 8, 25, 'nüsse nuss'],
  ['Kürbiskerne', 559, 5, 49, 30, 20, 'kerne samen'],
  ['Sonnenblumenkerne', 584, 12, 51, 21, 20, 'kerne samen'],
  ['Brötchen (Weizen)', 270, 52, 1.5, 9, 50, 'semmel'],
  ['Vollkornbrot', 210, 36, 1.5, 7, 50, 'brot'],
  ['Banane', 90, 20, .3, 1, 120, 'obst'],
  ['Apfel', 52, 11, .2, .3, 150, 'obst'],
]

export const EINHEIT_UEBERSCHREIBUNG = {
  'Ei (Hühnerei)': 'Stück', 'Gouda': 'Scheibe', 'Bacon / Speck': 'Scheibe', 'Kochschinken': 'Scheibe',
}

export function lebensmittelSuchen(query) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return LEBENSMITTEL
    .filter((x) => (x[0] + ' ' + x[6]).toLowerCase().split(/[ /(),]+/).some((w) => w.length > 1 && (w.startsWith(q) || q.startsWith(w))))
    .map(([bezeichnung, kcal, nettoCarbs, fett, eiweiss, portion, _begriffe]) => ({
      bezeichnung, kcal, nettoCarbs, fett, eiweiss, portion,
      einheit: EINHEIT_UEBERSCHREIBUNG[bezeichnung] || (portion === 100 ? 'Portion' : 'Stück'),
    }))
}
