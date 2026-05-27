/**
 * HeytapHealthModule.ts - OPPO健康SDK TypeScript类型定义和桥接
 *
 * 功能：
 * 1. 定义所有OPPO健康数据的TypeScript类型
 * 2. 封装原生模块调用
 * 3. 提供类型安全的API
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// ==================== 原生模块 ====================

const _module = NativeModules?.HeytapHealthModule;

// 在新架构下 NativeModules 可能返回 Proxy 对象，看起来非 null 但方法调不通
// 通过检查是否有 initialize 方法来验证模块真正可用
const HeytapHealthModule = (Platform.OS === 'android' && _module && typeof _module.initialize === 'function')
    ? _module
    : null;

if (Platform.OS === 'android') {
    console.warn('[HeytapHealthModule] _module:', _module ? 'exists' : 'null',
        'typeof initialize:', _module ? typeof _module.initialize : 'N/A',
        'final:', HeytapHealthModule ? 'available' : 'null');
}

// 检查模块是否可用
export const isHeytapHealthAvailable = (): boolean => {
    return Platform.OS === 'android' && HeytapHealthModule != null;
};

// 事件发射器
export const heytapHealthEmitter = HeytapHealthModule
    ? new NativeEventEmitter(HeytapHealthModule)
    : null;

// ==================== 类型定义 ====================

// 设备信息
export interface DeviceInfo {
    deviceName: string;
    deviceType: number;      // 1=手表, 2=手环, 3=RX手表, 100=体脂秤
    subDeviceType: number;   // 1=ECG版本
    model: string;
    deviceTypeName: string;
}

// 心率数据
export interface HeartRateData {
    timestamp: number;
    heartRate: number;       // 40-220 BPM
}

export interface HeartRateCountData {
    date: number;
    maxHeartRate: number;
    minHeartRate: number;
    avgHeartRate: number;
    restingHeartRate: number;
}

// 每日活动数据
export interface DailyActivityData {
    startTimestamp: number;
    endTimestamp: number;
    steps: number;
    distance: number;        // 米
    calories: number;
}

export interface DailyActivityCountData {
    date: number;
    totalSteps: number;
    totalDistance: number;
    totalCalories: number;
}

// 压力数据
export interface PressureData {
    timestamp: number;
    pressureValue: number;   // 1-100
    pressureLevel: string;   // 放松/正常/中等/偏高
}

export interface PressureCountData {
    date: number;
    maxPressure: number;
    minPressure: number;
    avgPressure: number;
}

// 睡眠数据
export interface SleepData {
    sleepInTime: number;
    sleepOutTime: number;
    totalSleepTime: number;      // 分钟
    totalDeepSleepTime: number;
    totalLightSleepTime: number;
    totalRemSleepTime: number;
    totalWakeTime: number;
    wakeCount: number;
    sleepScore: number;          // 0-100
    sleepDetailJson: string;
    sleepQuality: string;        // 优秀/良好/一般/较差
    sleepDurationHours: number;
}

export interface SleepCountData {
    date: number;
    avgSleepTime: number;
    avgSleepScore: number;
    avgSleepDurationHours: number;
}

// 血氧数据
export interface BloodOxygenData {
    timestamp: number;
    bloodOxygenValue: number;    // 0-100%
    bloodOxygenType: number;     // 0=日常, 1=睡眠, 2=自动间隔, 3=手动, 4=鼾症
    bloodOxygenTypeName: string;
    bloodOxygenStatus: string;   // 正常/偏低/低氧
}

export interface BloodOxygenCountData {
    date: number;
    maxBloodOxygen: number;
    minBloodOxygen: number;
    avgBloodOxygen: number;
}

// 心电数据
export interface EcgData {
    startTimestamp: number;
    endTimestamp: number;
    avgHeartRate: number;
    expertInterpretation: string;
}

// 运动记录数据
export interface SportMetadata {
    startTimestamp: number;
    endTimestamp: number;
    sportMode: number;
    sportModeName: string;
    avgHeartRate: number;
    calories: number;
    duration: number;            // 秒
    durationMinutes: number;
    distance: number;            // 米
    distanceKm: number;
    deviceCategory: string;
}

// 听力健康数据
export interface HearingHealthData {
    timestamp: number;
    hearingValue: number;        // 分贝
    duration: number;            // 秒
    hearingLevel: string;        // 安静/正常/较响/很响/危险
}

// 放松数据
export interface RelaxData {
    timestamp: number;
    type: number;                // -2=全部, 1=呼吸, 2=冥想, 3=游戏
    typeName: string;
    subType: number;
    subTypeName: string;
    pressureValue: number;
    duration: number;            // 秒
    durationMinutes: number;
}

// 综合健康状态
export interface ComprehensiveHealthState {
    // 今日活动
    dailySteps: number;
    dailyDistance: number;
    dailyCalories: number;

    // 心率
    currentHeartRate: number;
    restingHeartRate: number;
    avgHeartRate: number;
    maxHeartRate: number;
    minHeartRate: number;

    // 压力
    currentPressure: number;
    avgPressure: number;
    pressureLevel: string;

    // 睡眠 (昨晚)
    lastSleepDuration: number;       // 分钟
    lastSleepDurationHours: number;
    lastSleepScore: number;
    sleepQuality: string;
    lastDeepSleepDuration: number;
    lastRemSleepDuration: number;

    // 血氧
    currentBloodOxygen: number;
    avgBloodOxygen: number;
    bloodOxygenStatus: string;

    // 运动记录
    recentWorkoutDuration: number;   // 分钟
    recentWorkoutCalories: number;
    recentWorkoutType: string;
    isPostWorkout: boolean;
    lastWorkoutTimestamp: number;

    // 放松
    todayRelaxDuration: number;      // 分钟

    // 设备信息
    hasWearableDevice: boolean;
    deviceType: string;

    // 综合评估
    overallHealthStatus: string;     // 优秀/良好/一般/需关注
    activityLevel: string;           // 活跃/适中/轻度/久坐
    needsRest: boolean;
    isWellRested: boolean;
}

// 授权结果
export interface AuthResult {
    success: boolean;
}

export interface AuthStatus {
    isAuthorized: boolean;
    scopes: string[];
}

// 用户信息
export interface UserInfo {
    openId?: string;
}

// ==================== API封装 ====================

/**
 * OPPO健康SDK API
 */
