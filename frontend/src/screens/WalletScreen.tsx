import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { walletService, isCouponExpired } from '../services/walletService';
import { authService } from '../services/authService';
import api from '../services/apiClient';

const WalletScreen = ({ navigation }: any) => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('AVAILABLE'); // 'AVAILABLE' | 'EXPIRED'

    useEffect(() => {
        loadData();
    }, []);

    const [templates, setTemplates] = useState<any[]>([]);
    const [userId, setUserId] = useState<string>('');

    const loadData = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user && user.id) {
                setUserId(user.id);
                const [list, tpls] = await Promise.all([
                    walletService.getAllCoupons(user.id),
                    api.get('coupons', '/templates').catch(() => []),
                ]);
                setCoupons(Array.isArray(list) ? list : []);
                setTemplates(Array.isArray(tpls) ? tpls : []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimCoupon = async (templateId: number) => {
        try {
            await walletService.claimCoupon(templateId, userId);
            Alert.alert('领取成功', '优惠券已放入您的卡包');
            loadData();
        } catch (e: any) {
            Alert.alert('领取失败', e.message || '请稍后重试');
        }
    };

    // 过滤优惠券逻辑
    const displayedCoupons = coupons.filter(c => {
        const isExpired = isCouponExpired(c);
        const status = isExpired ? 'EXPIRED' : (c.status || 'AVAILABLE');

        if (activeTab === 'AVAILABLE') return status === 'AVAILABLE';
        return status !== 'AVAILABLE'; // 显示已过期或已使用的
    });

    const renderCoupon = ({ item }: any) => {
        const isAvailable = activeTab === 'AVAILABLE';
        // 数据标准化：兼容后端返回的不同字段名
        const title = item.couponTemplate?.name || item.name || '优惠券';
        const amount = item.couponTemplate?.discountValue || item.amount || 0;
        const minSpend = item.couponTemplate?.minOrderAmount || item.minSpend || 0;
        const expiry = item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : '长期有效';

        return (
            <View style={[styles.coupon, !isAvailable && styles.disabledCoupon]}>
                {/* 左侧金额 */}
                <View style={styles.couponLeft}>
                    <Text style={styles.amount}>¥<Text style={{ fontSize: 24 }}>{amount}</Text></Text>
                    <Text style={styles.condition}>满{minSpend}可用</Text>
                </View>
                {/* 右侧信息 */}
                <View style={styles.couponRight}>
                    <View>
                        <Text style={styles.couponTitle}>{title}</Text>
                        <Text style={styles.couponDate}>有效期至: {expiry}</Text>
                    </View>
                    {isAvailable ? (
                        <TouchableOpacity
                            style={styles.useBtn}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.useBtnText}>去使用</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.statusText}>不可用</Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* 领券中心 */}
            {templates.length > 0 && (
                <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>领券中心</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {templates.filter((t: any) => t.enabled !== false).map((tpl: any) => (
                            <TouchableOpacity
                                key={tpl.id}
                                style={{ backgroundColor: '#FFF6F2', borderRadius: 12, padding: 14, marginRight: 10, width: 140, borderWidth: 1, borderColor: '#FDEEE8' }}
                                onPress={() => handleClaimCoupon(tpl.id)}
                            >
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F2784B' }}>
                                    {tpl.discountType === 'PERCENTAGE' ? `${tpl.discountValue}折` : `¥${tpl.discountValue}`}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }} numberOfLines={1}>{tpl.name || '优惠券'}</Text>
                                <Text style={{ fontSize: 11, color: '#ccc', marginTop: 2 }}>满{tpl.minOrderAmount || 0}可用</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* 选项卡 */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'AVAILABLE' && styles.activeTab]}
                    onPress={() => setActiveTab('AVAILABLE')}
                >
                    <Text style={[styles.tabText, activeTab === 'AVAILABLE' && styles.activeTabText]}>
                        可用优惠券
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'EXPIRED' && styles.activeTab]}
                    onPress={() => setActiveTab('EXPIRED')}
                >
                    <Text style={[styles.tabText, activeTab === 'EXPIRED' && styles.activeTabText]}>
                        已失效
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 列表 */}
            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#e85a2d" />
            ) : (
                <FlatList
                    data={displayedCoupons}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderCoupon}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>暂无相关优惠券</Text>
                    }
                />
            )}
        </View>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F3EF',
    },

    balanceCard: {
        backgroundColor: colors.primary,
        margin: spacing.lg,
        padding: spacing.xl,
        borderRadius: borderRadius.xl,
        ...shadows.primary,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: fontSize.sm,
    },
    balanceValue: {
        color: colors.textOnPrimary,
        fontSize: fontSize.hero,
        fontWeight: fontWeight.bold,
        marginTop: spacing.sm,
    },
    chargeBtn: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        ...shadows.sm,
    },
    chargeText: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.xs,
    },

    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: spacing.xs,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        color: colors.textTertiary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize.sm,
    },
    activeTabText: {
        color: colors.textOnPrimary,
    },

    list: { padding: spacing.lg },
    coupon: {
        flexDirection: 'row',
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    disabledCoupon: { opacity: 0.6 },
    couponLeft: {
        width: 100,
        backgroundColor: colors.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: colors.divider,
        borderStyle: 'dashed',
    },
    amount: {
        fontSize: fontSize.lg,
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
    condition: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    couponRight: {
        flex: 1,
        padding: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    couponTitle: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    couponDate: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
    },
    useBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        ...shadows.sm,
    },
    useBtnText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    statusText: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.textTertiary,
        fontSize: fontSize.lg,
    },
});

export default WalletScreen;