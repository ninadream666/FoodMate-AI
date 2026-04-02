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

    // 上传头像
    uploadAvatar: async (imageUri) => {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('未登录');

        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
        });

        const { SERVICE_URLS } = require('../config/serviceConfig');
        const response = await fetch(`${SERVICE_URLS.users}/me/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('头像上传失败');
        }
        return await response.json();
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