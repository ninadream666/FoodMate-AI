/**
 * useHealthContext.tsx - 健康上下文 Provider
 *
 * 功能：
 * 1. 整合OPPO健康SDK数据（心率、步数、睡眠、压力、血氧等）
 * 2. 整合环境光传感器数据
 * 3. 支持开发者模式（模拟数据）
 * 4. 自动重置运动后状态（5分钟后）
 * 5. 提供综合健康评估
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
import { useAmbientLight, LightLevel, luxToLevel } from './useAmbientLight';
import { useOppoHealth } from './useOppoHealth';
import { ComprehensiveHealthState as OppoHealthState } from '../native/HeytapHealthModule';

// 运动后状态持续时间（5分钟）
const POST_WORKOUT_DURATION = 5 * 60 * 1000;

// 活动状态类型
export type ActivityStatus = 'still' | 'walking' | 'running' | 'cycling';

// 光线等级类型（re-export for convenience）
export type { LightLevel } from './useAmbientLight';

// 压力等级
export type PressureLevel = '放松' | '正常' | '中等' | '偏高';

// 睡眠质量
export type SleepQuality = '优秀' | '良好' | '一般' | '较差' | '无数据';

// 血氧状态
export type BloodOxygenStatus = '正常' | '偏低' | '低氧' | '无数据';

// 综合健康状态
export type OverallHealthStatus = '优秀' | '良好' | '一般' | '需关注' | '无数据';

// 健康上下文状态
export interface HealthState {
    // ========== 基础数据 ==========
    // 步数数据
    dailySteps: number;
    recentSteps30min: number;
    dailyDistance: number;           // 米
    dailyCalories: number;

    // 心率数据
    heartRate: number;               // 当前心率
    restingHeartRate: number;        // 静息心率
    avgHeartRate: number;            // 今日平均心率
    maxHeartRate: number;
    minHeartRate: number;

    // 活动状态
    activityStatus: ActivityStatus;
    isPostWorkout: boolean;
    postWorkoutExpiresAt: number | null;

    // ========== OPPO健康扩展数据 ==========
    // 压力数据
    pressureValue: number;           // 当前压力值 (1-100)
    avgPressure: number;
    pressureLevel: PressureLevel;

    // 睡眠数据 (昨晚)
    lastSleepDuration: number;       // 分钟
    lastSleepDurationHours: number;
    lastSleepScore: number;          // 0-100
    sleepQuality: SleepQuality;
    lastDeepSleepDuration: number;   // 分钟
    lastLightSleepDuration: number;
    lastRemSleepDuration: number;

    // 血氧数据
    bloodOxygen: number;             // 当前血氧 (0-100%)
    avgBloodOxygen: number;
    bloodOxygenStatus: BloodOxygenStatus;

    // 运动记录
    recentWorkoutDuration: number;   // 最近运动时长（分钟）
    recentWorkoutCalories: number;
    recentWorkoutType: string;
    lastWorkoutTimestamp: number;

    // 放松数据
    todayRelaxDuration: number;      // 今日放松时长（分钟）

    // ========== 环境数据 ==========
    // 环境光线数据
    lightLux: number;
    lightLevel: LightLevel;

    // ========== 综合评估 ==========
    overallHealthStatus: OverallHealthStatus;
    activityLevel: string;           // 活跃/适中/轻度/久坐
    needsRest: boolean;              // 是否需要休息
    isWellRested: boolean;           // 是否休息充足

    // ========== 设备信息 ==========
    hasWearableDevice: boolean;
    deviceType: string;

    // ========== 状态标志 ==========
    // 开发者模式
    isDevMode: boolean;

    // OPPO健康SDK状态
    isOppoHealthAvailable: boolean;
    isOppoHealthAuthorized: boolean;
    oppoHealthError: string | null;

    // 传感器状态
    isLightSensorAvailable: boolean;
    lightSensorError: string | null;
}

// 上下文接口
interface HealthContextType extends HealthState {
    // 模拟数据设置
    setSimulatedHeartRate: (value: number) => void;
    setSimulatedSteps: (value: number) => void;
    setSimulatedActivityStatus: (status: ActivityStatus) => void;
    setSimulatedLightLux: (value: number) => void;
    setSimulatedPressure: (value: number) => void;
    setSimulatedBloodOxygen: (value: number) => void;
    setSimulatedSleepScore: (value: number) => void;
    setSimulatedSleepDuration: (value: number) => void;

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
    simulateGoodSleep: () => void;
    simulateHighStress: () => void;
    simulateLowBloodOxygen: () => void;

    // OPPO健康操作
    initializeOppoHealth: () => Promise<boolean>;
    requestOppoHealthAuth: () => Promise<boolean>;
    refreshOppoHealthData: () => Promise<void>;
}

// 默认值
const defaultState: HealthState = {
    // 基础数据
    dailySteps: 0,
    recentSteps30min: 0,
    dailyDistance: 0,
    dailyCalories: 0,
    heartRate: 75,
    restingHeartRate: 65,
    avgHeartRate: 75,
    maxHeartRate: 0,
    minHeartRate: 0,
    activityStatus: 'still',
    isPostWorkout: false,
    postWorkoutExpiresAt: null,

    // OPPO扩展数据
    pressureValue: 50,
    avgPressure: 50,
    pressureLevel: '正常',
    lastSleepDuration: 0,
    lastSleepDurationHours: 0,
    lastSleepScore: 0,
    sleepQuality: '无数据',
    lastDeepSleepDuration: 0,
    lastLightSleepDuration: 0,
    lastRemSleepDuration: 0,
    bloodOxygen: 98,
    avgBloodOxygen: 98,
    bloodOxygenStatus: '正常',
    recentWorkoutDuration: 0,
    recentWorkoutCalories: 0,
    recentWorkoutType: '',
    lastWorkoutTimestamp: 0,
    todayRelaxDuration: 0,

    // 环境数据
    lightLux: 300,
    lightLevel: 'normal' as LightLevel,

    // 综合评估
    overallHealthStatus: '无数据',
    activityLevel: '无数据',
    needsRest: false,
    isWellRested: false,

    // 设备信息
    hasWearableDevice: false,
    deviceType: '',

    // 状态标志
    isDevMode: false,
    isOppoHealthAvailable: false,
    isOppoHealthAuthorized: false,
    oppoHealthError: null,
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
    // OPPO健康SDK
    const oppoHealth = useOppoHealth();

    // 真实环境光数据
    const ambientLight = useAmbientLight();

    // 模拟数据状态
    const [simulatedData, setSimulatedData] = useState({
        heartRate: 75,
        steps: 0,
        activityStatus: 'still' as ActivityStatus,
        lightLux: 300,
        pressure: 50,
        bloodOxygen: 98,
        sleepScore: 80,
        sleepDuration: 420, // 7小时
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
                if (isDevMode) {
                    setSimulatedData(prev => ({ ...prev, heartRate: 75 }));
                }
            } else {
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
            pressure: 50,
            bloodOxygen: 98,
            sleepScore: 80,
            sleepDuration: 420,
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

    // 一键模拟场景
    const simulateJustFinishedWorkout = useCallback(() => {
        setIsDevMode(true);
        setSimulatedData(prev => ({
            ...prev,
            heartRate: 145,
            steps: 12000,
            activityStatus: 'running',
        }));
        triggerPostWorkout();
        console.log('🎯 已模拟"刚跑完步"状态');
    }, [triggerPostWorkout]);

    const simulateGoodSleep = useCallback(() => {
        setIsDevMode(true);
        setSimulatedData(prev => ({
            ...prev,
            sleepScore: 92,
            sleepDuration: 480, // 8小时
            pressure: 30,
        }));
        console.log('🎯 已模拟"睡眠充足"状态');
    }, []);

    const simulateHighStress = useCallback(() => {
        setIsDevMode(true);
        setSimulatedData(prev => ({
            ...prev,
            pressure: 85,
            heartRate: 95,
        }));
        console.log('🎯 已模拟"高压力"状态');
    }, []);

    const simulateLowBloodOxygen = useCallback(() => {
        setIsDevMode(true);
        setSimulatedData(prev => ({
            ...prev,
            bloodOxygen: 92,
        }));
        console.log('🎯 已模拟"低血氧"状态');
    }, []);

    // 模拟数据设置函数
    const setSimulatedHeartRate = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, heartRate: value }));
    }, []);

    const setSimulatedSteps = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, steps: value }));
    }, []);

    const setSimulatedActivityStatus = useCallback((status: ActivityStatus) => {
        setSimulatedData(prev => ({ ...prev, activityStatus: status }));
    }, []);

    const setSimulatedLightLux = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, lightLux: Math.max(0, Math.min(50000, value)) }));
    }, []);

    const setSimulatedPressure = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, pressure: Math.max(1, Math.min(100, value)) }));
    }, []);

    const setSimulatedBloodOxygen = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, bloodOxygen: Math.max(0, Math.min(100, value)) }));
    }, []);

    const setSimulatedSleepScore = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, sleepScore: Math.max(0, Math.min(100, value)) }));
    }, []);

    const setSimulatedSleepDuration = useCallback((value: number) => {
        setSimulatedData(prev => ({ ...prev, sleepDuration: Math.max(0, value) }));
    }, []);

    // 辅助函数：获取压力等级
    const getPressureLevel = (pressure: number): PressureLevel => {
        if (pressure <= 29) return '放松';
        if (pressure <= 59) return '正常';
        if (pressure <= 79) return '中等';
        return '偏高';
    };

    // 辅助函数：获取睡眠质量
    const getSleepQuality = (score: number): SleepQuality => {
        if (score === 0) return '无数据';
        if (score >= 90) return '优秀';
        if (score >= 80) return '良好';
        if (score >= 60) return '一般';
        return '较差';
    };

    // 辅助函数：获取血氧状态
    const getBloodOxygenStatus = (value: number): BloodOxygenStatus => {
        if (value === 0) return '无数据';
        if (value >= 95) return '正常';
        if (value >= 90) return '偏低';
        return '低氧';
    };

    // 计算最终状态
    const oppoData = oppoHealth.healthState;
    const useOppoData = oppoHealth.isAuthorized && !isDevMode;

    const finalState: HealthState = {
        // 步数数据
        dailySteps: isDevMode ? simulatedData.steps : (useOppoData ? oppoData.dailySteps : 0),
        recentSteps30min: isDevMode ? Math.min(simulatedData.steps, 3000) : 0,
        dailyDistance: useOppoData ? oppoData.dailyDistance : 0,
        dailyCalories: useOppoData ? oppoData.dailyCalories : 0,

        // 心率数据
        heartRate: isDevMode ? simulatedData.heartRate : (useOppoData ? oppoData.currentHeartRate : 75),
        restingHeartRate: useOppoData ? oppoData.restingHeartRate : 65,
        avgHeartRate: useOppoData ? oppoData.avgHeartRate : 75,
        maxHeartRate: useOppoData ? oppoData.maxHeartRate : 0,
        minHeartRate: useOppoData ? oppoData.minHeartRate : 0,

        // 活动状态
        activityStatus: isDevMode
            ? simulatedData.activityStatus
            : (useOppoData && oppoData.isPostWorkout ? 'running' : 'still'),
        isPostWorkout: isPostWorkout || (useOppoData && oppoData.isPostWorkout),
        postWorkoutExpiresAt,

        // 压力数据
        pressureValue: isDevMode ? simulatedData.pressure : (useOppoData ? oppoData.currentPressure : 50),
        avgPressure: useOppoData ? oppoData.avgPressure : 50,
        pressureLevel: getPressureLevel(isDevMode ? simulatedData.pressure : (useOppoData ? oppoData.currentPressure : 50)),

        // 睡眠数据
        lastSleepDuration: isDevMode ? simulatedData.sleepDuration : (useOppoData ? oppoData.lastSleepDuration : 0),
        lastSleepDurationHours: (isDevMode ? simulatedData.sleepDuration : (useOppoData ? oppoData.lastSleepDuration : 0)) / 60,
        lastSleepScore: isDevMode ? simulatedData.sleepScore : (useOppoData ? oppoData.lastSleepScore : 0),
        sleepQuality: getSleepQuality(isDevMode ? simulatedData.sleepScore : (useOppoData ? oppoData.lastSleepScore : 0)),
        lastDeepSleepDuration: useOppoData ? oppoData.lastDeepSleepDuration : 0,
        lastLightSleepDuration: 0, // OPPO SDK中叫 totalLightSleepTime
        lastRemSleepDuration: useOppoData ? oppoData.lastRemSleepDuration : 0,

        // 血氧数据
        bloodOxygen: isDevMode ? simulatedData.bloodOxygen : (useOppoData ? oppoData.currentBloodOxygen : 98),
        avgBloodOxygen: useOppoData ? oppoData.avgBloodOxygen : 98,
        bloodOxygenStatus: getBloodOxygenStatus(isDevMode ? simulatedData.bloodOxygen : (useOppoData ? oppoData.currentBloodOxygen : 98)),

        // 运动记录
        recentWorkoutDuration: useOppoData ? oppoData.recentWorkoutDuration : 0,
        recentWorkoutCalories: useOppoData ? oppoData.recentWorkoutCalories : 0,
        recentWorkoutType: useOppoData ? oppoData.recentWorkoutType : '',
        lastWorkoutTimestamp: useOppoData ? oppoData.lastWorkoutTimestamp : 0,

        // 放松数据
        todayRelaxDuration: useOppoData ? oppoData.todayRelaxDuration : 0,

        // 环境光线：传感器可用时优先用真实数据，否则用模拟值
        lightLux: ambientLight.isAvailable && !isDevMode ? ambientLight.luxValue : simulatedData.lightLux,
        lightLevel: ambientLight.isAvailable && !isDevMode ? ambientLight.lightLevel : luxToLevel(simulatedData.lightLux),

        // 综合评估
        overallHealthStatus: (useOppoData ? oppoData.overallHealthStatus : '无数据') as OverallHealthStatus,
        activityLevel: useOppoData ? oppoData.activityLevel : '无数据',
        needsRest: useOppoData ? oppoData.needsRest : false,
        isWellRested: useOppoData ? oppoData.isWellRested : false,

        // 设备信息
        hasWearableDevice: useOppoData ? oppoData.hasWearableDevice : false,
        deviceType: useOppoData ? oppoData.deviceType : '',

        // 状态标志
        isDevMode,
        isOppoHealthAvailable: oppoHealth.isAvailable,
        isOppoHealthAuthorized: oppoHealth.isAuthorized,
        oppoHealthError: oppoHealth.error,
        isLightSensorAvailable: ambientLight.isAvailable,
        lightSensorError: ambientLight.error,
    };

    const contextValue: HealthContextType = {
        ...finalState,

        // 模拟数据设置
        setSimulatedHeartRate,
        setSimulatedSteps,
        setSimulatedActivityStatus,
        setSimulatedLightLux,
        setSimulatedPressure,
        setSimulatedBloodOxygen,
        setSimulatedSleepScore,
        setSimulatedSleepDuration,

        // 开发者模式控制
        setDevMode: setIsDevMode,

        // 运动状态控制
        triggerPostWorkout,
        resetAllStates,

        // 倒计时
        getRemainingTime,
        getRemainingTimeFormatted,

        // 一键模拟
        simulateJustFinishedWorkout,
        simulateGoodSleep,
        simulateHighStress,
        simulateLowBloodOxygen,

        // OPPO健康操作
        initializeOppoHealth: oppoHealth.initialize,
        requestOppoHealthAuth: oppoHealth.requestAuth,
        refreshOppoHealthData: oppoHealth.refresh,
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
