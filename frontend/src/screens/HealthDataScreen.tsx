import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, RefreshControl, TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { profileService } from '../services/profileService';
import { useHealthContext } from '../hooks/useHealthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const HealthDataScreen = ({ navigation }: any) => {
    const health = useHealthContext();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 忌口/过敏原
    const [allergies, setAllergies] = useState<string[]>([]);
    const [newAllergy, setNewAllergy] = useState('');

    // 常见忌口快捷标签
    const COMMON_ALLERGIES = [
        '花生过敏', '海鲜过敏', '乳糖不耐受', '麸质过敏',
        '鸡蛋过敏', '坚果过敏', '不吃辣', '素食',
        '不吃猪肉', '不吃牛肉', '低糖饮食', '低盐饮食',
        '痛风忌高嘌呤', '高血压忌高钠', '糖尿病忌高糖',
    ];

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadRecords();
            loadAllergies();
        }, [])
    );

    const loadAllergies = async () => {
        try {
            const data = await profileService.getAllergies();
            setAllergies(data);
        } catch (e) { console.warn('加载忌口信息失败', e); }
    };

    const addAllergy = async (item: string) => {
        const trimmed = item.trim();
        if (!trimmed || allergies.includes(trimmed)) return;
        const updated = [...allergies, trimmed];
        setAllergies(updated);
        setNewAllergy('');
        try {
            await profileService.updateAllergies(updated);
        } catch (e) {
            Alert.alert('保存失败', '请稍后重试');
            setAllergies(allergies); // rollback
        }
    };

    const removeAllergy = async (item: string) => {
        const updated = allergies.filter(a => a !== item);
        setAllergies(updated);
        try {
            await profileService.updateAllergies(updated);
        } catch (e) {
            setAllergies(allergies); // rollback
        }
    };

    const loadRecords = async () => {
        try {
            const data = await profileService.getHealthRecords();
            setRecords(Array.isArray(data) ? data.reverse() : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadRecords();
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert('删除记录', '确定删除这条健康记录？', [
            { text: '取消', style: 'cancel' },
            { text: '删除', style: 'destructive', onPress: async () => {
                await profileService.deleteHealthRecord(id).catch(() => {});
                setRecords(prev => prev.filter(r => r.id !== id));
            }},
        ]);
    };

    // 当前健康状态卡片
    const renderHealthStatus = () => (
        <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>当前健康状态</Text>
            <View style={styles.statusGrid}>
                <View style={styles.statusItem}>
                    <Text style={styles.statusValue}>{health.heartRate}</Text>
                    <Text style={styles.statusLabel}>心率 bpm</Text>
                </View>
                <View style={styles.statusItem}>
                    <Text style={styles.statusValue}>{health.dailySteps.toLocaleString()}</Text>
                    <Text style={styles.statusLabel}>今日步数</Text>
                </View>
                <View style={styles.statusItem}>
                    <Text style={styles.statusValue}>{health.bloodOxygen}%</Text>
                    <Text style={styles.statusLabel}>血氧</Text>
                </View>
                <View style={styles.statusItem}>
                    <Text style={styles.statusValue}>{health.lastSleepDurationHours.toFixed(1)}h</Text>
                    <Text style={styles.statusLabel}>睡眠</Text>
                </View>
            </View>
        </View>
    );

    // 从calories字符串中提取数字，如 "350 kcal" -> 350
    const parseCalories = (cal: string): number => {
        const match = cal?.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    };

    // 饮食记录卡片
    const renderRecord = ({ item }: any) => {
        const isFood = item.type === 'single_food';
        const result = item.result || {};
        const items = result.items || [];

        // 从items中提取菜品名称
        const foodName = items.length > 0
            ? items.map((i: any) => i.name).join('、')
            : (result.foodName || result.name || (isFood ? '食物分析' : '菜单扫描'));

        // 从items中计算总热量
        const totalCalories = items.length > 0
            ? items.reduce((sum: number, i: any) => sum + parseCalories(i.calories), 0)
            : parseCalories(result.calories || result.totalCalories || '');
        const caloriesDisplay = totalCalories > 0 ? Math.round(totalCalories) : '--';

        const date = item.timestamp ? new Date(item.timestamp).toLocaleString('zh-CN', {
            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '';

        return (
            <View style={styles.recordCard}>
                <View style={styles.recordHeader}>
                    <View style={[styles.recordBadge, { backgroundColor: isFood ? colors.primaryBg : colors.successBg }]}>
                        <Feather name={isFood ? 'target' : 'list'} size={14} color={isFood ? colors.primary : colors.success} />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <Text style={styles.recordTitle} numberOfLines={2}>{foodName}</Text>
                        <Text style={styles.recordDate}>{date}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: spacing.xs }}>
                        <Feather name="trash-2" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* 总热量 */}
                <View style={styles.recordBody}>
                    <View style={styles.nutriItem}>
                        <Text style={styles.nutriValue}>{caloriesDisplay}</Text>
                        <Text style={styles.nutriLabel}>总千卡</Text>
                    </View>
                    <View style={styles.nutriItem}>
                        <Text style={styles.nutriValue}>{items.length}</Text>
                        <Text style={styles.nutriLabel}>菜品数</Text>
                    </View>
                </View>

                {/* 每道菜品的详细信息 */}
                {items.length > 0 && (
                    <View style={styles.itemsContainer}>
                        {items.map((foodItem: any, idx: number) => (
                            <View key={idx} style={styles.foodItemRow}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={styles.foodItemName}>{foodItem.name}</Text>
                                        {foodItem.is_recommended && (
                                            <Feather name="check-circle" size={12} color={colors.success} />
                                        )}
                                    </View>
                                    {foodItem.ingredients && foodItem.ingredients.length > 0 && (
                                        <Text style={styles.foodItemIngredients} numberOfLines={1}>
                                            {foodItem.ingredients.join('、')}
                                        </Text>
                                    )}
                                    {foodItem.warnings && (
                                        <Text style={styles.foodItemWarning} numberOfLines={1}>
                                            ⚠️ {foodItem.warnings}
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.foodItemCalories}>{foodItem.calories}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* AI健康总结 */}
                {result.health_summary && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryLabel}>AI 总结</Text>
                        <Text style={styles.summaryText} numberOfLines={3}>{result.health_summary}</Text>
                    </View>
                )}

                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tagRow}>
                        {item.tags.map((tag: string, i: number) => (
                            <View key={i} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color={colors.primary} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={records}
                keyExtractor={(item, index) => item.id || String(index)}
                renderItem={renderRecord}
                ListHeaderComponent={
                    <>
                        {renderHealthStatus()}

                        {/* 忌口/过敏原管理 */}
                        <View style={styles.statusCard}>
                            <Text style={styles.statusTitle}>忌口与过敏原</Text>
                            <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: spacing.md }}>
                                设置后，智能推荐会自动避免含这些成分的餐厅
                            </Text>

                            {/* 已添加的忌口标签 */}
                            {allergies.length > 0 && (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
                                    {allergies.map((item, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => removeAllergy(item)}
                                            style={{
                                                flexDirection: 'row', alignItems: 'center',
                                                backgroundColor: '#FDECEA', paddingHorizontal: spacing.sm,
                                                paddingVertical: spacing.xs, borderRadius: borderRadius.full,
                                            }}
                                        >
                                            <Text style={{ fontSize: fontSize.xs, color: '#C62828', marginRight: 4 }}>{item}</Text>
                                            <Feather name="x" size={12} color="#C62828" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* 常见忌口快捷选择 */}
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
                                {COMMON_ALLERGIES.filter(a => !allergies.includes(a)).slice(0, 10).map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => addAllergy(item)}
                                        style={{
                                            backgroundColor: colors.tagBg, paddingHorizontal: spacing.sm,
                                            paddingVertical: spacing.xs, borderRadius: borderRadius.full,
                                        }}
                                    >
                                        <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>+ {item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* 自定义输入 */}
                            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                                <TextInput
                                    style={{
                                        flex: 1, height: 36, borderWidth: 1, borderColor: colors.border,
                                        borderRadius: borderRadius.lg, paddingHorizontal: spacing.md,
                                        fontSize: fontSize.sm, color: colors.textPrimary,
                                        backgroundColor: colors.surface,
                                    }}
                                    placeholder="输入其他忌口..."
                                    placeholderTextColor={colors.textDisabled}
                                    value={newAllergy}
                                    onChangeText={setNewAllergy}
                                    onSubmitEditing={() => addAllergy(newAllergy)}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity
                                    onPress={() => addAllergy(newAllergy)}
                                    style={{
                                        height: 36, paddingHorizontal: spacing.lg,
                                        backgroundColor: colors.primary, borderRadius: borderRadius.lg,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.bold }}>添加</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Feather name="clipboard" size={48} color={colors.textDisabled} />
                        <Text style={styles.emptyTitle}>暂无健康记录</Text>
                        <Text style={styles.emptyDesc}>使用"拍一拍"分析食物后，可保存到健康记录</Text>
                    </View>
                }
                contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // 健康状态卡片
    statusCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.card,
    },
    statusTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    statusGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusItem: {
        alignItems: 'center',
        flex: 1,
    },
    statusValue: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    statusLabel: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
    // 记录卡片
    recordCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.card,
    },
    recordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
    },
    recordDate: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginTop: 2,
    },
    recordBody: {
        flexDirection: 'row',
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    nutriItem: {
        flex: 1,
        alignItems: 'center',
    },
    nutriValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    nutriLabel: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginTop: 2,
    },
    itemsContainer: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    foodItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    foodItemName: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
    },
    foodItemIngredients: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginTop: 2,
    },
    foodItemWarning: {
        fontSize: fontSize.xs,
        color: '#e65100',
        marginTop: 2,
    },
    foodItemCalories: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.primary,
        marginLeft: spacing.md,
    },
    summaryContainer: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    summaryLabel: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
        color: colors.textTertiary,
        marginBottom: spacing.xs,
    },
    summaryText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.md,
        gap: spacing.xs,
    },
    tag: {
        backgroundColor: colors.tagBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    tagText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
    },
    // 空状态
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.textSecondary,
        marginTop: spacing.lg,
    },
    emptyDesc: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        marginTop: spacing.sm,
        textAlign: 'center',
    },
});

export default HealthDataScreen;
