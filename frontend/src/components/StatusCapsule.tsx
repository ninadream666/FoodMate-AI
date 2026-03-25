/**
 * StatusCapsule.tsx - 状态胶囊组件
 * 
 * 功能：
 * 1. 显示天气状态
 * 2. 显示心率数据
 * 3. 运动后状态高亮
 * 4. 环境光线指示
 * 5. 倒计时显示
 * 6. 连点5次打开开发者面板
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
import { lightLevelIcon, lightLevelLabel } from '../hooks/useAmbientLight';
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

                {/* 分隔符 */}
                <View style={[
                    styles.divider,
                    health.isPostWorkout && styles.dividerActive,
                ]} />

                {/* 环境光线指示 */}
                <View style={styles.lightIndicator}>
                    <Text style={styles.lightIcon}>
                        {lightLevelIcon(health.lightLevel)}
                    </Text>
                    <Text style={styles.lightText}>
                        {lightLevelLabel(health.lightLevel)}
                    </Text>
                </View>

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

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    // 状态胶囊 - 北欧磨砂玻璃效果
    capsule: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        position: 'relative',
    },
    capsuleActive: {
        backgroundColor: colors.primaryBg,
        borderColor: colors.primary,
        borderWidth: 1.5,
        ...shadows.sm,  // 激活状态才有阴影
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
        marginRight: spacing.sm,
    },
    weatherText: {
        fontSize: fontSize.sm,
        color: colors.textPrimary,
        fontWeight: fontWeight.medium,
    },
    activitySection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityIcon: {
        fontSize: 16,
        marginRight: spacing.sm,
    },
    activityText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    activeText: {
        color: colors.primary,
        fontWeight: fontWeight.semibold,
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: colors.border,
        marginHorizontal: spacing.md,
    },
    dividerActive: {
        backgroundColor: colors.primary,
        opacity: 0.4,
    },
    heartSection: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    heartIcon: {
        fontSize: 14,
        marginRight: spacing.xs,
    },
    heartRate: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    heartUnit: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginLeft: 2,
    },
    stepsIndicator: {
        marginLeft: spacing.md,
        backgroundColor: colors.surfaceFrosted,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    stepsText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    lightIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceFrosted,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        marginLeft: spacing.xs,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    lightIcon: {
        fontSize: 12,
        marginRight: 3,
    },
    lightText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    devBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        ...shadows.sm,
    },
    devBadgeText: {
        fontSize: 9,
        color: colors.textOnPrimary,
        fontWeight: fontWeight.bold,
    },
});

export default React.memo(StatusCapsule);
