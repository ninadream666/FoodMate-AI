import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const PaymentSuccessScreen = ({ route, navigation }: any) => {
    const { order } = route.params || {};

    const handleViewDetail = () => {
        // 跳转到订单追踪，替换当前历史，防止用户点返回回到支付成功页
        navigation.replace('OrderTracking', { order });
    };

    const handleHome = () => {
        navigation.navigate('Home');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                {/* 成功图标 */}
                <View style={styles.iconContainer}>
                    <Text style={styles.checkIcon}>✓</Text>
                </View>

                <Text style={styles.title}>支付成功</Text>
                <Text style={styles.subtitle}>下单成功，美味即将送达！</Text>

                <View style={styles.divider} />

                {/* 订单详情 */}
                <View style={styles.row}>
                    <Text style={styles.label}>订单号：</Text>
                    <Text style={styles.value}>{order?.id || 'SN---'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>预计送达：</Text>
                    <Text style={styles.value}>{order?.estimatedTime || '尽快送达'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>餐厅：</Text>
                    <Text style={styles.value}>{order?.restaurantName || '未知餐厅'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>支付金额：</Text>
                    <Text style={styles.price}>¥{order?.total?.toFixed(2) || '0.00'}</Text>
                </View>

                {/* 优惠信息 (如有) */}
                {order?.couponDiscount > 0 && (
                    <View style={styles.savingBox}>
                        <Text style={styles.savingIcon}>✨</Text>
                        <Text style={styles.savingText}>
                            AI 智能优化已生效，为您节省 ¥{order.couponDiscount.toFixed(2)}
                        </Text>
                    </View>
                )}

                <View style={styles.divider} />

                <TouchableOpacity style={styles.primaryBtn} onPress={handleViewDetail}>
                    <Text style={styles.primaryBtnText}>查看订单详情</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={handleHome}>
                    <Text style={styles.secondaryBtnText}>返回首页</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { padding: 20, paddingTop: 60, flex: 1, justifyContent: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e6fffa', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    checkIcon: { fontSize: 40, color: '#059669', fontWeight: 'bold' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
    divider: { width: '100%', height: 1, backgroundColor: '#eee', marginVertical: 20 },

    row: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 12 },
    label: { color: '#999', fontSize: 14 },
    value: { color: '#333', fontSize: 14, fontWeight: 'bold' },
    price: { color: '#e85a2d', fontSize: 16, fontWeight: 'bold' },

    savingBox: { flexDirection: 'row', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 10 },
    savingIcon: { marginRight: 8 },
    savingText: { color: '#166534', fontSize: 12, fontWeight: 'bold' },

    primaryBtn: { width: '100%', height: 50, backgroundColor: '#e85a2d', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    secondaryBtn: { width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e85a2d' },
    secondaryBtnText: { color: '#e85a2d', fontSize: 16, fontWeight: 'bold' },
});

export default PaymentSuccessScreen;