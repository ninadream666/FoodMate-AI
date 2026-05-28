import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { merchantOrderService } from '../../services/merchantOrderService';
import { merchantService } from '../../services/merchantService';

const RefundAuditScreen = ({ route }: any) => {
    const routeMerchantId = route?.params?.merchantId;
    const [refunds, setRefunds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [merchantId, setMerchantId] = useState<number | null>(routeMerchantId || null);

    useEffect(() => {
        if (routeMerchantId) {
            loadRefunds(routeMerchantId);
        } else {
            init();
        }
    }, []);

    const init = async () => {
        try {
            const m = await merchantService.getMyMerchant();
            setMerchantId(m.id);
            loadRefunds(m.id);
        } catch (e) { setLoading(false); }
    };

    const loadRefunds = async (mid: number) => {
        try {
            const data = await merchantOrderService.getPendingRefunds(mid);
            setRefunds(Array.isArray(data) ? data : (data.orders || []));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleAudit = async (orderId: number, approved: boolean) => {
        if (!merchantId) return;
        try {
            await merchantOrderService.auditRefund(merchantId, orderId, approved, approved ? null : '商家拒绝退款');
            Alert.alert('成功', approved ? '已同意退款' : '已拒绝退款');
            loadRefunds(merchantId);
        } catch (e: any) { Alert.alert('操作失败', e.message); }
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.orderId}>订单号: {item.orderId}</Text>
                <Text style={styles.price}>¥{item.totalAmount}</Text>
            </View>
            <Text style={styles.reason}>原因: {item.cancelReason || '未填写'}</Text>
            <View style={styles.btnRow}>
                <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleAudit(item.orderId, false)}>
                    <Text style={styles.rejectText}>拒绝</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleAudit(item.orderId, true)}>
                    <Text style={styles.approveText}>同意退款</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {loading ? <ActivityIndicator style={{ marginTop: 50 }} color="#e85a2d" /> :
                <FlatList
                    data={refunds}
                    renderItem={renderItem}
                    keyExtractor={item => item.orderId.toString()}
                    ListEmptyComponent={<Text style={styles.empty}>暂无待处理退款</Text>}
                    contentContainerStyle={{ padding: 16 }}
                />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0EDE8' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    orderId: { fontWeight: 'bold', color: '#333' },
    price: { fontWeight: 'bold', color: '#e85a2d' },
    reason: { color: '#666', marginBottom: 16 },
    btnRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
    btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1 },
    rejectBtn: { borderColor: '#ddd', backgroundColor: '#fff' },
    rejectText: { color: '#666' },
    approveBtn: { borderColor: '#e85a2d', backgroundColor: '#e85a2d' },
    approveText: { color: '#fff', fontWeight: 'bold' },
    empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default RefundAuditScreen;