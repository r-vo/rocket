-- CreateTable
CREATE TABLE "Rezept" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "titel" TEXT NOT NULL,
    "portionen" INTEGER,
    "zeitMinuten" INTEGER,
    "zubereitung" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "oeffentlich" BOOLEAN NOT NULL DEFAULT false,
    "fotoDateiname" TEXT,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rezept_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RezeptZutat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rezeptId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "reihenfolge" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RezeptZutat_rezeptId_fkey" FOREIGN KEY ("rezeptId") REFERENCES "Rezept" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
