import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { profileService } from '../services/profileService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/NordicTheme';

const BrowseHistoryScreen = ({ navigation }: any) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadHistory(); }, []);

    const loadHistory = async () => {
        try {
            const data = await profileService.getHistory();
            setHistory(Array.isArray(data) ? data.reverse() : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleClearAll = () => {
        Alert.alert('清空历史', '确定清空所有浏览记录？', [
            { text: '取消', style: 'cancel' },
            { text: '确定', onPress: async () => {
                await profileService.clearHistory().catch(() => {});
                setHistory([]);
            }},
        ]);
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color={colors.primary} />;

    return (
        <View style={styles.container}>
            {history.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
                    <Text style={styles.clearText}>清空记录</Text>
                </TouchableOpacity>
            )}
            <FlatList
                data={history}
                keyExtractor={(item, index) => item.recordId || String(index)}
                contentContainerStyle={{ padding: spacing.lg }}
                ListEmptyComponent={<Text style={styles.empty}>暂无浏览记录</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('RestaurantDetail', { restaurant: { id: item.merchantId } })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{item.merchantName || `店铺 #${item.merchantId}`}</Text>
                            <Text style={styles.time}>
                                {item.timestamp ? new Date(item.timestamp).toLocaleString('zh-CN') : ''}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    clearBtn: { alignSelf: 'flex-end', marginRight: spacing.lg, marginTop: spacing.md },
    clearText: { fontSize: fontSize.sm, color: colors.error },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: borderRadius.xl,
        padding: spacing.lg, marginBottom: spacing.md,
        borderWidth: 1, borderColor: colors.cardBorder,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
    time: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: spacing.xs },
    empty: { textAlign: 'center', marginTop: 60, fontSize: fontSize.md, color: colors.textTertiary },
});

export default BrowseHistoryScreen;
