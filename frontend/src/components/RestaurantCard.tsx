// src/components/RestaurantCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

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

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(restaurant)}
            activeOpacity={0.8}
        >
            {/* 顶部图片区域 */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                />
                {/* 评分角标 - 使用动态颜色 */}
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score) }]}>
                    <Text style={styles.scoreText}>{Math.round(score)}分</Text>
                </View>
            </View>

            {/* 底部信息区域 */}
            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>

                <View style={styles.metaRow}>
                    <Text style={styles.ratingText}>⭐ {typeof rating === 'number' ? rating.toFixed(1) : rating}</Text>
                    <Text style={styles.metaText}> • {typeof deliveryTime === 'number' ? `${deliveryTime}分钟` : deliveryTime}</Text>
                    <Text style={styles.metaText}> • {distanceDisplay}</Text>
                </View>

                {/* 推荐理由 - 使用 AI 生成的理由 */}
                {recommendationReason ? (
                    <View style={styles.reasonContainer}>
                        <Text style={styles.reasonText} numberOfLines={2}>
                            💡 {recommendationReason}
                        </Text>
                    </View>
                ) : null}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        // 阴影
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Android 阴影
        overflow: 'hidden',
    },
    imageContainer: {
        height: 150,
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    scoreBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    scoreText: {
        color: '#ffffff', // 白色文字，配合动态背景色
        fontWeight: 'bold',
        fontSize: 12,
    },
    infoContainer: {
        padding: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        color: '#FFD700', // 金色星星
        fontWeight: 'bold',
        fontSize: 14,
    },
    metaText: {
        color: '#666',
        fontSize: 12,
    },
    reasonContainer: {
        backgroundColor: '#fff5f2', // 浅橙色背景
        padding: 6,
        borderRadius: 4,
    },
    reasonText: {
        color: '#e85a2d',
        fontSize: 12,
    },
});

export default RestaurantCard;