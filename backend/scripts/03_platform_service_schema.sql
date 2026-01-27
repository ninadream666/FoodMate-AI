-- ============================================================
-- 平台服务模块 - 数据库表结构
-- 文件位置: scripts/03_platform_service_schema.sql
-- ============================================================

-- 安全清除（如需重建）
DROP TABLE IF EXISTS commission_records;
DROP TABLE IF EXISTS merchant_settlements;
DROP TABLE IF EXISTS merchant_service_subscriptions;
DROP TABLE IF EXISTS platform_services;

-- ============================================================
-- 2.17 平台服务定义表
-- ============================================================
CREATE TABLE platform_services (
    id BIGSERIAL PRIMARY KEY,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,  -- BASIC/TRAFFIC/DELIVERY/OPERATION
    description TEXT,
    fee_type VARCHAR(30) NOT NULL,  -- PERCENTAGE/FIXED_PER_ORDER/FIXED_MONTHLY
    fee_value DECIMAL(10, 4) NOT NULL,  -- 百分比用小数如0.05表示5%，固定金额直接存
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'PER_ORDER',  -- PER_ORDER/MONTHLY/DAILY
    min_order_amount DECIMAL(10, 2),  -- 最低订单金额要求（可空）
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否强制订阅（基础服务）
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE/INACTIVE
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2.18 商家服务订阅表
-- ============================================================
CREATE TABLE merchant_service_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id),
    service_id BIGINT NOT NULL REFERENCES platform_services(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE/CANCELLED/EXPIRED
    subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,  -- 周期性服务的过期时间
    cancelled_at TIMESTAMP,
    cancel_reason VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- 同一商家对同一服务只能有一个ACTIVE订阅
    CONSTRAINT uk_merchant_service_active UNIQUE (merchant_id, service_id, status)
);

-- ============================================================
-- 2.19 商家结算单表
-- ============================================================
CREATE TABLE merchant_settlements (
    id BIGSERIAL PRIMARY KEY,
    settlement_no VARCHAR(32) UNIQUE NOT NULL,  -- 结算单号，如 ST202401M001001
    merchant_id BIGINT NOT NULL REFERENCES merchants(id),
    settlement_type VARCHAR(20) NOT NULL,  -- WEEKLY / MONTHLY
    period_start DATE NOT NULL,  -- 周期开始日期
    period_end DATE NOT NULL,  -- 周期结束日期
    period_label VARCHAR(20) NOT NULL,  -- 周期标签，如 2024-01 或 2024-W03
    
    -- 金额字段
    total_order_count INT NOT NULL DEFAULT 0,  -- 订单总数
    total_order_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,  -- 订单总金额（GMV）
    total_commission DECIMAL(12, 2) NOT NULL DEFAULT 0,  -- 平台总分成
    adjustment_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,  -- 调整金额（可正可负）
    adjustment_reason VARCHAR(500),  -- 调整原因
    net_income DECIMAL(12, 2) NOT NULL DEFAULT 0,  -- 商家净收入（订单金额 - 分成 + 调整）
    
    -- 状态字段
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_CONFIRM',  -- PENDING_CONFIRM/CONFIRMED/DISPUTED/PAID/CANCELLED
    confirm_deadline TIMESTAMP,  -- 确认截止时间（超时自动确认）
    confirmed_at TIMESTAMP,  -- 确认时间
    paid_at TIMESTAMP,  -- 打款时间
    
    -- 异议字段（简化处理，只记录）
    dispute_reason VARCHAR(500),  -- 异议原因
    dispute_at TIMESTAMP,  -- 异议时间
    
    -- 时间戳
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 同一商家同一类型同一周期只能有一张有效结算单
    CONSTRAINT uk_merchant_settlement_period UNIQUE (merchant_id, settlement_type, period_label)
);

-- ============================================================
-- 2.20 订单分成记录表
-- ============================================================
CREATE TABLE commission_records (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,  -- 关联orders表，不加外键避免跨服务依赖
    merchant_id BIGINT NOT NULL REFERENCES merchants(id),
    service_id BIGINT NOT NULL REFERENCES platform_services(id),
    settlement_id BIGINT REFERENCES merchant_settlements(id),  -- 关联结算单（可空，未结算时为空）
    service_name VARCHAR(100) NOT NULL,  -- 冗余存储，便于历史查询
    order_amount DECIMAL(10, 2) NOT NULL,  -- 订单金额
    fee_type VARCHAR(30) NOT NULL,  -- 冗余存储
    fee_value DECIMAL(10, 4) NOT NULL,  -- 冗余存储
    commission_amount DECIMAL(10, 2) NOT NULL,  -- 计算出的分成金额
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING/SETTLED/REFUNDED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP
);

-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX idx_platform_services_status ON platform_services(status);
CREATE INDEX idx_platform_services_category ON platform_services(category);
CREATE INDEX idx_platform_services_mandatory ON platform_services(is_mandatory);

CREATE INDEX idx_subscriptions_merchant ON merchant_service_subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_service ON merchant_service_subscriptions(service_id);
CREATE INDEX idx_subscriptions_status ON merchant_service_subscriptions(status);

CREATE INDEX idx_settlement_merchant ON merchant_settlements(merchant_id);
CREATE INDEX idx_settlement_status ON merchant_settlements(status);
CREATE INDEX idx_settlement_type ON merchant_settlements(settlement_type);
CREATE INDEX idx_settlement_period ON merchant_settlements(period_start, period_end);
CREATE INDEX idx_settlement_confirm_deadline ON merchant_settlements(confirm_deadline);

CREATE INDEX idx_commission_order ON commission_records(order_id);
CREATE INDEX idx_commission_merchant ON commission_records(merchant_id);
CREATE INDEX idx_commission_settlement ON commission_records(settlement_id);
CREATE INDEX idx_commission_status ON commission_records(status);
CREATE INDEX idx_commission_created_at ON commission_records(created_at);
CREATE INDEX idx_commission_merchant_created ON commission_records(merchant_id, created_at);
CREATE INDEX idx_commission_unsettled ON commission_records(merchant_id, settlement_id) WHERE settlement_id IS NULL;
