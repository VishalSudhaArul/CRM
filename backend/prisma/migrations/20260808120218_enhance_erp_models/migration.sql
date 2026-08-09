-- Enhance existing Customer table safely
ALTER TABLE `customer`
ADD COLUMN `address` VARCHAR(191) NULL,
ADD COLUMN `businessName` VARCHAR(191) NULL,
ADD COLUMN `customerType` ENUM('RETAIL', 'WHOLESALE', 'DISTRIBUTOR') NULL,
ADD COLUMN `followUpDate` DATETIME(3) NULL,
ADD COLUMN `gstNumber` VARCHAR(191) NULL,
ADD COLUMN `mobile` VARCHAR(191) NULL,
ADD COLUMN `notes` VARCHAR(191) NULL,
ADD COLUMN `status` ENUM('LEAD', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'LEAD';

-- Copy old Customer data into the new fields
UPDATE `customer`
SET
  `mobile` = COALESCE(`phone`, ''),
  `businessName` = COALESCE(`company`, ''),
  `address` = '',
  `customerType` = 'RETAIL';

-- Make required Customer fields NOT NULL
ALTER TABLE `customer`
MODIFY COLUMN `address` VARCHAR(191) NOT NULL,
MODIFY COLUMN `businessName` VARCHAR(191) NOT NULL,
MODIFY COLUMN `customerType` ENUM('RETAIL', 'WHOLESALE', 'DISTRIBUTOR') NOT NULL,
MODIFY COLUMN `mobile` VARCHAR(191) NOT NULL;

-- Remove old Customer columns
ALTER TABLE `customer`
DROP COLUMN `company`,
DROP COLUMN `phone`;


-- Enhance existing Product table safely
ALTER TABLE `product`
ADD COLUMN `category` VARCHAR(191) NULL,
ADD COLUMN `currentStock` INTEGER NOT NULL DEFAULT 0,
ADD COLUMN `minimumStock` INTEGER NOT NULL DEFAULT 0,
ADD COLUMN `sku` VARCHAR(191) NULL,
ADD COLUMN `unitPrice` DOUBLE NULL,
ADD COLUMN `warehouseLocation` VARCHAR(191) NULL;

-- Copy existing Product data
UPDATE `product`
SET
  `category` = 'General',
  `currentStock` = `stock`,
  `sku` = CONCAT('SKU-', `id`),
  `unitPrice` = `price`,
  `warehouseLocation` = 'Main Warehouse';

-- Make required Product fields NOT NULL
ALTER TABLE `product`
MODIFY COLUMN `category` VARCHAR(191) NOT NULL,
MODIFY COLUMN `sku` VARCHAR(191) NOT NULL,
MODIFY COLUMN `unitPrice` DOUBLE NOT NULL,
MODIFY COLUMN `warehouseLocation` VARCHAR(191) NOT NULL;

-- Remove old Product columns
ALTER TABLE `product`
DROP COLUMN `description`,
DROP COLUMN `price`,
DROP COLUMN `stock`;

-- Add unique SKU constraint
CREATE UNIQUE INDEX `Product_sku_key` ON `Product`(`sku`);


-- Create StockMovement table
CREATE TABLE `StockMovement` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `productId` INTEGER NOT NULL,
  `quantityChanged` INTEGER NOT NULL,
  `movementType` ENUM('IN', 'OUT') NOT NULL,
  `reason` VARCHAR(191) NOT NULL,
  `createdBy` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Add StockMovement relationships
ALTER TABLE `StockMovement`
ADD CONSTRAINT `StockMovement_productId_fkey`
FOREIGN KEY (`productId`)
REFERENCES `Product`(`id`)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE `StockMovement`
ADD CONSTRAINT `StockMovement_createdBy_fkey`
FOREIGN KEY (`createdBy`)
REFERENCES `User`(`id`)
ON DELETE RESTRICT
ON UPDATE CASCADE;