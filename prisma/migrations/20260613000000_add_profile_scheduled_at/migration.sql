-- AlterTable
ALTER TABLE `Profile`
ADD COLUMN `scheduledAt` DATETIME(3) NULL AFTER `location`;
