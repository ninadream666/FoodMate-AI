import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { settlementService } from '../../services/settlementService';

const SettlementDashboardScreen = ({ route }: any) => {
    const merchantId = route?.params?.merchantId;
    const [stats, setStats] = useState({ netIncome: 0, pendingCommission: 0 });
    const [list, setList] = useState([]);

    useEffect(() => {
        loadData();
    }, [merchantId]);

    const loadData = async () => {
        try {
            const [s, l] = await Promise.all([
                settlementService.getThisMonthSummary(merchantId),
                settlementService.getSettlements(0, 20, null, merchantId)
            ]);
            setStats(s);
            setList(l.content || []);
        } catch (e) { console.error(e); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {/* 统计卡片 */}
                <View style={styles.statsCard}>
                    <Text style={styles.statsLabel}>本月预估净收入</Text>
                    <Text style={styles.statsValue}>¥{stats.netIncome}</Text>
                    <Text style={styles.statsSub}>待结算: ¥{stats.pendingCommission}</Text>
                </View>

                {/* 列表标题 */}
                <Text style={styles.sectionTitle}>结算记录</Text>

                {/* 列表 */}
                {list.map((item: any) => (
                    <View key={item.id} style={styles.itemCard}>
                        <View style={styles.row}>
                            <Text style={styles.period}>{item.periodDisplay}</Text>
                            <Text style={styles.income}>+¥{item.netIncome}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.status}>{item.statusName}</Text>
                            <Text style={styles.date}>订单数: {item.totalOrderCount}</Text>
                        </View>
                        {(item.status === 'PENDING_CONFIRMATION' || item.status === 'PENDING') && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={{ flex: 1, marginRight: 8 }}
                                    onPress={() => Alert.alert('提交异议', '确定对此结算单提交异议？', [
                                        { text: '取消', style: 'cancel' },
                                        { text: '提交', onPress: async () => {
                                            try {
                                                await settlementService.disputeSettlement(item.id, '金额有异议');
                                                Alert.alert('已提交', '异议已提交，平台将尽快处理');
                                                loadData();
                                            } catch (e: any) { Alert.alert('失败', e.message); }
                                        }},
                                    ])}
                                >
                                    <View style={styles.disputeBtn}>
                                        <Text style={styles.disputeBtnText}>异议</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={{ flex: 1 }}
                                    onPress={() => Alert.alert('确认结算', `确认 ${item.periodDisplay} 结算单？`, [
                                        { text: '取消', style: 'cancel' },
                                        { text: '确认', onPress: async () => {
                                            try {
                                                await settlementService.confirmSettlement(item.id);
                                                Alert.alert('已确认', '结算单已确认');
                                                loadData();
                                            } catch (e: any) { Alert.alert('失败', e.message); }
                                        }},
                                    ])}
                                >
                                    <LinearGradient colors={['#FFA07A', '#C4422E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.confirmBtn}>
                                        <Text style={styles.confirmBtnText}>确认结算</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0EDE8' },
    statsCard: { backgroundColor: '#F2784B', padding: 20, borderRadius: 12, marginBottom: 20 },
    statsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    statsValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 8 },
    statsSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    itemCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    period: { fontWeight: 'bold', color: '#333' },
    income: { fontWeight: 'bold', color: '#e85a2d' },
    status: { fontSize: 12, color: '#666' },
    date: { fontSize: 12, color: '#999' },
    actionRow: { flexDirection: 'row', marginTop: 12 },
    disputeBtn: { paddingVertical: 10, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f8f8f8' },
    disputeBtnText: { fontSize: 14, color: '#666', fontWeight: 'bold' },
    confirmBtn: { paddingVertical: 10, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    confirmBtnText: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
});

export default SettlementDashboardScreen;