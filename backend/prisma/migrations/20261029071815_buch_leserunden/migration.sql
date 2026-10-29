/*
  Warnings:

  - You are about to drop the column `beendetAm` on the `Buch` table. All the data in the column will be lost.
  - You are about to drop the column `begonnenAm` on the `Buch` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Leserunde" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buchId" INTEGER NOT NULL,
    "begonnenAm" TEXT,
    "beendetAm" TEXT,
    CONSTRAINT "Leserunde_buchId_fkey" FOREIGN KEY ("buchId") REFERENCES "Buch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bestehende begonnenAm/beendetAm-Werte als eine Leserunde je Buch übernehmen, bevor die
-- Spalten unten entfernt werden (sonst gingen reale Lese-Daten verloren).
INSERT INTO "Leserunde" ("buchId", "begonnenAm", "beendetAm")
SELECT "id", "begonnenAm", "beendetAm" FROM "Buch" WHERE "begonnenAm" IS NOT NULL OR "beendetAm" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Buch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "titel" TEXT NOT NULL,
    "autor" TEXT,
    "verlag" TEXT,
    "ausgabe" TEXT,
    "isbn" TEXT,
    "coverUrl" TEXT,
    "coverDateiname" TEXT,
    "seitenzahl" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'wunschliste',
    "aktuelleSeite" INTEGER,
    "bewertung" INTEGER,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Buch_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Buch" ("aktuelleSeite", "ausgabe", "autor", "bewertung", "coverDateiname", "coverUrl", "erstelltAm", "id", "isbn", "nutzerId", "seitenzahl", "status", "tags", "titel", "verlag") SELECT "aktuelleSeite", "ausgabe", "autor", "bewertung", "coverDateiname", "coverUrl", "erstelltAm", "id", "isbn", "nutzerId", "seitenzahl", "status", "tags", "titel", "verlag" FROM "Buch";
DROP TABLE "Buch";
ALTER TABLE "new_Buch" RENAME TO "Buch";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
