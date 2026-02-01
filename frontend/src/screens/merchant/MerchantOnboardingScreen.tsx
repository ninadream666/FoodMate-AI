import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { merchantService } from '../../services/merchantService';

interface UnclaimedMerchant {
    id: number;
    name: string;
    address: string;
    cuisineType?: string;
    rating?: number;
    source?: string;
}

const MerchantOnboardingScreen = ({ navigation }: any) => {
    const [mode, setMode] = useState<'choose' | 'create' | 'claim'>('choose'); // 选择模式
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [merchantId, setMerchantId] = useState<number | null>(null);

    // 认领商家相关
    const [unclaimedMerchants, setUnclaimedMerchants] = useState<UnclaimedMerchant[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);

    // 表单状态
    const [shopForm, setShopForm] = useState({ name: '', address: '' });
    const [dishForm, setDishForm] = useState({ name: '', price: '', category: '主食', imageUrl: '', description: '' });

    // 搜索未认领的商家
    const searchUnclaimedMerchants = async () => {
        setSearchLoading(true);
        try {
            const data = await merchantService.getUnclaimedMerchants(searchKeyword);
            setUnclaimedMerchants(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('搜索商家失败:', error);
            setUnclaimedMerchants([]);
        } finally {
            setSearchLoading(false);
        }
    };

    useEffect(() => {
        if (mode === 'claim') {
            searchUnclaimedMerchants();
        }
    }, [mode]);

    // 认领商家
    const handleClaimMerchant = async (merchant: UnclaimedMerchant) => {
        Alert.alert(
            '确认认领',
            `确定要认领「${merchant.name}」吗？\n\n认领后该商家将关联到您的账号。`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '确认认领',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await merchantService.claimMerchant(merchant.id);
                            Alert.alert('成功', '商家认领成功！', [
                                { text: '前往工作台', onPress: () => navigation.replace('MerchantDashboard') }
                            ]);
                        } catch (error: any) {
                            Alert.alert('失败', error.message || '认领失败');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCreateShop = async () => {
        if (!shopForm.name || !shopForm.address) return Alert.alert('提示', '请填写完整店铺信息');
        setLoading(true);
        try {
            const data = await merchantService.createMerchant(shopForm);
            setMerchantId(data.id);
            setStep(2);
        } catch (error: any) {
            Alert.alert('失败', error.message || '创建店铺失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDish = async () => {
        if (!dishForm.name || !dishForm.price) return Alert.alert('提示', '请填写菜品名称和价格');
        setLoading(true);
        try {
            await merchantService.addMenuItem(merchantId, {
                ...dishForm,
                price: parseFloat(dishForm.price)
            });
            setStep(3);
        } catch (error: any) {
            Alert.alert('失败', error.message);
        } finally {
            setLoading(false);
        }
    };

    // 入驻方式选择
    const renderChooseMode = () => (
        <View style={styles.card}>
            <Text style={styles.title}>🏪 商家入驻</Text>
            <Text style={styles.subtitle}>请选择入驻方式</Text>

            <TouchableOpacity style={styles.optionCard} onPress={() => setMode('create')}>
                <Text style={styles.optionIcon}>✨</Text>
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>创建新店铺</Text>
                    <Text style={styles.optionDesc}>全新注册，从零开始打造您的品牌</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => setMode('claim')}>
                <Text style={styles.optionIcon}>🔗</Text>
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>认领已有店铺</Text>
                    <Text style={styles.optionDesc}>您的店铺已在平台？点击认领关联</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    // 认领商家界面
    const renderClaimMode = () => (
        <View style={styles.card}>
            <TouchableOpacity style={styles.backLink} onPress={() => setMode('choose')}>
                <Text style={styles.backText}>← 返回选择</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🔍 认领店铺</Text>
            <Text style={styles.subtitle}>搜索并认领您的店铺</Text>

            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="输入店铺名称搜索..."
                    value={searchKeyword}
                    onChangeText={setSearchKeyword}
                    onSubmitEditing={searchUnclaimedMerchants}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={searchUnclaimedMerchants}>
                    <Text style={styles.searchBtnText}>搜索</Text>
                </TouchableOpacity>
            </View>

            {searchLoading ? (
                <ActivityIndicator size="large" color="#e85a2d" style={{ marginTop: 30 }} />
            ) : unclaimedMerchants.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>暂无可认领的商家</Text>
                    <Text style={styles.emptySubtext}>尝试搜索其他关键词，或创建新店铺</Text>
                </View>
            ) : (
                <FlatList
                    data={unclaimedMerchants}
                    keyExtractor={item => item.id.toString()}
                    style={styles.merchantList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.merchantItem}
                            onPress={() => handleClaimMerchant(item)}
                            disabled={loading}
                        >
                            <View style={styles.merchantInfo}>
                                <Text style={styles.merchantName}>{item.name}</Text>
                                <Text style={styles.merchantAddress}>{item.address}</Text>
                                {item.cuisineType && (
                                    <Text style={styles.merchantCuisine}>🍴 {item.cuisineType}</Text>
                                )}
                            </View>
                            <Text style={styles.claimBtn}>认领</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.card}>
            <TouchableOpacity style={styles.backLink} onPress={() => setMode('choose')}>
                <Text style={styles.backText}>← 返回选择</Text>
            </TouchableOpacity>
            <Text style={styles.title}>步骤 1/2: 创建店铺</Text>
            <TextInput style={styles.input} placeholder="店铺名称" value={shopForm.name} onChangeText={t => setShopForm({ ...shopForm, name: t })} />
            <TextInput style={styles.input} placeholder="店铺地址" value={shopForm.address} onChangeText={t => setShopForm({ ...shopForm, address: t })} />
            <TouchableOpacity style={styles.btn} onPress={handleCreateShop} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>下一步</Text>}
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.card}>
            <Text style={styles.title}>步骤 2/2: 添加招牌菜</Text>
            <TextInput style={styles.input} placeholder="菜品名称" value={dishForm.name} onChangeText={t => setDishForm({ ...dishForm, name: t })} />
            <TextInput style={styles.input} placeholder="价格" keyboardType="numeric" value={dishForm.price} onChangeText={t => setDishForm({ ...dishForm, price: t })} />
            <TextInput style={styles.input} placeholder="分类 (如: 主食)" value={dishForm.category} onChangeText={t => setDishForm({ ...dishForm, category: t })} />
            <TouchableOpacity style={styles.btn} onPress={handleAddDish} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>完成入驻</Text>}
            </TouchableOpacity>
        </View>
    );

    const renderStep3 = () => (
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 60 }}>🎉</Text>
            <Text style={[styles.title, { marginTop: 20 }]}>恭喜开业！</Text>
            <Text style={{ color: '#666', marginBottom: 30 }}>您的店铺已成功创建。</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.replace('MerchantDashboard')}>
                <Text style={styles.btnText}>前往工作台</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {mode === 'choose' && renderChooseMode()}
                {mode === 'claim' && renderClaimMode()}
                {mode === 'create' && step === 1 && renderStep1()}
                {mode === 'create' && step === 2 && renderStep2()}
                {mode === 'create' && step === 3 && renderStep3()}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 3 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    btn: { backgroundColor: '#e85a2d', padding: 15, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // 选择模式样式
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee'
    },
    optionIcon: { fontSize: 32, marginRight: 16 },
    optionContent: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    optionDesc: { fontSize: 12, color: '#999' },

    // 返回链接
    backLink: { marginBottom: 15 },
    backText: { color: '#e85a2d', fontSize: 14 },

    // 搜索样式
    searchRow: { flexDirection: 'row', marginBottom: 15 },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginRight: 10
    },
    searchBtn: { backgroundColor: '#e85a2d', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' },
    searchBtnText: { color: '#fff', fontWeight: 'bold' },

    // 商家列表
    merchantList: { maxHeight: 400 },
    merchantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10
    },
    merchantInfo: { flex: 1 },
    merchantName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    merchantAddress: { fontSize: 12, color: '#666', marginTop: 4 },
    merchantCuisine: { fontSize: 12, color: '#e85a2d', marginTop: 4 },
    claimBtn: { backgroundColor: '#e85a2d', color: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, overflow: 'hidden', fontWeight: 'bold' },

    // 空状态
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, color: '#999', marginBottom: 8 },
    emptySubtext: { fontSize: 12, color: '#ccc' }
});

export default MerchantOnboardingScreen;