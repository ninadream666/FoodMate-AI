import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Animated,
    Easing,
    Dimensions,
    StatusBar,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface NutriVisionLoadingProps {
    imageUri: string;
    mode?: 'menu' | 'food'; // 新增 mode 属性识别加载状态
    onCancel?: () => void;
}

const NutriVisionLoading: React.FC<NutriVisionLoadingProps> = ({ imageUri, mode = 'menu', onCancel }) => {
    // 动画值
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const radarRotate = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // 根据模式动态分配不同维度的装X状态文字
    const menuTexts = [
        "正在识别菜单文字...", 
        "小助理全力分析中...", 
        "正在匹配健康建议...",
        "生成营养透视报告..."
    ];
    
    const foodTexts = [
        "底层高精度视觉模型启动...", 
        "锁定食物纹理与特征...", 
        "端云协同：请求云端知识图谱...",
        "生成专属单品健康分析..."
    ];

    const loadingTexts = mode === 'food' ? foodTexts : menuTexts;
    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        // 1. 启动呼吸灯动画
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // 2. 启动雷达旋转动画
        Animated.loop(
            Animated.timing(radarRotate, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 3. 模拟进度条动画 (假进度，为了视觉效果)
        // 单品模式因为有 CV 加持速度更快，进度条可以走得稍微快一点
        const duration = mode === 'food' ? 5000 : 8000;
        Animated.timing(progressAnim, {
            toValue: 90, // 走到90%停住等待接口返回
            duration: duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();

        // 4. 文字轮播定时器
        const interval = setInterval(() => {
            setTextIndex(prev => (prev + 1) % loadingTexts.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [mode]);

    // 插值映射
    const spin = radarRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* 背景图 + 白色模糊蒙层 */}
            <Image 
                source={{ uri: imageUri }} 
                style={styles.backgroundImage} 
                blurRadius={15} // 高斯模糊
            />
            <View style={styles.whiteOverlay} />

            {/* 顶部导航 */}
            <SafeAreaView style={styles.header}>
                <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
                    <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Analysis</Text>
                <View style={{width: 40}} />
            </SafeAreaView>

            {/* 中央扫描区 */}
            <View style={styles.centerContainer}>
                <View style={styles.scannerWrapper}>
                    {/* 外圈脉冲 */}
                    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                    
                    {/* 雷达圆盘 */}
                    <View style={styles.radarContainer}>
                        <Animated.View style={[styles.radarSweep, { transform: [{ rotate: spin }] }]}>
                            <View style={styles.radarGradient} />
                        </Animated.View>
                        <View style={styles.centerIcon}>
                            <Text style={{fontSize: 48}}>{mode === 'food' ? '🍱' : '🥗'}</Text>
                        </View>
                    </View>
                </View>

                {/* 状态文字 */}
                <View style={styles.statusContainer}>
                    <Text style={styles.loadingText}>{loadingTexts[textIndex]}</Text>
                    <View style={styles.dotsContainer}>
                        <View style={[styles.dot, { opacity: 1 }]} />
                        <View style={[styles.dot, { opacity: 0.6 }]} />
                        <View style={[styles.dot, { opacity: 0.3 }]} />
                    </View>
                </View>
            </View>

            {/* 底部进度条区 */}
            <View style={styles.bottomContainer}>
                <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>
                        {mode === 'food' ? 'CV + LLM Engine Active' : 'AI Vision Processing'}
                    </Text>
                    <Text style={styles.progressPercent}>Processing...</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
                </View>

                <View style={styles.poweredBy}>
                    <Text style={styles.poweredByIcon}>⚡</Text>
                    <Text style={styles.poweredByText}>
                        {mode === 'food' ? '基于自研 CV 模型与云端知识图谱' : '基于 Google Gemini Vision 提供技术支持'}
                    </Text>
                </View>
            </View>
        </View>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.textPrimary },
    backgroundImage: { width: '100%', height: '100%', position: 'absolute' },
    whiteOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.frostedBgStrong // 磨砂白色蒙层
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md
    },
    closeBtn: {
        width: 40, height: 40,
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    closeIcon: { fontSize: fontSize.xl, color: colors.textPrimary },
    headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 50 },
    scannerWrapper: { width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },

    pulseRing: {
        position: 'absolute',
        width: 280, height: 280, borderRadius: 140,
        borderWidth: 2, borderColor: colors.primaryBg,
    },
    radarContainer: {
        width: 200, height: 200, borderRadius: 100,
        borderWidth: 2, borderColor: colors.primary,
        overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
        backgroundColor: colors.frostedBg,
        ...shadows.lg,
    },
    radarSweep: {
        width: '100%', height: '100%', position: 'absolute',
    },
    radarGradient: {
        width: '100%', height: '50%',
        backgroundColor: colors.primaryBg, // 扫描扇形颜色
        borderBottomWidth: 2, borderBottomColor: colors.primary
    },
    centerIcon: { zIndex: 10 },

    statusContainer: { marginTop: spacing.xxxl, alignItems: 'center' },
    loadingText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.primary, marginBottom: spacing.md },
    dotsContainer: { flexDirection: 'row', gap: spacing.sm },
    dot: { width: 6, height: 6, borderRadius: borderRadius.xs, backgroundColor: colors.primary },

    bottomContainer: { padding: spacing.xxxl, paddingBottom: 50 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, alignItems: 'flex-end' },
    progressLabel: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
    progressPercent: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.bold },
    progressBarBg: { height: 6, backgroundColor: colors.border, borderRadius: borderRadius.xs, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.xs },

    poweredBy: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xxl, opacity: 0.6 },
    poweredByIcon: { fontSize: fontSize.md, marginRight: spacing.xs },
    poweredByText: { fontSize: fontSize.sm, color: colors.textSecondary }
});

export default NutriVisionLoading;