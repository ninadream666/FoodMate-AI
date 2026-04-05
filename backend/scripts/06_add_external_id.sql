-- ============================================================
-- 为merchants表添加外部ID支持
-- 用于支持智能体返回的真实餐厅ID，如B0LDM1F2K5
-- ============================================================

-- 1. 添加外部ID字段
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS external_id VARCHAR(50) UNIQUE;

-- 2. 添加其他真实餐厅信息字段
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION;

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS cuisine_type VARCHAR(100);

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'LOCAL';

-- 3. 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_merchants_external_id ON merchants (external_id);

CREATE INDEX IF NOT EXISTS idx_merchants_source ON merchants (source);

-- 4. 为现有商家生成外部ID（可选）
UPDATE merchants
SET
    external_id = 'M' || LPAD(id::text, 9, '0')
WHERE
    external_id IS NULL;

-- 5. 添加注释说明
COMMENT ON COLUMN merchants.external_id IS '外部 ID，来自智能体/地图 API（如 B0LDM1F2K5）';

COMMENT ON COLUMN merchants.source IS '数据来源：LOCAL（本地创建）、AGENT（智能体导入）、AMAP（高德）、GOOGLE（Google Places）';

COMMENT ON COLUMN merchants.latitude IS '纬度';

COMMENT ON COLUMN merchants.longitude IS '经度';

COMMENT ON COLUMN merchants.image_url IS '餐厅图片 URL';

COMMENT ON COLUMN merchants.rating IS '评分（0-5）';

COMMENT ON COLUMN merchants.cuisine_type IS '菜系类型';

COMMENT ON COLUMN merchants.phone IS '联系电话';

COMMENT ON COLUMN merchants.description IS '餐厅描述';