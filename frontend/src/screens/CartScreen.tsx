import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    SafeAreaView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CartItem from '../components/CartItem';

const CartScreen = ({ route, navigation }: any) => {
    // 从上一页获取购物车数据
    const { cartItems: initialItems = [], restaurant } = route.params || {};

    const [cartItems, setCartItems] = useState<any[]>(initialItems);

    // 计算总价
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // 预估配送费（实际费用在 OrderConfirm 页根据距离计算）
    const deliveryFee = 3;
    const total = subtotal + deliveryFee;

    // 更新数量
    const handleUpdateQuantity = (id: number, newQty: number) => {
        if (newQty <= 0) {
            Alert.alert('删除商品', '确定要删除这个商品吗？', [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除', style: 'destructive', onPress: () => {
                        setCartItems(prev => prev.filter(item => item.id !== id));
                    }
                }
            ]);
        } else {
            setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
        }
    };

    // --- 修改点：去结算 ---
    const handleCheckout = () => {
        if (cartItems.length === 0) return;

        // 跳转到【确认订单页】，并传递最新的购物车数据和金额
        navigation.navigate('OrderConfirm', {
            cartItems,
            restaurant,
            subtotal,
            // 如果你在购物车也做了优惠券功能，可以在这里传 discount
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={cartItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <CartItem item={item} onUpdate={handleUpdateQuantity} />
                )}
                ListHeaderComponent={
                    // --- 修改点：移除了地址栏，只保留餐厅名 ---
                    <View style={styles.header}>
                        <Text style={styles.restaurantName}>{restaurant?.name || '购物车'}</Text>
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.bill}>
                        <View style={styles.row}>
                            <Text>小计</Text>
                            <Text>¥{subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text>配送费</Text>
                            <Text>¥{deliveryFee.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.row, styles.totalRow]}>
                            <Text style={styles.totalText}>合计</Text>
                            <Text style={styles.totalPrice}>¥{total.toFixed(2)}</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>购物车是空的</Text>
                }
            />

            <View style={styles.footer}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCheckout}
                    disabled={cartItems.length === 0}
                >
                    <LinearGradient
                        colors={cartItems.length === 0 ? ['#ccc', '#aaa'] : ['#FFA07A', '#C4422E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.payBtn}
                    >
                        <Text style={styles.payText}>去结算</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

// 北欧风格样式
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEEAE4',
    },
    header: {
        padding: spacing.xl,
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        borderRadius: borderRadius.xl,
        ...shadows.sm,
    },
    restaurantName: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    // 账单卡片 - 磨砂效果
    bill: {
        padding: spacing.xl,
        backgroundColor: '#FFFFFF',
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    rowLabel: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    rowValue: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        fontWeight: fontWeight.medium,
    },
    totalRow: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    totalText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    totalPrice: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    // 底部结算栏
    footer: {
        padding: spacing.xl,
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 10,
    },
    payBtn: {
        height: 54,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    payText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        letterSpacing: 1,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 80,
        color: colors.textTertiary,
        fontSize: fontSize.lg,
    },
});

export default CartScreen;