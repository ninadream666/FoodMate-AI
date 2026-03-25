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
} from 'react-native';
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

    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [scrollY] = useState(new Animated.Value(0));

    useEffect(() => {
        loadMenu();
        navigation.setOptions({
            title: restaurant?.name || '餐厅详情',
            headerTransparent: true,
            headerTintColor: colors.white,
            headerStyle: { backgroundColor: 'transparent' },
            headerTitleStyle: {
                color: colors.textPrimary,
                fontWeight: fontWeight.semibold,
                fontSize: fontSize.lg,
            },
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

            <Animated.ScrollView
                style={{ flex: 1 }}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* ========== 餐厅横幅区 ========== */}
                <View style={styles.bannerWrapper}>
                    <Animated.View style={[styles.bannerImageWrapper, { opacity: bannerOpacity, transform: [{ scale: bannerScale }] }]}>
                        <Image
                            source={{ uri: restaurant?.image || restaurant?.imageUrl }}
                            style={styles.banner}
                            resizeMode="cover"
                        />
                    </Animated.View>
                    {/* 底部渐变遮罩 */}
                    <View style={styles.bannerGradient} />
                </View>

                {/* ========== 餐厅信息卡片（磨砂风格浮于横幅上） ========== */}
                <View style={styles.infoCardWrapper}>
                    <View style={styles.infoCard}>
                        {/* 餐厅名称 */}
                        <Text style={styles.resName}>{restaurant?.name}</Text>

                        {/* 评分 + 配送信息行 */}
                        <View style={styles.metaRow}>
                            {/* 评分徽章 */}
                            <View style={styles.ratingBadge}>
                                <Text style={styles.ratingStar}>★</Text>
                                <Text style={styles.ratingText}>{restaurant?.rating || 4.5}</Text>
                            </View>

                            {/* 分隔点 */}
                            <View style={styles.metaDot} />

                            {/* 配送时间 */}
                            <View style={styles.deliveryInfo}>
                                <Text style={styles.deliveryIcon}>🕐</Text>
                                <Text style={styles.deliveryText}>约30分钟</Text>
                            </View>

                            {/* 分隔点 */}
                            <View style={styles.metaDot} />

                            {/* 免配送费标签 */}
                            <View style={styles.freeDeliveryTag}>
                                <Text style={styles.freeDeliveryText}>免配送费</Text>
                            </View>
                        </View>

                        {/* 标签行 */}
                        <View style={styles.tagRow}>
                            {(restaurant?.tags || ['品质商家', '准时达', '好评如潮']).map((tag: string, index: number) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* ========== 菜单分类列表 ========== */}
                {sections.map((section, sectionIndex) => (
                    <View key={section.title} style={styles.sectionWrapper}>
                        {/* 分类标题 */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionAccent} />
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <Text style={styles.sectionCount}>{section.data.length}道</Text>
                        </View>

                        {/* 菜品列表 */}
                        {section.data.map((item: any) => (
                            <MenuListItem key={item.id.toString()} dish={item} onAdd={handleAddToCart} />
                        ))}

                        {/* 分组间留白区隔（非最后一组） */}
                        {sectionIndex < sections.length - 1 && <View style={styles.sectionDivider} />}
                    </View>
                ))}

                {/* 底部留白（给购物车栏让出空间） */}
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
        height: 240,
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
        marginTop: -spacing.xxxl,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
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
        backgroundColor: colors.backgroundSection,
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
