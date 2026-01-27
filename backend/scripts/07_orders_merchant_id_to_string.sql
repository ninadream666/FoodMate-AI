-- Migration: Convert orders.merchant_id from BIGINT to VARCHAR
-- This allows storing external merchant IDs (like 'B0FFKPDZZI') from AI agents

-- Step 1: Add a temporary column for the string merchant_id
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS merchant_id_new VARCHAR(50);

-- Step 2: Copy existing merchant_id values (convert to string)
UPDATE orders
SET
    merchant_id_new = merchant_id::VARCHAR
WHERE
    merchant_id IS NOT NULL;

-- Step 3: Drop the old column and rename the new one
ALTER TABLE orders DROP COLUMN IF EXISTS merchant_id;

ALTER TABLE orders RENAME COLUMN merchant_id_new TO merchant_id;

-- Step 4: Add index for merchant_id queries
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders (merchant_id);

-- Note: If the above fails due to column already being VARCHAR, run this instead:
-- ALTER TABLE orders ALTER COLUMN merchant_id TYPE VARCHAR(50);