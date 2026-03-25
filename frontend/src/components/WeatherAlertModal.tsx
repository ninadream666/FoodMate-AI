/**
 * WeatherAlertModal.tsx - 天气感知提醒弹窗
 * 
 * 功能：
 * 1. 恶劣天气时自动提醒
 * 2. 展示配送影响
 * 3. 推荐适合天气的餐食
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { WeatherData } from '../services/weatherService';

interface WeatherAlertModalProps {
    visible: boolean;
    weather: WeatherData | null;
    onClose: () => void;
    onAcceptRecommendation?: () => void;
}

const WeatherAlertModal: React.FC<WeatherAlertModalProps> = ({
    visible,
    weather,
    onClose,
    onAcceptRecommendation,
}) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
        }
    }, [visible, fadeAnim, slideAnim]);

    if (!weather) return null;

    // 根据天气状况生成内容
    const getAlertContent = () => {
        if (weather.isHeavyRain) {
            return {
                icon: '⛈️',
                title: '检测到外面正在下大雨',
                description: '配送可能会受到影响，预计延迟10-20分钟',
                recommendation: '已为您优先筛选：\n• 配送运力充足的商家\n• 包装防水/保温好的商家\n• 距离较近的商家',
                tags: ['🏠 附近优先', '📦 防水包装', '🚀 运力充足'],
                buttonText: '查看推荐',
                severity: 'severe',
            };
        }

        if (weather.isRaining) {
            return {
                icon: '🌧️',
                title: '外面正在下雨',
                description: '配送可能略有延迟',
                recommendation: '已调整推荐策略：\n• 优先显示配送快的商家\n• 推荐热乎乎的美食',
                tags: ['🍜 热食推荐', '⏱️ 快速配送'],
                buttonText: '好的',
                severity: 'moderate',
            };
        }

        if (weather.temperature > 35) {
            return {
                icon: '🥵',
                title: '今天很热',
                description: `当前温度 ${weather.temperature}°C`,
                recommendation: '为您推荐清凉解暑的美食：\n• 冰饮、冷面、沙拉\n• 清淡易消化的餐食',
                tags: ['🧊 冰饮', '🥗 沙拉', '🍜 冷面'],
                buttonText: '看看有什么',
                severity: 'minor',
            };
        }

        if (weather.temperature < 5) {
            return {
                icon: '🥶',
                title: '今天很冷',
                description: `当前温度 ${weather.temperature}°C`,
                recommendation: '为您推荐暖身美食：\n• 火锅、麻辣烫、热汤\n• 热乎乎的主食',
                tags: ['🍲 火锅', '🍜 热汤', '🔥 麻辣'],
                buttonText: '看看有什么',
                severity: 'minor',
            };
        }

        return null;
    };

    const content = getAlertContent();
    if (!content) return null;

    const getSeverityColor = () => {
        switch (content.severity) {
            case 'severe': return '#d32f2f';
            case 'moderate': return '#f57c00';
            case 'minor': return '#1976d2';
            default: return '#388e3c';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Animated.View
                    style={[
                        styles.container,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    {/* 天气图标 */}
                    <View style={[styles.iconContainer, { backgroundColor: getSeverityColor() + '20' }]}>
                        <Text style={styles.weatherIcon}>{content.icon}</Text>
                    </View>

                    {/* 标题 */}
                    <Text style={[styles.title, { color: getSeverityColor() }]}>
                        {content.title}
                    </Text>

                    {/* 描述 */}
                    <Text style={styles.description}>
                        {content.description}
                    </Text>

                    {/* 推荐 */}
                    <View style={styles.recommendationBox}>
                        <Text style={styles.recommendationTitle}>🤖 AI 已自动调整</Text>
                        <Text style={styles.recommendationText}>
                            {content.recommendation}
                        </Text>
                    </View>

                    {/* 标签 */}
                    <View style={styles.tagsContainer}>
                        {content.tags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* 按钮 */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={onClose}
                        >
                            <Text style={styles.secondaryButtonText}>忽略</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: getSeverityColor() }]}
                            onPress={() => {
                                onAcceptRecommendation?.();
                                onClose();
                            }}
                        >
                            <Text style={styles.primaryButtonText}>{content.buttonText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '85%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xxl,
        alignItems: 'center',
        ...shadows.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    weatherIcon: {
        fontSize: 48,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    description: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    recommendationBox: {
        width: '100%',
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    recommendationTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    recommendationText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    tag: {
        backgroundColor: colors.infoBg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    tagText: {
        fontSize: fontSize.sm,
        color: colors.info,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    primaryButton: {
        flex: 2,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    primaryButtonText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    secondaryButtonText: {
        color: colors.textSecondary,
        fontSize: fontSize.lg,
    },
});

export default WeatherAlertModal;
