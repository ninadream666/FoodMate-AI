// 对应 vite.config.js 里的 '/api/profile' -> Profile Service (8086)
const API_URL = '/api/profile';

export const profileService = {
  // 获取我的完整画像（用于判断是否是新用户）
  getMyProfile: async () => {
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
      throw new Error('获取用户画像失败');
    }
    return await response.json();
  },

  // 更新/初始化我的画像（提交问卷）
  updateProfile: async (profileData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('未登录');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error('保存画像失败');
    }
    return await response.json();
  }
};