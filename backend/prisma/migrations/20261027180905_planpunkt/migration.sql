-- CreateTable
CREATE TABLE "Planpunkt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "wochentag" INTEGER NOT NULL,
    "mahlzeit" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Planpunkt_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Planpunkt_nutzerId_wochentag_mahlzeit_key" ON "Planpunkt"("nutzerId", "wochentag", "mahlzeit");
