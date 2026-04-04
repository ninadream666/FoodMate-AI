import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { orderService } from '../services/orderService';
import { merchantService } from '../services/merchantService';

// 模拟骑手头像
const RIDER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrawV460GKuSwxG2erT5rdBh9ksqmQjzOTvnwYNU94TAR8--4IoSIyOfS2xC0-s3GbtIMMvUkusGoRljcvgdBFUwmD-nkloIV6LQSXdQUcr27tzgJpxyuKyVik-B_9eTdirHZhMVgfkEVfDKo6yDeJv7tOMeUbHB-BW6vGuWrj0-245nme0zrYfM0SN5ZaxIK5AyaCUa1vvb2fIri1634y5Hjop3rpflHAC9zZXdPSEWLiQh7mhvSgy4_gKUuFYXuuBjkJrNms9v23';

// 上海时区格式化
const formatShanghaiTime = (dateStr: string, options?: Intl.DateTimeFormatOptions) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        ...options,
    });
};

const OrderTrackingScreen = ({ route, navigation }: any) => {
    const { order: initialOrder } = route.params || {};
    const [order, setOrder] = useState<any>(initialOrder);
    const [merchantName, setMerchantName] = useState('');
    const [loading, setLoading] = useState(true);

    // 始终调用详情API获取完整数据（含菜品名），同时获取商家名
    useEffect(() => {
        loadDetail();
    }, []);

    const loadDetail = async () => {
        try {
            const id = initialOrder?.id || route.params?.id;
            if (id) {
                // 获取订单详情（含菜品名称）
                const data = await orderService.getOrderDetail(id);
                setOrder(data);

                // 获取商家名称
                const mid = data?.merchantId || initialOrder?.merchantId;
                if (mid) {
                    try {
                        const merchant = await merchantService.getMerchantById(mid);
                        if (merchant?.name) setMerchantName(merchant.name);
                    } catch { /* 查不到用兜底 */ }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleContactRider = () => {
        Alert.alert('联系骑手', '拨打电话: 13800138000', [{ text: '呼叫' }, { text: '取消' }]);
    };

    // 渲染进度条的一个步骤
    const renderStep = (title: string, time: string | null, isCompleted: boolean, isLast: boolean) => (
        <View style={styles.stepRow}>
            {/* 左侧轴 */}
            <View style={styles.stepIndicator}>
                <View style={[styles.dot, isCompleted && styles.activeDot]} />
                {!isLast && <View style={[styles.line, isCompleted && styles.activeLine]} />}
            </View>
            {/* 右侧内容 */}
            <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, isCompleted && styles.activeText]}>{title}</Text>
                {time && <Text style={styles.stepTime}>{time}</Text>}
            </View>
        </View>
    );

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;
    if (!order) return <Text>订单不存在</Text>;

    // 兼容后端返回的对象 { code: 'PAID' } 或字符串 'PAID'
    const statusCode = typeof order.status === 'object' && order.status !== null ? order.status.code : order.status;

    const isCancelled = ['CANCELLED', 'CANCEL_PENDING', 'REFUNDED'].includes(statusCode);
    const statusLabel = orderService.getStatusLabel(order.status);

    return (
        <ScrollView style={styles.container}>
            {/* 顶部状态区域 */}
            {isCancelled ? (
                <View style={[styles.mapContainer, { backgroundColor: '#F5F0EB' }]}>
                    <View style={styles.mapPlaceholder}>
                        <Text style={[styles.mapText, { fontSize: 40 }]}>
                            {statusCode === 'CANCEL_PENDING' ? '⏳' : '❌'}
                        </Text>
                        <Text style={[styles.mapSubText, { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, marginTop: spacing.sm }]}>
                            {statusLabel}
                        </Text>
                        {statusCode === 'CANCELLED' && order.refundAmount && (
                            <Text style={[styles.mapSubText, { marginTop: spacing.xs }]}>
                                退款金额: ¥{order.refundAmount}
                            </Text>
                        )}
                        {order.cancelReason && (
                            <Text style={[styles.mapSubText, { marginTop: spacing.xs }]}>
                                取消原因: {order.cancelReason}
                            </Text>
                        )}
                    </View>
                </View>
            ) : (
                <View style={styles.mapContainer}>
                    <View style={styles.mapPlaceholder}>
                        <Text style={styles.mapText}>🗺️ 配送地图</Text>
                        <Text style={styles.mapSubText}>骑手正在火速赶往 {merchantName || '餐厅'}</Text>
                    </View>
                    <View style={styles.etaContainer}>
                        <Text style={styles.etaTitle}>预计送达</Text>
                        <Text style={styles.etaTime}>
                            {order.createdAt
                                ? formatShanghaiTime(
                                    new Date(new Date(order.createdAt).getTime() + 30 * 60000).toISOString(),
                                    { hour: '2-digit', minute: '2-digit' }
                                  )
                                : '--:--'}
                        </Text>
                    </View>
                </View>
            )}

            {/* 进度条区域 - 基于真实订单状态 */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>订单状态</Text>
                {isCancelled ? (
                    <View style={styles.timeline}>
                        {renderStep('已下单', order.createdAt ? formatShanghaiTime(order.createdAt, { hour: '2-digit', minute: '2-digit' }) : '', true, false)}
                        {renderStep(statusLabel, '', true, true)}
                    </View>
                ) : (
                    <View style={styles.timeline}>
                        {renderStep('已下单', order.createdAt ? formatShanghaiTime(order.createdAt, { hour: '2-digit', minute: '2-digit' }) : '', true, false)}
                        {renderStep('已接单', ['CONFIRMED','ACCEPTED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED'].includes(statusCode) ? '' : null,
                            ['CONFIRMED','ACCEPTED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED'].includes(statusCode), false)}
                        {renderStep('制作中', ['PREPARING','READY','DELIVERING','DELIVERED','COMPLETED'].includes(statusCode) ? '' : null,
                            ['PREPARING','READY','DELIVERING','DELIVERED','COMPLETED'].includes(statusCode), false)}
                        {renderStep('配送中', ['DELIVERING','DELIVERED','COMPLETED'].includes(statusCode) ? '' : null,
                            ['DELIVERING','DELIVERED','COMPLETED'].includes(statusCode), false)}
                        {renderStep('已送达', ['DELIVERED','COMPLETED'].includes(statusCode) ? '' : null,
                            ['DELIVERED','COMPLETED'].includes(statusCode), true)}
                    </View>
                )}
            </View>

            {/* 骑手信息 - 已取消的订单不显示 */}
            {!isCancelled && (
                <View style={styles.card}>
                    <View style={styles.riderRow}>
                        <Image source={{ uri: RIDER_AVATAR }} style={styles.avatar} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.riderName}>{order.riderName || '等待分配骑手'}</Text>
                            <Text style={styles.riderTag}>{['DELIVERING','DELIVERED','COMPLETED'].includes(statusCode) ? '配送中' : '等待接单'}</Text>
                        </View>
                        <TouchableOpacity style={styles.callBtn} onPress={handleContactRider}>
                            <Text style={styles.callText}>联系</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* 订单详情 */}
            <View style={[styles.card, { marginBottom: 40 }]}>
                <Text style={styles.sectionTitle}>订单详情</Text>
                {merchantName ? (
                    <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md }}>
                        {merchantName}
                    </Text>
                ) : null}
                {/* 优先用orderItems（详情API返回，含菜品名），fallback到items */}
                {(order.orderItems || order.items)?.map((item: any, index: number) => (
                    <View key={index} style={styles.orderItem}>
                        <Text style={styles.itemName}>
                            {item.menuItemName || item.name || `菜品 #${item.menuItemId}`}
                        </Text>
                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                        <Text style={styles.itemPrice}>¥{item.unitPrice || item.price}</Text>
                    </View>
                ))}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>实付金额</Text>
                    <Text style={styles.totalValue}>¥{order.totalAmount}</Text>
                </View>
                {isCancelled && order.refundAmount != null && (
                    <View style={[styles.totalRow, { borderTopWidth: 0, paddingTop: spacing.xs }]}>
                        <Text style={styles.totalLabel}>退回金额</Text>
                        <Text style={[styles.totalValue, { color: '#67c23a' }]}>¥{order.refundAmount}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    mapContainer: {
        height: 200,
        backgroundColor: colors.backgroundGradientEnd,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    mapPlaceholder: { alignItems: 'center' },
    mapText: {
        fontSize: fontSize.title,
        marginBottom: spacing.sm,
    },
    mapSubText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
    },
    etaContainer: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.md,
    },
    etaTitle: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
    },
    etaTime: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },

    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.lg,
        color: colors.textPrimary,
    },

    // Timeline styles
    timeline: { marginLeft: spacing.sm },
    stepRow: {
        flexDirection: 'row',
        minHeight: 60,
    },
    stepIndicator: { alignItems: 'center', width: 30 },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.border,
        zIndex: 1,
    },
    activeDot: {
        backgroundColor: colors.primary,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.xs,
    },
    activeLine: {
        backgroundColor: colors.primary,
    },
    stepContent: {
        flex: 1,
        marginLeft: spacing.md,
        marginTop: -4,
    },
    stepTitle: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        marginBottom: spacing.xs,
    },
    activeText: {
        color: colors.textPrimary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.lg,
    },
    stepTime: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
    },

    // Rider styles
    riderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: spacing.md,
        backgroundColor: colors.backgroundGradientEnd,
    },
    riderName: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    riderTag: {
        fontSize: fontSize.xs,
        color: colors.primary,
        marginTop: spacing.xs,
        fontWeight: fontWeight.medium,
    },
    callBtn: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primaryBg,
        ...shadows.sm,
    },
    callText: {
        color: colors.primary,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },

    // Order Detail styles
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    itemName: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: fontSize.md,
    },
    itemQty: {
        width: 40,
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: fontSize.sm,
    },
    itemPrice: {
        width: 60,
        textAlign: 'right',
        color: colors.textPrimary,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        paddingTop: spacing.md,
        marginTop: spacing.sm,
    },
    totalLabel: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    totalValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
});

export default OrderTrackingScreen;