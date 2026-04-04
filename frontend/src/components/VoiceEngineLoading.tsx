import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    StatusBar,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

interface VoiceEngineLoadingProps {
    progress: number;
    onCancel?: () => void;
}

const VoiceEngineLoading: React.FC<VoiceEngineLoadingProps> = ({ progress, onCancel }) => {
    // 动画值
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 启动中心盾牌的呼吸灯动画
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
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
    }, []);

    useEffect(() => {
        // 平滑过渡真实进度条
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [progress]);

    // 根据进度展示不同文案
    let statusText = "正在请求安全通信隧道...";
    if (progress > 5) statusText = "正在下载端侧隐私大模型...";
    if (progress > 70) statusText = "校验GGUF模型文件完整性...";
    if (progress > 90) statusText = "正在热部署端侧推理引擎...";
    if (progress === 100) statusText = "引擎部署完成，安全启动中...";

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* 极简背景蒙层 */}
            <View style={styles.whiteOverlay} />

            {/* 顶部导航 */}
            <SafeAreaView style={styles.header}>
                <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
                    <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edge AI Setup</Text>
                <View style={{width: 40}} />
            </SafeAreaView>

            {/* 中央扫描区 */}
            <View style={styles.centerContainer}>
                <View style={styles.scannerWrapper}>
                    {/* 外圈脉冲 */}
                    <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                    
                    {/* 中心盾牌图标 */}
                    <View style={styles.centerCircle}>
                        <Text style={{fontSize: 56}}>🛡️</Text>
                    </View>
                </View>

                {/* 状态文字 */}
                <View style={styles.statusContainer}>
                    <Text style={styles.loadingText}>{statusText}</Text>
                    <Text style={styles.percentText}>{progress}%</Text>
                </View>
            </View>

            {/* 底部进度条区 */}
            <View style={styles.bottomContainer}>
                <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>部署进度</Text>
                    <Text style={styles.progressPercent}>{progress === 100 ? 'Complete' : 'Downloading...'}</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
                </View>

                <View style={styles.poweredBy}>
                    <Text style={styles.poweredByIcon}>🔒</Text>
                    <Text style={styles.poweredByText}>
                        数据绝不出端，隐私最高权限保护
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    whiteOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.frostedBgStrong
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
    scannerWrapper: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },

    pulseRing: {
        position: 'absolute',
        width: 180, height: 180, borderRadius: 90,
        borderWidth: 2, borderColor: colors.primaryBg,
        backgroundColor: 'rgba(242,120,75,0.05)',
    },
    centerCircle: {
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: colors.surface,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: colors.borderLight,
        ...shadows.lg,
        zIndex: 10,
    },

    statusContainer: { marginTop: spacing.xxxl, alignItems: 'center' },
    loadingText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.primary, marginBottom: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xl },
    percentText: { fontSize: 32, fontWeight: fontWeight.bold, color: colors.textPrimary },

    bottomContainer: { padding: spacing.xxxl, paddingBottom: 50 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, alignItems: 'flex-end' },
    progressLabel: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },
    progressPercent: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.bold },
    progressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: borderRadius.sm, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.sm },

    poweredBy: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xxl, opacity: 0.7 },
    poweredByIcon: { fontSize: fontSize.md, marginRight: spacing.xs },
    poweredByText: { fontSize: fontSize.sm, color: colors.textSecondary }
});

export default VoiceEngineLoading;