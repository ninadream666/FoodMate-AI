-- ============================================================
-- 1. 安全清除旧数据
-- ============================================================

-- 最底层的子表（引用了其他表，但没有被其他表引用，或者处于依赖链末端）
DROP TABLE IF EXISTS user_coupons;

DROP TABLE IF EXISTS order_status_history;

DROP TABLE IF EXISTS pricing_ab_tests;

DROP TABLE IF EXISTS discount_recommendations;

DROP TABLE IF EXISTS price_elasticity;

DROP TABLE IF EXISTS pricing_history;

DROP TABLE IF EXISTS menu_item_costs;

DROP TABLE IF EXISTS cancellation_records;

DROP TABLE IF EXISTS order_items;

-- 中间层依赖
DROP TABLE IF EXISTS orders;

DROP TABLE IF EXISTS addresses;

DROP TABLE IF EXISTS menu_items;

DROP TABLE IF EXISTS merchant_notifications;

DROP TABLE IF EXISTS price_change_proposals;

DROP TABLE IF EXISTS pricing_strategies;

DROP TABLE IF EXISTS coupon_templates;

-- 顶层父表
DROP TABLE IF EXISTS merchants;

DROP TABLE IF EXISTS users;

-- ============================================================
-- 2. 开始建表
-- ============================================================

-- 2.1 用户表（最核心的基础表）
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    credit_level INT DEFAULT 5,
    recent_cancellations INT DEFAULT 0,
    last_level_change_at TIMESTAMP
);

-- 2.2 商家表（依赖users）
CREATE TABLE merchants (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT REFERENCES users (id),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    enable_dynamic_pricing BOOLEAN DEFAULT TRUE,
    pricing_strategy_id BIGINT, -- 注意：这里没有强制外键，避免与pricing_strategies循环依赖
    ai_pricing_budget_percentage INT DEFAULT 5,
    enable_auto_approval BOOLEAN DEFAULT FALSE,
    auto_approval_threshold DOUBLE PRECISION DEFAULT 0.05,
    external_id VARCHAR(50) UNIQUE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    image_url VARCHAR(500),
    rating DOUBLE PRECISION,
    cuisine_type VARCHAR(100),
    phone VARCHAR(50),
    description TEXT,
    source VARCHAR(20) DEFAULT 'LOCAL'
);

