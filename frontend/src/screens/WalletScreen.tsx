import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert // <--- 1. 必须引入这个
} from 'react-native';
import { walletService, isCouponExpired } from '../services/walletService';
import { authService } from '../services/authService';

const WalletScreen = ({ navigation }: any) => {
    const [balance, setBalance] = useState(0);
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('AVAILABLE'); // 'AVAILABLE' | 'EXPIRED'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // 1. 获取余额
            const balanceData = await walletService.getBalance();
            setBalance(balanceData.balance);

            // 2. 获取优惠券
            const user = await authService.getCurrentUser();
            if (user && user.id) {
                const list = await walletService.getAllCoupons(user.id);
                setCoupons(list);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
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
            {/* 余额卡片 */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>当前余额</Text>
                    {/* 修改点：使用 Alert.alert */}
                    <TouchableOpacity style={styles.chargeBtn} onPress={() => Alert.alert('提示', '充值功能开发中')}>
                        <Text style={styles.chargeText}>充值</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.balanceValue}>¥ {balance.toFixed(2)}</Text>
            </View>

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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },

    balanceCard: {
        backgroundColor: '#e85a2d', // 模拟渐变，使用纯色代替
        margin: 16,
        padding: 20,
        borderRadius: 12,
        elevation: 4,
    },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
    balanceValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 8 },
    chargeBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    chargeText: { color: '#e85a2d', fontWeight: 'bold', fontSize: 12 },

    tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#e85a2d' },
    tabText: { color: '#999', fontWeight: 'bold' },
    activeTabText: { color: '#e85a2d' },

    list: { padding: 16 },
    coupon: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 12,
        overflow: 'hidden',
        elevation: 1,
    },
    disabledCoupon: { opacity: 0.6 },
    couponLeft: {
        width: 100,
        backgroundColor: '#fff5f2',
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#eee',
        borderStyle: 'dashed',
    },
    amount: { fontSize: 16, color: '#e85a2d', fontWeight: 'bold' },
    condition: { fontSize: 10, color: '#666', marginTop: 4 },
    couponRight: { flex: 1, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    couponTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    couponDate: { fontSize: 10, color: '#999' },
    useBtn: { backgroundColor: '#e85a2d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    useBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    statusText: { fontSize: 12, color: '#999' },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
});

export default WalletScreen;