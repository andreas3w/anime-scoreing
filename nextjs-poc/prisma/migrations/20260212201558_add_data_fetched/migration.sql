-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Anime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "malId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleEnglish" TEXT,
    "titleJapanese" TEXT,
    "imageUrl" TEXT,
    "dataFetched" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT,
    "episodes" INTEGER,
    "myScore" INTEGER NOT NULL DEFAULT 0,
    "myStatus" TEXT,
    "myWatchedEpisodes" INTEGER NOT NULL DEFAULT 0,
    "myStartDate" TEXT,
    "myFinishDate" TEXT,
    "myLastUpdated" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Anime" ("createdAt", "episodes", "id", "imageUrl", "malId", "myFinishDate", "myLastUpdated", "myScore", "myStartDate", "myStatus", "myWatchedEpisodes", "title", "titleEnglish", "titleJapanese", "type", "updatedAt") SELECT "createdAt", "episodes", "id", "imageUrl", "malId", "myFinishDate", "myLastUpdated", "myScore", "myStartDate", "myStatus", "myWatchedEpisodes", "title", "titleEnglish", "titleJapanese", "type", "updatedAt" FROM "Anime";
DROP TABLE "Anime";
ALTER TABLE "new_Anime" RENAME TO "Anime";
CREATE UNIQUE INDEX "Anime_malId_key" ON "Anime"("malId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
