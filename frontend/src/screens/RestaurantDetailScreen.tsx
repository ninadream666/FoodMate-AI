import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    SectionList,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Animated,
    Platform,
    TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { merchantService } from '../services/merchantService';
import { profileService } from '../services/profileService';
import MenuListItem from '../components/MenuListItem';
import CartBar from '../components/CartBar';
import { hashId } from '../config/imageDictionary';

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

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
    const [scrollY] = useState(new Animated.Value(0));
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        loadMenu();
        profileService.recordHistory(id, restaurant?.name).catch(() => {});
        profileService.getFavorites().then((favs: any[]) => {
            if (Array.isArray(favs) && favs.includes(String(id))) setIsFavorite(true);
        }).catch(() => {});

        navigation.setOptions({
            title: restaurant?.name || '餐厅详情',
            headerTransparent: false,
            headerTintColor: colors.textPrimary,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTitleStyle: {
                color: colors.textPrimary,
                fontWeight: fontWeight.semibold,
                fontSize: fontSize.lg,
            },
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ paddingHorizontal: 4, paddingVertical: 4 }}
                >
                    <Feather name="chevron-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            ),
        });
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={async () => {
                        try {
                            if (isFavorite) {
                                await profileService.removeFavorite(id);
                                setIsFavorite(false);
                            } else {
                                await profileService.addFavorite(id);
                                setIsFavorite(true);
                            }
                        } catch (e) { console.warn('收藏操作失败', e); }
                    }}
                    style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                >
                    <Feather name="heart" size={22} color={isFavorite ? '#C4422E' : colors.textTertiary} />
                </TouchableOpacity>
            ),
        });
    }, [isFavorite]);

    const loadMenu = async () => {
        try {
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

    const bannerImageUrl = (() => {
        const url = restaurant?.image || restaurant?.imageUrl || restaurant?.features?.image || '';
        
        const isBadUrl = !url || 
            url.includes('unsplash.com') || 
            url.includes('example.com') || 
            url.includes('loremflickr.com') || 
            url.includes('placehold.co') ||
            url.includes('localhost') ||
            url.includes('127.0.0.1');

        if (!isBadUrl) {
            return url;
        }

        const safeId = id || 'default_merchant';
        const hash = hashId(safeId); // 使用相同的hash函数锁定图片
        
        // 动态拼装走后端代理的 URL
        return `http://8.217.223.120/app-api/images/proxy?tag=restaurant,interior&width=800&height=400&hash=${hash}`;
    })();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
                <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>正在加载菜单...</Text>
                </View>
            </View>
        );
    }

    const bannerOpacity = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [1, 0.6],
        extrapolate: 'clamp',
    });

    const bannerScale = scrollY.interpolate({
        inputRange: [-100, 0],
        outputRange: [1.3, 1],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* ========== 固定顶部：餐厅横幅 + 信息卡片 ========== */}
            <View>
                <View style={styles.bannerWrapper}>
                    <Image
                        source={{ uri: bannerImageUrl }}
                        style={styles.banner}
                        resizeMode="cover"
                    />
                    <View style={styles.bannerGradient} />
                </View>

                <View style={styles.infoCardWrapper}>
                    <View style={styles.infoCard}>
                        <Text style={styles.resName}>{restaurant?.name}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.ratingBadge}>
                                <Text style={styles.ratingStar}>★</Text>
                                <Text style={styles.ratingText}>{restaurant?.rating || 4.5}</Text>
                            </View>
                            <View style={styles.metaDot} />
                            <View style={styles.deliveryInfo}>
                                <Text style={styles.deliveryIcon}>🕐</Text>
                                <Text style={styles.deliveryText}>约30分钟</Text>
                            </View>
                            <View style={styles.metaDot} />
                            <View style={styles.freeDeliveryTag}>
                                <Text style={styles.freeDeliveryText}>免配送费</Text>
                            </View>
                        </View>
                        <View style={styles.tagRow}>
                            {(restaurant?.tags || ['品质商家', '准时达', '好评如潮']).map((tag: string, index: number) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* ========== 可滚动菜单列表 ========== */}
            <Animated.ScrollView
                style={{ flex: 1 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {sections.map((section, sectionIndex) => (
                    <View key={section.title} style={styles.sectionWrapper}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <Text style={styles.sectionCount}>{section.data.length}道</Text>
                        </View>
                        {section.data.map((item: any) => (
                            <MenuListItem 
                                key={item.id.toString()} 
                                dish={item} 
                                onAdd={handleAddToCart} 
                                fallbackMerchantImage={bannerImageUrl} 
                            />
                        ))}
                        {sectionIndex < sections.length - 1 && <View style={styles.sectionDivider} />}
                    </View>
                ))}
                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            <CartBar cartItems={cartItems} onViewCart={handleViewCart} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingCard: {
        backgroundColor: colors.surfaceFrosted,
        borderRadius: borderRadius.xxl,
        padding: spacing.xxxl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.frostedBorder,
        ...shadows.frosted,
    },
    loadingText: {
        marginTop: spacing.lg,
        fontSize: fontSize.md,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    bannerWrapper: {
        height: 180,
        overflow: 'hidden',
        backgroundColor: colors.backgroundGradientEnd,
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    bannerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'transparent',
        shadowColor: colors.background,
        shadowOffset: { width: 0, height: -40 },
        shadowOpacity: 1,
        shadowRadius: 30,
    },
    infoCardWrapper: {
        marginTop: -spacing.xxl,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        zIndex: 10,
    },
    infoCard: {
        backgroundColor: colors.surfaceFrosted,
        borderRadius: borderRadius.xxl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.frostedBorder,
        ...shadows.frosted,
    },
    resName: {
        fontSize: fontSize.xxxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        letterSpacing: 0.3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        flexWrap: 'wrap',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryBg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    ratingStar: {
        fontSize: fontSize.md,
        color: colors.primary,
        marginRight: spacing.xs,
    },
    ratingText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    metaDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.textTertiary,
        marginHorizontal: spacing.sm,
    },
    deliveryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deliveryIcon: {
        fontSize: fontSize.sm,
        marginRight: spacing.xs,
    },
    deliveryText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    freeDeliveryTag: {
        backgroundColor: colors.successBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    freeDeliveryText: {
        fontSize: fontSize.xs,
        color: colors.success,
        fontWeight: fontWeight.semibold,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    tag: {
        backgroundColor: colors.tagBg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.frostedBorder,
    },
    tagText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    sectionWrapper: {
        marginBottom: spacing.xs,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        backgroundColor: '#E8E4DD',
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    sectionAccent: {
        width: 4,
        height: 20,
        borderRadius: 2,
        backgroundColor: colors.primary,
        marginRight: spacing.md,
    },
    sectionTitle: {
        flex: 1,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        letterSpacing: 0.3,
    },
    sectionCount: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        fontWeight: fontWeight.medium,
    },
    sectionDivider: {
        height: spacing.section,
    },
});

export default RestaurantDetailScreen;