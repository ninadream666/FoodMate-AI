import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface Props {
    cartItems: any[];
    onViewCart: () => void;
}

const CartBar = ({ cartItems, onViewCart }: Props) => {
    if (cartItems.length === 0) return null;

    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <View style={styles.container}>
            <View style={styles.cartIconContainer}>
                <Text style={styles.icon}>🛒</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalCount}</Text>
                </View>
            </View>

            <View style={styles.priceInfo}>
                <Text style={styles.totalPrice}>¥{totalPrice.toFixed(2)}</Text>
                <Text style={styles.subText}>免配送费</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={onViewCart}>
                <Text style={styles.checkoutText}>去结算</Text>
            </TouchableOpacity>
        </View>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: spacing.xl,
        left: spacing.lg,
        right: spacing.lg,
        height: 64,
        backgroundColor: colors.textPrimary,
        borderRadius: borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        ...shadows.xl,
    },
    cartIconContainer: {
        position: 'relative',
        marginRight: spacing.lg,
    },
    icon: {
        fontSize: 24,
        color: colors.textOnPrimary,
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xs,
        borderWidth: 2,
        borderColor: colors.textPrimary,
    },
    badgeText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    priceInfo: {
        flex: 1,
    },
    totalPrice: {
        color: colors.textOnPrimary,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
    },
    subText: {
        color: colors.textTertiary,
        fontSize: fontSize.xs,
    },
    checkoutBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        ...shadows.sm,
    },
    checkoutText: {
        color: colors.textOnPrimary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.sm,
    },
});

export default CartBar;