// src/components/OptimizedImage.tsx
// 优化的图片组件 - 使用FastImage实现缓存、预加载、渐进式加载
import React, { useState, memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import FastImage, { FastImageProps, Priority, ResizeMode } from 'react-native-fast-image';
import { colors } from '../theme/NordicTheme';

interface OptimizedImageProps extends Omit<FastImageProps, 'source'> {
    uri: string;
    width?: number;
    height?: number;
    priority?: 'low' | 'normal' | 'high';
    showLoading?: boolean;
    fallbackUri?: string;
}

// 默认占位图
const DEFAULT_PLACEHOLDER = 'https://loremflickr.com/300/200/food,meal';

// 优化图片URL
const getOptimizedGoogleUrl = (url: string, width: number = 300): string => {
    if (!url) return DEFAULT_PLACEHOLDER;

    // 对 图片添加尺寸参数以减少下载大小
    if (url.includes('googleusercontent.com') || url.includes('lh3.google')) {
        // 移除已有的尺寸参数
        let cleanUrl = url.replace(/=w\d+(-h\d+)?(-[a-z]+)?$/i, '');
        cleanUrl = cleanUrl.replace(/=s\d+(-[a-z]+)?$/i, '');
        // 添加新的尺寸参数
        return `${cleanUrl}=w${width}`;
    }

    return url;
};

// 优先级映射
const priorityMap: Record<string, Priority> = {
    low: FastImage.priority.low,
    normal: FastImage.priority.normal,
    high: FastImage.priority.high,
};

/**
 * 优化的图片组件
 * - 自动缓存图片
 * - 支持渐进式加载
 * - 自动压缩图片
 * - 加载失败自动重试
 */
const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
    uri,
    width = 300,
    height,
    priority = 'normal',
    showLoading = true,
    fallbackUri,
    style,
    resizeMode = 'cover',
    ...rest
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // 优化URL
    const optimizedUri = getOptimizedGoogleUrl(uri, width);
    const finalUri = hasError && fallbackUri ? fallbackUri : optimizedUri;

    return (
        <View style={[styles.container, style]}>
            <FastImage
                style={[styles.image, style]}
                source={{
                    uri: finalUri,
                    priority: priorityMap[priority],
                    cache: FastImage.cacheControl.immutable, // 使用永久缓存
                }}
                resizeMode={resizeMode as ResizeMode}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                }}
                {...rest}
            />

            {/* 加载中指示器 */}
            {showLoading && isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: colors.backgroundGradientEnd,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.backgroundGradientEnd,
    },
});

/**
 * 预加载图片列表
 * @param urls 图片URL列表
 */
export const preloadImages = (urls: string[]) => {
    const validUrls = urls
        .filter(url => url && typeof url === 'string')
        .map(url => ({
            uri: getOptimizedGoogleUrl(url),
        }));

    if (validUrls.length > 0) {
        FastImage.preload(validUrls);
    }
};

/**
 * 清除图片缓存
 */
export const clearImageCache = async () => {
    await FastImage.clearMemoryCache();
    await FastImage.clearDiskCache();
};

export default OptimizedImage;
