// src/components/RestaurantCard.tsx
// 北欧风格磨砂卡片设计
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

// 默认图片列表
const defaultImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCGKHZQTlEYMaCX_XakByf8YPtBpJu1JbiVmEUPUCftM6tNzRyVbyE8f3B93zfHC9IU6yuQTSyRLBwyjZOCyKcwArw8BWvTd4ICz9hLoegZzezmIpMj--IQrqYL1y-5FBJynhYgrMIvAfx3LqT7MIWUdjd7Nu_4HG_yixaPWLbcv1JbV57XSLtFufazLCDmtIKU75l2djE7H-Nq9jmcWSE8nmdeV86n26tJOAArQksQID-q6YqfTF9XDOT1m_wGyrA7EwCx7fuiaXiY',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB5D4cVHmUDvJBFBae0uRhUP2dGh034P4yT1eXX7DXI4o99VrjQvf4MyLRT7aKUrxV54tTmh4MHx4I-X2mx6IEMJCfj1_NM79LlXeoR1Ee02k9qtFgtXO1cm08DggVsalQnB2CZqt-J4XXrJMmQ6pxAU5vP5aC6ex7wgrNJ8HvZ3KJUmpRzlteclmYitmPZbzJlaA4fMdJcy_dwxhnxl78edH5ei5fvuo9Z-pX4CemlX9S32hkNNtUv4BCGkEPSL35LhioStzX-N-wY',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCRbRdtVr5x0wXS2eSK0WUNXjC-oxYSdvonWoNS-5Wj0qxtMrWgGUrHVLAigY4VfoOEj86XuQevuNcn6UVpNGy8n2p9uwiZr-1MDiI3xmweY99OYdsgUJFW4tInlg6E3xKTLOd4TUg0NGHnXSgUaF53YIhvEh-Gb_RVHKFa1fpH_2zjYdMS6ZMSyJc4sfJ0et0OMUuC1WpzaJtHkk8Y96pTTJsdxQoIoVbuPJ_FkYGR1vlN4qp1zXjSC-2PWHG91LimkY47Gf8UwrIw',
];

interface Props {
    restaurant: any;
    onPress: (restaurant: any) => void;
}

const RestaurantCard = ({ restaurant, onPress }: Props) => {
    // 数据处理
    const name = restaurant.name || '未知餐厅';
    // 图片处理：优先用 API 返回的，包括 features 里的 image，没有就随机选一个默认图
    const imageUrl = restaurant.image || restaurant.imageUrl || restaurant.features?.image || defaultImages[Math.floor(Math.random() * defaultImages.length)];

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
            {/* 顶部图片区域 - 圆角裁剪 */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
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
};

const styles = StyleSheet.create({
    // 北欧风磨砂卡片 - 参考图片3的设计
    card: {
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.card,  // 可点击元素才有阴影
    },
    imageContainer: {
        height: 160,
        width: '100%',
        position: 'relative',
        backgroundColor: colors.backgroundGradientEnd,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    // 评分角标 - 磨砂玻璃效果
    scoreBadge: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
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
    },
    ratingText: {
        color: colors.warning,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.md,
    },
    metaText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        marginLeft: spacing.sm,
    },
    // 配送标签 - 北欧柔和绿色
    deliveryTag: {
        backgroundColor: colors.successBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        marginLeft: spacing.sm,
    },
    deliveryTagText: {
        color: colors.secondary,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
    },
    // AI推荐理由容器 - 柔和的磨砂效果
    reasonContainer: {
        backgroundColor: colors.primaryBg,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.frostedBorder,
    },
    reasonText: {
        color: colors.primary,
        fontSize: fontSize.sm,
        lineHeight: 20,
        fontWeight: fontWeight.medium,
    },
});

export default RestaurantCard;