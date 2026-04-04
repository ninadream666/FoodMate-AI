import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import Feather from 'react-native-vector-icons/Feather';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('customer');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        if (!username || !password) {
            Alert.alert('提示', '请输入用户名和密码');
            return;
        }
        if (!isLogin && !email) {
            Alert.alert('提示', '请输入邮箱');
            return;
        }

        setLoading(true);
        try {
            await AsyncStorage.removeItem('token');

            if (isLogin) {
                console.log(`正在登录: ${username}, 角色: ${role}`);
                await authService.login(username, password, role);

                if (role === 'merchant') {
                    navigation.replace('MerchantDashboard');
                } else if (role === 'admin') {
                    navigation.replace('AdminDashboard');
                } else {
                    navigation.replace('Home');
                }
            } else {
                if (role === 'admin') {
                    Alert.alert('提示', '管理员账号不支持自助注册');
                    setLoading(false);
                    return;
                }
                await authService.register(username, email, password, role);
                // 注册成功后自动登录并跳转到问卷页面
                const loginData = await authService.login(username, password);
                if (loginData) {
                    navigation.replace('Survey');
                }
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.message || '操作失败，请重试';
            Alert.alert('错误', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#FFFFFF', '#FFF8F5', '#F4F2EE']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradient}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* 顶部品牌区域 */}
                        <View style={styles.brandArea}>
                            <View style={styles.avatarOuter}>
                                <View style={styles.avatarInner}>
                                    <View style={styles.logoRow}>
                                        <Text style={styles.logoLetterF}>F</Text>
                                        <Text style={styles.logoLetterA}>A</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.appTitle}>
                                {isLogin ? 'FoodMate-AI' : 'FoodMate-AI'}
                            </Text>
                            <Text style={styles.subTitle}>
                                {isLogin ? '登录以继续您的美食之旅' : '注册开启美好的美食体验'}
                            </Text>
                        </View>

                        {/* 毛玻璃表单卡片 */}
                        <View style={styles.glassCardOuter}>
                            <BlurView
                                style={StyleSheet.absoluteFill}
                                blurType="light"
                                blurAmount={20}
                                reducedTransparencyFallbackColor="white"
                            />
                            <View style={styles.glassCardInner}>

                                {/* 登录/注册，切换Tab */}
                                <View style={styles.tabBar}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={[styles.tabItem, isLogin && styles.tabItemActive]}
                                        onPress={() => setIsLogin(true)}
                                    >
                                        <Text style={[styles.tabLabel, isLogin && styles.tabLabelActive]}>登录</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={[styles.tabItem, !isLogin && styles.tabItemActive]}
                                        onPress={() => setIsLogin(false)}
                                    >
                                        <Text style={[styles.tabLabel, !isLogin && styles.tabLabelActive]}>注册</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 角色切换 */}
                                <View style={styles.roleRow}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => setRole('customer')}
                                        style={[styles.roleChip, role === 'customer' && styles.roleChipActive]}
                                    >
                                        <Text style={[styles.roleChipText, role === 'customer' && styles.roleChipTextActive]}>
                                            顾客
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => setRole('merchant')}
                                        style={[styles.roleChip, role === 'merchant' && styles.roleChipActive]}
                                    >
                                        <Text style={[styles.roleChipText, role === 'merchant' && styles.roleChipTextActive]}>
                                            商家
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 输入框区域 */}
                                <View style={styles.inputGroup}>
                                    {/* 用户名 */}
                                    <View style={styles.inputRow}>
                                        <TextInput
                                            style={styles.inputField}
                                            placeholder="用户名"
                                            placeholderTextColor={colors.textTertiary}
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    {/* 邮箱 - 仅注册显示 */}
                                    {!isLogin && (
                                        <View style={styles.inputRow}>
                                            <TextInput
                                                style={styles.inputField}
                                                placeholder="邮箱地址"
                                                placeholderTextColor={colors.textTertiary}
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    )}

                                    {/* 密码 */}
                                    <View style={styles.inputRow}>
                                        <TextInput
                                            style={[styles.inputField, { flex: 1 }]}
                                            placeholder="密码"
                                            placeholderTextColor={colors.textTertiary}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeBtn}
                                            onPress={() => setShowPassword(!showPassword)}
                                            activeOpacity={0.6}
                                        >
                                            <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color={colors.textTertiary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* 忘记密码 */}
                                {isLogin && (
                                    <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.6}>
                                        <Text style={styles.forgotText}>忘记密码?</Text>
                                    </TouchableOpacity>
                                )}

                                {/* 提交按钮 */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                    style={[styles.submitBtnWrap, loading && styles.btnDisabled]}
                                >
                                    <LinearGradient
                                        colors={['#F9A882', '#F2784B', '#D9613A']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.submitBtn}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color={colors.textOnPrimary} />
                                        ) : (
                                            <Text style={styles.submitBtnText}>
                                                {isLogin ? '登 录' : '注 册'}
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 底部切换 */}
                        <View style={styles.bottomRow}>
                            <Text style={styles.bottomText}>
                                {isLogin ? '还没有账户？' : '已有账户？'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} activeOpacity={0.6}>
                                <Text style={styles.bottomLink}>
                                    {isLogin ? '立即注册' : '去登录'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.xxl,
        paddingBottom: spacing.xxxl,
    },

    // ---- 品牌区域 ----
    brandArea: {
        alignItems: 'center',
        marginBottom: spacing.xxl + 8,
        marginTop: 60,
        paddingBottom: 40,
    },
    avatarOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(242, 120, 75, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatarInner: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(242, 120, 75, 0.12)',
        shadowColor: '#F2784B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 6,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    logoLetterF: {
        fontSize: 36,
        fontWeight: fontWeight.bold,
        color: '#F2784B',
        letterSpacing: -1,
        textShadowColor: 'rgba(200, 80, 40, 0.35)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
    },
    logoLetterA: {
        fontSize: 28,
        fontWeight: fontWeight.bold,
        color: '#D9613A',
        letterSpacing: -0.5,
        marginLeft: 1,
        textShadowColor: 'rgba(180, 60, 30, 0.35)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
    },
    appTitle: {
        fontSize: 26,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        letterSpacing: -0.3,
        marginBottom: spacing.xs,
    },
    subTitle: {
        fontSize: fontSize.md,
        color: colors.textTertiary,
        fontWeight: fontWeight.regular,
        textAlign: 'center',
    },

    // ---- 毛玻璃卡片 ----
    glassCardOuter: {
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.65)',
        overflow: 'hidden',
        shadowColor: '#2C3038',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 6,
    },
    glassCardInner: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        padding: spacing.xxl,
    },

    // ---- Tab 切换 ----
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(244, 242, 238, 0.5)',
        borderRadius: borderRadius.full,
        padding: 3,
        marginBottom: spacing.xl,
        height: 46,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.full,
    },
    tabItemActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#2C3038',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    tabLabel: {
        color: colors.textTertiary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize.md,
    },
    tabLabelActive: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },

    // ---- 角色切换（Chip 样式） ----
    roleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    roleChip: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: 'rgba(237, 233, 227, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    roleChipActive: {
        borderColor: 'rgba(242, 120, 75, 0.4)',
        backgroundColor: 'rgba(255, 246, 242, 0.9)',
        shadowColor: '#F2784B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
    },
    roleChipText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        fontWeight: fontWeight.semibold,
    },
    roleChipTextActive: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },

    // ---- 输入框 ----
    inputGroup: {
        gap: spacing.md,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(247, 246, 243, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(237, 233, 227, 0.5)',
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.lg + 2,
        height: 52,
    },
    inputIcon: {
        fontSize: 18,
        color: colors.textTertiary,
        marginRight: spacing.md,
        width: 22,
        textAlign: 'center',
    },
    inputField: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.textPrimary,
        paddingVertical: 0,
    },
    eyeBtn: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    eyeIcon: {
        fontSize: 20,
        color: colors.textTertiary,
    },

    // ---- 忘记密码 ----
    forgotBtn: {
        alignSelf: 'flex-end',
        marginTop: spacing.sm + 2,
    },
    forgotText: {
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },

    // ---- 提交按钮 ----
    submitBtnWrap: {
        marginTop: spacing.xl,
        borderRadius: borderRadius.full,
        shadowColor: '#F2784B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    submitBtn: {
        borderRadius: borderRadius.full,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnDisabled: {
        opacity: 0.6,
    },
    submitBtnText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        letterSpacing: 2,
    },

    // ---- 底部 ----
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xxl,
        gap: spacing.xs,
    },
    bottomText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
    },
    bottomLink: {
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
});

export default LoginScreen;
