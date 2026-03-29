import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';
import OptimizedImage from './OptimizedImage';

// 默认图片
const DEFAULT_IMAGE = 'https://loremflickr.com/150/150/food,dish';

interface Props {
    item: any;
    onUpdate: (id: number, quantity: number) => void;
}

const CartItem = memo(({ item, onUpdate }: Props) => {
    return (
        <View style={styles.container}>
            {/* 圆角图片 - 使用优化的图片组件 */}
            <View style={styles.imageWrapper}>
                <OptimizedImage
                    uri={item.imageUrl || item.image || DEFAULT_IMAGE}
                    width={128}
                    style={styles.image}
                    priority="low"
                    fallbackUri={DEFAULT_IMAGE}
                />
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
                    onPress={() => onUpdate(item.id, item.quantity + 1)}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['#FFA07A', '#C4422E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.btn, styles.btnAdd]}
                    >
                        <Text style={[styles.btnText, styles.btnAddText]}>+</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
});

// 北欧磨砂卡片风格
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: spacing.lg,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
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
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
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