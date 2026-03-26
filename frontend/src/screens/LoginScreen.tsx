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
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

// 注意：这里暂时注释掉未迁移的服务，防止报错
// import adminAuthService from '../../services/admin/authService';
// import { profileService } from '../../services/profileService';

const LoginScreen = ({ navigation }: any) => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('customer');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        // 基础校验
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
            // 清除任何旧的过期 token，避免 500 错误
            await AsyncStorage.removeItem('token');

            if (isLogin) {
                // --- 登录逻辑 ---
                console.log(`正在登录: ${username}, 角色: ${role}`);

                // 调用我们之前写的 authService (会自动存 Token 到 AsyncStorage)
                await authService.login(username, password, role);

                // --- 登录成功后的跳转逻辑 ---
                if (role === 'merchant') {
                    navigation.replace('MerchantDashboard');
                } else if (role === 'admin') {
                    navigation.replace('AdminDashboard');
                } else {
                    // 顾客逻辑：这里将来可以加 Profile 检查
                    navigation.replace('Home');
                }

            } else {
                // --- 注册逻辑 ---
                if (role === 'admin') {
                    Alert.alert('提示', '管理员账号不支持自助注册');
                    setLoading(false);
                    return;
                }
                await authService.register(username, email, password, role);
                Alert.alert('成功', '注册成功！请直接登录。');
                setIsLogin(true); // 切换回登录态
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.message || '操作失败，请重试';
            Alert.alert('错误', msg);
        } finally {
            setLoading(false);
        }
    };

    // 角色选择组件 - 北欧磨砂卡片风格
    const RoleOption = ({ label, value, iconText }: any) => {
        const isSelected = role === value;
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setRole(value)}
                style={[
                    styles.roleBox,
                    isSelected && styles.roleBoxSelected
                ]}
            >
                <View style={[styles.roleIconCircle, isSelected && styles.roleIconCircleSelected]}>
                    <Text style={styles.roleIconText}>{iconText}</Text>
                </View>
                <Text style={[styles.roleText, isSelected && styles.roleTextSelected]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* 顶部品牌区域 */}
                        <View style={styles.brandArea}>
                            <View style={styles.logoCircle}>
                                <Text style={styles.logoEmoji}>🍽</Text>
                            </View>
                            <Text style={styles.appTitle}>FoodMate AI</Text>
                            <Text style={styles.subTitle}>
                                {isLogin ? '欢迎回来，美好一天从这里开始' : '创建新账户，开启美食之旅'}
                            </Text>
                        </View>

                        {/* 磨砂表单卡片 */}
                        <View style={styles.formCard}>

                            {/* 登录/注册 切换 Tab */}
                            <View style={styles.tabContainer}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={[styles.tabButton, isLogin && styles.tabButtonActive]}
                                    onPress={() => setIsLogin(true)}
                                >
                                    <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>登录</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
                                    onPress={() => setIsLogin(false)}
                                >
                                    <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>注册</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 角色选择 */}
                            <Text style={styles.sectionLabel}>选择身份</Text>
                            <View style={styles.roleGrid}>
                                <RoleOption label="顾客" value="customer" iconText="👤" />
                                <RoleOption label="商家" value="merchant" iconText="🏪" />
                            </View>

                            {/* 分隔线 */}
                            <View style={styles.divider} />

                            {/* 表单输入区 */}
                            <View style={styles.formFields}>
                                <Text style={styles.inputLabel}>用户名</Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputIcon}>👤</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="请输入用户名"
                                        placeholderTextColor={colors.textTertiary}
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>

                                {!isLogin && (
                                    <>
                                        <Text style={styles.inputLabel}>邮箱地址</Text>
                                        <View style={styles.inputWrapper}>
                                            <Text style={styles.inputIcon}>✉️</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="example@email.com"
                                                placeholderTextColor={colors.textTertiary}
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </>
                                )}

                                <Text style={styles.inputLabel}>密码</Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.inputIcon}>🔒</Text>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="请输入密码"
                                        placeholderTextColor={colors.textTertiary}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword(!showPassword)}
                                        activeOpacity={0.6}
                                    >
                                        <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 忘记密码 - 仅登录态显示 */}
                                {isLogin && (
                                    <TouchableOpacity style={styles.forgotButton} activeOpacity={0.6}>
                                        <Text style={styles.forgotText}>忘记密码?</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* 提交按钮 */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.submitButton, loading && styles.buttonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={colors.textOnPrimary} />
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {isLogin ? '登 录' : '注 册'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* 底部切换提示 */}
                        <View style={styles.bottomHint}>
                            <Text style={styles.bottomHintText}>
                                {isLogin ? '还没有账户？' : '已有账户？'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} activeOpacity={0.6}>
                                <Text style={styles.bottomHintLink}>
                                    {isLogin ? '立即注册' : '去登录'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

// ============================================================
// 样式表 - 北欧磨砂风格登录页
// ============================================================
const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xxxl,
    },

    // ---- 品牌区域 ----
    brandArea: {
        alignItems: 'center',
        marginTop: spacing.xxxl + 8,
        marginBottom: spacing.xxl,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.primaryLight,
        ...shadows.sm,
    },
    logoEmoji: {
        fontSize: 32,
    },
    appTitle: {
        fontSize: fontSize.title,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: spacing.xs,
    },
    subTitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        fontWeight: fontWeight.regular,
        textAlign: 'center',
    },

    // ---- 磨砂表单卡片 ----
    formCard: {
        backgroundColor: colors.surfaceFrosted,
        borderRadius: borderRadius.xxl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.frostedBorder,
        ...shadows.frosted,
    },

    // ---- Tab 切换 ----
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundSection,
        borderRadius: borderRadius.full,
        padding: spacing.xs,
        marginBottom: spacing.xl,
        height: 48,
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.full,
    },
    tabButtonActive: {
        backgroundColor: colors.surface,
        ...shadows.sm,
    },
    tabText: {
        color: colors.textTertiary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize.md,
    },
    tabTextActive: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },

    // ---- 角色选择 ----
    sectionLabel: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    roleGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    roleBox: {
        flex: 1,
        paddingVertical: spacing.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface,
    },
    roleBoxSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryBg,
        ...shadows.sm,
    },
    roleIconCircle: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.full,
        backgroundColor: colors.backgroundSection,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    roleIconCircleSelected: {
        backgroundColor: colors.primarySoft,
    },
    roleIconText: {
        fontSize: 20,
    },
    roleText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        fontWeight: fontWeight.semibold,
    },
    roleTextSelected: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },

    // ---- 分隔线 ----
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginBottom: spacing.lg,
    },

    // ---- 表单字段 ----
    formFields: {},
    inputLabel: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundSection,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
    },
    inputIcon: {
        fontSize: 16,
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    eyeButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    eyeText: {
        fontSize: 18,
    },

    // ---- 忘记密码 ----
    forgotButton: {
        alignSelf: 'flex-end',
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    forgotText: {
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },

    // ---- 提交按钮 ----
    submitButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.lg,
        ...shadows.primary,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        letterSpacing: 1,
    },

    // ---- 底部切换提示 ----
    bottomHint: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xl,
        gap: spacing.xs,
    },
    bottomHintText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
    },
    bottomHintLink: {
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },
});

export default LoginScreen;
