import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { merchantOrderService } from '../../services/merchantOrderService';
import { merchantService } from '../../services/merchantService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/NordicTheme';

const TABS = [
    { key: 'pending', label: '待接单', statuses: ['PAID'] },
    { key: 'cooking', label: '制作中', statuses: ['CONFIRMED', 'PREPARING'] },
    { key: 'ready', label: '待配送', statuses: ['READY'] },
    { key: 'all', label: '全部', statuses: ['PAID', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED'] },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PAID: { label: '待接单', color: '#e6a23c' },
    CONFIRMED: { label: '已接单', color: '#409eff' },
    PREPARING: { label: '制作中', color: '#409eff' },
    READY: { label: '待配送', color: '#67c23a' },
    DELIVERED: { label: '已配送', color: '#909399' },
    COMPLETED: { label: '已完成', color: '#909399' },
    CANCELLED: { label: '已取消', color: '#f56c6c' },
};

const MerchantOrdersScreen = ({ navigation, route }: any) => {
    const routeMerchantId = route?.params?.merchantId;
    const [merchantId, setMerchantId] = useState<number | null>(routeMerchantId || null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (!merchantId) {
            initMerchant();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const initMerchant = async () => {
        try {
            const list = await merchantService.getAllMyMerchants();
            const merchants = Array.isArray(list) ? list : [];
            if (merchants.length > 0) {
                setMerchantId(merchants[0].id);
            }
        } catch (e) {
            console.error('获取商家信息失败', e);
        }
    };

    useEffect(() => {
        if (merchantId) {
            fetchOrders();
            // 每30秒自动刷新
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(fetchOrders, 30000);
            return () => clearInterval(timerRef.current);
        }
    }, [merchantId, activeTab]);

    const fetchOrders = async () => {
        if (!merchantId) return;
        try {
            const includeCompleted = activeTab === 'all';
            const res = await merchantOrderService.getPendingOrders(merchantId, includeCompleted);
            const list = res?.orders || res?.data?.orders || [];
            setOrders(Array.isArray(list) ? list : []);
        } catch (e: any) {
            console.error('获取订单失败', e?.message || e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, [merchantId]);

    const filteredOrders = orders.filter((o: any) => {
        const tab = TABS.find(t => t.key === activeTab);
        const status = typeof o.status === 'object' ? o.status.code || o.status : o.status;
        return tab?.statuses.includes(status);
    });

    const handleAccept = async (orderId: number) => {
        if (!merchantId) return;
        setActionLoading(orderId);
        try {
            await merchantOrderService.acceptOrder(merchantId, orderId);
            Alert.alert('成功', '已接单');
            fetchOrders();
        } catch (e: any) {
            Alert.alert('接单失败', e.message || '请重试');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = (orderId: number) => {
        Alert.alert('确认拒单', '拒单后订单将全额退款给用户，确定要拒单吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '确认拒单', style: 'destructive', onPress: async () => {
                    if (!merchantId) return;
                    setActionLoading(orderId);
                    try {
                        await merchantOrderService.rejectOrder(merchantId, orderId, '商家拒绝接单');
                        Alert.alert('已拒单', '订单已取消，将退款给用户');
                        fetchOrders();
                    } catch (e: any) {
                        Alert.alert('拒单失败', e.message || '请重试');
                    } finally {
                        setActionLoading(null);
                    }
                }
            }
        ]);
    };

    const handleProgress = async (orderId: number, status: string, label: string) => {
        if (!merchantId) return;
        setActionLoading(orderId);
        try {
            await merchantOrderService.updateProgress(merchantId, orderId, status);
            Alert.alert('成功', label);
            fetchOrders();
        } catch (e: any) {
            Alert.alert('操作失败', e.message || '请重试');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusText = (status: string) => STATUS_MAP[status]?.label || status;
    const getStatusColor = (status: string) => STATUS_MAP[status]?.color || colors.textTertiary;

    const formatTime = (t: string) => {
        if (!t) return '';
        const d = new Date(t);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const renderActions = (order: any) => {
        const status = typeof order.status === 'object' ? order.status.code || order.status : order.status;
        const isLoading = actionLoading === order.orderId;

        if (isLoading) {
            return <ActivityIndicator size="small" color={colors.primary} />;
        }

        switch (status) {
            case 'PAID':
                return (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(order.orderId)}>
                            <Text style={styles.rejectBtnText}>拒单</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(order.orderId)}>
                            <Text style={styles.acceptBtnText}>接单</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'CONFIRMED':
                return (
                    <TouchableOpacity style={styles.progressBtn} onPress={() => handleProgress(order.orderId, 'PREPARING', '已开始制作')}>
                        <Text style={styles.progressBtnText}>开始制作</Text>
                    </TouchableOpacity>
                );
            case 'PREPARING':
                return (
                    <TouchableOpacity style={styles.progressBtn} onPress={() => handleProgress(order.orderId, 'READY', '备餐完成')}>
                        <Text style={styles.progressBtnText}>备餐完成</Text>
                    </TouchableOpacity>
                );
            case 'READY':
                return (
                    <TouchableOpacity style={styles.progressBtn} onPress={() => handleProgress(order.orderId, 'DELIVERED', '已出餐')}>
                        <Text style={styles.progressBtnText}>已出餐</Text>
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };

    const renderOrder = ({ item }: any) => {
        const status = typeof item.status === 'object' ? item.status.code || item.status : item.status;
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>订单 #{item.orderId}</Text>
                    <Text style={[styles.statusBadge, { color: getStatusColor(status) }]}>{getStatusText(status)}</Text>
                </View>

                <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>

                {item.orderItems && item.orderItems.length > 0 && (
                    <View style={styles.itemsSection}>
                        {item.orderItems.map((oi: any, idx: number) => (
                            <View key={idx} style={styles.itemRow}>
                                <Text style={styles.itemName} numberOfLines={1}>{oi.menuItemName || `菜品#${oi.menuItemId}`}</Text>
                                <Text style={styles.itemQty}>x{oi.quantity}</Text>
                                <Text style={styles.itemPrice}>¥{oi.subtotal?.toFixed(2) || (oi.unitPrice * oi.quantity).toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>合计</Text>
                    <Text style={styles.totalValue}>¥{item.totalAmount?.toFixed(2) || '0.00'}</Text>
                </View>

                <View style={styles.actionsContainer}>
                    {renderActions(item)}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>加载订单中...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Tab 栏 */}
            <View style={styles.tabBar}>
                {TABS.map(tab => {
                    const isActive = activeTab === tab.key;
                    const count = orders.filter((o: any) => {
                        const s = typeof o.status === 'object' ? o.status.code || o.status : o.status;
                        return tab.statuses.includes(s);
                    }).length;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, isActive && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                {tab.label}{count > 0 ? ` (${count})` : ''}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* 订单列表 */}
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => String(item.orderId)}
                renderItem={renderOrder}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Feather name="inbox" size={48} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>暂无{TABS.find(t => t.key === activeTab)?.label}订单</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8E4DD',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
        fontSize: fontSize.md,
    },
    emptyText: {
        marginTop: spacing.md,
        color: colors.textTertiary,
        fontSize: fontSize.md,
    },

    // Tab 栏
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: borderRadius.lg,
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    tabTextActive: {
        color: '#FFFFFF',
        fontWeight: fontWeight.bold,
    },

    // 列表
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },

    // 卡片
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    orderId: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    statusBadge: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
    timeText: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginBottom: spacing.md,
    },

    // 菜品列表
    itemsSection: {
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        paddingTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    itemName: {
        flex: 1,
        fontSize: fontSize.sm,
        color: colors.textPrimary,
    },
    itemQty: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        marginHorizontal: spacing.md,
    },
    itemPrice: {
        fontSize: fontSize.sm,
        color: colors.textPrimary,
        fontWeight: fontWeight.medium,
    },

    // 合计
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        paddingTop: spacing.sm,
        marginBottom: spacing.md,
    },
    totalLabel: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    totalValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },

    // 操作按钮
    actionsContainer: {
        alignItems: 'flex-end',
    },
    actionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    acceptBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    acceptBtnText: {
        color: '#FFFFFF',
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
    rejectBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E0DBD3',
    },
    rejectBtnText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
    progressBtn: {
        backgroundColor: '#409eff',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    progressBtnText: {
        color: '#FFFFFF',
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
});

export default MerchantOrdersScreen;
