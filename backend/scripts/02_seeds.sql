-- ============================================================
-- 插入种子数据 (依赖顺序：User -> Merchant -> Menu -> Others)
-- ============================================================

-- 1. 插入用户
INSERT INTO users (username, email, password_hash, nickname, avatar_url, phone, role) VALUES
('alice', 'alice@example.com', '$2b$10$5Zng5L.mHicdDHtQr3Tny.3q2DKHgXtHaD..W8noB0veT7o/.Z4Mi', '爱丽丝', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', '13800000001', 'customer'),
('bob', 'bob@example.com', '$2b$10$5Zng5L.mHicdDHtQr3Tny.3q2DKHgXtHaD..W8noB0veT7o/.Z4Mi', '鲍勃', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', '13800000002', 'merchant'),
('rider_tom', 'tom@example.com', '$2b$10$5Zng5L.mHicdDHtQr3Tny.3q2DKHgXtHaD..W8noB0veT7o/.Z4Mi', '汤姆骑手', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom', '13800000003', 'rider'),
('admin', 'admin@example.com', '$2b$10$5Zng5L.mHicdDHtQr3Tny.3q2DKHgXtHaD..W8noB0veT7o/.Z4Mi', '系统管理员', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', '13800000004', 'admin');

-- 2. 插入商家（依赖用户ID=2）
INSERT INTO merchants (owner_user_id, name, address) VALUES
(2, '张记面馆', '123 Main St'),
(2, '李氏烤肉', '456 Oak Ave'),
(2, '王牌披萨', '789 Pine Ln');

-- 3. 插入菜单（依赖商家）
INSERT INTO menu_items (merchant_id, name, price, description) VALUES
(1, '红烧牛肉面', 15.50, '经典美味'),
(1, '酸菜肉丝面', 12.00, '开胃可口'),
(2, '秘制烤五花', 28.00, '肥而不腻'),
(3, '超级至尊披萨', 58.00, '12寸，料足');

-- 4. 插入地址（依赖用户ID=1）
INSERT INTO addresses (user_id, city, street, detail) VALUES
(1, 'New York', '5th Avenue', 'Apt 101'),
(1, 'New York', 'Broadway', 'Office 303');

-- 5. 插入优惠券模板
-- 无门槛券：新用户满减
INSERT INTO coupon_templates (name, description, type, discount_value, max_discount, total_quantity, 
                              valid_from, valid_until, enabled, stackable, created_at, updated_at)
VALUES ('新用户优惠券', '新用户专享，无门槛直减10元', 'NO_THRESHOLD', 10.00, 10.00, 1000,
        CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', true, true,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 满减券：满30减5
INSERT INTO coupon_templates (name, description, type, min_order_amount, discount_value, 
                              total_quantity, valid_from, valid_until, enabled, stackable, created_at, updated_at)
VALUES ('满30减5', '订单满30元减5元', 'THRESHOLD_REDUCTION', 30.00, 5.00, 500,
        CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '60 days', true, true,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 满减券：满60减15
INSERT INTO coupon_templates (name, description, type, min_order_amount, discount_value, 
                              total_quantity, valid_from, valid_until, enabled, stackable, created_at, updated_at)
VALUES ('满60减15', '订单满60元减15元', 'THRESHOLD_REDUCTION', 60.00, 15.00, 300,
        CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '60 days', true, true,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 折扣券：9折
INSERT INTO coupon_templates (name, description, type, discount_value, max_discount,
                              total_quantity, valid_from, valid_until, enabled, stackable, created_at, updated_at)
VALUES ('9折优惠', '全品类商品9折优惠，最多优惠20元', 'DISCOUNT', 9.00, 20.00, 200,
        CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', true, false,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 免运费券
INSERT INTO coupon_templates (name, description, type, discount_value,
                              total_quantity, valid_from, valid_until, enabled, stackable, created_at, updated_at)
VALUES ('免运费券', '免配送费（节省5元）', 'FREE_SHIPPING', 5.00, 100,
        CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '30 days', true, true,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. 发放测试优惠券（依赖用户和模板）
INSERT INTO user_coupons (user_id, coupon_template_id, status, expires_at, created_at, updated_at)
VALUES 
(1, 1, 'AVAILABLE', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 2, 'AVAILABLE', CURRENT_TIMESTAMP + INTERVAL '60 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 3, 'AVAILABLE', CURRENT_TIMESTAMP + INTERVAL '60 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 5, 'AVAILABLE', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 'AVAILABLE', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, 'AVAILABLE', CURRENT_TIMESTAMP + INTERVAL '60 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 4, 'AVAILABLE', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);