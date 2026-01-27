-- ============================================================
-- Order Service - 预置历史订单数据 (Order History Seeds)
-- 文件位置: scripts/07_init_ai_pricing_data.sql
-- 目的：在 Order Service 数据库中生成过去30天的真实订单
--       以便 AI Service 通过 API 拉取并分析趋势。
-- 数据库: 连接到核心业务库 (food_delivery_db)
-- ============================================================

-- 切换到 Order Service 使用的主数据库
-- 注意：确保你的 docker-compose 或环境配置中主库名称为 food_delivery_db
\c food_delivery_db;

-- 1. 清理可能存在的旧模拟数据 (保留 ID < 10000 的基础种子数据)
DELETE FROM order_items WHERE order_id >= 10000;
DELETE FROM orders WHERE id >= 10000;

-- 2. 创建临时表生成模拟数据
-- 使用临时表替代 CTE，确保数据可以在后续多个 INSERT 语句中重复使用
DROP TABLE IF EXISTS temp_generated_orders;

CREATE TEMPORARY TABLE temp_generated_orders AS
WITH 
-- A. 生成过去 30 天的时间序列
date_series AS (
    SELECT generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, INTERVAL '1 day')::date as order_date
),

-- B. 定义不同菜品的销量趋势 (Trend Simulation)
trends AS (
    SELECT 
        d.order_date,
        m.id as menu_item_id,
        m.merchant_id,
        m.price,
        CASE 
            -- 策略 1: 销量严重下滑 (Trigger: MARKDOWN / 降价)
            -- 例如 ID=1 (红烧牛肉面): 从每天 20 单降到 2 单
            WHEN m.id = 1 THEN 
                GREATEST(1, (20 - (18.0 * (CURRENT_DATE - d.order_date)::int / 30.0)))::int

            -- 策略 2: 销量平稳 (Trigger: MAINTAIN / 维持)
            -- 例如 ID=2 (酸菜肉丝面): 每天稳定在 8-12 单
            WHEN m.id = 2 THEN 
                (8 + floor(random() * 5))::int

            -- 策略 3: 销量暴涨 (Trigger: SURGE / 涨价)
            -- 例如 ID=3 (秘制烤五花): 从每天 5 单涨到 30 单
            WHEN m.id = 3 THEN 
                GREATEST(1, (5 + (25.0 * (30 - (CURRENT_DATE - d.order_date)::int) / 30.0)))::int
             
            -- 策略 4: 销量低迷/波动 (Trigger: MARKDOWN or MAINTAIN)
            -- 例如 ID=4 (超级至尊披萨): 每天 0-3 单
            WHEN m.id = 4 THEN 
                floor(random() * 4)::int

            -- 其他默认情况: 随机 1-5 单
            ELSE 
                (1 + floor(random() * 5))::int
        END as daily_count
    FROM date_series d
    CROSS JOIN menu_items m -- 为所有现有菜品生成数据
    WHERE m.is_available = true -- 只处理上架商品
)

-- C. 展开生成具体的订单记录并存入临时表
SELECT 
    -- 生成唯一的 Order ID (从 10000 开始)
    10000 + ROW_NUMBER() OVER (ORDER BY t.order_date, t.menu_item_id) as new_order_id,
    t.order_date,
    t.merchant_id,
    t.menu_item_id,
    t.price,
    -- 随机生成下单时间 (10:00 - 22:00)
    t.order_date + time '10:00' + random() * interval '12 hours' as created_at,
    -- 随机分配用户 ID (假设 seeds.sql 里有 id 1-4 的用户)
    1 + floor(random() * 4)::int as user_id
FROM trends t,
generate_series(1, t.daily_count) as seq; -- 根据每日销量展开行

-- 3. 插入数据到 orders 表 (从临时表读取)
INSERT INTO orders (id, user_id, merchant_id, total_amount, status, created_at, paid_at, payment_method, payment_channel)
SELECT 
    new_order_id,
    user_id,
    merchant_id,
    price, -- 简单起见，假设每单只有一件商品
    'COMPLETED',
    created_at,
    created_at, -- 支付时间等于创建时间
    'WECHAT',
    'APP'
FROM temp_generated_orders;

-- 4. 插入数据到 order_items 表 (从临时表再次读取)
INSERT INTO order_items (order_id, menu_item_id, price, quantity)
SELECT 
    new_order_id,
    menu_item_id,
    price,
    1 -- 数量固定为 1
FROM temp_generated_orders;

-- 5. 重置序列值，防止后续新增订单 ID 冲突
-- 注意：如果 orders_id_seq 名字不同，请根据实际情况修改
SELECT setval(pg_get_serial_sequence('orders', 'id'), (SELECT MAX(id) FROM orders) + 1);
-- 如果 order_items 有自增 ID，也需要重置（假设没有显式 ID 或由数据库托管）
-- SELECT setval(pg_get_serial_sequence('order_items', 'id'), (SELECT MAX(id) FROM order_items) + 1);

-- 6. 清理临时表
DROP TABLE temp_generated_orders;