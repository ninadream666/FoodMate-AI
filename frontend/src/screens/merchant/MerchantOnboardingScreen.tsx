import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
            <Text style={styles.title}>请选择入驻方式</Text>

            <TouchableOpacity style={styles.optionCard} onPress={() => setMode('create')}>
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>创建新店铺</Text>
                    <Text style={styles.optionDesc}>全新注册，从零开始打造您的品牌</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={() => setMode('claim')}>
                <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>认领已有店铺</Text>
                    <Text style={styles.optionDesc}>您的店铺已在平台？点击认领关联</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    // 认领商家界面
    const renderClaimMode = () => (
        <View style={[styles.card, { marginTop: 40 }]}>
            <TouchableOpacity style={styles.backLink} onPress={() => setMode('choose')}>
                <Text style={styles.backText}>← 返回选择</Text>
            </TouchableOpacity>
            <Text style={styles.title}>认领店铺</Text>

            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="输入店铺名称搜索..."
                    value={searchKeyword}
                    onChangeText={setSearchKeyword}
                    onSubmitEditing={searchUnclaimedMerchants}
                />
                <TouchableOpacity onPress={searchUnclaimedMerchants} activeOpacity={0.7}>
                    <LinearGradient colors={['#FFA07A', '#C4422E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.searchBtn}>
                        <Text style={styles.searchBtnText}>搜索</Text>
                    </LinearGradient>
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
                            <LinearGradient colors={['#FFA07A', '#C4422E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.claimBtnGradient}>
                                <Text style={styles.claimBtnText}>认领</Text>
                            </LinearGradient>
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
            <TouchableOpacity onPress={handleCreateShop} disabled={loading} activeOpacity={0.7}>
                <LinearGradient colors={['#FFA07A', '#C4422E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>下一步</Text>}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.card}>
            <Text style={styles.title}>步骤 2/2: 添加招牌菜</Text>
            <TextInput style={styles.input} placeholder="菜品名称" value={dishForm.name} onChangeText={t => setDishForm({ ...dishForm, name: t })} />
            <TextInput style={styles.input} placeholder="价格" keyboardType="numeric" value={dishForm.price} onChangeText={t => setDishForm({ ...dishForm, price: t })} />
            <TextInput style={styles.input} placeholder="分类 (如: 主食)" value={dishForm.category} onChangeText={t => setDishForm({ ...dishForm, category: t })} />
            <TouchableOpacity onPress={handleAddDish} disabled={loading} activeOpacity={0.7}>
                <LinearGradient colors={['#FFA07A', '#C4422E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>完成入驻</Text>}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderStep3 = () => (
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 60 }}>🎉</Text>
            <Text style={[styles.title, { marginTop: 20 }]}>恭喜开业！</Text>
            <Text style={{ color: '#666', marginBottom: 30 }}>您的店铺已成功创建。</Text>
            <TouchableOpacity onPress={() => navigation.replace('MerchantDashboard')} activeOpacity={0.7}>
                <LinearGradient colors={['#FFA07A', '#C4422E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
                    <Text style={styles.btnText}>前往工作台</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: mode === 'choose' ? 'center' : 'flex-start', paddingBottom: mode === 'choose' ? 100 : 20 }}>
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
    container: { flex: 1, backgroundColor: '#F0EDE8' },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, elevation: 3 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 24, color: '#333' },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    btn: { padding: 15, borderRadius: 9999, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // 选择模式样式
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
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
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        marginRight: 10
    },
    searchBtn: { paddingHorizontal: 20, borderRadius: 9999, justifyContent: 'center', paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
    searchBtnText: { color: '#fff', fontWeight: 'bold' },

    // 商家列表
    merchantList: { maxHeight: 400 },
    merchantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    merchantInfo: { flex: 1 },
    merchantName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    merchantAddress: { fontSize: 12, color: '#666', marginTop: 4 },
    merchantCuisine: { fontSize: 12, color: '#e85a2d', marginTop: 4 },
    claimBtnGradient: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
    claimBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    // 空状态
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 16, color: '#999', marginBottom: 8 },
    emptySubtext: { fontSize: 12, color: '#ccc' }
});

export default MerchantOnboardingScreen;