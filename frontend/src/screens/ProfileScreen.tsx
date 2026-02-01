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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#eee' },
    userInfo: { flex: 1, marginLeft: 16 },
    username: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    userId: { fontSize: 14, color: '#999', marginTop: 4 },
    editBtn: { padding: 8 },
    editBtnText: { color: '#e85a2d', fontSize: 14 },

    formCard: { backgroundColor: '#fff', padding: 16, marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    inputGroup: { marginBottom: 12 },
    label: { fontSize: 12, color: '#666', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, fontSize: 14 },
    saveBtn: { backgroundColor: '#e85a2d', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    saveText: { color: '#fff', fontWeight: 'bold' },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 20,
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 12, color: '#999', marginTop: 4 },

    menuList: { backgroundColor: '#fff', paddingVertical: 8, marginBottom: 20 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    highlightItem: { backgroundColor: '#fff5ec' }, // 高亮背景
    highlightText: { color: '#e85a2d', fontWeight: 'bold' }, // 高亮文字
    menuLabel: { flex: 1, fontSize: 16, color: '#333' },
    menuArrow: { color: '#ccc' },

    logoutBtn: {
        backgroundColor: '#fff',
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutText: { color: 'red', fontSize: 16 },
});

export default ProfileScreen;