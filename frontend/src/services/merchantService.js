// src/services/merchantService.js
import api from './apiClient';

// --- 模拟菜单数据生成器 (保留原有的兜底数据) ---
const CUISINE_MENUS = {
    '火锅': [
        { id: 1, name: '麻辣锅底', description: '经典川味麻辣锅底', price: 68.0, category: 'mainCourses', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArCT0tj8J-e9yyH422cU_NzNiA-NddrGRXaqEsw_wDvT0Mfni_KyoPn4p67_giN4rSkQZtFbs7Ux4aXNhyex6eHWl7' },
        { id: 4, name: '精品肥牛', description: '优质牛肉', price: 48.0, category: 'appetizers', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhbQ9QcRMxm3Llr59SYyPVDBvXIeETgPqmZ_TDh0yGFWfgYmjwN89xAIT2MGtR--XXTFjIlci4ywk8FxQXju58r-0x4abnohjNJ0yvHytPSCMeME8hpWfe-iuarjXSMaMtmaToplyJCQzWEJ1PC_FrV_i0Rf2WcM57dchzX78SC-fPZrifDw9SYP2b73FdLAcxRrqgO0nkOXsdaMMvXb85jDZ2Lm68VN2jDGHZCeeS4N-judX4sb3iiv0fUZqmCc0iOZlIFSo2K0Bx' },
        { id: 7, name: '酸梅汤', description: '解腻开胃', price: 8.0, category: 'drinks', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmmd-i4u5v21dh8Ip1PqQdmDDbIYxNeb8OpD0iwmy60G1vNZ9xxIxPJqyAP7kCV8jz' },
    ],
    'default': [
        { id: 101, name: '招牌汉堡', description: '双层牛肉，芝士满满', price: 38.0, category: 'mainCourses', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrawV460GKuSwxG2erT5rdBh9ksqmQjzOTvnwYNU94TAR8--4IoSIyOfS2xC0-s3GbtIMMvUkusGoRljcvgdBFUwmD-nkloIV6LQSXdQUcr27tzgJpxyuKyVik-B_9eTdirHZhMVgfkEVfDKo6yDeJv7tOMeUbHB-BW6vGuWrj0-245nme0zrYfM0SN5ZaxIK5AyaCUa1vvb2fIri1634y5Hjop3rpflHAC9zZXdPSEWLiQh7mhvSgy4_gKUuFYXuuBjkJrNms9v23' },
        { id: 102, name: '炸薯条', description: '金黄酥脆', price: 12.0, category: 'appetizers', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0SqHYZlIXyFFcCFeErv7z3OCT3dWL1Eb2_7H2rw85kJN-QpFQB9NJg1JxLfHuCIcc9LySyuY9gHTuNFRiQSUFM8n2tPxCcoUCuHVr8uHm0PM8ZtGLP7QMU3v8nwmLVsQjHJV_Xmx8pj2VI06I7Y2sT_i4dCsutqf6twJq3q-ck158JrAnEH2_JJ_3UW8OxWRCet5OikJ1MztLTr8IWYEs2qvK6uAcJ326SNeNfYtyh-5Hrc5P2mZIGeIKpWDoz2AF5UcrzZHEWx8u' },
        { id: 103, name: '冰可乐', description: '快乐水', price: 6.0, category: 'drinks', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmmd-i4u5v21dh8Ip1PqQdmDDbIYxNeb8OpD0iwmy60G1vNZ9xxIxPJqyAP7kCV8jzvrSQD8zQuLrRvI_-R1CCMGm0tGeRbvLANxmBxvzpAN8sG8zR8kyBH4UdgaP-37WBj-k0Soe7jH3a2ERUM7qsHnkxbPV2UynBCU8ppX0BaGm93gPtVDmAil-sCuYyFxRWiSmcuit_tWPlIA8C_O7TctaQxlMVWKYdQ7xHhFFZplnBVJ2kCwJ0pr2Rm9VquCzWpE7qLdbczkm4' },
    ]
};

export const merchantService = {
    // ==============================
    // 顾客端接口 (Customer Side)
    // ==============================

    // 1. 获取商铺列表 (首页推荐用)
    getRecommendedMerchants: async () => {
        try {
            const data = await api.get('merchants', '/');
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

    // 2. 获取商铺详情 (顾客端详情页用)
    getMerchantById: async (id) => {
        return await api.get('merchants', `/${id}`);
    },

    // 3. 获取公开菜单 (顾客端用，含模拟数据兜底)
    getPublicMenu: async (merchantId) => {
        try {
            // 使用 /public 端点获取公开菜单
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
    // 商家端管理接口 (Merchant Side)
    // ==============================

    // 4. 获取商家详情 (商家端管理页用)
    getMerchantDetail: async (id) => {
        return await api.get('merchants', `/${id}`);
    },

    // 5. 获取菜单列表 (商家管理用)
    getMenu: async (merchantId) => {
        try {
            return await api.get('merchants', `/${merchantId}/menu-items`);
        } catch (e) {
            return CUISINE_MENUS['default']; // 兜底防止白屏
        }
    },

    // 6. 新增菜品
    addMenuItem: async (merchantId, itemData) => {
        return await api.post('merchants', `/${merchantId}/menu-items`, itemData);
    },

    // 7. 更新菜品 (上下架、改价)
    updateMenuItem: async (merchantId, itemId, itemData) => {
        return await api.put('merchants', `/${merchantId}/menu-items/${itemId}`, itemData);
    },

    // 8. 删除菜品
    deleteMenuItem: async (merchantId, itemId) => {
        return await api.del('merchants', `/${merchantId}/menu-items/${itemId}`);
    },

    // 9. 获取当前用户的商铺 (商家端用)
    getMyMerchant: async () => {
        return await api.get('merchants', '/my');
    },

    // 10. 导入真实餐厅 (AI 推荐服务用)
    importRealRestaurant: async (data) => {
        return await api.post('merchants', '/import', data);
    },

    // 11. [新增] 创建商铺 (入驻用) <-- 之前缺少的代码
    createMerchant: async (merchantData) => {
        // 假设后端创建商铺接口是 POST /api/merchants
        // 如果你的后端是 POST /api/merchants/apply 或其他路径，请在此修改
        return await api.post('merchants', '/', merchantData);
    },

    // 12. 获取未被认领的商家列表
    getUnclaimedMerchants: async (keyword = '') => {
        const params = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
        return await api.get('merchants', `/unclaimed${params}`);
    },

    // 13. 认领商家（关联外部导入的商家到当前用户）
    claimMerchant: async (merchantId) => {
        return await api.post('merchants', `/${merchantId}/claim`);
    }
};