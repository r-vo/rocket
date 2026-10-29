/*
  Warnings:

  - You are about to drop the column `erledigt` on the `HabitEintrag` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Habit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "art" TEXT NOT NULL DEFAULT 'positiv',
    "frequenz" TEXT NOT NULL DEFAULT 'taeglich',
    "zielAnzahl" INTEGER NOT NULL DEFAULT 1,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Habit_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Habit" ("aktiv", "bezeichnung", "erstelltAm", "id", "nutzerId") SELECT "aktiv", "bezeichnung", "erstelltAm", "id", "nutzerId" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE TABLE "new_HabitEintrag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "habitId" INTEGER NOT NULL,
    "datum" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "HabitEintrag_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HabitEintrag" ("datum", "habitId", "id") SELECT "datum", "habitId", "id" FROM "HabitEintrag";
DROP TABLE "HabitEintrag";
ALTER TABLE "new_HabitEintrag" RENAME TO "HabitEintrag";
CREATE UNIQUE INDEX "HabitEintrag_habitId_datum_key" ON "HabitEintrag"("habitId", "datum");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
