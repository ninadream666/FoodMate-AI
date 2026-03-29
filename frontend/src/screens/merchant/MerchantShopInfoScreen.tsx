import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { merchantService } from '../../services/merchantService';

const MerchantShopInfoScreen = () => {
    const [merchant, setMerchant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInfo();
    }, []);

    const loadInfo = async () => {
        try {
            const data = await merchantService.getMyMerchant();
            setMerchant(data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color="#e85a2d" />;
    if (!merchant) return <View style={styles.container}><Text style={{ textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 }}>暂无店铺信息，请先完成商家入驻</Text></View>;

    const InfoItem = ({ label, value }: any) => (
        <View style={styles.item}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View style={styles.card}>
                    <Text style={styles.header}>基本信息</Text>
                    <InfoItem label="店铺名称" value={merchant.name} />
                    <InfoItem label="店铺地址" value={merchant.address} />
                    <InfoItem label="动态定价" value={merchant.enableDynamicPricing ? '✅ 已启用 (AI托管中)' : '未启用'} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.header}>经营信息</Text>
                    <InfoItem label="商户ID" value={merchant.id} />
                    <InfoItem label="店主ID" value={merchant.ownerUserId} />
                    <InfoItem label="认证状态" value="已认证" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0EDE8' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
    header: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
    item: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', paddingBottom: 8 },
    label: { color: '#666' },
    value: { color: '#333', fontWeight: '500', maxWidth: '60%', textAlign: 'right' }
});

export default MerchantShopInfoScreen;