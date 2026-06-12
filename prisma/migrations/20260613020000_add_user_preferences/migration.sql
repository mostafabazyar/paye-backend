-- AlterTable
ALTER TABLE `User`
ADD COLUMN `preferredSports` TEXT NULL AFTER `interestedIn`,
ADD COLUMN `preferredSessionTypes` TEXT NULL AFTER `preferredSports`;
