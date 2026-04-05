-- 08_more_pricing_data.sql
-- 为商家 1 (Bob's Burger / 张记面馆) 添加更多菜品和销量数据
-- 修正版：使用 PL/pgSQL 动态获取 ID 并插入到 orders/order_items 表 (Food Delivery DB)
-- 这样 Order Service API 才能查到数据供 AI Service 使用

DO $$
DECLARE
    v_burger_id BIGINT;
    v_salad_id BIGINT;
    v_milktea_id BIGINT;
    v_fries_id BIGINT;
    v_seafood_id BIGINT;
    v_order_id BIGINT;
    i INT;
BEGIN
    -- 1. 添加更多菜品
    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '至尊豪华汉堡', '双层牛肉，双层芝士，培根', 45.00, '主食', 'http://example.com/burger_deluxe.jpg', true)
    RETURNING id INTO v_burger_id;

    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '滞销蔬菜沙拉', '健康有机蔬菜，无人问津', 35.00, '沙拉', 'http://example.com/salad.jpg', true)
    RETURNING id INTO v_salad_id;

    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '网红爆款奶茶', '黑糖珍珠，鲜奶', 18.00, '饮品', 'http://example.com/milktea.jpg', true)
    RETURNING id INTO v_milktea_id;

    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '普通炸薯条', '经典配方', 12.00, '小吃', 'http://example.com/fries.jpg', true)
    RETURNING id INTO v_fries_id;

    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '昂贵海鲜拼盘', '龙虾，鲍鱼，帝王蟹', 288.00, '主食', 'http://example.com/seafood.jpg', true)
    RETURNING id INTO v_seafood_id;

    -- 2. 模拟销量数据
    
    -- 2.1 畅销品：网红爆款奶茶（60单 -> 触发涨价）
    FOR i IN 1..60 LOOP
        INSERT INTO orders (user_id, merchant_id, total_amount, status, created_at)
        VALUES (1, 1, 36.00, 'COMPLETED', NOW() - (random() * interval '7 days'))
        RETURNING id INTO v_order_id;

        INSERT INTO order_items (order_id, menu_item_id, price, quantity)
        VALUES (v_order_id, v_milktea_id, 18.00, 2);
    END LOOP;

    -- 2.2 滞销品：滞销蔬菜沙拉（3单 -> 触发降价）
    FOR i IN 1..3 LOOP
        INSERT INTO orders (user_id, merchant_id, total_amount, status, created_at)
        VALUES (1, 1, 35.00, 'COMPLETED', NOW() - (random() * interval '7 days'))
        RETURNING id INTO v_order_id;

        INSERT INTO order_items (order_id, menu_item_id, price, quantity)
        VALUES (v_order_id, v_salad_id, 35.00, 1);
    END LOOP;

    -- 2.3 中等销量：至尊豪华汉堡（15单 -> 维持）
    FOR i IN 1..15 LOOP
        INSERT INTO orders (user_id, merchant_id, total_amount, status, created_at)
        VALUES (1, 1, 45.00, 'COMPLETED', NOW() - (random() * interval '7 days'))
        RETURNING id INTO v_order_id;

        INSERT INTO order_items (order_id, menu_item_id, price, quantity)
        VALUES (v_order_id, v_burger_id, 45.00, 1);
    END LOOP;

    -- 2.4 销量尚可：普通炸薯条（20单 -> 维持或微调）
    FOR i IN 1..20 LOOP
        INSERT INTO orders (user_id, merchant_id, total_amount, status, created_at)
        VALUES (1, 1, 12.00, 'COMPLETED', NOW() - (random() * interval '7 days'))
        RETURNING id INTO v_order_id;

        INSERT INTO order_items (order_id, menu_item_id, price, quantity)
        VALUES (v_order_id, v_fries_id, 12.00, 1);
    END LOOP;

END $$;
