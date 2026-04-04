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
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { nutriVisionService } from '../services/nutriVisionService';
import { profileService } from '../services/profileService';
import { getNetworkStatus } from '../services/networkUtils';
import NutriVisionLoading from '../components/NutriVisionLoading';

// 简单图标组件
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
    const { imageUri, imageBase64, healthTags, mode = 'menu' } = route.params || {};

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

        // 组件卸载时取消未完成的请求，避免浪费带宽
        return () => {
            nutriVisionService.cancelPending();
        };
    }, []);

    const analyzeImage = async () => {
        try {
            // 发起大请求前检查网络状态
            const { isConnected } = getNetworkStatus();
            if (!isConnected) {
                setErrorMsg('当前无网络连接，请检查网络后重试');
                setLoading(false);
                return;
            }

            console.log(`🚀 开始调用模型分析, 模式: ${mode}`);
            let data;
            
            // API智能分发
            if (mode === 'food') {
                // 拍菜品：走自研CV+降级版LLM，速度快
                data = await nutriVisionService.analyzeFood(imageBase64, healthTags);
            } else {
                // 拍菜单：走多模态LLM模型
                data = await nutriVisionService.analyzeMenu(imageBase64, healthTags);
            }
            
            setResult(data);
            setLoading(false);
        } catch (error: any) {
            console.error('❌ 分析失败:', error);
            setErrorMsg(error.message || '分析服务暂时不可用，请稍后重试');
            setLoading(false);
        }
    };

    const handleSaveRecord = async () => {
        try {
            // 只保存分析结果
            await profileService.saveHealthRecord({
                type: mode === 'food' ? 'single_food' : 'menu_scan',
                result: result,
                tags: healthTags,
                timestamp: new Date().toISOString(),
            });
            Alert.alert('保存成功', '已保存到健康记录，可在健康数据页面查看');
        } catch (e) {
            Alert.alert('保存失败', '请稍后重试');
        }
    };

    // 渲染加载页
    if (loading) {
        return (
            <NutriVisionLoading 
                imageUri={imageUri} 
                mode={mode}
                onCancel={() => navigation.goBack()} 
            />
        );
    }

    // 渲染错误页
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

    // 渲染结果页
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
                
                {/* 概览卡片 */}
                <View style={styles.summaryCard}>
                    {/* 图片区域 */}
                    <View style={styles.summaryImageContainer}>
                        <Image source={{ uri: imageUri }} style={styles.summaryImage} resizeMode="cover" />
                        <View style={styles.imageOverlay}>
                            <TouchableOpacity 
                                style={styles.viewOriginalBtn}
                                onPress={() => setShowOriginalImage(true)}
                            >
                                <Text style={styles.viewOriginalText}>查看原图</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    {/* AI总结 */}
                    <View style={styles.aiSummaryBox}>
                        <View style={styles.aiHeader}>
                            <Text style={styles.aiTitle}>AI智能总结</Text>
                        </View>
                        <Text style={styles.aiText}>
                            {result?.health_summary || '暂无总结'}
                        </Text>
                    </View>
                </View>

                {/* 智能小助理推荐（横向滚动） */}
                {result?.top_recommendations && result.top_recommendations.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>智能小助理推荐</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recsScroll}>
                            {result.top_recommendations.map((recName: string, index: number) => {
                                const itemDetail = result.items?.find((i: any) => i.name === recName);
                                return (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={styles.recCard}
                                        onPress={() => Alert.alert('推荐详情', recName)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.recCardTop}>
                                            <Text style={styles.recName} numberOfLines={1}>{recName}</Text>
                                            <Feather name="thumbs-up" size={14} color="#e85a2d" />
                                        </View>
                                        <View style={styles.recBadge}>
                                            <Text style={styles.recBadgeText}>健康首选</Text>
                                        </View>
                                        <Text style={styles.recDesc}>
                                            {itemDetail?.calories || '推荐选择'} • {itemDetail?.ingredients?.[0] || 'AI严选'}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* 详细透视列表 */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 12, marginTop: 8 }]}>全菜单营养明细</Text>
                    
                    {result?.items?.map((item: any, index: number) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.menuItemCard}
                            onPress={() => setSelectedItem(item)} // 点击显示详情
                        >
                            <View style={styles.itemLeft}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    {item.is_recommended && (
                                        <Feather name="check-circle" size={14} color="#4caf50" />
                                    )}
                                </View>
                                {/* 警告Badge */}
                                {item.warnings && (
                                    <View style={styles.warningBadge}>
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
                                            <Feather name="alert-triangle" size={12} color={colors.warning} style={{ marginTop: 2 }} />
                                            <Text style={[styles.warningText, { flexShrink: 1 }]}>{item.warnings}</Text>
                                        </View>
                                    </View>
                                )}
                                <Text style={styles.itemIngredients} numberOfLines={1}>
                                    {item.ingredients?.join(', ')}
                                </Text>
                            </View>
                            
                            <View style={styles.itemRight}>
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
                    <Text style={styles.btnSecondaryText}>重新拍摄</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveRecord} activeOpacity={0.7} style={{ flex: 1 }}>
                    <LinearGradient
                        colors={['#FFA07A', '#C4422E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.btnPrimary}
                    >
                        <Text style={styles.btnPrimaryText}>保存到健康记录</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* --- Modals --- */}

            {/* 查看原图Modal */}
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

            {/* 菜品详情小卡片Modal，支持长文本 */}
            <Modal visible={!!selectedItem} transparent={true} animationType="fade" onRequestClose={() => setSelectedItem(null)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.detailCard}>
                        <View style={styles.detailHeader}>
                            <Text style={styles.detailTitle}>{selectedItem?.name}</Text>
                            <TouchableOpacity onPress={() => setSelectedItem(null)}>
                                <Icon name="close" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.detailScroll}>
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
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, width: 60 }}>
                                        <Feather name="alert-triangle" size={14} color="#e65100" />
                                        <Text style={[styles.detailLabel, { color: '#e65100' }]}>注意:</Text>
                                    </View>
                                    <Text style={[styles.detailValue, { color: '#e65100' }]}>{selectedItem?.warnings}</Text>
                                </View>
                            )}
                            
                            {selectedItem?.is_recommended && (
                                <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Feather name="check-circle" size={18} color="#4caf50" />
                                    <Text style={{ marginLeft: 5, color: '#4caf50', fontWeight: 'bold' }}>AI 推荐健康选择</Text>
                                </View>
                            )}

                            {/* 完整显示长段落的健康警告 */}
                            {selectedItem?.warnings ? (
                                <View style={styles.warningBox}>
                                    <Text style={styles.warningLabel}>⚠️ 风险提示:</Text>
                                    <Text style={styles.warningBoxText}>{selectedItem?.warnings}</Text>
                                </View>
                            ) : null}
                            
                            {selectedItem?.is_recommended && (
                                <View style={styles.recommendedBox}>
                                    <Icon name="check_circle" size={20} color="#4caf50" />
                                    <Text style={styles.recommendedBoxText}>AI 推荐健康选择</Text>
                                </View>
                            )}
                        </ScrollView>

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

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0EDE8',
    },

    // 导航栏
    navBar: {
        backgroundColor: colors.frostedBgStrong,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    navBackBtn: { padding: spacing.sm },
    navTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },

    scrollContent: { padding: spacing.lg },

    // 概览卡片
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryImageContainer: {
        height: 160,
        backgroundColor: colors.backgroundGradientEnd,
        position: 'relative',
    },
    summaryImage: { width: '100%', height: '100%' },
    imageOverlay: {
        position: 'absolute',
        bottom: spacing.md,
        right: spacing.md,
    },
    viewOriginalBtn: {
        flexDirection: 'row',
        backgroundColor: 'rgba(45, 51, 57, 0.7)',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        gap: spacing.sm,
    },
    viewOriginalText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    aiSummaryBox: { padding: spacing.lg },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    aiTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    aiText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        lineHeight: 22,
    },

    // 推荐区
    section: { marginBottom: spacing.xxl },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xs,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    recsScroll: {
        marginHorizontal: -spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        overflow: 'visible',
    },
    recCard: {
        width: 180,
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    recCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    recName: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        flex: 1,
        marginRight: spacing.xs,
    },
    recBadge: {
        backgroundColor: colors.successBg,
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.sm,
    },
    recBadgeText: {
        color: colors.success,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    recDesc: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
    },

    // 列表项卡片
    menuItemCard: {
        backgroundColor: '#FFFFFF',
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    itemLeft: {
        flex: 1,
        paddingRight: spacing.md,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    itemName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        flexShrink: 1,
    },
    warningBadge: {
        backgroundColor: colors.warningBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        marginTop: spacing.xs,
        alignSelf: 'flex-start',
    },
    warningText: {
        fontSize: 10,
        color: colors.warning,
        fontWeight: fontWeight.bold,
    },
    itemIngredients: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        lineHeight: 18,
        marginTop: 2,
    },
    itemRight: { 
        alignItems: 'flex-end',
        justifyContent: 'center',
        minWidth: 60,
    },
    itemCalories: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
    },

    // 底部按钮
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        padding: spacing.lg,
        flexDirection: 'row',
        gap: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        ...shadows.sm,
    },
    btnSecondary: {
        flex: 1,
        height: 50,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    btnSecondaryText: {
        color: colors.textPrimary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize.sm,
    },
    btnPrimary: {
        height: 50,
        borderRadius: borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    btnPrimaryText: {
        color: colors.textOnPrimary,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.sm,
    },

    // 错误页
    errorText: {
        fontSize: fontSize.lg,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: spacing.xl,
    },
    retryBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xxxl,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        ...shadows.primary,
    },
    retryText: {
        color: colors.textOnPrimary,
        fontWeight: fontWeight.bold,
    },

    // 原图 Modal
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
    },
    modalCloseBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: spacing.md,
    },
    fullImage: { width: '100%', height: '100%' },

    // 详情卡片 Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailCard: {
        width: '85%',
        maxHeight: '80%', // 限制最大高度防止溢出屏幕
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xxl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.xl,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    detailTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        flex: 1,
        marginRight: spacing.sm,
    },
    detailScroll: {
        paddingVertical: spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    detailLabel: {
        width: 75,
        fontWeight: fontWeight.bold,
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        marginTop: 2,
    },
    detailValue: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: fontSize.sm,
    },
    warningBox: {
        marginTop: spacing.sm,
        backgroundColor: '#fff3e0',
        padding: 12,
        borderRadius: 8,
    },
    warningLabel: {
        color: '#e65100',
        fontWeight: 'bold',
        fontSize: fontSize.sm,
        marginBottom: 4,
    },
    warningBoxText: {
        color: '#e65100',
        fontSize: fontSize.sm,
        lineHeight: 20,
    },
    recommendedBox: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.successBg,
        paddingVertical: 10,
        borderRadius: 8,
    },
    recommendedBoxText: {
        marginLeft: spacing.sm,
        color: '#4caf50',
        fontWeight: 'bold',
        fontSize: fontSize.sm,
    },
    detailCloseBtn: {
        marginTop: spacing.xl,
        backgroundColor: colors.backgroundGradientEnd,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    detailCloseText: {
        color: colors.textSecondary,
        fontWeight: fontWeight.semibold,
    },
});

export default NutriVisionResultScreen;