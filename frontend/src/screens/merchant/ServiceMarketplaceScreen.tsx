import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { platformService } from '../../services/platformService';

const ServiceMarketplaceScreen = ({ route }: any) => {
    const merchantId = route?.params?.merchantId;
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, [merchantId]);

    const loadData = async () => {
        try {
            const data = await platformService.getAvailableServices(merchantId);
            setServices(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSubscribe = async (item: any) => {
        if (item.isSubscribed) return;
        Alert.alert('订阅服务', `确认订阅 ${item.serviceName} 吗？`, [
            { text: '取消', style: 'cancel' },
            {
                text: '确认订阅', onPress: async () => {
                    try {
                        await platformService.subscribe(item.id, merchantId);
                        Alert.alert('成功', '订阅成功');
                        loadData();
                    } catch (e: any) { Alert.alert('失败', e.message); }
                }
            }
        ]);
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.serviceName}</Text>
                <Text style={styles.desc}>{item.description}</Text>
                <Text style={styles.price}>{item.feeDisplay}</Text>
            </View>
            <TouchableOpacity
                style={[styles.btn, item.isSubscribed && styles.disabledBtn]}
                onPress={() => handleSubscribe(item)}
                disabled={item.isSubscribed}
            >
                <Text style={[styles.btnText, item.isSubscribed && styles.disabledText]}>
                    {item.isSubscribed ? '已订阅' : '订阅'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {loading ? <ActivityIndicator style={{ marginTop: 50 }} color="#e85a2d" /> :
                <FlatList data={services} renderItem={renderItem} contentContainerStyle={{ padding: 16 }} />
            }
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0EDE8' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    desc: { fontSize: 12, color: '#666', marginVertical: 4 },
    price: { fontSize: 14, color: '#e85a2d', fontWeight: 'bold' },
    btn: { backgroundColor: '#e85a2d', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    disabledBtn: { backgroundColor: '#f0f0f0' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    disabledText: { color: '#999' }
});

export default ServiceMarketplaceScreen;