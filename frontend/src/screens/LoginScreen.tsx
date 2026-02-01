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
import { authService } from '../services/authService';

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

    // 角色选择组件
    const RoleOption = ({ label, value, iconText }: any) => {
        const isSelected = role === value;
        return (
            <TouchableOpacity
                onPress={() => setRole(value)}
                style={[
                    styles.roleBox,
                    isSelected && styles.roleBoxSelected
                ]}
            >
                <Text style={{ fontSize: 20, marginBottom: 5 }}>{iconText}</Text>
                <Text style={[styles.roleText, isSelected && styles.roleTextSelected]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container}>

                    {/* 标题区域 */}
                    <View style={styles.header}>
                        <Text style={styles.appTitle}>FoodMate AI</Text>
                        <Text style={styles.subTitle}>
                            {isLogin ? '欢迎回来' : '创建新账户'}
                        </Text>
                    </View>

                    {/* 登录/注册 切换 Tab */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabButton, isLogin && styles.tabButtonActive]}
                            onPress={() => setIsLogin(true)}
                        >
                            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>登录</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
                            onPress={() => setIsLogin(false)}
                        >
                            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>注册</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 角色选择网格 */}
                    <Text style={styles.sectionLabel}>请选择您的身份</Text>
                    <View style={styles.roleGrid}>
                        <RoleOption label="顾客" value="customer" iconText="👤" />
                        <RoleOption label="商家" value="merchant" iconText="🏪" />
                    </View>

                    {/* 表单输入区 */}
                    <View style={styles.formContainer}>
                        <Text style={styles.inputLabel}>用户名</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="请输入用户名"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />

                        {!isLogin && (
                            <>
                                <Text style={styles.inputLabel}>邮箱地址</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="example@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </>
                        )}

                        <Text style={styles.inputLabel}>密码</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="请输入密码"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Text>{showPassword ? '隐藏' : '显示'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 提交按钮 */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {isLogin ? '登 录' : '注 册'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#9c6c49' }}>忘记密码?</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// 样式表 (对应 Web 端的 CSS)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fcfaf8', // 米色背景
    },
    container: {
        flexGrow: 1,
        padding: 24,
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1c130d',
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 18,
        color: '#666',
    },
    // Tab 切换样式
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f4ece7',
        borderRadius: 25,
        padding: 4,
        marginBottom: 24,
        height: 48,
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },
    tabButtonActive: {
        backgroundColor: '#fff',
        elevation: 2, // Android 阴影
        shadowColor: '#000', // iOS 阴影
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabText: {
        color: '#9c6c49',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#1c130d',
        fontWeight: 'bold',
    },
    // 角色选择样式
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c130d',
        marginBottom: 10,
    },
    roleGrid: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 24,
    },
    roleBox: {
        width: 120,
        height: 80,
        borderWidth: 1,
        borderColor: '#e8d9ce',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    roleBoxSelected: {
        borderColor: '#e85a2d', // 主题色 Orange
        backgroundColor: '#fff5f2',
    },
    roleText: {
        fontSize: 12,
        color: '#9c6c49',
        fontWeight: 'bold',
    },
    roleTextSelected: {
        color: '#e85a2d',
    },
    // 表单样式
    formContainer: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1c130d',
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e8d9ce',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        color: '#1c130d',
        marginBottom: 8,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e8d9ce',
        borderRadius: 8,
        marginBottom: 24,
    },
    passwordInput: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: '#1c130d',
    },
    eyeButton: {
        padding: 10,
        marginRight: 5,
    },
    submitButton: {
        backgroundColor: '#e85a2d', // 主题色
        borderRadius: 30,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default LoginScreen;