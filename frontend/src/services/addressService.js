// src/services/addressService.js
import api from './apiClient';

export const addressService = {
    // 获取地址列表
    getMyAddresses: async () => {
        try {
            console.log('[AddressService] 开始获取地址列表...');
            const result = await api.get('users', '/address');
            console.log('[AddressService] 地址列表获取成功:', result);
            return result;
        } catch (error) {
            console.error('[AddressService] 获取地址列表详细错误:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error; // 保留原始错误信息
        }
    },

    // 新增地址
    addAddress: async (addressData) => {
        try {
            console.log('[AddressService] 开始添加地址:', addressData);
            const result = await api.post('users', '/address', addressData);
            console.log('[AddressService] 地址添加成功:', result);
            return result;
        } catch (error) {
            console.error('[AddressService] 添加地址详细错误:', {
                message: error.message,
                stack: error.stack
            });
            throw error; // 保留原始错误信息
        }
    },

    // 修改地址
    updateAddress: async (id, addressData) => {
        try {
            return await api.put('users', `/address/${id}`, addressData);
        } catch (error) {
            console.log('修改地址失败:', error);
            throw new Error('修改地址失败');
        }
    },

    // 删除地址
    deleteAddress: async (id) => {
        try {
            return await api.del('users', `/address/${id}`);
        } catch (error) {
            console.log('删除地址失败:', error);
            throw new Error('删除地址失败');
        }
    },

    // 设为默认
    setDefault: async (id) => {
        try {
            return await api.put('users', `/address/${id}/default`);
        } catch (error) {
            console.log('设置默认地址失败:', error);
            throw new Error('设置默认地址失败');
        }
    }
};