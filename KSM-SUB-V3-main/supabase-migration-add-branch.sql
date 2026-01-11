-- ============================================
-- ŞUBE (BRANCH) KOLONU EKLENMESİ
-- Migration: Add branch column to products table
-- ============================================

-- 1. Add branch column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT 'MUT Şubesi'
CHECK (branch IN ('MUT Şubesi', 'KARAMAN Şubesi'));

-- 2. Drop unique constraint on barcode (allow same barcode in different branches)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_barcode_key;

-- 3. Create composite unique constraint on (barcode, branch)
ALTER TABLE products
ADD CONSTRAINT products_barcode_branch_unique UNIQUE (barcode, branch);

-- 4. Create index for branch filtering
CREATE INDEX IF NOT EXISTS idx_products_branch ON products(branch);

-- 5. Create composite index for barcode + branch lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode_branch ON products(barcode, branch);

-- Migration complete!
-- Note: Existing products will default to 'MUT Şubesi'
