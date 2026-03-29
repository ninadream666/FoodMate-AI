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
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

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
    const MenuItem = ({ label, onPress, highlight = false, isLast = false }: any) => (
        <TouchableOpacity
            style={[styles.menuItem, highlight && styles.highlightItem, isLast && { borderBottomWidth: 0 }]}
            onPress={onPress}
        >
            <Text style={[styles.menuLabel, highlight && styles.highlightText]}>{label}</Text>
            <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
    );

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color={colors.primary} />;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {/* 头部信息 */}
            <View style={styles.header}>
                <Image
                    source={{ uri: user.avatarUrl || defaultAvatar }}
                    style={styles.avatar}
                />
                <View style={{ flex: 1, marginLeft: spacing.lg }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.username}>{user.username || '用户'}</Text>
                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => setEditing(!editing)}
                        >
                            <Text style={styles.editBtnText}>{editing ? '取消' : '编辑'}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userId}>ID: {user.id || '-'}</Text>
                </View>
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
                    <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
                        <LinearGradient
                            colors={['#FFA07A', '#C4422E']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.saveBtn}
                        >
                            <Text style={styles.saveText}>保存修改</Text>
                        </LinearGradient>
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
                <MenuItem label="隐私政策" onPress={() => { }} isLast />
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
                    isLast
                />
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>退出登录</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8E4DD',
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: spacing.lg,
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
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
        backgroundColor: '#FFFFFF',
        padding: spacing.xl,
        marginBottom: spacing.md,
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
        padding: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        marginTop: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    saveText: {
        color: colors.textOnPrimary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.md,
    },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: spacing.xl,
        justifyContent: 'space-between',
        marginBottom: spacing.md,
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
        backgroundColor: '#FFFFFF',
        marginBottom: spacing.md,
        marginHorizontal: spacing.lg,
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

export default ProfileScreen;