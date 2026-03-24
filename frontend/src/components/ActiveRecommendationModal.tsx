/**
 * ActiveRecommendationModal.tsx - 主动推荐弹窗
 * 
 * 功能：
 * 1. 运动结束后自动弹出
 * 2. 展示个性化推荐理由
 * 3. 推荐运动后恢复餐食
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { useHealthContext } from '../hooks/useHealthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActiveRecommendationModalProps {
    visible: boolean;
    onClose: () => void;
    onViewRecommendations?: () => void;
}

const ActiveRecommendationModal: React.FC<ActiveRecommendationModalProps> = ({
    visible,
    onClose,
    onViewRecommendations,
}) => {
    const health = useHealthContext();
    const [slideAnim] = useState(new Animated.Value(0));
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            slideAnim.setValue(0);
            fadeAnim.setValue(0);
        }
    }, [visible, slideAnim, fadeAnim]);

    // 根据运动强度生成推荐理由
    const getRecommendationReason = () => {
        const { heartRate, dailySteps, recentSteps30min } = health;

        if (heartRate > 140 || recentSteps30min > 2000) {
            return {
                title: '🏃 运动结束了',
                subtitle: `检测到您刚结束30分钟高强度跑步（心率 ${heartRate} bpm，步数 ${dailySteps}）`,
                recommendation: '为您推荐高蛋白、修复肌肉的轻食套餐，预计30分钟送达',
                tags: ['🥗 低脂轻食', '🥚 高蛋白', '💪 肌肉修复', '🚀 30分钟达'],
            };
        }

        if (heartRate > 100 || recentSteps30min > 1000) {
            return {
                title: '🚶 检测到中等强度运动',
                subtitle: `您刚刚完成了一次有氧运动（${recentSteps30min} 步）`,
                recommendation: '为您推荐均衡营养的健康餐',
                tags: ['🥗 均衡营养', '🍚 能量补充', '💧 补水'],
            };
        }

        return {
            title: '👋 运动后恢复',
            subtitle: '适当补充营养有助于恢复',
            recommendation: '为您推荐适合的餐食',
            tags: ['🥗 健康轻食', '🍵 养生', '🥤 清爽'],
        };
    };

    const recommendation = getRecommendationReason();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={styles.overlayTouchable}
                    onPress={onClose}
                    activeOpacity={1}
                />

                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [{
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [300, 0],
                                }),
                            }],
                        },
                    ]}
                >
                    {/* 顶部装饰 */}
                    <View style={styles.topDecoration}>
                        <View style={styles.handle} />
                    </View>

                    {/* 图标 */}
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🎉</Text>
                    </View>

                    {/* 标题 */}
                    <Text style={styles.title}>{recommendation.title}</Text>
                    <Text style={styles.subtitle}>{recommendation.subtitle}</Text>

                    {/* 推荐说明 */}
                    <View style={styles.recommendBox}>
                        <Text style={styles.recommendIcon}>💡</Text>
                        <Text style={styles.recommendText}>
                            {recommendation.recommendation}
                        </Text>
                    </View>

                    {/* 标签 */}
                    <View style={styles.tagsContainer}>
                        {recommendation.tags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* 数据卡片 */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>❤️ {health.heartRate}</Text>
                            <Text style={styles.statLabel}>心率 bpm</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>👟 {health.dailySteps}</Text>
                            <Text style={styles.statLabel}>今日步数</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>🔥 {Math.round(health.dailySteps * 0.04)}</Text>
                            <Text style={styles.statLabel}>消耗 kcal</Text>
                        </View>
                    </View>

                    {/* 按钮 */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={() => {
                                onViewRecommendations?.();
                                onClose();
                            }}
                        >
                            <Text style={styles.primaryButtonText}>
                                🍽️ 查看推荐餐食
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.linkButton} onPress={onClose}>
                        <Text style={styles.linkText}>稍后再说</Text>
                    </TouchableOpacity>
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
        justifyContent: 'flex-end',
    },
    overlayTouchable: {
        flex: 1,
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xxl,
        borderTopRightRadius: borderRadius.xxl,
        paddingHorizontal: spacing.xl,
        paddingBottom: 34,
    },
    topDecoration: {
        alignItems: 'center',
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: borderRadius.xs,
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: spacing.md,
    },
    icon: {
        fontSize: 48,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    recommendBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryBg,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginTop: spacing.xl,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    recommendIcon: {
        fontSize: 20,
        marginRight: spacing.md,
    },
    recommendText: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: fontWeight.medium,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    tag: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tagText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xl,
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.cardBg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    statValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    statLabel: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
    buttonRow: {
        marginTop: spacing.xxl,
    },
    button: {
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: colors.primary,
        ...shadows.primary,
    },
    primaryButtonText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.textOnPrimary,
    },
    linkButton: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    linkText: {
        fontSize: fontSize.md,
        color: colors.textTertiary,
    },
});

export default ActiveRecommendationModal;
