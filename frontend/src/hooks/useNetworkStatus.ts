import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import {
    addNetworkListener,
    getNetworkStatus,
    startNetworkMonitor,
} from '../services/networkUtils';

interface NetworkState {
    isConnected: boolean;
    connectionType: string;
    isWifi: boolean;
}

/**
 * 全局网络状态 Hook
 *
 * 用法：
 *   const { isConnected, isWifi, guardLargeRequest } = useNetworkStatus();
 *
 *   // 在发起大请求前检查
 *   if (!guardLargeRequest('图片分析需要网络连接')) return;
 *   await analyzeImage();
 */
export const useNetworkStatus = () => {
    const [state, setState] = useState<NetworkState>(getNetworkStatus);

    useEffect(() => {
        // 确保全局监听器已启动
        startNetworkMonitor();

        const unsubscribe = addNetworkListener((newState) => {
            setState({
                isConnected: newState.isConnected,
                connectionType: newState.connectionType,
                isWifi: newState.isWifi,
            });

            // 断网时自动提示
            if (!newState.isConnected) {
                Alert.alert('网络已断开', '请检查您的网络连接后重试');
            }
        });

        return unsubscribe;
    }, []);

    /**
     * 在发起大请求前调用，离线时弹窗并返回 false
     */
    const guardLargeRequest = useCallback((message?: string) => {
        if (!state.isConnected) {
            Alert.alert(
                '无网络连接',
                message || '该操作需要网络连接，请检查网络设置后重试'
            );
            return false;
        }
        return true;
    }, [state.isConnected]);

    return {
        ...state,
        guardLargeRequest,
    };
};
