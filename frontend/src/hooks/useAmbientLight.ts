/**
 * useAmbientLight.ts - 环境光传感器 Hook
 *
 * 功能：
 * 1. 读取手机环境光传感器 (lux)
 * 2. 根据 lux 值自动分级
 * 3. 300ms 节流 + 移动平均平滑
 * 4. 设备不支持时优雅降级
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

// 光线等级类型
export type LightLevel = 'dark' | 'dim' | 'normal' | 'bright' | 'sunlight';

// lux 分级阈值
const LIGHT_THRESHOLDS: { max: number; level: LightLevel }[] = [
    { max: 50, level: 'dark' },       // 暗光 / 夜间
    { max: 200, level: 'dim' },       // 昏暗室内
    { max: 1000, level: 'normal' },   // 正常室内照明
    { max: 10000, level: 'bright' },  // 户外阴天 / 明亮室内
    { max: Infinity, level: 'sunlight' }, // 户外强烈日照
];

// 尝试导入 react-native-sensors
let lightSensor: any = null;
try {
    const sensors = require('react-native-sensors');
    lightSensor = sensors.lightSensor;
} catch (e) {
    console.warn('react-native-sensors 未安装或不可用，环境光将使用默认值');
}

export interface AmbientLightState {
    luxValue: number;           // 原始 lux 值
    lightLevel: LightLevel;     // 分级
    isAvailable: boolean;       // 传感器是否可用
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
const THROTTLE_MS = 300;    // 采样节流

export const useAmbientLight = () => {
    const [state, setState] = useState<AmbientLightState>({
        luxValue: 300,       // 默认室内照明
        lightLevel: 'normal',
        isAvailable: false,
        error: null,
    });

    const historyRef = useRef<number[]>([]);
    const lastUpdateRef = useRef(0);
    const subscriptionRef = useRef<any>(null);

    // 计算移动平均
    const getSmoothedLux = useCallback((newLux: number): number => {
        historyRef.current.push(newLux);
        if (historyRef.current.length > SMOOTHING_WINDOW) {
            historyRef.current.shift();
        }
        const sum = historyRef.current.reduce((a, b) => a + b, 0);
        return Math.round(sum / historyRef.current.length);
    }, []);

    useEffect(() => {
        if (!lightSensor) {
            setState(prev => ({
                ...prev,
                isAvailable: false,
                error: '环境光传感器不可用',
            }));
            return;
        }

        // iOS 不直接暴露 light sensor API
        if (Platform.OS === 'ios') {
            setState(prev => ({
                ...prev,
                isAvailable: false,
                error: 'iOS 不支持直接访问光传感器',
            }));
            return;
        }

        try {
            subscriptionRef.current = lightSensor({
                updateInterval: THROTTLE_MS,
            }).subscribe(
                (data: { light: number }) => {
                    const now = Date.now();
                    if (now - lastUpdateRef.current < THROTTLE_MS) return;
                    lastUpdateRef.current = now;

                    // 钳位到合理范围
                    const rawLux = Math.max(0, Math.min(100000, data.light));
                    const smoothed = getSmoothedLux(rawLux);

                    setState({
                        luxValue: smoothed,
                        lightLevel: luxToLevel(smoothed),
                        isAvailable: true,
                        error: null,
                    });
                },
                (error: any) => {
                    console.warn('环境光传感器错误:', error);
                    setState(prev => ({
                        ...prev,
                        isAvailable: false,
                        error: '传感器读取失败',
                    }));
                }
            );
        } catch (e) {
            setState(prev => ({
                ...prev,
                isAvailable: false,
                error: '传感器初始化失败',
            }));
        }

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, [getSmoothedLux]);

    return state;
};

export default useAmbientLight;
