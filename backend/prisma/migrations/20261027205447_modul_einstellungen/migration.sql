-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Nutzer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwortHash" TEXT NOT NULL,
    "istAdmin" BOOLEAN NOT NULL DEFAULT false,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deaktivierteModule" TEXT NOT NULL DEFAULT '[]'
);
INSERT INTO "new_Nutzer" ("aktiv", "email", "erstelltAm", "id", "istAdmin", "name", "passwortHash") SELECT "aktiv", "email", "erstelltAm", "id", "istAdmin", "name", "passwortHash" FROM "Nutzer";
DROP TABLE "Nutzer";
ALTER TABLE "new_Nutzer" RENAME TO "Nutzer";
CREATE UNIQUE INDEX "Nutzer_email_key" ON "Nutzer"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
