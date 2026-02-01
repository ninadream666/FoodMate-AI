import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { authService } from '../../services/authService';

interface MerchantHeaderProps {
    merchant?: {
        name: string;
    };
}

export default function MerchantHeader({ merchant }: MerchantHeaderProps) {
    const navigation = useNavigation();

    const handleLogout = () => {
        Alert.alert(
            '退出登录',
            '确定要退出登录吗？',
            [
                {
                    text: '取消',
                    style: 'cancel',
                },
                {
                    text: '确定',
                    onPress: () => {
                        authService.logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' as never }],
                        });
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.header}>
            {/* Left: Store Context */}
            <View style={styles.leftSection}>
                <View style={styles.iconContainer}>
                    <Text style={styles.storeIcon}>🏪</Text>
                </View>
                <Text style={styles.storeName}>
                    {merchant ? merchant.name : '加载店铺中...'}
                </Text>
            </View>

            {/* Right: Logout */}
            <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
            >
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>退出</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 64,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#fed7aa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    storeIcon: {
        fontSize: 16,
    },
    storeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutIcon: {
        fontSize: 16,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
});