export const HeytapHealth = {
    /**
     * 初始化SDK
     */
    initialize: async (enableLogging: boolean = false): Promise<boolean> => {
        if (!isHeytapHealthAvailable()) {
            console.warn('HeytapHealth SDK not available on this platform');
            return false;
        }
        return HeytapHealthModule.initialize(enableLogging);
    },

    /**
     * 检查健康APP是否安装
     */
    isHealthAppInstalled: async (): Promise<boolean> => {
        if (!isHeytapHealthAvailable()) return false;
        return HeytapHealthModule.isHealthAppInstalled();
    },

    /**
     * 下载健康APP
     */
    downloadHealthApp: (): void => {
        if (!isHeytapHealthAvailable()) return;
        HeytapHealthModule.downloadHealthApp();
    },

    /**
     * 请求授权
     */
    requestAuthorization: async (): Promise<AuthResult> => {
        if (!isHeytapHealthAvailable()) {
            throw new Error('HeytapHealth SDK not available');
        }
        return HeytapHealthModule.requestAuthorization();
    },

    /**
     * 检查授权状态
     */
    checkAuthorization: async (): Promise<AuthStatus> => {
        if (!isHeytapHealthAvailable()) {
            return { isAuthorized: false, scopes: [] };
        }
        return HeytapHealthModule.checkAuthorization();
    },

    /**
     * 取消授权
     */
    revokeAuthorization: async (): Promise<boolean> => {
        if (!isHeytapHealthAvailable()) return false;
        return HeytapHealthModule.revokeAuthorization();
    },

    /**
     * 获取用户信息
     */
    getUserInfo: async (): Promise<UserInfo> => {
        if (!isHeytapHealthAvailable()) return {};
        return HeytapHealthModule.getUserInfo();
    },

    /**
     * 查询绑定设备
     */
    queryBoundDevices: async (): Promise<DeviceInfo[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.queryBoundDevices();
    },

    // ========== 数据读取 ==========

    /**
     * 读取心率数据
     */
    readHeartRate: async (days: number = 1): Promise<HeartRateData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readHeartRate(days);
    },

    /**
     * 读取心率统计数据
     */
    readHeartRateCount: async (days: number = 7): Promise<HeartRateCountData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readHeartRateCount(days);
    },

    /**
     * 读取今日活动数据
     */
    readDailyActivity: async (): Promise<DailyActivityData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readDailyActivity();
    },

    /**
     * 读取每日活动统计数据
     */
    readDailyActivityCount: async (days: number = 7): Promise<DailyActivityCountData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readDailyActivityCount(days);
    },

    /**
     * 读取压力数据
     */
    readPressure: async (days: number = 1): Promise<PressureData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readPressure(days);
    },

    /**
     * 读取压力统计数据
     */
    readPressureCount: async (days: number = 7): Promise<PressureCountData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readPressureCount(days);
    },

    /**
     * 读取睡眠数据
     */
    readSleep: async (days: number = 7): Promise<SleepData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readSleep(days);
    },

    /**
     * 读取睡眠统计数据
     */
    readSleepCount: async (days: number = 7): Promise<SleepCountData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readSleepCount(days);
    },

    /**
     * 读取血氧数据
     */
    readBloodOxygen: async (days: number = 1): Promise<BloodOxygenData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readBloodOxygen(days);
    },

    /**
     * 读取血氧统计数据
     */
    readBloodOxygenCount: async (days: number = 7): Promise<BloodOxygenCountData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readBloodOxygenCount(days);
    },

    /**
     * 读取心电数据
     */
    readEcg: async (days: number = 7): Promise<EcgData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readEcg(days);
    },

    /**
     * 读取运动记录数据
     */
    readSportMetadata: async (days: number = 7): Promise<SportMetadata[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readSportMetadata(days);
    },

    /**
     * 读取听力健康数据
     */
    readHearingHealth: async (days: number = 7): Promise<HearingHealthData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readHearingHealth(days);
    },

    /**
     * 读取放松数据
     */
    readRelax: async (days: number = 7): Promise<RelaxData[]> => {
        if (!isHeytapHealthAvailable()) return [];
        return HeytapHealthModule.readRelax(days);
    },

    /**
     * 获取综合健康状态（一次性获取所有数据）
     */
    getComprehensiveHealthState: async (): Promise<ComprehensiveHealthState | null> => {
        if (!isHeytapHealthAvailable()) return null;
        return HeytapHealthModule.getComprehensiveHealthState();
    },
};

export default HeytapHealth;
