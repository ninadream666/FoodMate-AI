import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';
import { getDishImage } from '../config/imageDictionary';

interface Props {
    dish: any;
    onAdd: (dish: any) => void;
    fallbackMerchantImage?: string; // 接收从详情页传下来的商家主图兜底
}

const MenuListItem = memo(({ dish, onAdd, fallbackMerchantImage }: Props) => {
    
    // 动态计算该菜品的最终配图URL
    const displayImage = (() => {
        // 兼容后端可能使用的多种图片字段名
        let finalUrl = dish.imageUrl || dish.image || dish.picture || '';
        
        // 无论数据库里存了什么，只要没有明确包含代理接口'/app-api/images/proxy'
        // 就一律视为脏数据，强行拦截
        const isBadUrl = !finalUrl || !finalUrl.includes('/app-api/images/proxy');

        if (isBadUrl) {
            if (dish.name === '米饭' || dish.name === '白米饭') {
                // 生成安全的hash确保后端不溢出
                const safeHash = (dish.id ? String(dish.id).charCodeAt(0) : Math.floor(Math.random() * 1000)) % 2147483647;
                finalUrl = `http://8.217.223.120/app-api/images/proxy?tag=white,rice,bowl&width=200&height=200&hash=${safeHash}`;
            } 

            // 将默认的例汤固定为视觉效果更好的西红柿汤
            else if (dish.name === '例汤' || dish.name.includes('番茄') || dish.name.includes('西红柿')) {
                const safeHash = (dish.id ? String(dish.id).charCodeAt(0) : Math.floor(Math.random() * 1000)) % 2147483647;
                finalUrl = `http://8.217.223.120/app-api/images/proxy?tag=tomato,soup&width=200&height=200&hash=${safeHash}`;
            } 
            else {
                // 其他菜品正常走智能代理匹配，获取高清美食图
                finalUrl = getDishImage(
                    dish.name, 
                    dish.category, 
                    '', // 传入空字符，防止小菜品错误继承商家大横幅导致比例失调
                    dish.id || Math.random()
                );
            }
        }

        return finalUrl;
    })();

    return (
        <View style={styles.container}>
            {/* 使用原生Image组件，彻底告别第三方库的莫名拦截机制 */}
            <Image
                source={{ uri: displayImage }}
                style={styles.image}
                resizeMode="cover"
            />

            {/* 中间信息 */}
            <View style={styles.info}>
                <Text style={styles.name}>{dish.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{dish.description}</Text>
                <Text style={styles.price}>¥{dish.price.toFixed(2)}</Text>
            </View>

            {/* 右侧添加按钮 */}
            <TouchableOpacity activeOpacity={0.7} onPress={() => onAdd(dish)}>
                <LinearGradient
                    colors={['#FFA07A', '#C4422E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addButton}
                >
                    <Text style={styles.addText}>+</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
});

// 磨砂风格样式
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: spacing.lg,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0DBD3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: 76,
        height: 76,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.backgroundGradientEnd,
    },
    info: {
        flex: 1,
        marginLeft: spacing.md,
        justifyContent: 'center',
    },
    name: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    desc: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        marginBottom: spacing.sm,
        lineHeight: 18,
    },
    price: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    addText: {
        color: colors.textOnPrimary,
        fontSize: 22,
        lineHeight: 24,
        fontWeight: fontWeight.medium,
    },
});

export default MenuListItem;