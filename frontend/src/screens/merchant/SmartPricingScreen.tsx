import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Switch,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
    SafeAreaView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { aiPricingService } from '../../services/aiPricingService';
import { merchantService } from '../../services/merchantService';

const SmartPricingScreen = ({ navigation, route }: any) => {
    const routeMerchantId = route?.params?.merchantId;
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
    const [loading, setLoading] = useState(true);
    const [proposals, setProposals] = useState<any[]>([]);
    const [menuItemsMap, setMenuItemsMap] = useState<any>({});
    const [merchantId, setMerchantId] = useState<number | null>(routeMerchantId || null);

    // 配置状态
    const [config, setConfig] = useState({
        enableAutoApproval: false,
        autoApprovalThreshold: 0.05
    });
    const [isTriggering, setIsTriggering] = useState(false);
    const [thresholdText, setThresholdText] = useState(String(Math.round(config.autoApprovalThreshold * 100)));

    useEffect(() => {
        if (!routeMerchantId) {
            initializeMerchant();
        }
    }, []);

    useEffect(() => {
        if (merchantId) {
            loadData(merchantId);
        }
    }, [activeTab, merchantId]);

    const initializeMerchant = async () => {
        try {
            const merchant = await merchantService.getMyMerchant();
            if (merchant && merchant.id) {
                setMerchantId(merchant.id);
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

    const loadData = async (mId: number) => {
        setLoading(true);
        try {
            // 加载配置
            const merchant = await merchantService.getMerchantDetail(mId);
            setConfig({
                enableAutoApproval: merchant.enableAutoApproval || false,
                autoApprovalThreshold: merchant.autoApprovalThreshold || 0.05
            });

            // 加载提案
            const list = activeTab === 'pending'
                ? await aiPricingService.getPendingProposals(mId)
                : await aiPricingService.getProposalHistory(mId);
            setProposals(list);

            // 加载菜单匹配图片
            if (list.length > 0) {
                const menu = await merchantService.getMenu(mId);
                const map: any = {};
                menu.forEach((item: any) => map[item.id] = item);
                setMenuItemsMap(map);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (proposalId: number, action: 'approve' | 'reject') => {
        if (!merchantId) return;
        try {
            if (action === 'approve') {
                await aiPricingService.approveProposal(merchantId, proposalId);
                Alert.alert('✅ 已批准', '价格已更新');
            } else {
                await aiPricingService.rejectProposal(merchantId, proposalId);
            }
            loadData(merchantId); // 刷新
        } catch (error) {
            Alert.alert('操作失败');
        }
    };

    const handleTriggerAnalysis = async () => {
        if (!merchantId) return;
        setIsTriggering(true);
        try {
            await aiPricingService.triggerAiAnalysis();
            setTimeout(() => {
                loadData(merchantId);
                setIsTriggering(false);
                Alert.alert('✅ 分析完成', 'AI 已生成最新的定价建议');
            }, 2000);
        } catch (e) {
            setIsTriggering(false);
            Alert.alert('触发失败');
        }
    };

    // 渲染单个提案卡片
    const renderProposalCard = (item: any) => {
        const menuItem = menuItemsMap[item.menuItemId];
        const diff = ((item.suggestedPrice - item.currentPrice) / item.currentPrice * 100).toFixed(1);
        const isUp = parseFloat(diff) > 0;

        return (
            <View key={item.id} style={styles.card}>
                {/* 头部：图片和名称 */}
                <View style={styles.cardHeader}>
                    <Image
                        source={{ uri: menuItem?.imageUrl || 'https://via.placeholder.com/100' }}
                        style={styles.foodImage}
                    />
                    <View style={styles.headerInfo}>
                        <Text style={styles.foodName}>{menuItem?.name || `菜品 #${item.menuItemId}`}</Text>
                        <View style={styles.categoryTag}>
                            <Text style={styles.categoryText}>{menuItem?.category || 'AI 推荐'}</Text>
                        </View>
                    </View>
                    {/* 历史记录显示状态标签 */}
                    {activeTab === 'history' && (
                        <View style={[styles.statusTag, item.status === 'APPROVED' ? styles.statusApproved : styles.statusRejected]}>
                            <Text style={styles.statusText}>{item.status === 'APPROVED' ? '已生效' : '已拒绝'}</Text>
                        </View>
                    )}
                </View>

                {/* 价格对比区 */}
                <View style={styles.priceRow}>
                    <View>
                        <Text style={styles.priceLabel}>当前价格</Text>
                        <Text style={styles.oldPrice}>¥{item.currentPrice.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                    <View>
                        <Text style={[styles.priceLabel, { color: '#e85a2d' }]}>建议价格</Text>
                        <Text style={styles.newPrice}>¥{item.suggestedPrice.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.badge, isUp ? styles.badgeUp : styles.badgeDown]}>
                        <Text style={[styles.badgeText, isUp ? styles.textUp : styles.textDown]}>
                            {isUp ? '📈' : '📉'} {diff}%
                        </Text>
                    </View>
                </View>

                {/* AI 理由 */}
                <View style={styles.reasonBox}>
                    <Text style={styles.reasonTitle}>💡 AI 分析</Text>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                </View>

                {/* 按钮区，仅显示待处理状态 */}
                {activeTab === 'pending' && (
                    <View style={styles.btnRow}>
                        <TouchableOpacity
                            style={[styles.btn, styles.rejectBtn]}
                            onPress={() => handleAction(item.id, 'reject')}
                        >
                            <Text style={styles.rejectText}>忽略</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btn, styles.approveBtn]}
                            onPress={() => handleAction(item.id, 'approve')}
                        >
                            <Text style={styles.approveText}>批准变价</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

                {/* 顶部控制面板 */}
                <View style={styles.panel}>
                    <View style={styles.panelRow}>
                        <View>
                            <Text style={styles.panelTitle}>自动审批</Text>
                            <Text style={styles.panelSubtitle}>自动应用低风险变动</Text>
                        </View>
                        <Switch
                            value={config.enableAutoApproval}
                            onValueChange={(val) => {
                                if (!merchantId) return;
                                setConfig(prev => ({ ...prev, enableAutoApproval: val }));
                                aiPricingService.updateAutoApprovalStatus(merchantId, val);
                            }}
                            trackColor={{ false: "#767577", true: "#ffccaa" }}
                            thumbColor={config.enableAutoApproval ? "#e85a2d" : "#f4f3f4"}
                        />
                    </View>

                    <View style={[styles.panelRow, { marginTop: 15 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.panelTitle}>阈值设置 (%)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={thresholdText}
                                onChangeText={(val) => {
                                    setThresholdText(val);
                                }}
                                onEndEditing={() => {
                                    if (!merchantId) return;
                                    const num = parseFloat(thresholdText) / 100;
                                    if (!isNaN(num) && num >= 0 && num <= 1) {
                                        setConfig(prev => ({ ...prev, autoApprovalThreshold: num }));
                                        aiPricingService.updateThreshold(merchantId, num);
                                    } else {
                                        setThresholdText(String(Math.round(config.autoApprovalThreshold * 100)));
                                    }
                                }}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={handleTriggerAnalysis}
                            disabled={isTriggering}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={['#FFA07A', '#C4422E']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.analyzeBtn}
                            >
                                {isTriggering ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeText}>立即分析</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                        onPress={() => setActiveTab('pending')}
                    >
                        <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>待处理</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>历史记录</Text>
                    </TouchableOpacity>
                </View>

                {/* 列表 */}
                <View style={styles.list}>
                    {loading ? (
                        <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#e85a2d" />
                    ) : proposals.length === 0 ? (
                        <Text style={styles.emptyText}>暂无相关记录</Text>
                    ) : (
                        proposals.map(renderProposalCard)
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0EDE8' },
    panel: { backgroundColor: '#FFFFFF', margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E0DBD3', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
    panelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    panelTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    panelSubtitle: { fontSize: 12, color: '#999' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, width: 80, marginTop: 5, textAlign: 'center' },
    analyzeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginLeft: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8 },
    analyzeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10 },
    tab: { marginRight: 16, paddingBottom: 8 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#e85a2d' },
    tabText: { fontSize: 16, color: '#999' },
    activeTabText: { color: '#333', fontWeight: 'bold' },

    list: { paddingHorizontal: 16 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E0DBD3', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
    cardHeader: { flexDirection: 'row', marginBottom: 12 },
    foodImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
    headerInfo: { marginLeft: 12, justifyContent: 'center', flex: 1 },
    foodName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    categoryTag: { backgroundColor: '#fff5f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
    categoryText: { fontSize: 10, color: '#e85a2d' },

    statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, height: 24 },
    statusApproved: { backgroundColor: '#e6fffa' },
    statusRejected: { backgroundColor: '#f5f5f5' },
    statusText: { fontSize: 10, fontWeight: 'bold', color: '#333' },

    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 },
    priceLabel: { fontSize: 10, color: '#999', marginBottom: 2 },
    oldPrice: { fontSize: 14, color: '#666', textDecorationLine: 'line-through' },
    newPrice: { fontSize: 18, fontWeight: 'bold', color: '#e85a2d' },
    arrow: { fontSize: 18, color: '#ccc' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    badgeUp: { backgroundColor: '#e6fffa' },
    badgeDown: { backgroundColor: '#fff5f5' },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    textUp: { color: 'green' },
    textDown: { color: 'red' },

    reasonBox: { marginTop: 12, backgroundColor: '#e6f7ff', padding: 10, borderRadius: 8 },
    reasonTitle: { fontSize: 12, fontWeight: 'bold', color: '#0050b3', marginBottom: 4 },
    reasonText: { fontSize: 12, color: '#333', lineHeight: 18 },

    btnRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    rejectBtn: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
    approveBtn: { backgroundColor: '#e85a2d' },
    rejectText: { color: '#666', fontWeight: 'bold' },
    approveText: { color: '#fff', fontWeight: 'bold' },

    emptyText: { textAlign: 'center', marginTop: 40, color: '#999' }
});

export default SmartPricingScreen;