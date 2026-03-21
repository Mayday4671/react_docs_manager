-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_hk_api_category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "parentId" INTEGER,
    "orderNum" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hk_api_category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "hk_api_category" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_hk_api_category" ("createdAt", "description", "icon", "id", "name", "orderNum", "status", "updatedAt") SELECT "createdAt", "description", "icon", "id", "name", "orderNum", "status", "updatedAt" FROM "hk_api_category";
DROP TABLE "hk_api_category";
ALTER TABLE "new_hk_api_category" RENAME TO "hk_api_category";
CREATE INDEX "hk_api_category_parentId_idx" ON "hk_api_category"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
