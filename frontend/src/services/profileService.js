// src/services/profileService.js
import api from './apiClient';

export const profileService = {
    // 获取用户画像
    getMyProfile: async () => {
        return await api.get('profile', '');
    },

    // 更新用户画像
    updateProfile: async (profileData) => {
        return await api.post('profile', '', profileData);
    },

    // 收藏
    getFavorites: async () => {
        return await api.get('profile', '/favorites');
    },
    addFavorite: async (merchantId) => {
        return await api.post('profile', `/favorites/${merchantId}`);
    },
    removeFavorite: async (merchantId) => {
        return await api.del('profile', `/favorites/${merchantId}`);
    },

    // 健康饮食记录
    saveHealthRecord: async (record) => {
        return await api.post('profile', '/health-records', record);
    },
    getHealthRecords: async () => {
        return await api.get('profile', '/health-records');
    },
    deleteHealthRecord: async (recordId) => {
        return await api.del('profile', `/health-records/${recordId}`);
    },

    // 忌口/过敏原
    getAllergies: async () => {
        const profile = await api.get('profile', '');
        return profile?.allergies || [];
    },
    updateAllergies: async (allergies) => {
        return await api.post('profile', '', { allergies });
    },

    // 浏览历史
    getHistory: async () => {
        return await api.get('profile', '/history');
    },
    recordHistory: async (merchantId) => {
        return await api.post('profile', '/history', { merchantId });
    },
    clearHistory: async () => {
        return await api.del('profile', '/history');
    },
};