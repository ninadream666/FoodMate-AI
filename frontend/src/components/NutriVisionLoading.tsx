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
    onCancel?: () => void;
}

const NutriVisionLoading: React.FC<NutriVisionLoadingProps> = ({ imageUri, onCancel }) => {
    // 动画值
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const radarRotate = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // 状态文字轮播
    const loadingTexts = [
        "正在识别菜单文字...", 
        "小助理全力分析中...", 
        "正在匹配健康建议...",
        "生成营养透视报告..."
    ];
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
        Animated.timing(progressAnim, {
            toValue: 90, // 走到90%停住等待接口返回
            duration: 8000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();

        // 4. 文字轮播定时器
        const interval = setInterval(() => {
            setTextIndex(prev => (prev + 1) % loadingTexts.length);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

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
                            <Text style={{fontSize: 48}}>🥗</Text>
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
                    <Text style={styles.progressLabel}>AI Vision Processing</Text>
                    <Text style={styles.progressPercent}>Processing...</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
                </View>

                <View style={styles.poweredBy}>
                    <Text style={styles.poweredByIcon}>⚡</Text>
                    <Text style={styles.poweredByText}>基于 Google Gemini Vision 提供技术支持</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    backgroundImage: { width: '100%', height: '100%', position: 'absolute' },
    whiteOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(255,255,255,0.85)' // 白色蒙层
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16,
        paddingTop: 10
    },
    closeBtn: {
        width: 40, height: 40,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeIcon: { fontSize: 20, color: '#333' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 50 },
    scannerWrapper: { width: 300, height: 300, justifyContent: 'center', alignItems: 'center' },
    
    pulseRing: {
        position: 'absolute',
        width: 280, height: 280, borderRadius: 140,
        borderWidth: 2, borderColor: 'rgba(232, 90, 45, 0.2)',
    },
    radarContainer: {
        width: 200, height: 200, borderRadius: 100,
        borderWidth: 2, borderColor: '#e85a2d',
        overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        elevation: 10, shadowColor: '#e85a2d', shadowOpacity: 0.3, shadowRadius: 10
    },
    radarSweep: {
        width: '100%', height: '100%', position: 'absolute',
    },
    radarGradient: {
        width: '100%', height: '50%', 
        backgroundColor: 'rgba(232, 90, 45, 0.15)', // 扫描扇形颜色
        borderBottomWidth: 2, borderBottomColor: '#e85a2d'
    },
    centerIcon: { zIndex: 10 },
    
    statusContainer: { marginTop: 40, alignItems: 'center' },
    loadingText: { fontSize: 20, fontWeight: 'bold', color: '#e85a2d', marginBottom: 10 },
    dotsContainer: { flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e85a2d' },
    
    bottomContainer: { padding: 30, paddingBottom: 50 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-end' },
    progressLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
    progressPercent: { fontSize: 12, color: '#e85a2d', fontWeight: 'bold' },
    progressBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#e85a2d', borderRadius: 3 },
    
    poweredBy: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, opacity: 0.6 },
    poweredByIcon: { fontSize: 14, marginRight: 4 },
    poweredByText: { fontSize: 12, color: '#666' }
});

export default NutriVisionLoading;