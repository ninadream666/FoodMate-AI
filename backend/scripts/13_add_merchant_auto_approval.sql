-- Add auto-approval settings to merchants table

\c food_delivery_db;

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS enable_auto_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS auto_approval_threshold DOUBLE PRECISION DEFAULT 0.05;
