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

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        height: 60,
        backgroundColor: '#333',
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        // 阴影
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cartIconContainer: {
        position: 'relative',
        marginRight: 16,
    },
    icon: {
        fontSize: 24,
        color: '#fff',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#e85a2d',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    priceInfo: {
        flex: 1,
    },
    totalPrice: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    subText: {
        color: '#999',
        fontSize: 10,
    },
    checkoutBtn: {
        backgroundColor: '#e85a2d',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    checkoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default CartBar;