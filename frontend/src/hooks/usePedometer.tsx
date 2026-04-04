/**
 * usePedometer.tsx - 步数传感器Hook
 * 
 * 功能：
 * 1. 读取手机硬件步数传感器
 * 2. 计算今日步数
 * 3. 分析最近30分钟步数增量
 * 4. 判断用户是否"刚运动完"
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

// 尝试导入步数计数器库
let StepCounter: any = null;
try {
    StepCounter = require('@dongminyu/react-native-step-counter');
} catch (e) {
    console.warn('步数计数器库未安装或不可用，将使用模拟数据');
}

// 运动状态阈值
const WORKOUT_THRESHOLD = 2000; // 30分钟内超过2000步视为刚运动完
const HISTORY_DURATION = 30 * 60 * 1000; // 30分钟历史记录

interface StepHistoryRecord {
    timestamp: number;
    steps: number;
}

interface PedometerState {
    dailySteps: number;
    recentSteps30min: number;
    isPostWorkout: boolean;
    isAvailable: boolean;
    hasPermission: boolean;
    error: string | null;
}

export const usePedometer = () => {
    const [state, setState] = useState<PedometerState>({
        dailySteps: 0,
        recentSteps30min: 0,
        isPostWorkout: false,
        isAvailable: false,
        hasPermission: false,
        error: null,
    });

    // 步数历史记录
    const historyRef = useRef<StepHistoryRecord[]>([]);
    const subscriptionRef = useRef<any>(null);

    // 请求活动识别权限(Android 10+)
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (Platform.OS !== 'android') {
            return true; // iOS权限通过Info.plist配置
        }

        try {
            // 检查是否需要运行时权限(Android 10+)
            if (Platform.Version >= 29) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
                    {
                        title: '运动数据权限',
                        message: 'FoodMate 需要访问您的运动数据来提供个性化推荐',
                        buttonNegative: '拒绝',
                        buttonPositive: '允许',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            return true; // Android 9及以下不需要运行时权限
        } catch (err) {
            console.warn('请求运动权限失败:', err);
            return false;
        }
    }, []);

    // 分析运动状态
    const analyzeWorkoutStatus = useCallback((currentSteps: number) => {
        const now = Date.now();

        // 记录当前状态
        historyRef.current.push({ timestamp: now, steps: currentSteps });

        // 清理超过30分钟的数据
        const thirtyMinsAgo = now - HISTORY_DURATION;
        historyRef.current = historyRef.current.filter(
            item => item.timestamp > thirtyMinsAgo
        );

        let recentSteps = 0;
        let isPostWorkout = false;

        if (historyRef.current.length > 0) {
            const oldestRecord = historyRef.current[0];
            recentSteps = currentSteps - oldestRecord.steps;

            // 如果过去30分钟内步数增加超过阈值
            if (recentSteps > WORKOUT_THRESHOLD) {
                console.log(`🏃 检测到高强度运动！30分钟内走了 ${recentSteps} 步`);
                isPostWorkout = true;
            }
        }

        setState(prev => ({
            ...prev,
            dailySteps: currentSteps,
            recentSteps30min: Math.max(0, recentSteps),
            isPostWorkout,
        }));

        return { recentSteps, isPostWorkout };
    }, []);

    // 初始化步数监听
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            // 检查库是否可用
            if (!StepCounter) {
                setState(prev => ({
                    ...prev,
                    isAvailable: false,
                    error: '步数传感器库未安装',
                }));
                return;
            }

            // 请求权限
            const hasPermission = await requestPermission();
            if (!isMounted) return;

            if (!hasPermission) {
                setState(prev => ({
                    ...prev,
                    hasPermission: false,
                    error: '未获得运动数据权限',
                }));
                return;
            }

            try {
                // 检查传感器是否可用
                const isSupported = await StepCounter.isStepCountingSupported();
                if (!isMounted) return;

                if (!isSupported) {
                    setState(prev => ({
                        ...prev,
                        isAvailable: false,
                        error: '设备不支持步数传感器',
                    }));
                    return;
                }

                setState(prev => ({
                    ...prev,
                    isAvailable: true,
                    hasPermission: true,
                    error: null,
                }));

                // 启动步数监听
                subscriptionRef.current = StepCounter.startStepCounterUpdate(
                    new Date(),
                    (data: { steps: number; distance?: number }) => {
                        if (isMounted) {
                            analyzeWorkoutStatus(data.steps);
                        }
                    }
                );

                console.log('✅ 步数传感器启动成功');
            } catch (error: any) {
                console.error('❌ 步数传感器初始化失败:', error);
                if (isMounted) {
                    setState(prev => ({
                        ...prev,
                        isAvailable: false,
                        error: error.message || '传感器初始化失败',
                    }));
                }
            }
        };

        init();

        return () => {
            isMounted = false;
            if (subscriptionRef.current && StepCounter) {
                try {
                    StepCounter.stopStepCounterUpdate();
                } catch (e) {
                    console.warn('停止步数监听失败:', e);
                }
            }
        };
    }, [requestPermission, analyzeWorkoutStatus]);

    return {
        ...state,
        // 便捷方法
        refresh: () => {
            // 手动刷新
        },
    };
};

export default usePedometer;
