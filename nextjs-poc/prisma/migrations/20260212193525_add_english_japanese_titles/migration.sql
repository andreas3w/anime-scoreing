-- AlterTable
ALTER TABLE "Anime" ADD COLUMN "titleEnglish" TEXT;
ALTER TABLE "Anime" ADD COLUMN "titleJapanese" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#4f46e5',
    "isStatus" BOOLEAN NOT NULL DEFAULT false,
    "isType" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Tag" ("color", "id", "isStatus", "isType", "name") SELECT "color", "id", "isStatus", "isType", "name" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
