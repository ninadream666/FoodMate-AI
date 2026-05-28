import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { merchantService } from '../../services/merchantService';
import { settlementService } from '../../services/settlementService';
import { authService } from '../../services/authService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme/NordicTheme';

interface MerchantInfo {
    id: number;
    name: string;
    address?: string;
}

const MerchantDashboardScreen = ({ navigation }: any) => {
    const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
    const [allMerchants, setAllMerchants] = useState<MerchantInfo[]>([]);
    const [showSelector, setShowSelector] = useState(false);
    const [loading, setLoading] = useState(true);
    const [todayEarnings, setTodayEarnings] = useState<any>(null);

    useEffect(() => {
        fetchMerchants();
    }, []);

    const fetchMerchants = async () => {
        try {
            const list = await merchantService.getAllMyMerchants();
            const merchants = Array.isArray(list) ? list : [];
            setAllMerchants(merchants);
            if (merchants.length === 0) {
                navigation.replace('MerchantOnboarding');
            } else if (merchants.length === 1) {
                setMerchant(merchants[0]);
                settlementService.getTodaySummary(merchants[0].id).then(setTodayEarnings).catch(() => {});
            } else {
                // 多个店铺，显示选择界面
                setShowSelector(true);
            }
        } catch (error: any) {
            console.error('获取商家信息失败:', error);
            if (error.message === 'UNAUTHORIZED') {
                navigation.replace('Login');
            } else {
                navigation.replace('MerchantOnboarding');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('退出登录', '确定要退出当前账号吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '确定',
                style: 'destructive',
                onPress: async () => {
                    await authService.logout();
                    navigation.replace('Login');
                }
            }
        ]);
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

    // 多店铺选择界面
    if (showSelector && !merchant) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={[styles.contentContainer, { paddingTop: spacing.xl }]}>
                    <Text style={styles.selectorTitle}>选择要管理的店铺</Text>
                    <Text style={styles.selectorSubtitle}>您有 {allMerchants.length} 家店铺</Text>
                    {allMerchants.map((m) => (
                        <TouchableOpacity
                            key={m.id}
                            style={styles.selectorCard}
                            onPress={() => {
                                setMerchant(m);
                                setShowSelector(false);
                            }}
                        >
                            <View style={styles.profileAvatar}>
                                <Text style={styles.avatarText}>{(m.name || '店')[0]}</Text>
                            </View>
                            <View style={styles.selectorInfo}>
                                <Text style={styles.shopName}>{m.name}</Text>
                                {m.address ? <Text style={styles.profileSubtitle}>{m.address}</Text> : null}
                            </View>
                            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.newShopBtn}
                        onPress={() => navigation.navigate('MerchantOnboarding')}
                    >
                        <Feather name="plus" size={18} color={colors.primary} />
                        <Text style={styles.newShopText}>创建或认领新店铺</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                {/* 顶部店铺信息 - 点击可切换店铺 */}
                <TouchableOpacity
                    style={styles.profileSection}
                    onPress={() => {
                        if (allMerchants.length > 1) {
                            setMerchant(null);
                            setShowSelector(true);
                        } else {
                            navigation.navigate('Profile');
                        }
                    }}
                >
                    <View style={styles.profileAvatar}>
                        <Text style={styles.avatarText}>{(merchant?.name || '店')[0]}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.shopName}>{merchant?.name || '我的店铺'}</Text>
                        <Text style={styles.profileSubtitle}>
                            {allMerchants.length > 1 ? `${allMerchants.length} 家店铺 · 点击切换` : '个人中心 · 账户设置'}
                        </Text>
                    </View>
                    <Feather name={allMerchants.length > 1 ? 'repeat' : 'chevron-right'} size={18} color={colors.textTertiary} />
                </TouchableOpacity>

                {/* 今日收益卡片 */}
                {todayEarnings && (
                    <View style={styles.earningsCard}>
                        <Text style={styles.earningsLabel}>今日收益</Text>
                        <Text style={styles.earningsValue}>¥{(todayEarnings.totalCommission || todayEarnings.netIncome || 0).toFixed(2)}</Text>
                        <Text style={styles.earningsSub}>订单数 {todayEarnings.orderCount || 0}</Text>
                    </View>
                )}

                {/* 第一组功能列表 */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MerchantOrders', { merchantId: merchant?.id, merchantName: merchant?.name })}>
                        <Text style={styles.menuTitle}>订单管理</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SmartPricing', { merchantId: merchant?.id, merchantName: merchant?.name })}>
                        <Text style={styles.menuTitle}>AI 智能定价</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MenuManagement', { merchantId: merchant?.id, merchantName: merchant?.name })}>
                        <Text style={styles.menuTitle}>菜单管理</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => navigation.navigate('RefundAudit', { merchantId: merchant?.id, merchantName: merchant?.name })}>
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
                    <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettlementDashboard', { merchantId: merchant?.id, merchantName: merchant?.name })}>
                        <Text style={styles.menuTitle}>财务结算</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => navigation.navigate('ServiceMarketplace', { merchantId: merchant?.id, merchantName: merchant?.name })}>
                        <Text style={styles.menuTitle}>服务市场</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* 第三组 - 经营报表 */}
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => {
                        Alert.alert('经营报表', '完整经营数据分析请前往 PC 端管理后台查看');
                    }}>
                        <Text style={styles.menuTitle}>经营报表</Text>
                        <Text style={styles.menuSubLabel}>请至PC端</Text>
                        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>
                
                {/* 退出登录按钮 */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>退出登录</Text>
                </TouchableOpacity>

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

    // 今日收益
    earningsCard: {
        backgroundColor: colors.primary,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    earningsLabel: {
        fontSize: fontSize.sm,
        color: 'rgba(255,255,255,0.7)',
    },
    earningsValue: {
        fontSize: 32,
        fontWeight: fontWeight.bold,
        color: colors.textOnPrimary,
        marginVertical: spacing.xs,
    },
    earningsSub: {
        fontSize: fontSize.sm,
        color: 'rgba(255,255,255,0.7)',
    },

    // 店铺选择界面
    selectorTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    selectorSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    selectorCard: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xl,
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
    },
    selectorInfo: {
        flex: 1,
        marginLeft: spacing.lg,
    },
    newShopBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
    },
    newShopText: {
        fontSize: fontSize.md,
        color: colors.primary,
        fontWeight: fontWeight.medium,
        marginLeft: spacing.sm,
    },
    
    // 退出登录按钮样式
    logoutBtn: {
        backgroundColor: '#FFFFFF',
        padding: spacing.md,
        alignItems: 'center',
        marginBottom: spacing.sm,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    logoutText: {
        color: colors.error,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
});

export default MerchantDashboardScreen;