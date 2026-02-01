import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { settlementService } from '../../services/settlementService';

const SettlementDashboardScreen = () => {
    const [stats, setStats] = useState({ netIncome: 0, pendingCommission: 0 });
    const [list, setList] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [s, l] = await Promise.all([
                settlementService.getThisMonthSummary(),
                settlementService.getSettlements(0, 20)
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
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    statsCard: { backgroundColor: '#e85a2d', padding: 20, borderRadius: 12, marginBottom: 20 },
    statsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    statsValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 8 },
    statsSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    itemCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    period: { fontWeight: 'bold', color: '#333' },
    income: { fontWeight: 'bold', color: '#e85a2d' },
    status: { fontSize: 12, color: '#666' },
    date: { fontSize: 12, color: '#999' }
});

export default SettlementDashboardScreen;