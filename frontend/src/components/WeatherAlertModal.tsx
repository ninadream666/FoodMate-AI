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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    weatherIcon: {
        fontSize: 48,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    recommendationBox: {
        width: '100%',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    recommendationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    recommendationText: {
        fontSize: 13,
        color: '#555',
        lineHeight: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    tag: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 12,
        color: '#1976d2',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    primaryButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 16,
    },
});

export default WeatherAlertModal;
