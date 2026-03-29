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
import MenuListItem from '../components/MenuListItem';
import CartBar from '../components/CartBar';

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
    console.log('🏪 餐厅数据:', JSON.stringify({ image: restaurant?.image, imageUrl: restaurant?.imageUrl, features: restaurant?.features?.image }, null, 2));

    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [scrollY] = useState(new Animated.Value(0));

    useEffect(() => {
        loadMenu();
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
                    style={{
                        paddingHorizontal: 4,
                        paddingVertical: 4,
                    }}
                >
                    <Feather
                        name="chevron-left"
                        size={24}
                        color={colors.textPrimary}
                        style={{
                            textShadowColor: 'rgba(0,0,0,0.2)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 3,
                        }}
                    />
                </TouchableOpacity>
            ),
        });
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

    // 加载态 - 北欧风居中微暖
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

    // 横幅图片透明度动画（滚动时渐隐）
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
                        source={{ uri: (() => {
                            const url = restaurant?.image || restaurant?.imageUrl || restaurant?.features?.image || '';
                            // 如果是 Unsplash 链接（国内无法访问）或为空，用 picsum 替代
                            if (!url || url.includes('unsplash.com')) {
                                return `https://loremflickr.com/800/400/restaurant,food`;
                            }
                            return url;
                        })() }}
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
                            <MenuListItem key={item.id.toString()} dish={item} onAdd={handleAddToCart} />
                        ))}
                        {sectionIndex < sections.length - 1 && <View style={styles.sectionDivider} />}
                    </View>
                ))}
                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {/* ========== 底部购物车栏 ========== */}
            <CartBar cartItems={cartItems} onViewCart={handleViewCart} />
        </View>
    );
};

const styles = StyleSheet.create({
    // ============ 容器 ============
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // 加载状态
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

    // ============ 横幅区 ============
    bannerWrapper: {
        height: 180,
        overflow: 'hidden',
        backgroundColor: colors.backgroundGradientEnd,
    },
    bannerImageWrapper: {
        width: '100%',
        height: '100%',
    },
    banner: {
        width: '100%',
        height: '100%',
    },
    // 横幅底部渐变遮罩（模拟浅底渐变效果 Image2）
    bannerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'transparent',
        // 用半透明白色模拟渐变过渡
        borderTopWidth: 0,
        ...(Platform.OS === 'ios' ? {} : {}),
        // 用多层叠加模拟渐变
        shadowColor: colors.background,
        shadowOffset: { width: 0, height: -40 },
        shadowOpacity: 1,
        shadowRadius: 30,
    },

    // ============ 信息卡片（磨砂风格 Image3） ============
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

    // 元信息行
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

    // 标签行
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

    // ============ 分类区 ============
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
