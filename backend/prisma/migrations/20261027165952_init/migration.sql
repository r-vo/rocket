-- CreateTable
CREATE TABLE "Nutzer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwortHash" TEXT NOT NULL,
    "istAdmin" BOOLEAN NOT NULL DEFAULT false,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Sitzung" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gueltigBis" DATETIME NOT NULL,
    CONSTRAINT "Sitzung_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutzerProfil" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "alter" INTEGER,
    "geschlecht" TEXT,
    "groesseCm" REAL,
    "gewichtZielKg" REAL,
    "nettoCarbsZielG" INTEGER,
    "alltagFaktor" REAL,
    "trainingstage" INTEGER,
    "equipment" TEXT,
    "tempo" TEXT,
    "zieldatum" TEXT,
    "extraDefizit" INTEGER,
    CONSTRAINT "NutzerProfil_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ernaehrungseintrag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "datum" TEXT NOT NULL,
    "mahlzeit" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "menge" REAL,
    "einheit" TEXT,
    "kcal" INTEGER NOT NULL,
    "nettoCarbs" REAL NOT NULL,
    "fett" REAL NOT NULL,
    "eiweiss" REAL NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ernaehrungseintrag_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gewichtseintrag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "datum" TEXT NOT NULL,
    "kg" REAL NOT NULL,
    CONSTRAINT "Gewichtseintrag_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fortschrittsfoto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "datum" TEXT NOT NULL,
    "dateiname" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fortschrittsfoto_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Aufgabe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "faelligAm" TEXT,
    "erledigt" BOOLEAN NOT NULL DEFAULT false,
    "erledigtAm" DATETIME,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Aufgabe_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nutzerId" INTEGER NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Habit_nutzerId_fkey" FOREIGN KEY ("nutzerId") REFERENCES "Nutzer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HabitEintrag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "habitId" INTEGER NOT NULL,
    "datum" TEXT NOT NULL,
    "erledigt" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "HabitEintrag_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Nutzer_email_key" ON "Nutzer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sitzung_tokenHash_key" ON "Sitzung"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "NutzerProfil_nutzerId_key" ON "NutzerProfil"("nutzerId");

-- CreateIndex
CREATE UNIQUE INDEX "Gewichtseintrag_nutzerId_datum_key" ON "Gewichtseintrag"("nutzerId", "datum");

-- CreateIndex
CREATE UNIQUE INDEX "HabitEintrag_habitId_datum_key" ON "HabitEintrag"("habitId", "datum");
