import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { profileService } from '../services/profileService';
import { authService } from '../services/authService';

const defaultAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0SqHYZlIXyFFcCFeErv7z3OCT3dWL1Eb2_7H2rw85kJN-QpFQB9NJg1JxLfHuCIcc9LySyuY9gHTuNFRiQSUFM8n2tPxCcoUCuHVr8uHm0PM8ZtGLP7QMU3v8nwmLVsQjHJV_Xmx8pj2VI06I7Y2sT_i4dCsutqf6twJq3q-ck158JrAnEH2_JJ_3UW8OxWRCet5OikJ1MztLTr8IWYEs2qvK6uAcJ326SNeNfYtyh-5Hrc5P2mZIGeIKpWDoz2AF5UcrzZHEWx8u';

const ProfileScreen = ({ navigation }: any) => {
    const [user, setUser] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    // 表单状态
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await profileService.getMyProfile();
            setUser(data);
            // 初始化表单
            setNickname(data.nickname || '');
            setPhone(data.phone || '');
            setEmail(data.email || '');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const updateData = {
                ...user,
                nickname,
                phone,
                email
            };
            await profileService.updateProfile(updateData);
            setUser(updateData);
            setEditing(false);
            Alert.alert('成功', '个人资料已更新');
        } catch (e) {
            Alert.alert('失败', '更新失败，请重试');
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        navigation.replace('Login');
    };

    // 统计卡片组件
    const StatItem = ({ label, value }: any) => (
        <View style={styles.statItem}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    // 菜单项组件
    const MenuItem = ({ label, onPress, highlight = false }: any) => (
        <TouchableOpacity
            style={[styles.menuItem, highlight && styles.highlightItem]}
            onPress={onPress}
        >
            <Text style={[styles.menuLabel, highlight && styles.highlightText]}>{label}</Text>
            <Text style={styles.menuArrow}>{'>'}</Text>
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#e85a2d" />;

    return (
        <ScrollView style={styles.container}>
            {/* 头部信息 */}
            <View style={styles.header}>
                <Image
                    source={{ uri: user.avatarUrl || defaultAvatar }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{user.username || '用户'}</Text>
                    <Text style={styles.userId}>ID: {user.id || '-'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => setEditing(!editing)}
                >
                    <Text style={styles.editBtnText}>{editing ? '取消' : '编辑'}</Text>
                </TouchableOpacity>
            </View>

            {/* 编辑表单区域 */}
            {editing && (
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>修改资料</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>昵称</Text>
                        <TextInput style={styles.input} value={nickname} onChangeText={setNickname} placeholder="未设置" />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>手机</Text>
                        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="未绑定" />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>邮箱</Text>
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="未绑定" />
                    </View>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveText}>保存修改</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 统计数据 */}
            <View style={styles.statsRow}>
                <StatItem label="本月消费" value="¥0.00" />
                <StatItem label="累计订单" value="0" />
                <StatItem label="优惠券" value="0" />
            </View>

            {/* 顾客菜单列表 */}
            <View style={styles.menuList}>
                <MenuItem label="我的订单" onPress={() => navigation.navigate('OrderList')} />
                <MenuItem label="地址管理" onPress={() => navigation.navigate('AddressList')} />
                <MenuItem label="我的钱包 & 优惠券" onPress={() => navigation.navigate('Wallet')} />
                <MenuItem label="隐私政策" onPress={() => { }} />
            </View>

            {/* --- 新增：商家入口 --- */}
            <View style={[styles.menuList, { marginTop: 0 }]}>
                <MenuItem
                    label="我是商家 (进入后台)"
                    highlight={true}
                    onPress={() => navigation.navigate('MerchantDashboard')}
                />
                <MenuItem
                    label="商家入驻 / 认领店铺"
                    onPress={() => navigation.navigate('MerchantOnboarding')}
                />
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>退出登录</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
        padding: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.backgroundGradientEnd,
    },
    userInfo: { flex: 1, marginLeft: spacing.lg },
    username: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    userId: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
    editBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primaryBg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.frostedBorder,
    },
    editBtnText: {
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },

    formCard: {
        backgroundColor: colors.surface,
        padding: spacing.xl,
        marginBottom: spacing.md,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.md,
        color: colors.textPrimary,
    },
    inputGroup: { marginBottom: spacing.md },
    label: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: fontWeight.medium,
    },
    input: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: fontSize.md,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        marginTop: spacing.md,
        ...shadows.primary,
    },
    saveText: {
        color: colors.textOnPrimary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.md,
    },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.cardBg,
        padding: spacing.xl,
        justifyContent: 'space-between',
        marginBottom: spacing.md,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    statLabel: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginTop: spacing.xs,
        fontWeight: fontWeight.medium,
    },

    menuList: {
        backgroundColor: colors.surface,
        paddingVertical: spacing.sm,
        marginBottom: spacing.lg,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    highlightItem: {
        backgroundColor: colors.primaryBg,
    },
    highlightText: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
    menuLabel: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        fontWeight: fontWeight.medium,
    },
    menuArrow: {
        color: colors.textTertiary,
        fontSize: fontSize.lg,
    },

    logoutBtn: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.errorBg,
    },
    logoutText: {
        color: colors.error,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
});

export default ProfileScreen;