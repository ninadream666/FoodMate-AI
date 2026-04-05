import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import { addressService } from '../services/addressService';
import LinearGradient from 'react-native-linear-gradient';
import { useIsFocused } from '@react-navigation/native'; // 每次进入页面都刷新

const AddressListScreen = ({ navigation, route }: any) => {
    // mode：'manage'（默认）或'select'（从购物车来）
    const { mode = 'manage' } = route.params || {};

    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused(); // 监听焦点

    useEffect(() => {
        if (isFocused) {
            loadAddresses();
        }
    }, [isFocused]);

    const loadAddresses = async () => {
        setLoading(true);
        try {
            console.log('[AddressListScreen] 开始加载地址列表...');

            // 检查用户登录状态
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const token = await AsyncStorage.getItem('token');
            const user = await AsyncStorage.getItem('user');

            console.log('[AddressListScreen] 认证状态:', {
                hasToken: !!token,
                tokenPreview: token ? token.substring(0, 20) + '...' : null,
                user: user ? JSON.parse(user) : null
            });

            if (!token) {
                console.error('[AddressListScreen] 用户未登录');
                Alert.alert('错误', '请先登录');
                return;
            }

            const data = await addressService.getMyAddresses();
            console.log('[AddressListScreen] 地址数据获取成功:', data);

            // 排序：默认地址排第一
            const sorted = data.sort((a: any, b: any) => {
                if (a.isDefault && !b.isDefault) return -1;
                if (!a.isDefault && b.isDefault) return 1;
                return b.id - a.id;
            });
            setAddresses(sorted);
        } catch (error) {
            console.error('加载地址列表失败:', error);
            // 如果是网络错误或服务不可用，显示空列表而不是崩溃
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await addressService.setDefault(id);
            loadAddresses(); // 刷新列表
        } catch (error) {
            Alert.alert('设置失败');
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert('删除地址', '确认删除吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除', style: 'destructive', onPress: async () => {
                    try {
                        await addressService.deleteAddress(id);
                        loadAddresses();
                    } catch (e) {
                        Alert.alert('删除失败');
                    }
                }
            }
        ]);
    };

    const handleSelect = (address: any) => {
        if (mode === 'select') {
            // 返回上一页（CartScreen），并带回selectedAddress
            // 使用navigate merge模式
            navigation.navigate({
                name: 'Cart',
                params: { selectedAddress: address },
                merge: true,
            });
        }
    };

    const renderItem = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.card, item.isDefault && styles.defaultBorder]}
            onPress={() => handleSelect(item)} // 点击选中
            activeOpacity={mode === 'select' ? 0.6 : 1}
        >
            <View style={styles.cardHeader}>
                <View style={styles.tagRow}>
                    <Text style={styles.tag}>地址</Text>
                    {item.isDefault && <Text style={styles.defaultTag}>默认</Text>}
                </View>

                {/* 只在管理模式显示删除按钮 */}
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>删除</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.addressText}>
                {item.city} {item.street} {item.detail}
            </Text>

            {/* 设为默认按钮 */}
            {!item.isDefault && (
                <TouchableOpacity
                    style={styles.setDefaultBtn}
                    onPress={() => handleSetDefault(item.id)}
                >
                    <Text style={styles.setDefaultText}>设为默认</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={addresses}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={!loading ? <Text style={styles.empty}>暂无地址</Text> : null}
            />

            {/* 底部新增按钮 */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddressEdit')}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['#FFA07A', '#C4422E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.addBtn}
                    >
                        <Text style={styles.addBtnText}>+ 新增地址</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#e85a2d" />
                </View>
            )}
        </SafeAreaView>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0EDE8',
    },
    list: { padding: spacing.lg },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    defaultBorder: {
        borderColor: '#E0DBD3',
        backgroundColor: '#FFFFFF',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    tagRow: { flexDirection: 'row', gap: spacing.sm },
    tag: {
        fontSize: fontSize.xs,
        color: colors.primary,
        backgroundColor: colors.primaryBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        fontWeight: fontWeight.medium,
    },
    defaultTag: {
        fontSize: fontSize.xs,
        color: colors.success,
        backgroundColor: colors.successBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        fontWeight: fontWeight.medium,
    },
    deleteBtn: { padding: spacing.xs },
    deleteText: {
        color: colors.textTertiary,
        fontSize: fontSize.xs,
    },
    addressText: {
        fontSize: fontSize.lg,
        color: colors.textPrimary,
        lineHeight: 24,
        marginBottom: spacing.md,
        fontWeight: fontWeight.medium,
    },
    setDefaultBtn: {
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        paddingTop: spacing.md,
        alignItems: 'center',
    },
    setDefaultText: {
        color: colors.textSecondary,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
    },
    footer: {
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    addBtn: {
        height: 54,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    addBtnText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: colors.textTertiary,
        fontSize: fontSize.lg,
    },
    loading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(250, 249, 247, 0.92)',
    },
});

export default AddressListScreen;