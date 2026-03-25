import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

interface Props {
    item: any;
    onUpdate: (id: number, quantity: number) => void;
}

const CartItem = ({ item, onUpdate }: Props) => {
    return (
        <View style={styles.container}>
            {/* 圆角图片 - 磨砂风格 */}
            <View style={styles.imageWrapper}>
                <Image source={{ uri: item.imageUrl || item.image }} style={styles.image} />
            </View>

            {/* 商品信息 */}
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>¥{item.price.toFixed(2)}</Text>
            </View>

            {/* 数量控制 - 北欧简约风格 */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => onUpdate(item.id, item.quantity - 1)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.btnText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.quantity}>{item.quantity}</Text>

                <TouchableOpacity
                    style={[styles.btn, styles.btnAdd]}
                    onPress={() => onUpdate(item.id, item.quantity + 1)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.btnText, styles.btnAddText]}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// 北欧磨砂卡片风格
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
    imageWrapper: {
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        backgroundColor: colors.backgroundGradientEnd,
    },
    image: {
        width: 64,
        height: 64,
        borderRadius: borderRadius.md,
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
    price: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundGradientEnd,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xs,
    },
    btn: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    btnAdd: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        ...shadows.sm,
    },
    btnText: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
        lineHeight: 20,
        fontWeight: fontWeight.medium,
    },
    btnAddText: {
        color: colors.textOnPrimary,
    },
    quantity: {
        marginHorizontal: spacing.md,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        minWidth: 24,
        textAlign: 'center',
    },
});

export default CartItem;