/*
  Warnings:

  - You are about to drop the `Changelog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MenuItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Changelog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MenuItem";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Notification";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "sys_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "roleId" INTEGER,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sys_user_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "sys_role" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sys_role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "roleName" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "description" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sys_menu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "path" TEXT,
    "component" TEXT,
    "parentId" INTEGER,
    "orderNum" INTEGER NOT NULL DEFAULT 0,
    "menuType" TEXT NOT NULL DEFAULT 'M',
    "visible" INTEGER NOT NULL DEFAULT 1,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sys_menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "sys_menu" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sys_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "configKey" TEXT NOT NULL,
    "configValue" TEXT NOT NULL,
    "configType" TEXT NOT NULL DEFAULT 'system',
    "remark" TEXT,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sys_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "method" TEXT,
    "url" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "params" TEXT,
    "result" TEXT,
    "errorMsg" TEXT,
    "costTime" INTEGER,
    "userId" INTEGER,
    "username" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tbl_notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'info',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "publishAt" DATETIME,
    "expireAt" DATETIME,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tbl_changelog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL DEFAULT 'feature',
    "status" INTEGER NOT NULL DEFAULT 1,
    "publishAt" DATETIME,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tbl_file" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileExt" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageType" TEXT NOT NULL DEFAULT 'local',
    "uploadBy" INTEGER,
    "uploadIp" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "hk_api_category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "orderNum" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "hk_api" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "description" TEXT,
    "summary" TEXT,
    "categoryId" INTEGER NOT NULL,
    "requestHeaders" TEXT,
    "requestParams" TEXT,
    "requestBody" TEXT,
    "responseExample" TEXT,
    "responseSchema" TEXT,
    "version" TEXT,
    "deprecated" INTEGER NOT NULL DEFAULT 0,
    "needAuth" INTEGER NOT NULL DEFAULT 1,
    "rateLimit" TEXT,
    "notes" TEXT,
    "callCount" INTEGER NOT NULL DEFAULT 0,
    "lastCall" DATETIME,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "hk_api_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "hk_api_category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_username_key" ON "sys_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_email_key" ON "sys_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_roleName_key" ON "sys_role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_roleKey_key" ON "sys_role"("roleKey");

-- CreateIndex
CREATE UNIQUE INDEX "sys_menu_key_key" ON "sys_menu"("key");

-- CreateIndex
CREATE INDEX "sys_menu_parentId_idx" ON "sys_menu"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "sys_config_configKey_key" ON "sys_config"("configKey");

-- CreateIndex
CREATE INDEX "sys_log_userId_idx" ON "sys_log"("userId");

-- CreateIndex
CREATE INDEX "sys_log_action_idx" ON "sys_log"("action");

-- CreateIndex
CREATE INDEX "sys_log_createdAt_idx" ON "sys_log"("createdAt");

-- CreateIndex
CREATE INDEX "tbl_notification_type_idx" ON "tbl_notification"("type");

-- CreateIndex
CREATE INDEX "tbl_notification_status_idx" ON "tbl_notification"("status");

-- CreateIndex
CREATE INDEX "tbl_notification_publishAt_idx" ON "tbl_notification"("publishAt");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_changelog_version_key" ON "tbl_changelog"("version");

-- CreateIndex
CREATE INDEX "tbl_changelog_version_idx" ON "tbl_changelog"("version");

-- CreateIndex
CREATE INDEX "tbl_changelog_publishAt_idx" ON "tbl_changelog"("publishAt");

-- CreateIndex
CREATE INDEX "tbl_file_uploadBy_idx" ON "tbl_file"("uploadBy");

-- CreateIndex
CREATE INDEX "tbl_file_fileType_idx" ON "tbl_file"("fileType");

-- CreateIndex
CREATE UNIQUE INDEX "hk_api_category_name_key" ON "hk_api_category"("name");

-- CreateIndex
CREATE INDEX "hk_api_categoryId_idx" ON "hk_api"("categoryId");

-- CreateIndex
CREATE INDEX "hk_api_method_idx" ON "hk_api"("method");

-- CreateIndex
CREATE INDEX "hk_api_path_idx" ON "hk_api"("path");
