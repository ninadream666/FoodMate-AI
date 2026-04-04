import { userApi, API_ENDPOINTS } from './apiConfig';

class UserService {
    // 获取用户列表
    async getUsers(params = {}) {
        try {
            const response = await userApi.get('/admin/users', { params });
            return response.data;
        } catch (error) {
            console.error('Get users failed:', error);
            throw error;
        }
    }

    // 获取用户列表
    async getAllUsers(params = {}) {
        return this.getUsers(params);
    }

    // 获取用户详情
    async getUserById(userId) {
        try {
            const response = await userApi.get(`/admin/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Get user detail failed:', error);
            throw error;
        }
    }

    // 获取用户个人统计信息
    async getUserPersonalStats(userId, params = {}) {
        try {
            const response = await userApi.get(`/users/${userId}/stats`, { params });
            return response.data;
        } catch (error) {
            console.error('Get user personal stats failed:', error);
            throw error;
        }
    }

    // 获取用户订单历史
    async getUserOrders(userId, params = {}) {
        try {
            const response = await userApi.get(`/users/${userId}/orders`, { params });
            return response.data;
        } catch (error) {
            console.error('Get user orders failed:', error);
            throw error;
        }
    }

    // 更新用户状态
    async updateUserStatus(userId, status, reason) {
        try {
            const response = await userApi.patch(`/admin/users/${userId}/status`, {
                status,
                reason
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 获取管理员用户统计数据（系统总览）
    async getUserStats(params = {}) {
        try {
            const response = await userApi.get('/admin/users/stats', { params });
            return response.data;
        } catch (error) {
            console.error('Get admin user stats failed:', error);
            throw error;
        }
    }

    // 获取用户活动日志
    async getUserActivityLog(userId, params = {}) {
        try {
            const response = await userApi.get(`/admin/users/${userId}/activity`, { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 调整用户信用
    async adjustUserCredit(userId, creditData) {
        try {
            const response = await userApi.patch(`/admin/users/${userId}/credit`, creditData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 获取用户信用信息
    async getUserCredit(userId) {
        try {
            const response = await userApi.get(`/users/${userId}/credit`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 获取用户信用记录
    async getUserCreditHistory(userId, params = {}) {
        try {
            const response = await userApi.get(`/admin/users/${userId}/credit/history`, { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 批量更新用户信用
    async batchUpdateUserCredit(userIds, creditData) {
        try {
            const response = await userApi.post('/admin/users/credit/batch-update', {
                userIds,
                ...creditData
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

const userService = new UserService();
export default userService;