/**
 * useOppoHealth.ts - OPPO健康数据 Hook
 *
 * 功能：
 * 1. 管理OPPO健康SDK的授权状态
 * 2. 定期获取健康数据
 * 3. 提供综合健康状态
 * 4. 支持手动刷新
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import HeytapHealth, {
    isHeytapHealthAvailable,
    heytapHealthEmitter,
    ComprehensiveHealthState,
    DeviceInfo,
    HeartRateData,
    SleepData,
    PressureData,
    BloodOxygenData,
    SportMetadata,
    DailyActivityData,
} from '../native/HeytapHealthModule';

// 数据刷新间隔 (毫秒)
const REFRESH_INTERVAL = 60 * 1000; // 1分钟

// 默认健康状态
const DEFAULT_HEALTH_STATE: ComprehensiveHealthState = {
    dailySteps: 0,
    dailyDistance: 0,
    dailyCalories: 0,
    currentHeartRate: 75,
    restingHeartRate: 65,
    avgHeartRate: 75,
    maxHeartRate: 0,
    minHeartRate: 0,
    currentPressure: 50,
    avgPressure: 50,
    pressureLevel: '正常',
    lastSleepDuration: 0,
    lastSleepDurationHours: 0,
    lastSleepScore: 0,
    sleepQuality: '无数据',
    lastDeepSleepDuration: 0,
    lastRemSleepDuration: 0,
    currentBloodOxygen: 98,
    avgBloodOxygen: 98,
    bloodOxygenStatus: '正常',
    recentWorkoutDuration: 0,
    recentWorkoutCalories: 0,
    recentWorkoutType: '',
    isPostWorkout: false,
    lastWorkoutTimestamp: 0,
    todayRelaxDuration: 0,
    hasWearableDevice: false,
    deviceType: '',
    overallHealthStatus: '无数据',
    activityLevel: '无数据',
    needsRest: false,
    isWellRested: false,
};

export interface UseOppoHealthResult {
    // SDK状态
    isAvailable: boolean;
    isInitialized: boolean;
    isAuthorized: boolean;
    isLoading: boolean;
    error: string | null;

    // 健康数据
    healthState: ComprehensiveHealthState;
    devices: DeviceInfo[];

    // 详细数据 (可选获取)
    heartRateHistory: HeartRateData[];
    sleepHistory: SleepData[];
    pressureHistory: PressureData[];
    bloodOxygenHistory: BloodOxygenData[];
    sportHistory: SportMetadata[];

    // 操作方法
    initialize: () => Promise<boolean>;
    requestAuth: () => Promise<boolean>;
    revokeAuth: () => Promise<boolean>;
    refresh: () => Promise<void>;
    fetchDetailedData: () => Promise<void>;
}

export const useOppoHealth = (): UseOppoHealthResult => {
    // SDK状态
    const [isAvailable] = useState(() => isHeytapHealthAvailable());
    const [isInitialized, setIsInitialized] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 健康数据
    const [healthState, setHealthState] = useState<ComprehensiveHealthState>(DEFAULT_HEALTH_STATE);
    const [devices, setDevices] = useState<DeviceInfo[]>([]);

    // 详细历史数据
    const [heartRateHistory, setHeartRateHistory] = useState<HeartRateData[]>([]);
    const [sleepHistory, setSleepHistory] = useState<SleepData[]>([]);
    const [pressureHistory, setPressureHistory] = useState<PressureData[]>([]);
    const [bloodOxygenHistory, setBloodOxygenHistory] = useState<BloodOxygenData[]>([]);
    const [sportHistory, setSportHistory] = useState<SportMetadata[]>([]);

    // 刷新定时器
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * 初始化SDK
     */
    const initialize = useCallback(async (): Promise<boolean> => {
        if (!isAvailable) {
            setError('OPPO健康SDK不可用（仅支持Android OPPO设备）');
            return false;
        }

        try {
            setIsLoading(true);
            setError(null);

            // 检查健康APP是否安装
            const appInstalled = await HeytapHealth.isHealthAppInstalled();
            if (!appInstalled) {
                setError('请先安装OPPO健康APP');
                return false;
            }

            // 初始化SDK
            const success = await HeytapHealth.initialize(true);
            if (success) {
                setIsInitialized(true);

                // 检查授权状态
                const authStatus = await HeytapHealth.checkAuthorization();
                setIsAuthorized(authStatus.isAuthorized);

                if (authStatus.isAuthorized) {
                    // 获取设备信息
                    const deviceList = await HeytapHealth.queryBoundDevices();
                    setDevices(deviceList);

                    // 获取健康数据
                    await fetchHealthData();
                }

                console.log('✅ OPPO健康SDK初始化成功');
                return true;
            }
            return false;
        } catch (e: any) {
            console.error('❌ OPPO健康SDK初始化失败:', e);
            setError(e.message || '初始化失败');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isAvailable]);

    /**
     * 请求授权
     */
    const requestAuth = useCallback(async (): Promise<boolean> => {
        if (!isInitialized) {
            setError('请先初始化SDK');
            return false;
        }

        try {
            setIsLoading(true);
            setError(null);

            const result = await HeytapHealth.requestAuthorization();
            if (result.success) {
                setIsAuthorized(true);

                // 获取设备信息
                const deviceList = await HeytapHealth.queryBoundDevices();
                setDevices(deviceList);

                // 获取健康数据
                await fetchHealthData();

                console.log('✅ OPPO健康授权成功');
                return true;
            }
            return false;
        } catch (e: any) {
            console.error('❌ OPPO健康授权失败:', e);
            setError(e.message || '授权失败');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized]);

    /**
     * 取消授权
     */
    const revokeAuth = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoading(true);
            const success = await HeytapHealth.revokeAuthorization();
            if (success) {
                setIsAuthorized(false);
                setHealthState(DEFAULT_HEALTH_STATE);
                setDevices([]);
                console.log('✅ OPPO健康授权已取消');
            }
            return success;
        } catch (e: any) {
            setError(e.message || '取消授权失败');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * 获取健康数据
     */
    const fetchHealthData = useCallback(async () => {
        if (!isAuthorized) return;

        try {
            const state = await HeytapHealth.getComprehensiveHealthState();
            if (state) {
                setHealthState(state);
            }
        } catch (e: any) {
            console.warn('获取健康数据失败:', e);
        }
    }, [isAuthorized]);

    /**
     * 刷新数据
     */
    const refresh = useCallback(async () => {
        if (!isAuthorized) return;

        setIsLoading(true);
        try {
            await fetchHealthData();
        } finally {
            setIsLoading(false);
        }
    }, [isAuthorized, fetchHealthData]);

    /**
     * 获取详细历史数据
     */
    const fetchDetailedData = useCallback(async () => {
        if (!isAuthorized) return;

        setIsLoading(true);
        try {
            const [heartRate, sleep, pressure, bloodOxygen, sport] = await Promise.all([
                HeytapHealth.readHeartRate(7),
                HeytapHealth.readSleep(7),
                HeytapHealth.readPressure(7),
                HeytapHealth.readBloodOxygen(7),
                HeytapHealth.readSportMetadata(7),
            ]);

            setHeartRateHistory(heartRate);
            setSleepHistory(sleep);
            setPressureHistory(pressure);
            setBloodOxygenHistory(bloodOxygen);
            setSportHistory(sport);
        } catch (e: any) {
            console.warn('获取详细数据失败:', e);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthorized]);

    // 自动初始化
    useEffect(() => {
        if (isAvailable && !isInitialized) {
            initialize();
        }
    }, [isAvailable, isInitialized, initialize]);

    // 定期刷新数据
    useEffect(() => {
        if (isAuthorized) {
            refreshTimerRef.current = setInterval(() => {
                fetchHealthData();
            }, REFRESH_INTERVAL);

            return () => {
                if (refreshTimerRef.current) {
                    clearInterval(refreshTimerRef.current);
                }
            };
        }
    }, [isAuthorized, fetchHealthData]);

    // 监听授权事件
    useEffect(() => {
        if (!heytapHealthEmitter) return;

        const authSuccessListener = heytapHealthEmitter.addListener(
            'onAuthSuccess',
            () => {
                setIsAuthorized(true);
                fetchHealthData();
            }
        );

        const authFailureListener = heytapHealthEmitter.addListener(
            'onAuthFailure',
            (event: { errorCode: number; message: string }) => {
                setError(event.message);
            }
        );

        return () => {
            authSuccessListener.remove();
            authFailureListener.remove();
        };
    }, [fetchHealthData]);

    return {
        // SDK状态
        isAvailable,
        isInitialized,
        isAuthorized,
        isLoading,
        error,

        // 健康数据
        healthState,
        devices,

        // 详细数据
        heartRateHistory,
        sleepHistory,
        pressureHistory,
        bloodOxygenHistory,
        sportHistory,

        // 操作方法
        initialize,
        requestAuth,
        revokeAuth,
        refresh,
        fetchDetailedData,
    };
};

export default useOppoHealth;
