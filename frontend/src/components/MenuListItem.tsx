import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';
import OptimizedImage from './OptimizedImage';

// 使用更简短的默认图片 URL
const defaultImage = 'https://loremflickr.com/200/200/food,dish';

interface Props {
    dish: any;
    onAdd: (dish: any) => void;
}

const MenuListItem = memo(({ dish, onAdd }: Props) => {
    return (
        <View style={styles.container}>
            {/* 左侧图片 - 使用优化的图片组件 */}
            <OptimizedImage
                uri={(!dish.imageUrl || dish.imageUrl.includes('unsplash.com') || dish.imageUrl.includes('picsum.photos')) ? defaultImage : dish.imageUrl}
                width={150}
                style={styles.image}
                priority="low"
                fallbackUri={defaultImage}
            />

            {/* 中间信息 */}
            <View style={styles.info}>
                <Text style={styles.name}>{dish.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{dish.description}</Text>
                <Text style={styles.price}>¥{dish.price.toFixed(2)}</Text>
            </View>

            {/* 右侧添加按钮 */}
            <TouchableOpacity activeOpacity={0.7} onPress={() => onAdd(dish)}>
                <LinearGradient
                    colors={['#FFA07A', '#C4422E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addButton}
                >
                    <Text style={styles.addText}>+</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
});

// 磨砂风格样式（Image3 卡片 + Image2 阴影原则）
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: spacing.lg,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    // 圆角图片 - 磨砂风格（Image3 ClipRRect）
    image: {
        width: 76,
        height: 76,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.backgroundGradientEnd,
    },
    info: {
        flex: 1,
        marginLeft: spacing.md,
        justifyContent: 'center',
    },
    name: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    desc: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        marginBottom: spacing.sm,
        lineHeight: 18,
    },
    price: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    // 添加按钮 - 可点击元素带阴影（Image2 原则）
    addButton: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    addText: {
        color: colors.textOnPrimary,
        fontSize: 22,
        lineHeight: 24,
        fontWeight: fontWeight.medium,
    },
});

export default MenuListItem;