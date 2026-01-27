-- 10_more_pricing_data_v2.sql
-- 为商家 1 (Bob's Burger / 张记面馆) 添加第二批测试菜品和销量数据
-- 目的：用于 Demo 演示，再次触发 AI 的不同定价策略 (涨价、降价、维持)

DO $$
DECLARE
    v_crayfish_id BIGINT;
    v_plum_juice_id BIGINT;
    v_fried_rice_id BIGINT;
    v_cucumber_id BIGINT;
    v_wagyu_id BIGINT;
    v_order_id BIGINT;
    i INT;
BEGIN
    -- 1. 添加更多菜品 (第二批)
    -- 1.1 爆款：麻辣小龙虾 (预期触发涨价)
    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '麻辣小龙虾', '鲜活现炒，麻辣鲜香，夜宵必备', 98.00, '夜宵', 'http://example.com/crayfish.jpg', true)
    RETURNING id INTO v_crayfish_id;

    -- 1.2 滞销款：冰镇酸梅汤 (预期触发降价)
    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '冰镇酸梅汤', '传统工艺熬制，解腻消暑', 18.00, '饮品', 'http://example.com/plum_juice.jpg', true)
    RETURNING id INTO v_plum_juice_id;

    -- 1.3 常规款：扬州炒饭 (预期维持原价)
    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '扬州炒饭', '粒粒分明，配料丰富', 25.00, '主食', 'http://example.com/fried_rice.jpg', true)
    RETURNING id INTO v_fried_rice_id;

    -- 1.4 销量尚可：蒜泥拍黄瓜 (预期维持或微调)
    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '蒜泥拍黄瓜', '清爽开胃，下酒好菜', 12.00, '凉菜', 'http://example.com/cucumber.jpg', true)
    RETURNING id INTO v_cucumber_id;

    -- 1.5 高价冷门：澳洲M9和牛 (预期降价促销)
    INSERT INTO menu_items (merchant_id, name, description, price, category, image_url, is_available) 
    VALUES (1, '澳洲M9和牛', '顶级纹理，入口即化', 588.00, '主食', 'http://example.com/wagyu.jpg', true)
    RETURNING id INTO v_wagyu_id;

    -- 2. 模拟销量数据 (插入 orders 和 order_items 表)
    
    -- 2.1 爆款：麻辣小龙虾 (55 单 -> 强劲需求 -> 涨价)
    FOR i IN 1..55 LOOP
        INSERT INTO orders (user_id, merchant_id, total_amount, status, created_at)
        VALUES (1, 1, 196.00, 'COMPLETED', NOW() - (random() * interval '7 days'))
        RETURNING id INTO v_order_id;

        INSERT INTO order_items (order_id, menu_item_id, price, quantity)
        VALUES (v_order_id, v_crayfish_id, 98.00, 2);
    END LOOP;

    -- 2.2 滞销款：冰镇酸梅汤 (仅 2 单 -> 需求不足 -> 降价)
    FOR i IN 1..2 LOOP
        INSERT INTO orders (user_id, merchant_id, total_amount, status, created_at)
        VALUES (1, 1, 18.00, 'COMPLETED', NOW() - (random() * interval '7 days'))
        RETURNING id INTO v_order_id;

        INSERT INTO order_items (order_id, menu_item_id, price, quantity)
        VALUES (v_order_id, v_plum_juice_id, 18.00, 1);
    END LOOP;

    -- 2.3 常规款：扬州炒饭 (18 单 -> 供需平衡 -> 维持)
    FOR i IN 1..18 LOOP
        INSERT INTO orders (user_id, merchant_id, total_amount, status, created_at)
        VALUES (1, 1, 25.00, 'COMPLETED', NOW() - (random() * interval '7 days'))
        RETURNING id INTO v_order_id;

        INSERT INTO order_items (order_id, menu_item_id, price, quantity)
        VALUES (v_order_id, v_fried_rice_id, 25.00, 1);
    END LOOP;

    -- 2.4 销量尚可：蒜泥拍黄瓜 (25 单 -> 表现不错 -> 维持或微涨)
    FOR i IN 1..25 LOOP
        INSERT INTO orders (user_id, merchant_id, total_amount, status, created_at)
        VALUES (1, 1, 12.00, 'COMPLETED', NOW() - (random() * interval '7 days'))
        RETURNING id INTO v_order_id;

        INSERT INTO order_items (order_id, menu_item_id, price, quantity)
        VALUES (v_order_id, v_cucumber_id, 12.00, 1);
    END LOOP;
    
    -- 2.5 高价冷门：澳洲M9和牛 (0 单 -> 严重滞销 -> 建议降价)
    -- 不插入任何订单

END $$;
