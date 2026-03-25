import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { authService } from '../services/authService';

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const AdminDashboardScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.icon}>⚙️</Text>
                <Text style={styles.title}>系统管理员后台</Text>
                <Text style={styles.subtitle}>管理系统配置与用户</Text>
            </View>
            <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => { authService.logout(); navigation.replace('Login'); }}
            >
                <Text style={styles.logoutText}>退出登录</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.xl,
    },
    card: {
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.xxxl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        marginBottom: spacing.xxl,
    },
    icon: {
        fontSize: 48,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: fontSize.title,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
    },
    logoutBtn: {
        backgroundColor: colors.error,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xxxl,
        borderRadius: borderRadius.full,
        ...shadows.sm,
    },
    logoutText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
});

export default AdminDashboardScreen;