import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const defaultImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsKKNZeioee-JViVf_SBcbT3rBBvZu4DRFaNV6zHlXtXEjC2CNTIsAmJI7F9lgIkkqvLI7GQ6aPH6dVIVSJYKiHlfzeJz8XvF7xFAKjKqhEaRfTu-NLionE8GH6f18T0nyhqQZK-DJTCPCdctLKhSoQdXHd52-CSkDC81U5LPnZtqdpW9a81FBB9suOIFC2VSfFJpnsmbj7pDYXC2LSYX9H8h_XhM49_8PrKxP1JwsEgNlm_YYWEv_4lAJqN8e8_e-8meysrlbEIft';

interface Props {
    dish: any;
    onAdd: (dish: any) => void;
}

const MenuListItem = ({ dish, onAdd }: Props) => {
    return (
        <View style={styles.container}>
            {/* 左侧图片 */}
            <Image
                source={{ uri: dish.imageUrl || defaultImage }}
                style={styles.image}
            />

            {/* 中间信息 */}
            <View style={styles.info}>
                <Text style={styles.name}>{dish.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{dish.description}</Text>
                <Text style={styles.price}>¥{dish.price.toFixed(2)}</Text>
            </View>

            {/* 右侧添加按钮 */}
            <TouchableOpacity style={styles.addButton} onPress={() => onAdd(dish)}>
                <Text style={styles.addText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

// 北欧磨砂风格样式
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: spacing.lg,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    // 圆角图片 - 磨砂风格
    image: {
        width: 72,
        height: 72,
        borderRadius: borderRadius.md,
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
    // 添加按钮 - 可点击元素带阴影
    addButton: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.primary,
    },
    addText: {
        color: colors.textOnPrimary,
        fontSize: 22,
        lineHeight: 24,
        fontWeight: fontWeight.medium,
    },
});

export default MenuListItem;