-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Buch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "titel" TEXT NOT NULL,
    "autor" TEXT,
    "coverUrl" TEXT,
    "coverDateiname" TEXT,
    "seitenzahl" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'wunschliste',
    "aktuelleSeite" INTEGER,
    "begonnenAm" TEXT,
    "beendetAm" TEXT,
    "bewertung" INTEGER,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Buch_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Buch" ("aktuelleSeite", "autor", "beendetAm", "begonnenAm", "bewertung", "coverDateiname", "coverUrl", "erstelltAm", "id", "nutzerId", "seitenzahl", "status", "titel") SELECT "aktuelleSeite", "autor", "beendetAm", "begonnenAm", "bewertung", "coverDateiname", "coverUrl", "erstelltAm", "id", "nutzerId", "seitenzahl", "status", "titel" FROM "Buch";
DROP TABLE "Buch";
ALTER TABLE "new_Buch" RENAME TO "Buch";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
