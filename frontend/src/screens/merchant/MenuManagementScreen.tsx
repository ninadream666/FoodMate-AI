import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    Switch,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Platform
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { merchantService } from '../../services/merchantService';

const MenuManagementScreen = ({ navigation }: any) => {
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [merchantId, setMerchantId] = useState<number | null>(null);

    useEffect(() => {
        initializeMerchant();
    }, []);

    const initializeMerchant = async () => {
        try {
            // 获取当前用户关联的商家
            const merchant = await merchantService.getMyMerchant();
            if (merchant && merchant.id) {
                setMerchantId(merchant.id);
                loadMenu(merchant.id);
            } else {
                Alert.alert('提示', '您还没有关联的商家，请先入驻或认领店铺');
                navigation.goBack();
            }
        } catch (error) {
            console.error('获取商家信息失败:', error);
            Alert.alert('错误', '获取商家信息失败');
            setLoading(false);
        }
    };

    const loadMenu = async (mId: number) => {
        try {
            const data = await merchantService.getMenu(mId);
            setMenuItems(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (item: any) => {
        if (!merchantId) return;
        const newStatus = !item.isAvailable;
        // 乐观更新
        setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: newStatus } : i));

        try {
            const payload = {
                name: item.name,
                price: item.price,
                description: item.description,
                imageUrl: item.imageUrl,
                category: item.category,
                isAvailable: newStatus
            };
            await merchantService.updateMenuItem(merchantId, item.id, payload);
        } catch (error) {
            Alert.alert('更新失败');
            loadMenu(merchantId); // 回滚
        }
    };

    const handleDelete = (id: number) => {
        if (!merchantId) return;
        Alert.alert('删除菜品', '确定删除吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除', style: 'destructive', onPress: async () => {
                    try {
                        await merchantService.deleteMenuItem(merchantId, id);
                        loadMenu(merchantId);
                    } catch (e) {
                        Alert.alert('删除失败');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <Image source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} style={styles.image} />
            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Switch
                        value={item.isAvailable}
                        onValueChange={() => toggleStatus(item)}
                        trackColor={{ false: "#ccc", true: "#ffccaa" }}
                        thumbColor={item.isAvailable ? "#e85a2d" : "#f4f3f4"}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                </View>
                <Text style={styles.category}>{item.category || '默认'}</Text>
                <View style={styles.bottomRow}>
                    <Text style={styles.price}>¥{item.price.toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Text style={styles.deleteText}>删除</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>菜品管理 ({menuItems.length})</Text>
                <TouchableOpacity onPress={() => Alert.alert('提示', '请在 PC 端进行批量新增')} activeOpacity={0.7}>
                    <LinearGradient
                        colors={['#FFA07A', '#C4422E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.addBtn}
                    >
                        <Text style={styles.addBtnText}>+ 新增</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 50 }} color="#e85a2d" />
            ) : (
                <FlatList
                    data={menuItems}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0EDE8' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginHorizontal: 16, marginTop: 16, marginBottom: 4, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E0DBD3', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 }, android: {} }) },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
    addBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    list: { paddingVertical: 12 },
    card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, marginHorizontal: 16, borderWidth: 1, borderColor: '#E0DBD3', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 }, android: {} }) },
    image: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
    content: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333', maxWidth: 120 },
    category: { fontSize: 12, color: '#999', backgroundColor: '#f0f0f0', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    price: { fontSize: 16, fontWeight: 'bold', color: '#e85a2d' },
    deleteText: { color: '#999', fontSize: 12 },
});

export default MenuManagementScreen;