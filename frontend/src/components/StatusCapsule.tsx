/**
 * StatusCapsule.tsx - 状态胶囊组件
 * 
 * 功能：
 * 1. 显示天气状态
 * 2. 显示心率数据
 * 3. 运动后状态高亮
 * 4. 倒计时显示
 * 5. 连点5次打开开发者面板
 * 
 * 设计：类似"灵动岛"风格的状态胶囊
 */

import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { useHealthContext } from '../hooks/useHealthContext';
import DevModePanel from './DevModePanel';

interface StatusCapsuleProps {
    weather?: {
        condition: string;
        temperature: number;
    };
    onPress?: () => void;
}

const StatusCapsule: React.FC<StatusCapsuleProps> = ({
    weather = { condition: '晴', temperature: 25 },
    onPress,
}) => {
    const health = useHealthContext();
    const [pulseAnim] = useState(new Animated.Value(1));

    // 开发者面板状态
    const [devPanelVisible, setDevPanelVisible] = useState(false);
    const tapCountRef = useRef(0);
    const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 处理点击（5次连点打开开发者面板）
    const handlePress = () => {
        tapCountRef.current += 1;

        // 清除之前的计时器
        if (tapTimerRef.current) {
            clearTimeout(tapTimerRef.current);
        }

        if (tapCountRef.current >= 5) {
            setDevPanelVisible(true);
            tapCountRef.current = 0;
        } else {
            // 2秒后重置计数
            tapTimerRef.current = setTimeout(() => {
                tapCountRef.current = 0;
            }, 2000);
        }

        // 调用外部 onPress
        onPress?.();
    };

    // 心跳动画（运动后状态时）
    useEffect(() => {
        if (health.isPostWorkout) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [health.isPostWorkout, pulseAnim]);

    // 获取天气图标
    const getWeatherIcon = (condition: string) => {
        const iconMap: Record<string, string> = {
            '晴': '☀️',
            '晴天': '☀️',
            '多云': '⛅',
            '阴': '☁️',
            '阴天': '☁️',
            '小雨': '🌧️',
            '中雨': '🌧️',
            '大雨': '🌧️',
            '暴雨': '⛈️',
            '雷阵雨': '⛈️',
            '小雪': '🌨️',
            '大雪': '❄️',
            '雾': '🌫️',
        };
        return iconMap[condition] || '🌤️';
    };

    // 获取心率颜色
    const getHeartRateColor = (hr: number) => {
        if (hr < 60) return '#2196F3'; // 偏低 - 蓝色
        if (hr < 100) return '#4CAF50'; // 正常 - 绿色
        if (hr < 140) return '#FF9800'; // 中度 - 橙色
        return '#F44336'; // 高强度 - 红色
    };

    // 获取活动状态文本
    const getActivityText = () => {
        if (health.isPostWorkout) {
            return `运动恢复中 (${health.getRemainingTimeFormatted()})`;
        }

        const statusMap: Record<string, string> = {
            'still': '休息中',
            'walking': '步行中',
            'running': '跑步中',
            'cycling': '骑行中',
        };
        return statusMap[health.activityStatus] || '休息中';
    };

    // 获取活动图标
    const getActivityIcon = () => {
        if (health.isPostWorkout) return '🏃‍♂️';

        const iconMap: Record<string, string> = {
            'still': '🧘',
            'walking': '🚶',
            'running': '🏃',
            'cycling': '🚴',
        };
        return iconMap[health.activityStatus] || '🧘';
    };

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.capsule,
                    health.isPostWorkout && styles.capsuleActive,
                ]}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                {/* 左侧：天气或运动状态 */}
                <View style={styles.section}>
                    {health.isPostWorkout ? (
                        // 运动后显示活动状态
                        <Animated.View
                            style={[
                                styles.activitySection,
                                { transform: [{ scale: pulseAnim }] },
                            ]}
                        >
                            <Text style={styles.activityIcon}>{getActivityIcon()}</Text>
                            <Text style={[styles.activityText, styles.activeText]}>
                                {getActivityText()}
                            </Text>
                        </Animated.View>
                    ) : (
                        // 正常显示天气
                        <View style={styles.weatherSection}>
                            <Text style={styles.weatherIcon}>
                                {getWeatherIcon(weather.condition)}
                            </Text>
                            <Text style={styles.weatherText}>
                                {weather.condition} {weather.temperature}°C
                            </Text>
                        </View>
                    )}
                </View>

                {/* 分隔符 */}
                <View style={[
                    styles.divider,
                    health.isPostWorkout && styles.dividerActive,
                ]} />

                {/* 右侧：心率 */}
                <Animated.View
                    style={[
                        styles.section,
                        styles.heartSection,
                        { transform: [{ scale: health.isPostWorkout ? pulseAnim : 1 }] },
                    ]}
                >
                    <Text style={styles.heartIcon}>❤️</Text>
                    <Text style={[
                        styles.heartRate,
                        { color: getHeartRateColor(health.heartRate) },
                    ]}>
                        {health.heartRate}
                    </Text>
                    <Text style={styles.heartUnit}>bpm</Text>
                </Animated.View>

                {/* 步数指示器（小）*/}
                {health.dailySteps > 0 && (
                    <View style={styles.stepsIndicator}>
                        <Text style={styles.stepsText}>
                            👟 {health.dailySteps.toLocaleString()}
                        </Text>
                    </View>
                )}

                {/* 开发者模式标记 */}
                {health.isDevMode && (
                    <View style={styles.devBadge}>
                        <Text style={styles.devBadgeText}>DEV</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* 开发者面板（连点5次打开） */}
            <DevModePanel
                visible={devPanelVisible}
                onClose={() => setDevPanelVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    capsule: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
        position: 'relative',
    },
    capsuleActive: {
        backgroundColor: '#fff3e0',
        borderColor: '#e85a2d',
        borderWidth: 1.5,
    },
    section: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weatherSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weatherIcon: {
        fontSize: 18,
        marginRight: 6,
    },
    weatherText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    activitySection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    activityText: {
        fontSize: 13,
        color: '#666',
    },
    activeText: {
        color: '#e85a2d',
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: '#ddd',
        marginHorizontal: 12,
    },
    dividerActive: {
        backgroundColor: '#e85a2d',
        opacity: 0.5,
    },
    heartSection: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    heartIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    heartRate: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    heartUnit: {
        fontSize: 11,
        color: '#999',
        marginLeft: 2,
    },
    stepsIndicator: {
        marginLeft: 12,
        backgroundColor: '#e9ecef',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    stepsText: {
        fontSize: 11,
        color: '#666',
    },
    devBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#e85a2d',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    devBadgeText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default React.memo(StatusCapsule);
