// src/services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './apiClient';

export const authService = {
    // 登录
    login: async (username, password, role) => {
        // 调用 apiClient，服务选 'auth'，路径 '/login'
        // 这里的 'auth' 对应 serviceConfig.js 里的 http://10.0.2.2:8083/api/auth
        const data = await api.post('auth', '/login', {
            username,
            password,
            role
        });

        if (data.token) {
            await AsyncStorage.setItem('token', data.token);

            const userInfo = {
                id: data.id,
                username: data.username || username,
                role: data.role || role
            };

            await AsyncStorage.setItem('user', JSON.stringify(userInfo));

            if (data.id) {
                await AsyncStorage.setItem('userId', data.id.toString());
            }
        }
        return data;
    },

    // 注册
    register: async (username, email, password, role) => {
        return await api.post('auth', '/register', {
            username,
            email,
            password,
            role
        });
    },

    // 登出
    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userId');
    },

    // 检查是否已登录 (异步)
    isLoggedIn: async () => {
        const token = await AsyncStorage.getItem('token');
        return !!token;
    },

    // 获取当前用户信息 (异步)
    getCurrentUser: async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    }
};