// 对应移动端API服务
import api from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const userService = {
    // 获取当前用户信息
    getUserProfile: async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('未登录');

        return await api.get('users', '/me');
    },

    // 更新用户信息
    updateUserProfile: async (userData) => {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('未登录');

        // userData对应后端的UpdateUserDto: { nickname, phone, email, avatarUrl }
        return await api.put('users', '/me', userData);
    },

    /**
     * 获取用户信用信息
     * GET /users/{userId}/credit
     */
    getUserCredit: async (userId) => {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('未登录');

        return await api.get('users', `/${userId}/credit`);
    }
};