import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

interface NavItem {
    screen: string;
    icon: string;
    label: string;
}

interface MerchantSidebarProps {
    user?: {
        nickname?: string;
        role?: string;
    };
}

export default function MerchantSidebar({ user }: MerchantSidebarProps) {
    const navigation = useNavigation();
    const route = useRoute();

    // 导航配置
    const navItems: NavItem[] = [
        { screen: 'MenuManagement', icon: '📋', label: '菜单管理' },
        { screen: 'SmartPricing', icon: '🤖', label: 'AI 定价' },
        { screen: 'RefundAudit', icon: '💱', label: '退款审批' },
        { screen: 'ServiceMarketplace', icon: '🛠️', label: '平台服务' },
        { screen: 'SettlementDashboard', icon: '💰', label: '结算分成' },
        { screen: 'MerchantShopInfo', icon: '🏪', label: '店铺信息' },
    ];

    const handleNavigation = (screen: string) => {
        navigation.navigate(screen as never);
    };

    return (
        <View style={styles.container}>
            {/* Logo Area */}
            <View style={styles.logoArea}>
                <View style={styles.logoIcon}>
                    <Text style={styles.logoIconText}>🍽️</Text>
                </View>
                <Text style={styles.logoText}>
                    商家工作台
                </Text>
            </View>

            {/* Navigation */}
            <ScrollView style={styles.navigation}>
                <View style={styles.navContainer}>
                    {navItems.map((item) => {
                        const isActive = route.name === item.screen;
                        return (
                            <TouchableOpacity
                                key={item.screen}
                                onPress={() => handleNavigation(item.screen)}
                                style={[
                                    styles.navItem,
                                    isActive ? styles.navItemActive : styles.navItemInactive
                                ]}
                            >
                                <Text style={styles.navIcon}>{item.icon}</Text>
                                <Text
                                    style={[
                                        styles.navLabel,
                                        isActive ? styles.navLabelActive : styles.navLabelInactive
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRightWidth: 1,
        borderRightColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    logoArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
    },
    logoIcon: {
        backgroundColor: '#fed7aa',
        borderRadius: 12,
        padding: 8,
    },
    logoIconText: {
        fontSize: 20,
    },
    logoText: {
        color: '#1f2937',
        fontSize: 18,
        fontWeight: 'bold',
    },
    navigation: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    navContainer: {
        gap: 6,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    navItemActive: {
        backgroundColor: '#fed7aa',
    },
    navItemInactive: {
        backgroundColor: 'transparent',
    },
    navIcon: {
        fontSize: 16,
    },
    navLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    navLabelActive: {
        color: '#ea580c',
    },
    navLabelInactive: {
        color: '#6b7280',
    },
});