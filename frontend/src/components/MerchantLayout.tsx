import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { merchantService } from '../services/merchantService';
import MerchantSidebar from './merchant/MerchantSidebar';
import MerchantHeader from './merchant/MerchantHeader';

interface MerchantLayoutProps {
    children: React.ReactNode;
}

interface Merchant {
    id: string;
    name: string;
}

interface User {
    id: string;
    nickname?: string;
    role?: string;
}

/**
 * 商家端专用布局 (React Native版本)
 */
export default function MerchantLayout({ children }: MerchantLayoutProps) {
    const navigation = useNavigation();
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [loading, setLoading] = useState(true);

    // 从 AsyncStorage 读取当前用户信息 (在实际React Native项目中应该使用AsyncStorage)
    const user: User = {
        id: '1',
        nickname: '商家用户',
        role: 'MERCHANT'
    };

    useEffect(() => {
        // 简单的权限检查
        const userRole = user.role ? user.role.toUpperCase() : '';

        if (userRole !== 'MERCHANT' && userRole !== 'ADMIN') {
            console.warn('权限不足，当前角色:', user.role);
            // 在React Native中，需要使用Alert而不是alert
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' as never }],
            });
            return;
        }

        fetchMerchantInfo();
    }, []);

    const fetchMerchantInfo = async () => {
        try {
            const data = await merchantService.getMyMerchant();
            setMerchant(data);
            setLoading(false);
        } catch (error) {
            console.error("加载商铺信息失败:", error);

            // 如果后端返回特定错误码表示"没有商铺"，则跳转到入驻页
            if (error instanceof Error && error.message === 'MERCHANT_NOT_FOUND') {
                console.log("检测到未入驻商家，跳转至入驻向导...");
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MerchantOnboarding' as never }],
                });
                return;
            }

            // 其他错误（如网络问题），也停止 Loading，以免白屏
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                    <Text style={styles.loadingText}>加载商家工作台...</Text>
                </View>
            </View>
        );
    }

    // 如果加载完了但没有 merchant 信息（且不是因为要去 onboarding），
    // 说明发生了其他错误，此时不应该渲染 Layout，以免子组件报错
    if (!merchant) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>无法加载店铺信息。</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MerchantHeader merchant={merchant} />
            <View style={styles.contentRow}>
                <MerchantSidebar user={user} />
                <View style={styles.mainContent}>
                    {children}
                </View>
            </View>
        </View>
    );
}

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    loadingContent: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    loadingText: {
        color: colors.textSecondary,
        fontSize: fontSize.md,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    errorText: {
        color: colors.textSecondary,
        fontSize: fontSize.md,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentRow: {
        flex: 1,
        flexDirection: 'row',
    },
    mainContent: {
        flex: 1,
        padding: spacing.lg,
    },
});