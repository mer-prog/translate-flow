-- CreateTable
CREATE TABLE "TranslationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "targetLocale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "originalTitle" TEXT NOT NULL,
    "translatedTitle" TEXT,
    "originalBody" TEXT NOT NULL,
    "translatedBody" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "translationMode" TEXT NOT NULL DEFAULT 'mock',
    "apiKey" TEXT,
    "defaultLocales" TEXT NOT NULL DEFAULT 'en,ja'
);

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
