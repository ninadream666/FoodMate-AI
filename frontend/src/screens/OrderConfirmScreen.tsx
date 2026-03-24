import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { orderService } from '../services/orderService';
import { addressService } from '../services/addressService';
import { useIsFocused } from '@react-navigation/native';

const OrderConfirmScreen = ({ route, navigation }: any) => {
    // 1. 获取上一页传来的数据
    const { cartItems, restaurant, subtotal, discount = 0, selectedCouponIds = [] } = route.params || {};

    // 2. 状态管理
    const [address, setAddress] = useState<any>(null);
    const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // 3. 计算最终费用 (参考 Web 端逻辑)
    const deliveryFee = 5.00;
    const tax = subtotal * 0.0175; // 1.75% 税费
    const total = subtotal + deliveryFee + tax - discount;

    const isFocused = useIsFocused();

    // 4. 加载默认地址
    useEffect(() => {
        if (isFocused) {
            loadDefaultAddress();
        }
    }, [isFocused]);

    // 如果从地址列表选了地址回来，更新地址
    useEffect(() => {
        if (route.params?.selectedAddress) {
            setAddress(route.params.selectedAddress);
        }
    }, [route.params?.selectedAddress]);

    const loadDefaultAddress = async () => {
        try {
            // 如果已经手动选了地址，就不重新加载默认的
            if (route.params?.selectedAddress) return;

            const list = await addressService.getMyAddresses();
            // 找默认地址，没有则取第一个
            const defaultAddr = list.find((a: any) => a.isDefault) || list[0];
            setAddress(defaultAddr || null);
        } catch (error) {
            console.warn('加载地址失败', error);
        } finally {
            setPageLoading(false);
        }
    };

    // 5. 提交支付
    const handlePay = async () => {
        if (!address) {
            Alert.alert('提示', '请添加收货地址');
            return;
        }

        setLoading(true);
        try {
            // 检查用户登录状态
            const token = await AsyncStorage.getItem('token');
            const user = await AsyncStorage.getItem('user');

            if (!token || !user) {
                Alert.alert('登录已过期', '请重新登录', [
                    {
                        text: '确定',
                        onPress: () => navigation.navigate('Login')
                    }
                ]);
                return;
            }

            console.log('用户认证信息:', {
                hasToken: !!token,
                tokenLength: token ? token.length : 0,
                hasUser: !!user,
                userInfo: user ? JSON.parse(user) : null
            });

            // 详细的token调试信息
            if (token) {
                console.log('Token详细信息:', {
                    tokenStart: token.substring(0, 20) + '...',
                    tokenParts: token.split('.').length,
                    tokenStartsWith: token.startsWith('ey'),
                    tokenLength: token.length
                });

                // 尝试解析token内容（简单解析，不验证签名）
                try {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        // Base64解码payload
                        let payload;
                        try {
                            // 处理可能的padding问题
                            let base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
                            while (base64.length % 4) {
                                base64 += '=';
                            }
                            payload = JSON.parse(atob(base64));
                        } catch (decodeError) {
                            console.error('Token base64解码失败:', decodeError);
                            payload = null;
                        }

                        if (payload) {
                            console.log('Token payload:', {
                                userId: payload.userId,
                                username: payload.sub,
                                role: payload.role,
                                exp: payload.exp,
                                expireTime: payload.exp ? new Date(payload.exp * 1000) : '未设置',
                                isExpired: payload.exp ? Date.now() > payload.exp * 1000 : false,
                                timeRemaining: payload.exp ? Math.max(0, payload.exp * 1000 - Date.now()) : 0
                            });

                            // 检查token是否过期
                            if (payload.exp && Date.now() > payload.exp * 1000) {
                                console.error('Token已过期！');
                                Alert.alert('登录已过期', '您的登录状态已过期，请重新登录', [
                                    {
                                        text: '重新登录',
                                        onPress: async () => {
                                            await AsyncStorage.removeItem('token');
                                            await AsyncStorage.removeItem('user');
                                            await AsyncStorage.removeItem('userId');
                                            navigation.navigate('Login');
                                        }
                                    }
                                ]);
                                return;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Token解析失败:', e);
                }
            }

            // 验证token格式 (简单检查)
            if (token && !token.startsWith('ey')) {
                console.warn('Token格式可能异常:', token.substring(0, 10) + '...');
                Alert.alert('登录已过期', 'Token格式异常，请重新登录', [
                    {
                        text: '确定',
                        onPress: () => navigation.navigate('Login')
                    }
                ]);
                return;
            }

            // 尝试先获取用户订单列表来验证连接和权限
            try {
                console.log('测试API连接...');
                console.log('即将调用 orderService.getMyOrders()');
                const orders = await orderService.getMyOrders();
                console.log('API连接测试成功，获取到订单:', orders?.length || 0, '条');
            } catch (testError: any) {
                console.error('API连接测试失败:', testError);
                console.error('测试错误详情:', {
                    message: testError.message,
                    status: testError.response?.status,
                    data: testError.response?.data,
                    url: testError.config?.url
                });

                // 检查是否是服务不可用的问题
                if (testError.message.includes('网络连接失败') || testError.message.includes('ECONNREFUSED')) {
                    Alert.alert('服务不可用', '订单服务暂时不可用，请确认后端服务已启动', [
                        {
                            text: '确定',
                            onPress: () => navigation.goBack()
                        }
                    ]);
                    return;
                }

                // 如果是权限错误，提示重新登录
                if (testError.message.includes('权限验证失败') || testError.message.includes('登录已失效') || testError.message.includes('登录已过期') || testError.message.includes('未登录') || testError.message.includes('UNAUTHORIZED')) {
                    Alert.alert('登录已失效', '您的登录状态已失效，请重新登录', [
                        {
                            text: '重新登录',
                            onPress: async () => {
                                // 清除本地存储的认证信息
                                await AsyncStorage.removeItem('token');
                                await AsyncStorage.removeItem('user');
                                await AsyncStorage.removeItem('userId');
                                navigation.navigate('Login');
                            }
                        }
                    ]);
                } else {
                    // 其他错误
                    Alert.alert('连接失败', `服务连接失败: ${testError.message}`, [
                        {
                            text: '重试',
                            onPress: () => handlePay() // 重试当前操作
                        },
                        {
                            text: '取消',
                            style: 'cancel',
                            onPress: () => navigation.goBack()
                        }
                    ]);
                }
                return;
            }
            // 构造订单数据 (匹配后端CreateOrderDto格式)
            const orderData = {
                merchantId: restaurant.id.toString(), // 后端期望 string 类型
                items: cartItems.map((item: any) => ({
                    menuItemId: item.id,
                    price: parseFloat(item.price), // 确保price是数字格式
                    quantity: item.quantity
                }))
                // 注意：addressId、couponIds、remark 不在当前后端 CreateOrderDto 中，暂时移除
            };

            console.log('创建订单详细信息:', {
                restaurant: restaurant,
                merchantId: restaurant.id,
                merchantIdString: restaurant.id.toString(),
                cartItems: cartItems,
                orderData: orderData
            });

            // 1. 创建订单
            const createdOrder = await orderService.createOrder(orderData);

            // 2. 支付订单
            await orderService.payOrder(createdOrder.id);

            // 3. 跳转成功页
            navigation.replace('PaymentSuccess', {
                order: {
                    id: createdOrder.id,
                    restaurantName: restaurant.name,
                    total: total,
                    couponDiscount: discount,
                    estimatedTime: '30-40分钟'
                }
            });

        } catch (error: any) {
            console.error('支付流程失败:', error);
            console.error('错误详情:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });

            let errorMessage = '支付失败，请稍后重试';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('支付失败', `错误信息: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#e85a2d" />;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* 地址卡片 */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('AddressList', { mode: 'select' })}
                >
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>配送地址</Text>
                        <Text style={styles.linkText}>修改 {'>'}</Text>
                    </View>
                    {address ? (
                        <>
                            <Text style={styles.addrText}>{address.city} {address.street} {address.detail}</Text>
                            <Text style={styles.contactText}>{address.contactName || '用户'} {address.phone}</Text>
                        </>
                    ) : (
                        <Text style={styles.placeholderText}>+ 添加收货地址</Text>
                    )}
                </TouchableOpacity>

                {/* 订单详情卡片 */}
                <View style={styles.card}>
                    <Text style={styles.restaurantName}>{restaurant?.name}</Text>
                    {cartItems.map((item: any) => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQty}>x{item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>¥{(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                    ))}

                    <View style={styles.divider} />

                    {/* 费用明细 */}
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>小计</Text>
                        <Text style={styles.feeValue}>¥{subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>配送费</Text>
                        <Text style={styles.feeValue}>¥{deliveryFee.toFixed(2)}</Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>税费 (1.75%)</Text>
                        <Text style={styles.feeValue}>¥{tax.toFixed(2)}</Text>
                    </View>
                    {discount > 0 && (
                        <View style={styles.feeRow}>
                            <Text style={[styles.feeLabel, { color: 'green' }]}>优惠</Text>
                            <Text style={[styles.feeValue, { color: 'green' }]}>-¥{discount.toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={[styles.divider, { marginTop: 10 }]} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>合计</Text>
                        <Text style={styles.totalValue}>¥{total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* 备注卡片 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>订单备注</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="例如：不要辣，放门口..."
                        value={remark}
                        onChangeText={setRemark}
                        multiline
                    />
                </View>

            </ScrollView>

            {/* 底部支付栏 */}
            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <Text style={styles.footerTotalLabel}>待支付</Text>
                    <Text style={styles.footerTotalValue}>¥{total.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.payBtn, (!address || loading) && styles.disabledBtn]}
                    onPress={handlePay}
                    disabled={!address || loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>确认支付</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: { padding: spacing.lg, paddingBottom: 100 },
    card: {
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    cardTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    linkText: {
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    addrText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    contactText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    placeholderText: {
        color: colors.primary,
        fontSize: fontSize.lg,
        textAlign: 'center',
        padding: spacing.md,
        fontWeight: fontWeight.semibold,
    },

    restaurantName: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.md,
        color: colors.textPrimary,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    itemName: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    itemQty: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
    itemPrice: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },

    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: spacing.sm,
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    feeLabel: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    feeValue: {
        fontSize: fontSize.sm,
        color: colors.textPrimary,
        fontWeight: fontWeight.medium,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    totalLabel: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    totalValue: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },

    input: {
        backgroundColor: colors.surfaceFrosted,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginTop: spacing.sm,
        height: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        alignItems: 'center',
        ...shadows.sm,
    },
    footerInfo: { flex: 1 },
    footerTotalLabel: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    footerTotalValue: {
        fontSize: fontSize.title,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    payBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xxxl,
        height: 50,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.primary,
    },
    disabledBtn: {
        backgroundColor: colors.textDisabled,
        shadowOpacity: 0,
        elevation: 0,
    },
    payBtnText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
});

export default OrderConfirmScreen;