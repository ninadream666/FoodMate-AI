import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    RefreshControl
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { orderService } from '../services/orderService';

const OrderListScreen = ({ navigation }: any) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancellingId, setCancellingId] = useState<number | null>(null); // 正在取消的订单ID

    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            loadOrders();
        }
    }, [isFocused]);

    const loadOrders = async () => {
        try {
            const data = await orderService.getMyOrders();
            const sorted = Array.isArray(data) ? data.sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ) : [];
            setOrders(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    // 跳转详情
    const goToDetail = (order: any) => {
        navigation.navigate('OrderTracking', { order });
    };

    // 处理取消订单
    const handleCancel = (order: any) => {
        Alert.alert(
            '取消订单',
            '确定要取消这个订单吗？',
            [
                { text: '再想想', style: 'cancel' },
                {
                    text: '确定取消',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setCancellingId(order.id);
                            await orderService.cancelOrder(order.id, '用户主动取消');
                            Alert.alert('成功', '订单已取消');
                            loadOrders(); // 刷新列表
                        } catch (error: any) {
                            Alert.alert('取消失败', error.message || '请稍后重试');
                        } finally {
                            setCancellingId(null);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: any) => {
        const statusLabel = orderService.getStatusLabel(item.status);
        const statusColor = orderService.getStatusColor(item.status);
        const canCancel = orderService.canCancel(item.status);

        // 商家名称兜底 (Web端逻辑: item.merchantName || 1->'张记'...)
        const merchantName = item.merchantName || (item.items && item.items[0]?.name) || `商家 #${item.merchantId}`;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => goToDetail(item)}
                activeOpacity={0.8}
            >
                {/* 头部：商家名 + 状态 */}
                <View style={styles.cardHeader}>
                    <View style={styles.merchantRow}>
                        <Text style={styles.merchantIcon}>🏪</Text>
                        <Text style={styles.merchantName}>{merchantName}</Text>
                        <Text style={styles.arrow}> &gt;</Text>
                    </View>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {statusLabel}
                    </Text>
                </View>

                {/* 中间：简略信息 */}
                <View style={styles.cardBody}>
                    <Text style={styles.timeText}>下单时间: {new Date(item.createdAt).toLocaleString()}</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.itemSummary}>
                            {item.items ? `${item.items.length} 件商品` : '共消费'}
                        </Text>
                        <Text style={styles.totalPrice}>¥{item.totalAmount}</Text>
                    </View>
                </View>

                {/* 底部：操作按钮 */}
                <View style={styles.cardFooter}>
                    {/* 取消按钮 (仅在允许状态显示) */}
                    {canCancel && (
                        <TouchableOpacity
                            style={[styles.btn, styles.cancelBtn]}
                            onPress={() => handleCancel(item)}
                            disabled={cancellingId === item.id}
                        >
                            {cancellingId === item.id ? (
                                <ActivityIndicator size="small" color="#666" />
                            ) : (
                                <Text style={styles.cancelBtnText}>取消订单</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.btn, styles.detailBtn]}
                        onPress={() => goToDetail(item)}
                    >
                        <Text style={styles.detailBtnText}>查看详情</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>暂无订单，快去点餐吧！</Text>
                            <TouchableOpacity
                                style={styles.goHomeBtn}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Text style={styles.goHomeText}>去点餐</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
            {loading && !refreshing && (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#e85a2d" />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    list: { padding: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 }
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    merchantRow: { flexDirection: 'row', alignItems: 'center' },
    merchantIcon: { fontSize: 18, marginRight: 8 },
    merchantName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    arrow: { fontSize: 14, color: '#999', marginLeft: 4 },
    statusText: { fontSize: 14, fontWeight: 'bold' },

    cardBody: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    timeText: { fontSize: 12, color: '#999', marginBottom: 8 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemSummary: { fontSize: 14, color: '#666' },
    totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 12, gap: 10 },
    btn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelBtn: { borderColor: '#ddd', backgroundColor: '#fff' },
    cancelBtnText: { color: '#666', fontSize: 12 },

    detailBtn: { borderColor: '#e85a2d', backgroundColor: '#fff5f2' },
    detailBtnText: { color: '#e85a2d', fontSize: 12, fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#999', fontSize: 16, marginBottom: 20 },
    goHomeBtn: { backgroundColor: '#e85a2d', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    goHomeText: { color: '#fff', fontWeight: 'bold' },
    loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)' },
});

export default OrderListScreen;