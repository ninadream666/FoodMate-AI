/**
 * useHealthContext.tsx - 健康上下文 Provider
 * 
 * 功能：
 * 1. 整合步数、心率、运动状态、环境光线数据
 * 2. 支持开发者模式（模拟数据）
 * 3. 自动重置运动后状态（5分钟后）
 * 4. 提供倒计时显示
 * 5. 环境光感知（自动传感器 + 手动模拟）
 */

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    ReactNode,
} from 'react';
import { usePedometer } from './usePedometer';
import { useAmbientLight, LightLevel, luxToLevel } from './useAmbientLight';

// 运动后状态持续时间（5分钟）
const POST_WORKOUT_DURATION = 5 * 60 * 1000;

// 活动状态类型
export type ActivityStatus = 'still' | 'walking' | 'running' | 'cycling';

// 光线等级类型（re-export for convenience）
export type { LightLevel } from './useAmbientLight';

// 健康上下文状态
export interface HealthState {
    // 步数数据
    dailySteps: number;
    recentSteps30min: number;

    // 心率数据
    heartRate: number;

    // 活动状态
    activityStatus: ActivityStatus;
    isPostWorkout: boolean;
    postWorkoutExpiresAt: number | null;

    // 环境光线数据
    lightLux: number;
    lightLevel: LightLevel;

    // 开发者模式
    isDevMode: boolean;

    // 传感器状态
    isPedometerAvailable: boolean;
    pedometerError: string | null;
    isLightSensorAvailable: boolean;
    lightSensorError: string | null;
}

// 上下文接口
interface HealthContextType extends HealthState {
    // 模拟数据设置
    setSimulatedHeartRate: (value: number) => void;
    setSimulatedSteps: (value: number) => void;
    setSimulatedActivityStatus: (status: ActivityStatus) => void;

    // 光线模拟设置
    setSimulatedLightLux: (value: number) => void;

    // 开发者模式控制
    setDevMode: (enabled: boolean) => void;

    // 运动状态控制
    triggerPostWorkout: () => void;
    resetAllStates: () => void;

    // 倒计时
    getRemainingTime: () => number;
    getRemainingTimeFormatted: () => string;

    // 一键模拟
    simulateJustFinishedWorkout: () => void;
}

// 默认值
const defaultState: HealthState = {
    dailySteps: 0,
    recentSteps30min: 0,
    heartRate: 75,
    activityStatus: 'still',
    isPostWorkout: false,
    postWorkoutExpiresAt: null,
    lightLux: 300,
    lightLevel: 'normal' as LightLevel,
    isDevMode: false,
    isPedometerAvailable: false,
    pedometerError: null,
    isLightSensorAvailable: false,
    lightSensorError: null,
};

// 创建上下文
const HealthContext = createContext<HealthContextType | null>(null);

// Provider Props
interface HealthProviderProps {
    children: ReactNode;
}

