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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    overlayTouchable: {
        flex: 1,
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 34,
    },
    topDecoration: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
    },
    iconContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    icon: {
        fontSize: 48,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    recommendBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3e0',
        padding: 14,
        borderRadius: 12,
        marginTop: 20,
    },
    recommendIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    recommendText: {
        flex: 1,
        fontSize: 14,
        color: '#e85a2d',
        fontWeight: '500',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
    },
    tag: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 13,
        color: '#666',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
    },
    buttonRow: {
        marginTop: 24,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#e85a2d',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    linkButton: {
        marginTop: 12,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        color: '#999',
    },
});

export default ActiveRecommendationModal;
