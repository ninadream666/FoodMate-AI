/**
 * AdaptiveOverlay.tsx - 环境光自适应遮罩
 *
 * 只在暗光环境 (dark/dim) 下叠深色遮罩护眼。
 * 其他光线条件下完全透明，不影响显示。
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useHealthContext } from '../hooks/useHealthContext';

const AdaptiveOverlay: React.FC = () => {
    const { lightLevel } = useHealthContext();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // 只有 dark 和 dim 才显示遮罩
    const isDark = lightLevel === 'dark' || lightLevel === 'dim';
    const overlayColor = lightLevel === 'dark'
        ? 'rgba(15, 10, 5, 0.45)'
        : lightLevel === 'dim'
            ? 'rgba(25, 20, 10, 0.25)'
            : 'rgba(0, 0, 0, 0)';

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: isDark ? 1 : 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [lightLevel, isDark, fadeAnim]);

    // 非暗光时不渲染，彻底避免任何视觉影响
    if (!isDark && fadeAnim._value === 0) {
        return null;
    }

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.overlay,
                {
                    backgroundColor: overlayColor,
                    opacity: fadeAnim,
                },
            ]}
        />
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        elevation: 9999,
    },
});

export default AdaptiveOverlay;
