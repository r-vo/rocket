-- CreateTable
CREATE TABLE "RezeptFavorit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "rezeptId" INTEGER NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RezeptFavorit_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RezeptFavorit_rezeptId_fkey" FOREIGN KEY ("rezeptId") REFERENCES "Rezept" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RezeptFavorit_nutzerId_rezeptId_key" ON "RezeptFavorit"("nutzerId", "rezeptId");
