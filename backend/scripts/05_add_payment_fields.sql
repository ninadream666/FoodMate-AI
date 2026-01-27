-- ============================================================
-- 支付功能迁移脚本
-- 为 orders 表添加支付相关字段
-- ============================================================

-- 添加支付相关字段到 orders 表
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(100);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(50);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders (paid_at);

CREATE INDEX IF NOT EXISTS idx_orders_payment_transaction_id ON orders (payment_transaction_id);

CREATE INDEX IF NOT EXISTS idx_orders_status_paid ON orders (status, paid_at);

-- 添加注释
COMMENT ON COLUMN orders.paid_at IS '支付完成时间';

COMMENT ON COLUMN orders.payment_method IS '支付方式：WECHAT, ALIPAY, CARD, CASH';

COMMENT ON COLUMN orders.payment_transaction_id IS '第三方支付交易号';

COMMENT ON COLUMN orders.payment_channel IS '支付渠道：APP, MINI_PROGRAM, H5, WEB';