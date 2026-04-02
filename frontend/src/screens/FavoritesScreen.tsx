import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { profileService } from '../services/profileService';
import { merchantService } from '../services/merchantService';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/NordicTheme';

const FavoritesScreen = ({ navigation }: any) => {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadFavorites(); }, []);

    const loadFavorites = async () => {
        try {
            const favIds = await profileService.getFavorites();
            const ids = Array.isArray(favIds) ? favIds : [];
            const merchants = await Promise.all(
                ids.map(async (id: number) => {
                    try {
                        return await merchantService.getMerchantById(id);
                    } catch { return { id, name: `店铺 #${id}`, address: '' }; }
                })
            );
            setFavorites(merchants);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleRemove = (id: number) => {
        Alert.alert('取消收藏', '确定取消收藏该店铺？', [
            { text: '取消', style: 'cancel' },
            { text: '确定', onPress: async () => {
                await profileService.removeFavorite(id).catch(() => {});
                setFavorites(prev => prev.filter(m => m.id !== id));
            }},
        ]);
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color={colors.primary} />;

    return (
        <FlatList
            style={styles.container}
            data={favorites}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ padding: spacing.lg }}
            ListEmptyComponent={<Text style={styles.empty}>暂无收藏的店铺</Text>}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{item.name}</Text>
                        {item.address ? <Text style={styles.address}>{item.address}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
                        <Text style={styles.removeText}>取消收藏</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}
        />
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, borderRadius: borderRadius.xl,
        padding: spacing.lg, marginBottom: spacing.md,
        borderWidth: 1, borderColor: colors.cardBorder,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
    address: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: spacing.xs },
    removeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.error },
    removeText: { fontSize: fontSize.sm, color: colors.error },
    empty: { textAlign: 'center', marginTop: 60, fontSize: fontSize.md, color: colors.textTertiary },
});

export default FavoritesScreen;
