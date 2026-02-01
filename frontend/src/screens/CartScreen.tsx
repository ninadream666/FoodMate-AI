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
import CartItem from '../components/CartItem';

const CartScreen = ({ route, navigation }: any) => {
    // 从上一页获取购物车数据
    const { cartItems: initialItems = [], restaurant } = route.params || {};

    const [cartItems, setCartItems] = useState<any[]>(initialItems);

    // 计算总价
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // 这里只展示预估，实际费用在 OrderConfirm 页计算
    const deliveryFee = 5;
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
                    style={[styles.payBtn, cartItems.length === 0 && styles.disabledBtn]}
                    onPress={handleCheckout} // --- 修改点：调用跳转函数 ---
                    disabled={cartItems.length === 0}
                >
                    <Text style={styles.payText}>去结算</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    restaurantName: { fontSize: 18, fontWeight: 'bold' },
    bill: { padding: 16, backgroundColor: '#fff', marginTop: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
    totalText: { fontSize: 16, fontWeight: 'bold' },
    totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#e85a2d' },
    footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    payBtn: { backgroundColor: '#e85a2d', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    disabledBtn: { backgroundColor: '#ccc' },
    payText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default CartScreen;