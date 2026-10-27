// Zentrale Registry aller Rocket-Module. Ein neues Modul wird hier einmal eingetragen und ist
// danach für alle Nutzer automatisch aktiv (siehe Kommentar zu Nutzer.deaktivierteModule).
const MODULE_REGISTRY = [
  { schluessel: 'ernaehrung', name: 'Ernährung', beschreibung: 'Essen erfassen, Ziele, Körperwerte, Essensplan' },
  { schluessel: 'aufgaben', name: 'Aufgaben', beschreibung: 'To-dos mit Fälligkeitsdatum' },
  { schluessel: 'habits', name: 'Habits', beschreibung: 'Gewohnheiten täglich abhaken' },
  { schluessel: 'buecher', name: 'Bücher', beschreibung: 'Leseliste, gelesene Bücher und Notizen' },
];

module.exports = { MODULE_REGISTRY };
