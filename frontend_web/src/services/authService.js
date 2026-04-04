// 基础URL使用在vite.config.js中配置的代理前缀
const API_URL = '/api/auth';

export const authService = {
  // 登录
  login: async (username, password, role) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 将role加入请求体发送给后端
      body: JSON.stringify({ username, password, role }),
    });

    if (!response.ok) {
      // 尝试读取后端返回的错误信息
      let errorMessage = '登录失败，请检查用户名或密码';
      try {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      } catch (e) { } // 忽略解析错误

      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      // 保存完整的用户信息，包括 id、username、role
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        username: data.username || username,
        role: data.role || role
      }));
      // 单独保存userId方便推荐服务使用
      if (data.id) {
        localStorage.setItem('userId', data.id.toString());
      }
    }
    return data;
  },

  // 注册
  register: async (username, email, password, role) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, role }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '注册失败');
    }

    return await response.text();
  },

  // 登出
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
  },

  // 检查是否已登录
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
};