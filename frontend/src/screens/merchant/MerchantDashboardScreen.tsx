import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { merchantService } from '../../services/merchantService';

interface MerchantInfo {
    id: number;
    name: string;
    address?: string;
}

const MerchantDashboardScreen = ({ navigation }: any) => {
    const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMerchant();
    }, []);

    const fetchMerchant = async () => {
        try {
            const data = await merchantService.getMyMerchant();
            setMerchant(data);
        } catch (error) {
            console.error('获取商家信息失败:', error);
            // 如果获取失败，可能用户还没有商家，跳转到入驻页
            // navigation.navigate('MerchantOnboarding');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff6b35" />
                    <Text style={styles.loadingText}>加载商家信息...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* 顶部个人中心入口 - 微信风格 */}
                <TouchableOpacity
                    style={styles.profileSection}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <View style={styles.profileAvatar}>
                        <Text style={styles.avatarText}>{(merchant?.name || '店')[0]}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.shopName}>{merchant?.name || '我的店铺'}</Text>
                        <Text style={styles.profileSubtitle}>个人中心 · 账户设置</Text>
                    </View>
                    <Text style={styles.arrowIcon}>›</Text>
                </TouchableOpacity>

                {/* 第一组功能列表 */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('SmartPricing')}
                    >
                        <Text style={styles.menuTitle}>AI 智能定价</Text>
                        <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('MenuManagement')}
                    >
                        <Text style={styles.menuTitle}>菜单管理</Text>
                        <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('RefundAudit')}
                    >
                        <Text style={styles.menuTitle}>退款审批</Text>
                        <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* 第二组功能列表 */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('MerchantShopInfo')}
                    >
                        <Text style={styles.menuTitle}>店铺信息</Text>
                        <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('SettlementDashboard')}
                    >
                        <Text style={styles.menuTitle}>财务结算</Text>
                        <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('ServiceMarketplace')}
                    >
                        <Text style={styles.menuTitle}>服务市场</Text>
                        <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* 第三组 - 经营报表 */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { }}>
                        <Text style={styles.menuTitle}>经营报表</Text>
                        <Text style={styles.menuSubLabel}>请至PC端</Text>
                        <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#666', fontSize: 14 },

    // 微信风格个人中心区域
    profileSection: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
        marginBottom: 10,
    },
    profileAvatar: {
        width: 64,
        height: 64,
        borderRadius: 8,
        backgroundColor: '#ff6b35',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 32,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    shopName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    profileSubtitle: {
        fontSize: 14,
        color: '#999',
    },
    arrowIcon: {
        fontSize: 24,
        color: '#ccc',
        fontWeight: '300',
    },

    // 微信风格菜单组
    menuGroup: {
        backgroundColor: '#fff',
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    menuTitle: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    menuSubLabel: {
        fontSize: 12,
        color: '#999',
        marginRight: 8,
    },
    divider: {
        height: 0.5,
        backgroundColor: '#eee',
        marginLeft: 20,
    },
});

export default MerchantDashboardScreen;