// Provider 组件
export const HealthProvider: React.FC<HealthProviderProps> = ({ children }) => {
    // 真实步数数据
    const pedometer = usePedometer();

    // 真实环境光数据
    const ambientLight = useAmbientLight();

    // 模拟数据状态
    const [simulatedData, setSimulatedData] = useState({
        heartRate: 75,
        steps: 0,
        activityStatus: 'still' as ActivityStatus,
        lightLux: 300,
    });

    // 开发者模式
    const [isDevMode, setIsDevMode] = useState(false);

    // 运动后状态
    const [isPostWorkout, setIsPostWorkout] = useState(false);
    const [postWorkoutExpiresAt, setPostWorkoutExpiresAt] = useState<number | null>(null);

    // 倒计时更新触发器
    const [, setTick] = useState(0);

    // 自动重置运动状态
    useEffect(() => {
        if (!isPostWorkout || !postWorkoutExpiresAt) return;

        const timer = setInterval(() => {
            const now = Date.now();
            if (now > postWorkoutExpiresAt) {
                console.log('⏰ 运动状态已过期，自动重置');
                setIsPostWorkout(false);
                setPostWorkoutExpiresAt(null);
                // 重置模拟的心率
                if (isDevMode) {
                    setSimulatedData(prev => ({ ...prev, heartRate: 75 }));
                }
            } else {
                // 触发重渲染以更新倒计时
                setTick(t => t + 1);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isPostWorkout, postWorkoutExpiresAt, isDevMode]);

    // 触发运动后状态
    const triggerPostWorkout = useCallback(() => {
        const expiresAt = Date.now() + POST_WORKOUT_DURATION;
        setIsPostWorkout(true);
        setPostWorkoutExpiresAt(expiresAt);
        console.log(`🏃 触发运动后状态，将在 ${new Date(expiresAt).toLocaleTimeString()} 重置`);
    }, []);

    // 重置所有状态
    const resetAllStates = useCallback(() => {
        setIsPostWorkout(false);
        setPostWorkoutExpiresAt(null);
        setSimulatedData({
            heartRate: 75,
            steps: 0,
            activityStatus: 'still',
            lightLux: 300,
        });
        console.log('🔄 已重置所有健康状态');
    }, []);

    // 获取剩余时间（毫秒）
    const getRemainingTime = useCallback(() => {
        if (!postWorkoutExpiresAt) return 0;
        return Math.max(0, postWorkoutExpiresAt - Date.now());
    }, [postWorkoutExpiresAt]);

    // 获取格式化的剩余时间
    const getRemainingTimeFormatted = useCallback(() => {
        const remaining = getRemainingTime();
        if (remaining <= 0) return '0:00';

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [getRemainingTime]);

    // 一键模拟刚跑完步
    const simulateJustFinishedWorkout = useCallback(() => {
        // 自动启用开发者模式
        setIsDevMode(true);
        setSimulatedData({
            heartRate: 145,
            steps: 12000,
            activityStatus: 'running',
            lightLux: simulatedData.lightLux,
        });
        triggerPostWorkout();
        console.log('🎯 已模拟"刚跑完步"状态（自动启用开发者模式）');
    }, [triggerPostWorkout]);

    // 设置模拟心率
    const setSimulatedHeartRate = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, heartRate: value }));
    }, []);

    // 设置模拟步数
    const setSimulatedSteps = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, steps: value }));
    }, []);

    // 设置模拟活动状态
    const setSimulatedActivityStatus = useCallback((status: ActivityStatus) => {
        setSimulatedData(prev => ({ ...prev, activityStatus: status }));
    }, []);

    // 设置模拟光线值
    const setSimulatedLightLux = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, lightLux: Math.max(0, Math.min(50000, value)) }));
    }, []);

    // 计算最终状态
    const finalState: HealthState = {
        // 步数：开发者模式用模拟值，否则用真实值
        dailySteps: isDevMode ? simulatedData.steps : pedometer.dailySteps,
        recentSteps30min: isDevMode ? Math.min(simulatedData.steps, 3000) : pedometer.recentSteps30min,

        // 心率：始终用模拟值（没有真实传感器）
        heartRate: simulatedData.heartRate,

        // 活动状态
        activityStatus: isDevMode ? simulatedData.activityStatus :
            (pedometer.isPostWorkout ? 'running' : 'still'),

        // 运动后状态：手动触发或传感器检测都生效
        isPostWorkout: isPostWorkout || pedometer.isPostWorkout,
        postWorkoutExpiresAt,

        // 环境光线：开发者模式用模拟值，否则用真实传感器值
        lightLux: isDevMode ? simulatedData.lightLux : ambientLight.luxValue,
        lightLevel: isDevMode ? luxToLevel(simulatedData.lightLux) : ambientLight.lightLevel,

        // 开发者模式
        isDevMode,

        // 传感器状态
        isPedometerAvailable: pedometer.isAvailable,
        pedometerError: pedometer.error,
        isLightSensorAvailable: ambientLight.isAvailable,
        lightSensorError: ambientLight.error,
    };

    const contextValue: HealthContextType = {
        ...finalState,
        setSimulatedHeartRate,
        setSimulatedSteps,
        setSimulatedActivityStatus,
        setSimulatedLightLux,
        setDevMode: setIsDevMode,
        triggerPostWorkout,
        resetAllStates,
        getRemainingTime,
        getRemainingTimeFormatted,
        simulateJustFinishedWorkout,
    };

    return (
        <HealthContext.Provider value={contextValue}>
            {children}
        </HealthContext.Provider>
    );
};

// Hook
export const useHealthContext = (): HealthContextType => {
    const context = useContext(HealthContext);
    if (!context) {
        throw new Error('useHealthContext must be used within a HealthProvider');
    }
    return context;
};

export default useHealthContext;
