-- ============================================================
-- 平台服务模块 - 种子数据
-- 文件位置: scripts/04_platform_service_seeds.sql
-- ============================================================

-- 插入平台服务定义
INSERT INTO platform_services (service_code, service_name, category, description, fee_type, fee_value, billing_cycle, min_order_amount, is_mandatory, status, sort_order) VALUES
-- 基础服务（强制）
('BASIC_TECH_FEE', '平台技术服务费', 'BASIC', '平台提供的基础技术支持服务，包括订单处理、支付对接等', 'PERCENTAGE', 0.03, 'PER_ORDER', NULL, TRUE, 'ACTIVE', 1),

-- 配送服务（可选）
('PLATFORM_DELIVERY', '平台配送服务', 'DELIVERY', '由平台骑手提供配送服务', 'PERCENTAGE', 0.08, 'PER_ORDER', NULL, FALSE, 'ACTIVE', 10),
('PRIORITY_DELIVERY', '优先配送', 'DELIVERY', '订单优先分配骑手，缩短配送时间', 'FIXED_PER_ORDER', 2.00, 'PER_ORDER', NULL, FALSE, 'ACTIVE', 11),

-- 流量服务（可选）
('PROMO_HOMEPAGE', '首页推荐位', 'TRAFFIC', '商家出现在APP首页推荐列表，增加曝光', 'FIXED_MONTHLY', 50.00, 'MONTHLY', NULL, FALSE, 'ACTIVE', 20),
('PROMO_SEARCH_TOP', '搜索置顶', 'TRAFFIC', '用户搜索时商家优先展示', 'FIXED_MONTHLY', 30.00, 'MONTHLY', NULL, FALSE, 'ACTIVE', 21),
('PROMO_FLASH_SALE', '限时秒杀活动', 'TRAFFIC', '参与平台限时促销活动', 'FIXED_PER_ORDER', 1.00, 'PER_ORDER', 20.00, FALSE, 'ACTIVE', 22),

-- 运营服务（可选）
('DATA_ANALYTICS', '经营数据报表', 'OPERATION', '提供详细的经营数据分析报表', 'FIXED_MONTHLY', 20.00, 'MONTHLY', NULL, FALSE, 'ACTIVE', 30),
('CUSTOMER_SERVICE', '客服代运营', 'OPERATION', '平台代为处理客户投诉和咨询', 'FIXED_MONTHLY', 100.00, 'MONTHLY', NULL, FALSE, 'ACTIVE', 31);

-- 为现有商家自动订阅强制服务（基础技术服务费）
INSERT INTO merchant_service_subscriptions (merchant_id, service_id, status, subscribed_at)
SELECT m.id, ps.id, 'ACTIVE', CURRENT_TIMESTAMP
FROM merchants m
CROSS JOIN platform_services ps
WHERE ps.is_mandatory = TRUE;

-- 为测试商家(id=1)订阅一些可选服务
INSERT INTO merchant_service_subscriptions (merchant_id, service_id, status, subscribed_at)
SELECT 1, id, 'ACTIVE', CURRENT_TIMESTAMP
FROM platform_services
WHERE service_code IN ('PLATFORM_DELIVERY', 'DATA_ANALYTICS');

-- 插入一些测试分成记录（模拟已完成订单的分成）
-- 假设订单1-3已完成，为商家1生成分成记录
INSERT INTO commission_records (order_id, merchant_id, service_id, service_name, order_amount, fee_type, fee_value, commission_amount, status, created_at) VALUES
-- 订单1的分成（假设订单金额50元）- 上月数据
(1, 1, 1, '平台技术服务费', 50.00, 'PERCENTAGE', 0.03, 1.50, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '35 days'),
(1, 1, 2, '平台配送服务', 50.00, 'PERCENTAGE', 0.08, 4.00, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '35 days'),

-- 订单2的分成（假设订单金额80元）- 上月数据
(2, 1, 1, '平台技术服务费', 80.00, 'PERCENTAGE', 0.03, 2.40, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '32 days'),
(2, 1, 2, '平台配送服务', 80.00, 'PERCENTAGE', 0.08, 6.40, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '32 days'),

-- 订单3的分成（假设订单金额120元）- 上月数据
(3, 1, 1, '平台技术服务费', 120.00, 'PERCENTAGE', 0.03, 3.60, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '28 days'),
(3, 1, 2, '平台配送服务', 120.00, 'PERCENTAGE', 0.08, 9.60, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '28 days'),

-- 订单4-6的分成 - 本月数据（用于测试当前周期）
(4, 1, 1, '平台技术服务费', 65.00, 'PERCENTAGE', 0.03, 1.95, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 1, 2, '平台配送服务', 65.00, 'PERCENTAGE', 0.08, 5.20, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '5 days'),

(5, 1, 1, '平台技术服务费', 95.00, 'PERCENTAGE', 0.03, 2.85, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(5, 1, 2, '平台配送服务', 95.00, 'PERCENTAGE', 0.08, 7.60, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '3 days'),

(6, 1, 1, '平台技术服务费', 45.00, 'PERCENTAGE', 0.03, 1.35, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(6, 1, 2, '平台配送服务', 45.00, 'PERCENTAGE', 0.08, 3.60, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- 商家2的测试数据
INSERT INTO commission_records (order_id, merchant_id, service_id, service_name, order_amount, fee_type, fee_value, commission_amount, status, created_at) VALUES
(7, 2, 1, '平台技术服务费', 88.00, 'PERCENTAGE', 0.03, 2.64, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(8, 2, 1, '平台技术服务费', 120.00, 'PERCENTAGE', 0.03, 3.60, 'PENDING', CURRENT_TIMESTAMP - INTERVAL '8 days');
