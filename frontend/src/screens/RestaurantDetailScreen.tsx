import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    SectionList,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { merchantService } from '../services/merchantService';
import MenuListItem from '../components/MenuListItem';
import CartBar from '../components/CartBar';

// 数据转换工具函数
const organizeMenuByCategory = (menuItems: any[]) => {
    const categories: any = { '主食': [], '小吃': [], '饮品': [], '其他': [] };
    const map: any = { 'mainCourses': '主食', 'appetizers': '小吃', 'drinks': '饮品', 'desserts': '其他' };

    menuItems.forEach((item) => {
        let key = map[item.category] || '其他';
        if (categories[item.category]) key = item.category;
        if (!categories[key]) categories[key] = [];
        categories[key].push(item);
    });

    return Object.keys(categories)
        .filter(key => categories[key].length > 0)
        .map(key => ({ title: key, data: categories[key] }));
};

const RestaurantDetailScreen = ({ route, navigation }: any) => {
    const { restaurant } = route.params || {};
    const id = restaurant?.id || route.params?.id;

    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState<any[]>([]);

    useEffect(() => {
        loadMenu();
        navigation.setOptions({ title: restaurant?.name || '餐厅详情' });
    }, []);

    const loadMenu = async () => {
        try {
            // 关键修改：加了 (merchantService as any) 来避开 TS 报错
            const data = await (merchantService as any).getPublicMenu(id);
            const organized = organizeMenuByCategory(data);
            setSections(organized);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (dish: any) => {
        setCartItems(prev => {
            const exist = prev.find(i => i.id === dish.id);
            if (exist) {
                return prev.map(i => i.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...dish, quantity: 1 }];
        });
    };

    const handleViewCart = () => {
        navigation.navigate('Cart', {
            cartItems,
            restaurant: restaurant || { id, name: '餐厅' }
        });
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;

    return (
        <View style={styles.container}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <MenuListItem dish={item} onAdd={handleAddToCart} />
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.header}>
                        <Text style={styles.headerText}>{title}</Text>
                    </View>
                )}
                ListHeaderComponent={
                    <View style={styles.restaurantHeader}>
                        <Image source={{ uri: restaurant?.image || restaurant?.imageUrl }} style={styles.banner} />
                        <View style={styles.headerInfo}>
                            <Text style={styles.resName}>{restaurant?.name}</Text>
                            <Text style={styles.resMeta}>⭐ {restaurant?.rating || 4.5} • 配送约30分钟</Text>
                        </View>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />

            <CartBar cartItems={cartItems} onViewCart={handleViewCart} />
        </View>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    restaurantHeader: {
        marginBottom: spacing.md,
    },
    banner: {
        width: '100%',
        height: 200,
        backgroundColor: colors.backgroundGradientEnd,
    },
    headerInfo: {
        padding: spacing.xl,
        backgroundColor: colors.surface,
        borderBottomWidth: spacing.sm,
        borderBottomColor: colors.background,
        marginTop: -spacing.xl,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.xl,
        ...shadows.md,
    },
    resName: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.sm,
        color: colors.textPrimary,
    },
    resMeta: {
        color: colors.textSecondary,
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
    },
    // 分类标题 - 北欧风格
    header: {
        backgroundColor: colors.backgroundGradientEnd,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        marginTop: spacing.sm,
    },
    headerText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
});

export default RestaurantDetailScreen;