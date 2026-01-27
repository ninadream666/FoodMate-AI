-- ============================================================
-- AI Pricing 服务数据库初始化
-- 文件位置: scripts/06_create_ai_pricing_db.sql
-- ============================================================

-- 1. 创建数据库 (Postgres 容器启动时默认会处理 create database，但这里显式声明以防万一)
-- 注意：在 docker-entrypoint-initdb.d 中运行的脚本通常已经是在超级用户下
-- 如果数据库已存在，以下命令可能会报错或跳过，视 postgres 版本而定
-- 更好的方式是依赖 POSTGRES_DB 环境变量创建主库，这里只创建额外的库

SELECT 'CREATE DATABASE ai_pricing_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_pricing_db')\gexec

-- 切换到新数据库 (在 psql 脚本中有效)
\c ai_pricing_db;

-- 2. 创建销售历史表
CREATE TABLE IF NOT EXISTS sales_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    menu_item_id INTEGER,
    merchant_id INTEGER,
    quantity INTEGER,
    unit_price FLOAT,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_item ON sales_history(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_sales_time ON sales_history(transaction_time);

-- 3. 创建定价提案表
CREATE TABLE IF NOT EXISTS pricing_proposals (
    id SERIAL PRIMARY KEY,
    merchant_id INTEGER,
    menu_item_id INTEGER,
    current_price FLOAT,
    suggested_price FLOAT,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, AUTO_APPROVED, MERCHANT_APPROVED, REJECTED
    reasoning TEXT,
    strategy_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proposal_merchant ON pricing_proposals(merchant_id);
CREATE INDEX IF NOT EXISTS idx_proposal_status ON pricing_proposals(status);