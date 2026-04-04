import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const PaymentSuccessScreen = ({ route, navigation }: any) => {
    const { order } = route.params || {};

    const handleViewDetail = () => {
        // 跳转到订单追踪，替换当前历史，防止用户点返回回到支付成功页
        navigation.replace('OrderTracking', { order });
    };

    const handleHome = () => {
        navigation.navigate('Home');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.card}>
                {/* 成功图标 */}
                <View style={styles.iconContainer}>
                    <Text style={styles.checkIcon}>✓</Text>
                </View>

                <Text style={styles.title}>支付成功</Text>
                <Text style={styles.subtitle}>下单成功，美味即将送达！</Text>

                <View style={styles.divider} />

                {/* 订单详情 */}
                <View style={styles.row}>
                    <Text style={styles.label}>订单号：</Text>
                    <Text style={styles.value}>{order?.id || 'SN---'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>预计送达：</Text>
                    <Text style={styles.value}>{order?.estimatedTime || '尽快送达'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>餐厅：</Text>
                    <Text style={styles.value}>{order?.restaurantName || '未知餐厅'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>支付金额：</Text>
                    <Text style={styles.price}>¥{order?.total?.toFixed(2) || '0.00'}</Text>
                </View>

                {/* 优惠信息 */}
                {order?.couponDiscount > 0 && (
                    <View style={styles.savingBox}>
                        <Text style={styles.savingIcon}>✨</Text>
                        <Text style={styles.savingText}>
                            AI智能优化已生效，为您节省 ¥{order.couponDiscount.toFixed(2)}
                        </Text>
                    </View>
                )}

                <View style={styles.divider} />

                <TouchableOpacity onPress={handleViewDetail} activeOpacity={0.7} style={{ width: '100%' }}>
                    <LinearGradient
                        colors={['#FFA07A', '#C4422E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.primaryBtn}
                    >
                        <Text style={styles.primaryBtnText}>查看订单详情</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={handleHome}>
                    <Text style={styles.secondaryBtnText}>返回首页</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: spacing.xl,
        paddingTop: 60,
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xxl,
        padding: spacing.xxxl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.successBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    checkIcon: {
        fontSize: 40,
        color: colors.success,
        fontWeight: fontWeight.bold,
    },
    title: {
        fontSize: fontSize.title,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: spacing.xl,
    },

    row: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    label: {
        color: colors.textTertiary,
        fontSize: fontSize.sm,
    },
    value: {
        color: colors.textPrimary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
    price: {
        color: colors.primary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },

    savingBox: {
        flexDirection: 'row',
        backgroundColor: colors.successBg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        width: '100%',
        alignItems: 'center',
        marginTop: spacing.md,
        borderWidth: 1,
        borderColor: colors.frostedBorder,
    },
    savingIcon: { marginRight: spacing.sm },
    savingText: {
        color: colors.success,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },

    primaryBtn: {
        width: '100%',
        height: 54,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    primaryBtnText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    secondaryBtn: {
        width: '100%',
        height: 54,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    secondaryBtnText: {
        color: colors.primary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
});

export default PaymentSuccessScreen;