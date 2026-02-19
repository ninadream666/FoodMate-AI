import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Modal,
    StatusBar,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { nutriVisionService } from '../services/nutriVisionService';
import NutriVisionLoading from '../components/NutriVisionLoading';

// 简单图标组件 (替代 Material Icons)
const Icon = ({ name, size = 24, color = '#333' }: any) => {
    let symbol = '•';
    switch (name) {
        case 'arrow_back': symbol = '←'; break;
        case 'thumb_up': symbol = '👍'; break;
        case 'warning': symbol = '⚠️'; break;
        case 'check_circle': symbol = '✅'; break;
        case 'close': symbol = '✕'; break;
        case 'photo_camera': symbol = '📷'; break;
        case 'favorite': symbol = '❤️'; break;
        case 'visibility': symbol = '👁️'; break;
        case 'auto_awesome': symbol = '✨'; break;
    }
    return <Text style={{ fontSize: size, color: color }}>{symbol}</Text>;
};

const NutriVisionResultScreen = ({ route, navigation }: any) => {
    // 路由参数
    const { imageUri, imageBase64, healthTags } = route.params || {};

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Modal 状态
    const [showOriginalImage, setShowOriginalImage] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null); // 点击列表项展示详情

    useEffect(() => {
        if (!imageBase64) {
            setErrorMsg('未获取到图片数据');
            setLoading(false);
            return;
        }

        // 调用 API
        analyzeImage();
    }, []);

    const analyzeImage = async () => {
        try {
            console.log('🚀 开始调用视觉大模型...');
            const data = await nutriVisionService.analyzeMenu(imageBase64, healthTags);
            setResult(data);
            setLoading(false);
        } catch (error: any) {
            console.error('❌ 分析失败:', error);
            setErrorMsg(error.message || '分析服务暂时不可用，请稍后重试');
            setLoading(false);
        }
    };

    const handleSaveRecord = () => {
        Alert.alert('提示', '健康记录功能开发中，敬请期待！');
    };

    // 1. 渲染加载页 (使用独立组件)
    if (loading) {
        return (
            <NutriVisionLoading 
                imageUri={imageUri} 
                onCancel={() => navigation.goBack()} 
            />
        );
    }

    // 2. 渲染错误页
    if (errorMsg) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="dark-content" />
                <Text style={{ fontSize: 50, marginBottom: 20 }}>😕</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryText}>返回重试</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // 3. 渲染结果页
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
            
            {/* 顶部导航栏 */}
            <SafeAreaView style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBackBtn}>
                    <Icon name="arrow_back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>营养透视报告</Text>
                <View style={{ width: 40 }} />
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* 1. 概览卡片 */}
                <View style={styles.summaryCard}>
                    {/* 图片区域 */}
                    <View style={styles.summaryImageContainer}>
                        <Image source={{ uri: imageUri }} style={styles.summaryImage} resizeMode="cover" />
                        <View style={styles.imageOverlay}>
                            <TouchableOpacity 
                                style={styles.viewOriginalBtn}
                                onPress={() => setShowOriginalImage(true)}
                            >
                                <Icon name="visibility" size={16} color="#fff" />
                                <Text style={styles.viewOriginalText}>查看原图</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {/* AI 总结 */}
                    <View style={styles.aiSummaryBox}>
                        <View style={styles.aiHeader}>
                            <Icon name="auto_awesome" size={20} color="#e85a2d" />
                            <Text style={styles.aiTitle}>AI 智能总结</Text>
                        </View>
                        <Text style={styles.aiText}>
                            {result?.health_summary || '暂无总结'}
                        </Text>
                    </View>
                </View>

                {/* 2. 智能小助理推荐 (横向滚动) */}
                {result?.top_recommendations && result.top_recommendations.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>智能小助理推荐</Text>
                            <Icon name="auto_awesome" size={20} color="#e85a2d" />
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recsScroll}>
                            {result.top_recommendations.map((recName: string, index: number) => {
                                // 尝试从 items 中找到完整信息
                                const itemDetail = result.items?.find((i: any) => i.name === recName);
                                return (
                                    <View key={index} style={styles.recCard}>
                                        <View style={styles.recCardTop}>
                                            <Text style={styles.recName} numberOfLines={1}>{recName}</Text>
                                            <Icon name="thumb_up" size={16} color="#e85a2d" />
                                        </View>
                                        <View style={styles.recBadge}>
                                            <Text style={styles.recBadgeText}>健康首选</Text>
                                        </View>
                                        <Text style={styles.recDesc} numberOfLines={2}>
                                            {itemDetail?.calories || '推荐选择'} • {itemDetail?.ingredients?.[0] || 'AI严选'}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* 3. 详细透视列表 */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>全菜单营养明细</Text>
                    
                    {result?.items?.map((item: any, index: number) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.menuItemCard}
                            onPress={() => setSelectedItem(item)} // 点击显示详情
                        >
                            <View style={{ flex: 1 }}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    {item.is_recommended && (
                                        <Icon name="check_circle" size={16} color="#4caf50" />
                                    )}
                                    {/* 警告 Badge */}
                                    {item.warnings && (
                                        <View style={styles.warningBadge}>
                                            <Text style={styles.warningText}>⚠️ {item.warnings}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.itemIngredients} numberOfLines={1}>
                                    {item.ingredients?.join(', ')}
                                </Text>
                            </View>
                            
                            <View style={styles.itemRight}>
                                {/* 热量显示：简单逻辑判断颜色 */}
                                <Text style={[
                                    styles.itemCalories,
                                    item.calories.includes('kcal') && parseInt(item.calories) > 800 
                                        ? { color: '#f44336' } 
                                        : { color: '#e85a2d' }
                                ]}>
                                    {item.calories}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 底部占位 */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* 底部悬浮按钮 */}
            <View style={styles.bottomBar}>
                <TouchableOpacity 
                    style={styles.btnSecondary} 
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="photo_camera" size={20} color="#333" />
                    <Text style={styles.btnSecondaryText}>重新拍摄</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.btnPrimary} 
                    onPress={handleSaveRecord}
                >
                    <Icon name="favorite" size={20} color="#fff" />
                    <Text style={styles.btnPrimaryText}>保存到健康记录</Text>
                </TouchableOpacity>
            </View>

            {/* --- Modals --- */}

            {/* 1. 查看原图 Modal */}
            <Modal visible={showOriginalImage} transparent={true} animationType="fade" onRequestClose={() => setShowOriginalImage(false)}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity 
                        style={styles.modalCloseBtn}
                        onPress={() => setShowOriginalImage(false)}
                    >
                        <Text style={{color: 'white', fontSize: 30}}>✕</Text>
                    </TouchableOpacity>
                    <Image source={{ uri: imageUri }} style={styles.fullImage} resizeMode="contain" />
                </View>
            </Modal>

            {/* 2. 菜品详情小卡片 Modal */}
            <Modal visible={!!selectedItem} transparent={true} animationType="fade" onRequestClose={() => setSelectedItem(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.detailCard}>
                        <View style={styles.detailHeader}>
                            <Text style={styles.detailTitle}>{selectedItem?.name}</Text>
                            <TouchableOpacity onPress={() => setSelectedItem(null)}>
                                <Icon name="close" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>🔥 热量估算:</Text>
                            <Text style={styles.detailValue}>{selectedItem?.calories}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>🥦 主要成分:</Text>
                            <Text style={styles.detailValue}>{selectedItem?.ingredients?.join(', ')}</Text>
                        </View>

                        {selectedItem?.warnings && (
                            <View style={[styles.detailRow, { marginTop: 10, backgroundColor: '#fff3e0', padding: 8, borderRadius: 8 }]}>
                                <Text style={[styles.detailLabel, { color: '#e65100', width: 60 }]}>⚠️ 注意:</Text>
                                <Text style={[styles.detailValue, { color: '#e65100' }]}>{selectedItem?.warnings}</Text>
                            </View>
                        )}
                        
                        {selectedItem?.is_recommended && (
                            <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="check_circle" size={20} color="#4caf50" />
                                <Text style={{ marginLeft: 5, color: '#4caf50', fontWeight: 'bold' }}>AI 推荐健康选择</Text>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={styles.detailCloseBtn}
                            onPress={() => setSelectedItem(null)}
                        >
                            <Text style={styles.detailCloseText}>关闭</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    
    // 导航栏
    navBar: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 16,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    navBackBtn: { padding: 8 },
    navTitle: { fontSize: 18, fontWeight: 'bold', color: '#181311' },

    scrollContent: { padding: 16 },

    // 概览卡片
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 }
    },
    summaryImageContainer: {
        height: 160,
        backgroundColor: '#eee',
        position: 'relative'
    },
    summaryImage: { width: '100%', height: '100%' },
    imageOverlay: {
        position: 'absolute',
        bottom: 10,
        right: 10,
    },
    viewOriginalBtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignItems: 'center',
        gap: 6
    },
    viewOriginalText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    aiSummaryBox: { padding: 16 },
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    aiTitle: { fontSize: 16, fontWeight: 'bold', color: '#181311' },
    aiText: { fontSize: 14, color: '#666', lineHeight: 22 },

    // 推荐区
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#181311' },
    recsScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
    recCard: {
        width: 180,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    recCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    recName: { fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1 },
    recBadge: { 
        backgroundColor: '#e8f5e9', 
        alignSelf: 'flex-start', 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 4,
        marginBottom: 8
    },
    recBadgeText: { color: '#2e7d32', fontSize: 10, fontWeight: 'bold' },
    recDesc: { fontSize: 11, color: '#888' },

    // 列表项
    menuItemCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 1
    },
    itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    itemName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    warningBadge: { backgroundColor: '#fff3e0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    warningText: { fontSize: 10, color: '#e65100', fontWeight: 'bold' },
    itemIngredients: { fontSize: 12, color: '#999', maxWidth: 200 },
    itemRight: { alignItems: 'flex-end' },
    itemCalories: { fontSize: 14, fontWeight: 'bold' },

    // 底部按钮
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    btnSecondary: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    btnSecondaryText: { color: '#333', fontWeight: 'bold' },
    btnPrimary: {
        flex: 1.5,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#e85a2d',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#e85a2d',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 }
    },
    btnPrimaryText: { color: '#fff', fontWeight: 'bold' },

    // 错误页
    errorText: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 40, marginBottom: 20 },
    retryBtn: { paddingVertical: 10, paddingHorizontal: 30, backgroundColor: '#e85a2d', borderRadius: 20 },
    retryText: { color: '#fff', fontWeight: 'bold' },

    // Modal Styles
    modalContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
    modalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
    fullImage: { width: '100%', height: '100%' },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    detailCard: { width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1 },
    detailRow: { flexDirection: 'row', marginBottom: 10 },
    detailLabel: { width: 80, fontWeight: 'bold', color: '#666' },
    detailValue: { flex: 1, color: '#333' },
    detailCloseBtn: { marginTop: 20, backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, alignItems: 'center' },
    detailCloseText: { color: '#666', fontWeight: 'bold' }
});

export default NutriVisionResultScreen;