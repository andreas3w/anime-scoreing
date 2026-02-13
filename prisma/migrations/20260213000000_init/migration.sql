-- CreateTable
CREATE TABLE "Anime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "malId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleEnglish" TEXT,
    "titleJapanese" TEXT,
    "imageUrl" TEXT,
    "synopsis" TEXT,
    "trailerUrl" TEXT,
    "year" INTEGER,
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

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "colorKey" TEXT NOT NULL DEFAULT 'DEFAULT',
    "isStatus" BOOLEAN NOT NULL DEFAULT false,
    "isType" BOOLEAN NOT NULL DEFAULT false,
    "isStudio" BOOLEAN NOT NULL DEFAULT false,
    "isGenre" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "AnimeTag" (
    "animeId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    PRIMARY KEY ("animeId", "tagId"),
    CONSTRAINT "AnimeTag_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnimeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Anime_malId_key" ON "Anime"("malId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
