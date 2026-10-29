-- CreateTable
CREATE TABLE "NotizVerknuepfung" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notizVonId" INTEGER NOT NULL,
    "notizZuId" INTEGER NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotizVerknuepfung_notizVonId_fkey" FOREIGN KEY ("notizVonId") REFERENCES "BuchNotiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotizVerknuepfung_notizZuId_fkey" FOREIGN KEY ("notizZuId") REFERENCES "BuchNotiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BuchNotiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buchId" INTEGER NOT NULL,
    "nutzerId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "seite" INTEGER,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BuchNotiz_buchId_fkey" FOREIGN KEY ("buchId") REFERENCES "Buch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuchNotiz_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BuchNotiz" ("buchId", "erstelltAm", "id", "nutzerId", "seite", "text") SELECT "buchId", "erstelltAm", "id", "nutzerId", "seite", "text" FROM "BuchNotiz";
DROP TABLE "BuchNotiz";
ALTER TABLE "new_BuchNotiz" RENAME TO "BuchNotiz";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "NotizVerknuepfung_notizVonId_notizZuId_key" ON "NotizVerknuepfung"("notizVonId", "notizZuId");
