// 基础 URL
const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const merchantService = {
  // 1. 获取当前登录用户的商铺信息
  getMyMerchant: async () => {
    const response = await fetch(`${API_BASE}/merchants/my`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      // 这里的逻辑关键：
      // 404 Not Found: 明确表示没找到资源
      // 403 Forbidden: 有时后端框架会在没权限(比如没关联店铺)时返回 403
      // 我们把这两种情况都视为"需要入驻"
      if (response.status === 404 || response.status === 403) {
        throw new Error('MERCHANT_NOT_FOUND');
      }
      const errText = await response.text();
      throw new Error(errText || '获取商铺信息失败');
    }
    return await response.json();
  },

  // 1.1 创建商铺
  // 对应 POST /merchants
  createMerchant: async (data) => {
    const response = await fetch(`${API_BASE}/merchants`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || '创建商铺失败');
    }
    return await response.json();
  },

  // 2. 获取商铺的所有菜品
  getMenu: async (merchantId) => {
    const response = await fetch(`${API_BASE}/merchants/${merchantId}/menu-items`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('获取菜单失败');
    }
    return await response.json();
  },

  // 3. 添加菜品
  addMenuItem: async (merchantId, data) => {
    const response = await fetch(`${API_BASE}/merchants/${merchantId}/menu-items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('添加菜品失败');
    }
    return await response.json();
  },

  // 4. 更新菜品
  updateMenuItem: async (merchantId, itemId, data) => {
    const response = await fetch(`${API_BASE}/merchants/${merchantId}/menu-items/${itemId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('更新菜品失败');
    }
    return await response.json();
  },

  // 5. 删除菜品
  deleteMenuItem: async (merchantId, itemId) => {
    const response = await fetch(`${API_BASE}/merchants/${merchantId}/menu-items/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('删除菜品失败');
    }
    return true;
  }
};
