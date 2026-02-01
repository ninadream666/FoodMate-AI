// src/services/profileService.js
import api from './apiClient';

export const profileService = {
    // 获取用户画像
    getMyProfile: async () => {
        // 对应 Web 的 GET /profile (注意：无尾部斜杠)
        return await api.get('profile', '');
    },

    // 更新用户画像
    updateProfile: async (profileData) => {
        // 对应 Web 的 POST /profile (注意：无尾部斜杠)
        return await api.post('profile', '', profileData);
    }
};