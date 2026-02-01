import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { orderService } from '../services/orderService';

// 模拟骑手头像
const RIDER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrawV460GKuSwxG2erT5rdBh9ksqmQjzOTvnwYNU94TAR8--4IoSIyOfS2xC0-s3GbtIMMvUkusGoRljcvgdBFUwmD-nkloIV6LQSXdQUcr27tzgJpxyuKyVik-B_9eTdirHZhMVgfkEVfDKo6yDeJv7tOMeUbHB-BW6vGuWrj0-245nme0zrYfM0SN5ZaxIK5AyaCUa1vvb2fIri1634y5Hjop3rpflHAC9zZXdPSEWLiQh7mhvSgy4_gKUuFYXuuBjkJrNms9v23';

const OrderTrackingScreen = ({ route, navigation }: any) => {
    const { order: initialOrder } = route.params || {};
    const [order, setOrder] = useState<any>(initialOrder);
    const [loading, setLoading] = useState(!initialOrder);

    // 如果传进来的是完整对象直接用，如果是ID则请求详情
    useEffect(() => {
        if (!initialOrder || !initialOrder.items) {
            loadDetail();
        }
    }, []);

    const loadDetail = async () => {
        try {
            const id = initialOrder?.id || route.params?.id;
            if (id) {
                const data = await orderService.getOrderDetail(id);
                setOrder(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleContactRider = () => {
        Alert.alert('联系骑手', '拨打电话: 13800138000', [{ text: '呼叫' }, { text: '取消' }]);
    };

    // 渲染进度条的一个步骤
    const renderStep = (title: string, time: string | null, isCompleted: boolean, isLast: boolean) => (
        <View style={styles.stepRow}>
            {/* 左侧轴 */}
            <View style={styles.stepIndicator}>
                <View style={[styles.dot, isCompleted && styles.activeDot]} />
                {!isLast && <View style={[styles.line, isCompleted && styles.activeLine]} />}
            </View>
            {/* 右侧内容 */}
            <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, isCompleted && styles.activeText]}>{title}</Text>
                {time && <Text style={styles.stepTime}>{time}</Text>}
            </View>
        </View>
    );

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;
    if (!order) return <Text>订单不存在</Text>;

    return (
        <ScrollView style={styles.container}>
            {/* 1. 地图区域 (图片占位) */}
            <View style={styles.mapContainer}>
                <View style={styles.mapPlaceholder}>
                    <Text style={styles.mapText}>🗺️ 配送地图</Text>
                    <Text style={styles.mapSubText}>骑手正在火速赶往 {order.merchantName || '餐厅'}</Text>
                </View>
                <View style={styles.etaContainer}>
                    <Text style={styles.etaTitle}>预计送达</Text>
                    <Text style={styles.etaTime}>12:30</Text>
                </View>
            </View>

            {/* 2. 进度条区域 */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>订单状态</Text>
                <View style={styles.timeline}>
                    {renderStep('已接单', '12:00', true, false)}
                    {renderStep('制作中', '12:05', true, false)}
                    {renderStep('配送中', '12:15', true, false)}
                    {renderStep('已送达', null, false, true)}
                </View>
            </View>

            {/* 3. 骑手信息 */}
            <View style={styles.card}>
                <View style={styles.riderRow}>
                    <Image source={{ uri: RIDER_AVATAR }} style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.riderName}>骑手小王</Text>
                        <Text style={styles.riderTag}>金牌骑手</Text>
                    </View>
                    <TouchableOpacity style={styles.callBtn} onPress={handleContactRider}>
                        <Text style={styles.callText}>📞 联系</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 4. 订单详情简略 */}
            <View style={[styles.card, { marginBottom: 40 }]}>
                <Text style={styles.sectionTitle}>订单详情</Text>
                {order.items?.map((item: any, index: number) => (
                    <View key={index} style={styles.orderItem}>
                        <Text style={styles.itemName}>{item.menuItemName || item.name || '商品'}</Text>
                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                        <Text style={styles.itemPrice}>¥{item.price}</Text>
                    </View>
                ))}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>实付金额</Text>
                    <Text style={styles.totalValue}>¥{order.totalAmount}</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    mapContainer: { height: 200, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    mapPlaceholder: { alignItems: 'center' },
    mapText: { fontSize: 24, marginBottom: 8 },
    mapSubText: { color: '#666' },
    etaContainer: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#fff', padding: 12, borderRadius: 8, elevation: 4 },
    etaTitle: { fontSize: 12, color: '#999' },
    etaTime: { fontSize: 20, fontWeight: 'bold', color: '#333' },

    card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#333' },

    // Timeline styles
    timeline: { marginLeft: 8 },
    stepRow: { flexDirection: 'row', minHeight: 60 },
    stepIndicator: { alignItems: 'center', width: 30 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd', zIndex: 1 },
    activeDot: { backgroundColor: '#e85a2d' },
    line: { width: 2, flex: 1, backgroundColor: '#ddd', marginVertical: 4 },
    activeLine: { backgroundColor: '#e85a2d' },
    stepContent: { flex: 1, marginLeft: 10, marginTop: -4 },
    stepTitle: { fontSize: 14, color: '#999', marginBottom: 4 },
    activeText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
    stepTime: { fontSize: 12, color: '#999' },

    // Rider styles
    riderRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#eee' },
    riderName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    riderTag: { fontSize: 12, color: '#e85a2d', marginTop: 2 },
    callBtn: { padding: 8, borderWidth: 1, borderColor: '#e85a2d', borderRadius: 20 },
    callText: { color: '#e85a2d', fontSize: 12, fontWeight: 'bold' },

    // Order Detail styles
    orderItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    itemName: { flex: 1, color: '#333' },
    itemQty: { width: 40, textAlign: 'center', color: '#666' },
    itemPrice: { width: 60, textAlign: 'right', color: '#333' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginTop: 8 },
    totalLabel: { fontSize: 16, fontWeight: 'bold' },
    totalValue: { fontSize: 18, fontWeight: 'bold', color: '#e85a2d' },
});

export default OrderTrackingScreen;