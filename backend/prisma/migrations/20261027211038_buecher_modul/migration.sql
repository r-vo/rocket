-- CreateTable
CREATE TABLE "Buch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "titel" TEXT NOT NULL,
    "autor" TEXT,
    "coverUrl" TEXT,
    "seitenzahl" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'wunschliste',
    "aktuelleSeite" INTEGER,
    "begonnenAm" TEXT,
    "beendetAm" TEXT,
    "bewertung" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Buch_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuchNotiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buchId" INTEGER NOT NULL,
    "nutzerId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "seite" INTEGER,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BuchNotiz_buchId_fkey" FOREIGN KEY ("buchId") REFERENCES "Buch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BuchNotiz_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
