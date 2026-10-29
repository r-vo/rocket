-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Planpunkt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "wochentag" INTEGER NOT NULL,
    "mahlzeit" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rezeptId" INTEGER,
    CONSTRAINT "Planpunkt_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Planpunkt_rezeptId_fkey" FOREIGN KEY ("rezeptId") REFERENCES "Rezept" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Planpunkt" ("id", "mahlzeit", "nutzerId", "text", "wochentag") SELECT "id", "mahlzeit", "nutzerId", "text", "wochentag" FROM "Planpunkt";
DROP TABLE "Planpunkt";
ALTER TABLE "new_Planpunkt" RENAME TO "Planpunkt";
CREATE UNIQUE INDEX "Planpunkt_nutzerId_wochentag_mahlzeit_key" ON "Planpunkt"("nutzerId", "wochentag", "mahlzeit");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
