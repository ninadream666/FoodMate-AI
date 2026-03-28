// 对应 vite.config.js 里的 '/api/users' -> localhost:8083/users
const API_URL = '/api/users';

export const userService = {
  // 获取当前用户信息
  getUserProfile: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('未登录');

    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('获取用户信息失败');
    }

    return await response.json();
  },

  // 更新用户信息
  updateUserProfile: async (userData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('未登录');

    // userData对应后端的UpdateUserDto: { nickname, phone, email, avatarUrl }
    const response = await fetch(`${API_URL}/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('更新失败');
    }

    return await response.json();
  },

  /**
   * 获取用户信用信息
   * GET /users/{userId}/credit
   */
  getUserCredit: async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('未登录');

    const response = await fetch(`${API_URL}/${userId}/credit`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('获取信用信息失败');
    }

    return await response.json();
  }
};