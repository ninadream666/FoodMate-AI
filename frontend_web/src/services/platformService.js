// 基础 URL
const API_BASE = '/api/merchant/platform-services';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const platformService = {
  // 获取所有可用服务
  // 对应后端: GET /api/merchant/platform-services
  getAvailableServices: async () => {
    try {
      const response = await fetch(`${API_BASE}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`获取服务列表失败: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API返回-服务市场数据:", data); // 调试日志
      return data;
    } catch (error) {
      console.error("API调用错误:", error);
      throw error;
    }
  },

  // 获取当前生效的订阅列表
  // 对应后端: GET /api/merchant/platform-services/subscriptions
  getActiveSubscriptions: async () => {
    try {
      const response = await fetch(`${API_BASE}/subscriptions`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error('获取订阅列表失败');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API调用错误:", error);
      throw error;
    }
  },

  // 获取全部订阅历史，包含已取消、已过期
  // 对应后端: GET /api/merchant/platform-services/subscriptions/all
  getAllSubscriptions: async () => {
    try {
      const response = await fetch(`${API_BASE}/subscriptions/all`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error('获取订阅历史失败');
      }
      
      const data = await response.json();
      console.log("API返回-订阅历史:", data);
      return data;
    } catch (error) {
      console.error("API调用错误:", error);
      throw error;
    }
  },

  // 订阅服务
  // 对应后端: POST /api/merchant/platform-services/subscriptions
  subscribe: async (serviceId) => {
    const response = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ serviceId }), // 对应 SubscribeServiceRequest.java
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '订阅失败');
    }
    return await response.json();
  },

  // 取消订阅
  // 对应后端: DELETE /api/merchant/platform-services/subscriptions/{subscriptionId}
  cancelSubscription: async (subscriptionId, reason = "商家主动取消") => {
    const response = await fetch(`${API_BASE}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ reason }), // 虽然是 DELETE，但部分后端框架允许带 Body 传理由
    });

    if (!response.ok) {
      throw new Error('取消订阅失败');
    }
    return true;
  }
};