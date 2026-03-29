import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { merchantService } from '../../services/merchantService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/NordicTheme';

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
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                {/* 顶部个人中心入口 */}
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
                    <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                </TouchableOpacity>

                {/* 第一组功能列表 */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SmartPricing')}>
                        <Text style={styles.menuTitle}>AI 智能定价</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MenuManagement')}>
                        <Text style={styles.menuTitle}>菜单管理</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => navigation.navigate('RefundAudit')}>
                        <Text style={styles.menuTitle}>退款审批</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* 第二组功能列表 */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MerchantShopInfo')}>
                        <Text style={styles.menuTitle}>店铺信息</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettlementDashboard')}>
                        <Text style={styles.menuTitle}>财务结算</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => navigation.navigate('ServiceMarketplace')}>
                        <Text style={styles.menuTitle}>服务市场</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* 第三组 - 经营报表 */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => { }}>
                        <Text style={styles.menuTitle}>经营报表</Text>
                        <Text style={styles.menuSubLabel}>请至PC端</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8E4DD',
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
        fontSize: fontSize.md,
    },

    profileSection: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xl,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    profileAvatar: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        color: colors.textOnPrimary,
    },
    profileInfo: {
        flex: 1,
        marginLeft: spacing.lg,
    },
    shopName: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    profileSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
    },

    menuGroup: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuTitle: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        fontWeight: fontWeight.medium,
    },
    menuSubLabel: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginRight: spacing.sm,
    },
});

export default MerchantDashboardScreen;