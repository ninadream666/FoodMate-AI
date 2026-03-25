// src/components/LocationDisplay.tsx
// 位置显示组件

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import locationService from '../services/locationService';

interface LocationDisplayProps {
    onLocationChange?: (location: any) => void;
    showRefresh?: boolean;
}

function LocationDisplay({ onLocationChange, showRefresh = true }: LocationDisplayProps) {
    const [location, setLocation] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<number>(0);

    useEffect(() => {
        loadLocation();
        // 空依赖数组确保只在组件挂载时执行一次
    }, []);

    const loadLocation = async () => {
        // 防止频繁调用 - 至少间隔10秒
        const now = Date.now();
        if (now - lastUpdate < 10000) {
            console.log('🔍 LocationDisplay: 跳过频繁请求，距离上次更新不足10秒');
            return;
        }

        // 防止重复加载
        if (loading) {
            console.log('🔍 LocationDisplay: 正在加载中，跳过重复请求');
            return;
        }

        setLoading(true);
        try {
            console.log('🔄 LocationDisplay: 开始获取位置');
            const currentLocation = await locationService.getLocationWithPermission();
            console.log('📍 LocationDisplay: 获取到位置', currentLocation);

            // 检查位置是否真的改变了（避免相同位置重复更新）
            if (location &&
                Math.abs(currentLocation.latitude - location.latitude) < 0.0001 &&
                Math.abs(currentLocation.longitude - location.longitude) < 0.0001) {
                console.log('📍 位置无变化，跳过更新');
                setLoading(false);
                return;
            }

            setLocation(currentLocation);
            setLastUpdate(now);
            onLocationChange?.(currentLocation);
        } catch (error) {
            console.error('❌ LocationDisplay: 获取位置失败', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshLocation = () => {
        console.log('🔄 用户点击刷新位置');
        // 用户主动刷新时，重置时间限制
        setLastUpdate(0);
        loadLocation();
    };

    const formatLocation = (loc: any) => {
        if (!loc) return '定位中...';

        // 检查是否是默认位置（北京）
        if (loc.latitude === 39.9042 && loc.longitude === 116.4074) {
            return '⚠️ 定位失败，点击🔄重试';
        }

        if (loc.address && !loc.address.includes('默认位置') && !loc.address.includes('定位失败')) {
            return loc.address;
        }

        // 显示真实坐标 - 精度提升到6位小数
        if (loc.latitude && loc.longitude) {
            return `纬度: ${loc.latitude.toFixed(6)}, 经度: ${loc.longitude.toFixed(6)}`;
        }

        return '位置未知';
    };

    const isDefaultLocation = (loc: any) => {
        return loc?.latitude === 39.9042 && loc?.longitude === 116.4074;
    };

    return (
        <View style={[styles.container, isDefaultLocation(location) && styles.warningContainer]}>
            <View style={styles.locationInfo}>
                <Text style={styles.icon}>
                    {loading ? '🔍' : isDefaultLocation(location) ? '⚠️' : '📍'}
                </Text>
                <View style={styles.textContainer}>
                    <Text style={[styles.label, isDefaultLocation(location) && styles.warningLabel]}>
                        {isDefaultLocation(location) ? '⚠️ 定位异常' : '当前位置'}
                    </Text>
                    <Text style={[
                        styles.address,
                        isDefaultLocation(location) && styles.warningText
                    ]}>
                        {formatLocation(location)}
                    </Text>
                </View>
            </View>

            {showRefresh && (
                <TouchableOpacity
                    style={[
                        styles.refreshButton,
                        isDefaultLocation(location) && styles.warningButton
                    ]}
                    onPress={refreshLocation}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                        <Text style={styles.refreshIcon}>🔄</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardBg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    warningContainer: {
        backgroundColor: colors.warningBg,
        borderColor: colors.warning,
        borderWidth: 1.5,
    },
    locationInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        fontSize: 16,
        marginRight: spacing.sm,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        fontWeight: fontWeight.medium,
    },
    warningLabel: {
        color: colors.warning,
        fontWeight: fontWeight.semibold,
    },
    address: {
        fontSize: fontSize.sm,
        color: colors.textPrimary,
        fontWeight: fontWeight.medium,
    },
    warningText: {
        color: colors.error,
        fontWeight: fontWeight.semibold,
    },
    refreshButton: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 36,
        minHeight: 36,
        borderWidth: 1,
        borderColor: colors.border,
    },
    warningButton: {
        backgroundColor: colors.warning,
        borderColor: colors.warning,
    },
    refreshIcon: {
        fontSize: 16,
    },
});

// 使用 React.memo 防止不必要的重新渲染
export default React.memo(LocationDisplay);