/**
 * useAmbientLight.ts - 环境光传感器 Hook
 *
 * 功能：
 * 1. 通过 react-native-ambient-light-sensor 读取手机光线传感器 (lux)
 * 2. 根据 lux 值自动分级 (dark/dim/normal/bright/sunlight)
 * 3. 移动平均平滑，避免频繁跳动
 * 4. 仅 Android 支持，iOS 和不支持设备优雅降级
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';

// 光线等级类型
export type LightLevel = 'dark' | 'dim' | 'normal' | 'bright' | 'sunlight';

// lux 分级阈值
const LIGHT_THRESHOLDS: { max: number; level: LightLevel }[] = [
    { max: 50, level: 'dark' },          // 暗光 / 夜间
    { max: 200, level: 'dim' },          // 昏暗室内
    { max: 1000, level: 'normal' },      // 正常室内照明
    { max: 10000, level: 'bright' },     // 户外阴天 / 明亮室内
    { max: Infinity, level: 'sunlight' }, // 户外强烈日照
];

// 尝试导入 react-native-ambient-light-sensor
let AmbientLightSensor: {
    hasLightSensor: () => Promise<boolean>;
    startLightSensor: () => void;
    stopLightSensor: () => void;
} | null = null;

try {
    AmbientLightSensor = require('react-native-ambient-light-sensor');
} catch (e) {
    console.warn('react-native-ambient-light-sensor 未安装，环境光将使用默认值');
}

export interface AmbientLightState {
    luxValue: number;
    lightLevel: LightLevel;
    isAvailable: boolean;
    error: string | null;
}

// lux → 等级
export function luxToLevel(lux: number): LightLevel {
    for (const t of LIGHT_THRESHOLDS) {
        if (lux < t.max) return t.level;
    }
    return 'normal';
}

// 等级 → 图标
export function lightLevelIcon(level: LightLevel): string {
    const map: Record<LightLevel, string> = {
        dark: '🌙',
        dim: '🌑',
        normal: '💡',
        bright: '🌤️',
        sunlight: '☀️',
    };
    return map[level] || '💡';
}

// 等级 → 中文标签
export function lightLevelLabel(level: LightLevel): string {
    const map: Record<LightLevel, string> = {
        dark: '暗光',
        dim: '昏暗',
        normal: '室内',
        bright: '户外',
        sunlight: '强光',
    };
    return map[level] || '正常';
}

const SMOOTHING_WINDOW = 5; // 移动平均窗口

export const useAmbientLight = () => {
    const [state, setState] = useState<AmbientLightState>({
        luxValue: 300,
        lightLevel: 'normal',
        isAvailable: false,
        error: null,
    });

    const historyRef = useRef<number[]>([]);

    const getSmoothedLux = useCallback((newLux: number): number => {
        historyRef.current.push(newLux);
        if (historyRef.current.length > SMOOTHING_WINDOW) {
            historyRef.current.shift();
        }
        const sum = historyRef.current.reduce((a, b) => a + b, 0);
        return Math.round(sum / historyRef.current.length);
    }, []);

    useEffect(() => {
        // iOS 不支持光线传感器
        if (Platform.OS === 'ios') {
            setState(prev => ({
                ...prev,
                isAvailable: false,
                error: 'iOS 不支持光线传感器',
            }));
            return;
        }

        if (!AmbientLightSensor) {
            setState(prev => ({
                ...prev,
                isAvailable: false,
                error: '光线传感器模块不可用',
            }));
            return;
        }

        let isActive = true;

        const setup = async () => {
            try {
                const hasSensor = await AmbientLightSensor!.hasLightSensor();
                if (!hasSensor || !isActive) {
                    setState(prev => ({
                        ...prev,
                        isAvailable: false,
                        error: '设备没有光线传感器',
                    }));
                    return;
                }

                // 启动传感器
                AmbientLightSensor!.startLightSensor();

                setState(prev => ({ ...prev, isAvailable: true, error: null }));

                // 监听光线数据事件
                DeviceEventEmitter.addListener('LightSensor', (data: { lightValue: number }) => {
                    if (!isActive) return;
                    const rawLux = Math.max(0, Math.min(100000, data.lightValue));
                    const smoothed = getSmoothedLux(rawLux);

                    setState({
                        luxValue: smoothed,
                        lightLevel: luxToLevel(smoothed),
                        isAvailable: true,
                        error: null,
                    });
                });
            } catch (e: any) {
                console.warn('光线传感器初始化失败:', e);
                setState(prev => ({
                    ...prev,
                    isAvailable: false,
                    error: '传感器初始化失败',
                }));
            }
        };

        setup();

        return () => {
            isActive = false;
            DeviceEventEmitter.removeAllListeners('LightSensor');
            try {
                AmbientLightSensor?.stopLightSensor();
            } catch (e) {
                // ignore cleanup errors
            }
        };
    }, [getSmoothedLux]);

    return state;
};

export default useAmbientLight;
