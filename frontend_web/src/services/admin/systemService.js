import { platformApi } from './apiConfig';

class SystemService {
    // 获取所有服务健康状态
    async getSystemHealth() {
        try {
            const response = await platformApi.get('/api/admin/system/health');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 获取特定服务健康状态
    async getServiceHealth(serviceName) {
        try {
            const response = await platformApi.get(`/api/admin/system/health/${serviceName}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 获取系统性能指标
    async getSystemMetrics() {
        try {
            const response = await platformApi.get('/api/admin/system/metrics');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 获取服务日志
    async getServiceLogs(serviceName, params = {}) {
        try {
            const response = await platformApi.get(`/api/admin/system/logs/${serviceName}`, { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 重启服务
    async restartService(serviceName) {
        try {
            const response = await platformApi.post(`/api/admin/system/restart/${serviceName}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 获取系统资源使用情况
    async getSystemResources() {
        try {
            const response = await platformApi.get('/api/admin/system/resources');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // 发送系统测试请求
    async pingService(serviceName) {
        try {
            const response = await platformApi.post(`/api/admin/system/ping/${serviceName}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

const systemService = new SystemService();
export default systemService;