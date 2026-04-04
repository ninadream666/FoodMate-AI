// 对应vite.config.js里的配置 '/api/users' -> User Service
const API_URL = '/api/users/address';

export const addressService = {
  // 获取我的地址列表
  getMyAddresses: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('未登录');

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn('认证失败，Token 可能已过期，请重新登录');
      }
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `获取地址失败: ${response.status}`);
    }
    return await response.json();
  },

  // 新增地址
  addAddress: async (addressData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('未登录');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    });

    if (!response.ok) throw new Error('添加地址失败');
    return await response.json();
  },

  /**
   * 修改地址
   * PUT /users/address/{id}
   */
  updateAddress: async (id, addressData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('未登录');

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    });

    if (!response.ok) throw new Error('修改地址失败');
    return await response.json();
  },

  // --- 删除地址 ---
  deleteAddress: async (id) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('未登录');

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('删除失败');
    return true;
  },

  // --- 设为默认 ---
  setDefault: async (id) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('未登录');

    const response = await fetch(`${API_URL}/${id}/default`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('设置失败');
    return true;
  }
};