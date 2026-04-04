// src/services/merchantService.js
import api from './apiClient';

// --- 模拟菜单数据生成器 ---
// 使用Unsplash作为备用图片源，加载更快且URL更短
const CUISINE_MENUS = {
    '火锅': [
        { id: 1, name: '麻辣锅底', description: '经典川味麻辣锅底', price: 68.0, category: 'mainCourses', imageUrl: 'https://loremflickr.com/200/200/hotpot,spicy' },
        { id: 4, name: '精品肥牛', description: '优质牛肉', price: 48.0, category: 'appetizers', imageUrl: 'https://loremflickr.com/200/200/beef,meat' },
        { id: 7, name: '酸梅汤', description: '解腻开胃', price: 8.0, category: 'drinks', imageUrl: 'https://loremflickr.com/200/200/juice,drink' },
    ],
    'default': [
        { id: 101, name: '招牌汉堡', description: '双层牛肉，芝士满满', price: 38.0, category: 'mainCourses', imageUrl: 'https://loremflickr.com/200/200/burger,hamburger' },
        { id: 102, name: '炸薯条', description: '金黄酥脆', price: 12.0, category: 'appetizers', imageUrl: 'https://loremflickr.com/200/200/fries,potato' },
        { id: 103, name: '冰可乐', description: '快乐水', price: 6.0, category: 'drinks', imageUrl: 'https://loremflickr.com/200/200/cola,soda' },
    ]
};

export const merchantService = {
    // ==============================
    // 顾客端接口（Customer Side）
    // ==============================

    // 获取商铺列表（首页推荐用）
    getRecommendedMerchants: async () => {
        try {
            const data = await api.get('merchants', '');
            const list = Array.isArray(data) ? data : (data.content || []);
            return list;
        } catch (error) {
            console.warn('获取商家列表失败，尝试获取指定商家兜底', error);
            // 兜底逻辑
            const ids = [1, 2, 3];
            const results = await Promise.all(
                ids.map(id => api.get('merchants', `/${id}`).catch(() => null))
            );
            return results.filter(item => item !== null);
        }
    },

    // 获取商铺详情（顾客端详情页用）
    getMerchantById: async (id) => {
        return await api.get('merchants', `/${id}`);
    },

    // 获取公开菜单（顾客端用，含模拟数据兜底）
    getPublicMenu: async (merchantId) => {
        try {
            // 使用/public端点获取公开菜单
            const list = await api.get('merchants', `/${merchantId}/menu-items/public`);
            if (!list || list.length === 0) throw new Error('Empty menu');
            return list;
        } catch (error) {
            console.warn('API获取菜单失败，使用模拟数据', error);
            // 模拟数据兜底
            return CUISINE_MENUS['default'];
        }
    },

    // ==============================
    // 商家端管理接口（Merchant Side）
    // ==============================

    // 获取商家详情（商家端管理页用）
    getMerchantDetail: async (id) => {
        return await api.get('merchants', `/${id}`);
    },

    // 获取菜单列表（商家管理用）
    getMenu: async (merchantId) => {
        try {
            return await api.get('merchants', `/${merchantId}/menu-items`);
        } catch (e) {
            return CUISINE_MENUS['default']; // 兜底防止白屏
        }
    },

    // 新增菜品
    addMenuItem: async (merchantId, itemData) => {
        return await api.post('merchants', `/${merchantId}/menu-items`, itemData);
    },

    // 更新菜品（上下架、改价）
    updateMenuItem: async (merchantId, itemId, itemData) => {
        return await api.put('merchants', `/${merchantId}/menu-items/${itemId}`, itemData);
    },

    // 删除菜品
    deleteMenuItem: async (merchantId, itemId) => {
        return await api.del('merchants', `/${merchantId}/menu-items/${itemId}`);
    },

    // 获取当前用户的商铺（商家端用）
    getMyMerchant: async () => {
        return await api.get('merchants', '/my');
    },

    // 获取当前用户的所有商铺
    getAllMyMerchants: async () => {
        return await api.get('merchants', '/my/all');
    },

    // 导入真实餐厅（AI推荐服务用）
    importRealRestaurant: async (data) => {
        return await api.post('merchants', '/import', data);
    },

    // 创建商铺（入驻用）
    createMerchant: async (merchantData) => {
        return await api.post('merchants', '', merchantData);
    },

    // 获取未被认领的商家列表
    getUnclaimedMerchants: async (keyword = '') => {
        const params = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
        return await api.get('merchants', `/unclaimed${params}`);
    },

    // 认领商家（关联外部导入的商家到当前用户）
    claimMerchant: async (merchantId) => {
        return await api.post('merchants', `/${merchantId}/claim`);
    }
};