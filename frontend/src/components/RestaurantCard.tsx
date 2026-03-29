// src/components/RestaurantCard.tsx
// 北欧风格磨砂卡片设计 - 使用优化的图片组件
import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';
import OptimizedImage from './OptimizedImage';

// 默认图片列表（已简化 URL）
const defaultImages = [
    'https://loremflickr.com/400/300/food,restaurant',
    'https://loremflickr.com/400/300/dish,cuisine',
    'https://loremflickr.com/400/300/meal,dinner',
];

interface Props {
    restaurant: any;
    onPress: (restaurant: any) => void;
}

const RestaurantCard = memo(({ restaurant, onPress }: Props) => {
    // 数据处理
    const name = restaurant.name || '未知餐厅';

    // 图片处理：使用 useMemo 避免每次渲染都计算随机图片
    const imageUrl = useMemo(() => {
        const url = restaurant.image || restaurant.imageUrl || restaurant.features?.image || '';
        if (!url || url.includes('unsplash.com')) {
            return defaultImages[Math.floor(Math.random() * defaultImages.length)];
        }
        return url;
    }, [restaurant.image, restaurant.imageUrl, restaurant.features?.image]);

    // AI评分：优先使用后端返回的 score（60-100），final_score，最后默认85
    // 后端 DecisionAgent 返回的 score 已经是 60-100 范围
    let rawScore = restaurant.score || restaurant.final_score || 85;
    // 如果 score 是 0-1 范围的小数，转换为 60-100 范围
    const score = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

    const rating = restaurant.rating || (restaurant.features?.rating) || 4.5;
    const deliveryTime = restaurant.deliveryTime || restaurant.estimated_delivery_time || (restaurant.features?.delivery_time) || '30分钟';
    const distance = restaurant.distance || (restaurant.features?.distance);
    const distanceDisplay = distance ? `${(distance / 1000).toFixed(1)}km` : '1.2km';

    // AI推荐理由：后端返回的是 reason 字段（在 recommendations 数组每个item里）
    // 优先级: reason > recommendation_reason > match_reasons[0] > description
    const recommendationReason = restaurant.reason
        || restaurant.recommendation_reason
        || (restaurant.match_reasons && restaurant.match_reasons.length > 0 ? restaurant.match_reasons[0] : null)
        || restaurant.description
        || null;

    // 根据评分获取颜色
    const getScoreColor = (s: number) => {
        if (s >= 90) return '#22c55e'; // 绿色 - 优秀
        if (s >= 80) return '#f59e0b'; // 橙色 - 良好
        if (s >= 70) return '#ef4444'; // 红色 - 一般
        return '#6b7280'; // 灰色 - 较低
    };

    // 获取评分背景色（北欧风格柔和色调）
    const getScoreBgColor = (s: number) => {
        if (s >= 90) return colors.successBg;
        if (s >= 80) return colors.warningBg;
        if (s >= 70) return colors.primaryBg;
        return colors.surfaceFrosted;
    };

    // 获取评分文字色
    const getScoreTextColor = (s: number) => {
        if (s >= 90) return colors.success;
        if (s >= 80) return colors.warning;
        if (s >= 70) return colors.primary;
        return colors.textSecondary;
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(restaurant)}
            activeOpacity={0.85}
        >
            {/* 顶部图片区域 - 使用优化的图片组件 */}
            <View style={styles.imageContainer}>
                <OptimizedImage
                    uri={imageUrl}
                    width={400}
                    style={styles.image}
                    priority="normal"
                    fallbackUri={defaultImages[0]}
                />
                {/* 评分角标 - 磨砂玻璃效果 */}
                <View style={[styles.scoreBadge, { backgroundColor: getScoreBgColor(score) }]}>
                    <Text style={[styles.scoreText, { color: getScoreTextColor(score) }]}>
                        {Math.round(score)}分
                    </Text>
                </View>
            </View>

            {/* 底部信息区域 */}
            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>

                <View style={styles.metaRow}>
                    <Text style={styles.ratingText}>
                        {typeof rating === 'number' ? rating.toFixed(1) : rating}
                    </Text>
                    <Text style={styles.metaText}>
                        {typeof deliveryTime === 'number' ? `${deliveryTime}分钟` : deliveryTime}
                    </Text>
                    <Text style={styles.metaText}>{distanceDisplay}</Text>
                    {/* 免费配送标签 */}
                    {restaurant.freeDelivery && (
                        <View style={styles.deliveryTag}>
                            <Text style={styles.deliveryTagText}>免配送费</Text>
                        </View>
                    )}
                </View>

                {/* 推荐理由 - 北欧风格磨砂卡片 */}
                {recommendationReason ? (
                    <View style={styles.reasonContainer}>
                        <Text style={styles.reasonText} numberOfLines={2}>
                            {recommendationReason}
                        </Text>
                    </View>
                ) : null}
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    // 磨砂卡片（Image3 风格）- 可点击元素带阴影（Image2 原则）
    card: {
        backgroundColor: colors.cardBgSolid,
        borderRadius: borderRadius.xxl,
        marginBottom: spacing.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.card,
    },
    imageContainer: {
        height: 168,
        width: '100%',
        position: 'relative',
        backgroundColor: colors.backgroundGradientEnd,
        borderTopLeftRadius: borderRadius.xxl,
        borderTopRightRadius: borderRadius.xxl,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    // 评分角标 - 磨砂玻璃效果（Image3）
    scoreBadge: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: colors.frostedBgStrong,
        borderWidth: 1,
        borderColor: colors.frostedBorder,
    },
    scoreText: {
        color: colors.textPrimary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.sm,
    },
    infoContainer: {
        padding: spacing.lg,
        backgroundColor: colors.surface,
    },
    name: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    ratingText: {
        color: colors.warning,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.md,
    },
    metaText: {
        color: colors.textTertiary,
        fontSize: fontSize.sm,
    },
    // 配送标签 - 柔和绿色胶囊
    deliveryTag: {
        backgroundColor: colors.successBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    deliveryTagText: {
        color: colors.secondary,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
    },
    // AI推荐理由 - 柔和磨砂底
    reasonContainer: {
        backgroundColor: colors.primarySoft,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    reasonText: {
        color: colors.primaryDark,
        fontSize: fontSize.sm,
        lineHeight: 20,
        fontWeight: fontWeight.medium,
    },
});

export default RestaurantCard;