-- 2.3 定价策略表（依赖merchants）
CREATE TABLE pricing_strategies (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT REFERENCES merchants (id),
    strategy_name VARCHAR(100) NOT NULL,
    strategy_type VARCHAR(50) NOT NULL,
    description TEXT,
    apply_time_range VARCHAR(50),
    apply_day_of_week VARCHAR(50),
    price_adjustment_percentage INT,
    min_price DECIMAL(10, 2),
    max_price DECIMAL(10, 2),
    ai_enabled BOOLEAN DEFAULT TRUE,
    elasticity_factor DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.4 菜单项表（依赖merchants）
CREATE TABLE menu_items (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT REFERENCES merchants (id),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    category VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    base_price DECIMAL(10, 2),
    current_dynamic_price DECIMAL(10, 2),
    cost_type VARCHAR(50) DEFAULT 'FIXED',
    cost_amount DECIMAL(10, 2),
    pricing_strategy_id BIGINT, -- 逻辑上关联pricing_strategies，但建表时不强制FK以简化
    last_price_update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_dynamic BOOLEAN DEFAULT FALSE
);

-- 2.4.1 商家通知表
CREATE TABLE merchant_notifications (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT,
    title VARCHAR(255),
    content VARCHAR(1000),
    type VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
);

-- 2.4.2 价格变更提案表
CREATE TABLE price_change_proposals (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT,
    menu_item_id BIGINT,
    external_proposal_id BIGINT,
    current_price DECIMAL(10, 2),
    suggested_price DECIMAL(10, 2),
    reason TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP,
    handled_at TIMESTAMP
);

-- 2.5 收货地址表（依赖users）
CREATE TABLE addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users (id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    street VARCHAR(255) NOT NULL,
    detail VARCHAR(255),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 订单主表（依赖users, merchants）
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL, -- 逻辑外键
    merchant_id BIGINT NOT NULL, -- 逻辑外键
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancel_reason VARCHAR(255),
    cancel_status VARCHAR(20),
    refund_amount DECIMAL(10, 2),
    refund_approved_at TIMESTAMP,
    discount_amount DECIMAL(10, 2),
    original_amount DECIMAL(10, 2),
    original_item_price DECIMAL(10, 2),
    applied_pricing_strategy_id BIGINT,
    ai_discount_reason VARCHAR(255),
    -- 支付相关字段
    paid_at TIMESTAMP, -- 支付完成时间
    payment_method VARCHAR(50), -- 支付方式：WECHAT, ALIPAY, CARD, CASH
    payment_transaction_id VARCHAR(100), -- 第三方支付交易号
    payment_channel VARCHAR(50) -- 支付渠道：APP, MINI_PROGRAM, H5, WEB
);

-- 2.7 订单详情表（依赖orders）
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders (id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL
);

-- 2.8 取消记录表（依赖users, orders）
CREATE TABLE cancellation_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users (id),
    order_id BIGINT REFERENCES orders (id),
    cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.9 菜单项成本表（依赖menu_items）
CREATE TABLE menu_item_costs (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT REFERENCES menu_items (id),
    cost_category VARCHAR(50),
    cost_name VARCHAR(100),
    cost_amount DECIMAL(10, 2),
    unit VARCHAR(20),
    cost_date DATE,
    supplier VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.10 定价历史表（依赖menu_items, merchants）
CREATE TABLE pricing_history (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT REFERENCES menu_items (id),
    merchant_id BIGINT REFERENCES merchants (id),
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    change_reason VARCHAR(100),
    applied_strategy_id BIGINT,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.11 价格弹性表（依赖menu_items, merchants）
CREATE TABLE price_elasticity (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT REFERENCES menu_items (id),
    merchant_id BIGINT REFERENCES merchants (id),
    elasticity_coefficient DECIMAL(5, 3),
    confidence_score DECIMAL(5, 3),
    optimal_price_min DECIMAL(10, 2),
    optimal_price_max DECIMAL(10, 2),
    data_period_start DATE,
    data_period_end DATE,
    sample_size INT,
    last_calculated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.12 折扣推荐表（依赖merchants, menu_items）
CREATE TABLE discount_recommendations (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT REFERENCES merchants (id),
    menu_item_id BIGINT REFERENCES menu_items (id),
    recommendation_type VARCHAR(50),
    recommended_discount DECIMAL(5, 2),
    recommended_price DECIMAL(10, 2),
    reason TEXT,
    expected_sales_increase DECIMAL(5, 2),
    status VARCHAR(20),
    merchant_decision_reason VARCHAR(255),
    decided_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- 2.13 定价A/B测试表（依赖merchants, menu_items）
CREATE TABLE pricing_ab_tests (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT REFERENCES merchants (id),
    menu_item_id BIGINT REFERENCES menu_items (id),
    test_name VARCHAR(100),
    test_group_a_price DECIMAL(10, 2),
    test_group_b_price DECIMAL(10, 2),
    test_start_date TIMESTAMP,
    test_end_date TIMESTAMP,
    group_a_sales INT,
    group_a_revenue DECIMAL(10, 2),
    group_b_sales INT,
    group_b_revenue DECIMAL(10, 2),
    winner VARCHAR(10),
    winner_confirmed_at TIMESTAMP,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.14 订单状态历史表 （依赖orders）
CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders (id),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 营销服务表 ====================

-- 2.15 优惠券模板表（相对独立）
CREATE TABLE coupon_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    type VARCHAR(20) NOT NULL,
    min_order_amount DECIMAL(10, 2),
    discount_value DECIMAL(10, 2) NOT NULL,
    max_discount DECIMAL(10, 2),
    total_quantity INTEGER NOT NULL DEFAULT 0,
    issued_quantity INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    stackable BOOLEAN NOT NULL DEFAULT true,
    exclusive_ids TEXT,
    applicable_merchant_ids TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2.16 用户优惠券表（依赖users, coupon_templates）
CREATE TABLE user_coupons (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coupon_template_id BIGINT NOT NULL REFERENCES coupon_templates (id),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    order_id BIGINT,
    obtained_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. 添加索引
-- ============================================================
CREATE INDEX idx_menu_items_pricing_strategy ON menu_items (pricing_strategy_id);

CREATE INDEX idx_menu_items_is_dynamic ON menu_items (is_dynamic);

CREATE INDEX idx_pricing_history_menu_item ON pricing_history (menu_item_id);

CREATE INDEX idx_pricing_history_changed_at ON pricing_history (changed_at);

CREATE INDEX idx_discount_recommendations_merchant ON discount_recommendations (merchant_id);

CREATE INDEX idx_price_elasticity_menu_item ON price_elasticity (menu_item_id);

CREATE INDEX idx_orders_user_id ON orders (user_id);

CREATE INDEX idx_orders_merchant_id ON orders (merchant_id);

CREATE INDEX idx_orders_created_at ON orders (created_at);

CREATE INDEX idx_cancellation_records_user_id ON cancellation_records (user_id);

CREATE INDEX idx_cancellation_records_created_at ON cancellation_records (cancelled_at);

CREATE INDEX idx_coupon_enabled ON coupon_templates (enabled);

CREATE INDEX idx_coupon_type ON coupon_templates(type);

CREATE INDEX idx_user_id ON user_coupons (user_id);

CREATE INDEX idx_coupon_template_id ON user_coupons (coupon_template_id);

CREATE INDEX idx_user_status ON user_coupons (user_id, status);