// src/screens/LocationDebugScreen.tsx
// 定位调试页面 - 帮助诊断定位问题

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import locationService from '../services/locationService';

// 尝试使用React Native内置的定位API作为备用
const nativeGeolocation = navigator.geolocation;

export default function LocationDebugScreen() {
    const [permissionStatus, setPermissionStatus] = useState('未知');
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [locationHistory, setLocationHistory] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const status = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                setPermissionStatus(status ? '已授权' : '未授权');
            } catch (err) {
                setPermissionStatus('检查失败');
            }
        } else {
            setPermissionStatus('iOS - 检查Info.plist');
        }
    };

    const requestPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: '位置权限测试',
                        message: '测试应用需要位置权限来检测定位功能',
                        buttonNegative: '拒绝',
                        buttonPositive: '允许',
                    }
                );

                const status = granted === PermissionsAndroid.RESULTS.GRANTED ? '已授权' : '被拒绝';
                setPermissionStatus(status);
                Alert.alert('权限结果', `位置权限: ${status}`);
            } catch (err) {
                Alert.alert('错误', '权限请求失败');
            }
        }
    };

    const testLocationOnce = () => {
        setError(null);
        console.log('🔍 开始单次定位测试');

        // 检查Geolocation是否可用
        if (!Geolocation) {
            console.error('❌ Geolocation模块未正确导入');
            setError('Geolocation模块未正确导入，请检查库是否正确安装');
            Alert.alert('错误', 'Geolocation模块未正确导入，请重新安装依赖');
            return;
        }

        // 更强力的定位配置
        const options = {
            enableHighAccuracy: true,
            timeout: 60000, // 60秒超时
            maximumAge: 0, // 不使用缓存
            forceRequestLocation: true,
            showLocationDialog: true,
            forceLocationManager: true, // 强制使用位置管理器
            distanceFilter: 0,
        };

        console.log('📍 使用配置:', options);

        Geolocation.getCurrentPosition(
            (position) => {
                console.log('✅ 定位成功:', position);
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toLocaleTimeString(),
                    altitude: position.coords.altitude,
                    speed: position.coords.speed,
                };

                setCurrentLocation(location);
                setLocationHistory(prev => [location, ...prev.slice(0, 4)]);

                Alert.alert('定位成功',
                    `纬度: ${location.latitude.toFixed(6)}\n经度: ${location.longitude.toFixed(6)}\n精度: ${location.accuracy}米`
                );
            },
            (error) => {
                console.error('❌ 定位失败:', error);
                let message = '定位失败';

                switch (error.code) {
                    case 1: // PERMISSION_DENIED
                        message = '位置权限被拒绝';
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        message = '位置服务不可用';
                        break;
                    case 3: // TIMEOUT
                        message = '定位超时';
                        break;
                    default:
                        message = `定位错误: ${error.message}`;
                }

                setError(message);
                Alert.alert('定位失败', message);
            },
            options
        );
    };

    const clearHistory = () => {
        setLocationHistory([]);
        setCurrentLocation(null);
        setError(null);
    };

    // 网络定位测试（精度较低但更快）
    const testNetworkLocation = () => {
        setError(null);
        console.log('🌐 开始网络定位测试');

        // 检查Geolocation是否可用
        if (!Geolocation) {
            console.error('❌ Geolocation模块未正确导入');
            setError('Geolocation模块未正确导入，请检查库是否正确安装');
            Alert.alert('错误', 'Geolocation模块未正确导入，请重新安装依赖');
            return;
        }

        const options = {
            enableHighAccuracy: false, // 使用网络定位
            timeout: 15000,
            maximumAge: 0,
        };

        Geolocation.getCurrentPosition(
            (position) => {
                console.log('✅ 网络定位成功:', position);
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toLocaleTimeString(),
                    type: '网络定位',
                };

                setCurrentLocation(location);
                setLocationHistory(prev => [location, ...prev.slice(0, 4)]);

                Alert.alert('网络定位成功',
                    `纬度: ${location.latitude.toFixed(6)}\n经度: ${location.longitude.toFixed(6)}\n精度: ${location.accuracy}米\n类型: 网络定位`
                );
            },
            (error) => {
                console.error('❌ 网络定位失败:', error);
                setError(`网络定位失败: ${error.message}`);
            },
            options
        );
    };

    // 连续定位测试
    const testLocationContinuous = () => {
        setError(null);
        console.log('🔄 开始连续定位测试');

        // 检查Geolocation是否可用
        if (!Geolocation) {
            console.error('❌ Geolocation模块未正确导入');
            setError('Geolocation模块未正确导入，请检查库是否正确安装');
            Alert.alert('错误', 'Geolocation模块未正确导入，请重新安装依赖');
            return;
        }

        let attemptCount = 0;
        const maxAttempts = 3;

        const tryLocation = () => {
            attemptCount++;
            console.log(`📍 第${attemptCount}次定位尝试`);

            const options = {
                enableHighAccuracy: attemptCount === 1, // 第一次用高精度，后续用网络
                timeout: attemptCount === 1 ? 30000 : 15000,
                maximumAge: 0,
            };

            Geolocation.getCurrentPosition(
                (position) => {
                    console.log(`✅ 第${attemptCount}次定位成功:`, position);
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toLocaleTimeString(),
                        attempt: attemptCount,
                        type: attemptCount === 1 ? 'GPS' : '网络',
                    };

                    setCurrentLocation(location);
                    setLocationHistory(prev => [location, ...prev.slice(0, 4)]);

                    Alert.alert('连续定位成功',
                        `第${attemptCount}次尝试成功\n纬度: ${location.latitude.toFixed(6)}\n经度: ${location.longitude.toFixed(6)}\n精度: ${location.accuracy}米`
                    );
                },
                (error) => {
                    console.error(`❌ 第${attemptCount}次定位失败:`, error);
                    if (attemptCount < maxAttempts) {
                        setTimeout(tryLocation, 2000); // 2秒后重试
                    } else {
                        setError(`连续定位失败，已尝试${maxAttempts}次`);
                        Alert.alert('定位失败', `连续${maxAttempts}次定位都失败了`);
                    }
                },
                options
            );
        };

        tryLocation();
    };

    // 检查系统位置设置
    const checkSystemSettings = async () => {
        try {
            // 检查Geolocation是否可用
            if (!Geolocation) {
                console.error('❌ Geolocation模块未正确导入');
                setError('Geolocation模块未正确导入，请检查库是否正确安装');
                Alert.alert('错误', 'Geolocation模块未正确导入，请重新安装依赖');
                return;
            }

            // 检查位置服务授权
            const result = await Geolocation.requestAuthorization('whenInUse');
            console.log('位置授权状态:', result);

            let message = '';
            switch (result) {
                case 'granted':
                    message = '✅ 位置权限已授予';
                    break;
                case 'denied':
                    message = '❌ 位置权限被拒绝';
                    break;
                case 'disabled':
                    message = '⚠️ 位置服务已禁用';
                    break;
                case 'restricted':
                    message = '🔒 位置服务受限制';
                    break;
                default:
                    message = `❓ 未知状态: ${result}`;
            }

            // 添加详细的系统检查信息
            const systemInfo = `
系统检查结果：
• 授权状态: ${result}
• 平台: ${Platform.OS}
• 高精度定位: ${Platform.OS === 'android' ? '需要GPS开启' : '需要精确定位开启'}

建议操作：
1. 检查手机设置 > 位置 > 应用权限
2. 确保GPS/位置服务已开启  
3. 尝试到户外开阔地带测试
4. 重启定位服务或重启手机
            `;

            Alert.alert('系统检查', message + systemInfo);

        } catch (error) {
            console.error('系统检查失败:', error);
            Alert.alert('检查失败', `无法检查系统设置: ${error.message}`);
        }
    };

    // 紧急定位测试 - 更激进的参数
    const testEmergencyLocation = async () => {
        setError(null);
        console.log('🚨 启动紧急定位测试...');

        try {
            console.log('⏰ 开始60秒紧急定位，请等待...');
            setCurrentLocation({ loading: true, message: '紧急定位中，请耐心等待60秒...' });

            const location = await locationService.getLocationEmergency();

            console.log('🎯 紧急定位成功!', location);
            const finalLocation = {
                ...location,
                timestamp: new Date().toLocaleTimeString(),
                type: '紧急定位'
            };

            setCurrentLocation(finalLocation);
            setLocationHistory(prev => [finalLocation, ...prev.slice(0, 4)]);

            Alert.alert('紧急定位成功!',
                `纬度: ${location.latitude.toFixed(6)}\n经度: ${location.longitude.toFixed(6)}\n精度: ${location.accuracy}米\n类型: 紧急定位（60秒超时）`
            );

        } catch (error) {
            console.error('💥 紧急定位失败:', error);
            setError(`紧急定位失败: ${error.message}`);
            Alert.alert('紧急定位失败', `即使60秒超时也无法定位: ${error.message}\n\n可能原因:\n1. 位置服务完全关闭\n2. 设备GPS硬件故障\n3. 处于信号完全覆盖不到的地方`);
        }
    };

    // 最基础的定位测试 - 使用React Native内置API
    const testBasicLocation = () => {
        setError(null);
        console.log('🔧 尝试最基础的定位API...');

        if (!nativeGeolocation) {
            setError('设备不支持地理定位');
            Alert.alert('不支持', '您的设备不支持地理定位功能');
            return;
        }

        const timeoutId = setTimeout(() => {
            setError('基础定位超时（10秒）');
            console.log('⏰ 基础定位10秒超时');
        }, 10000);

        nativeGeolocation.getCurrentPosition(
            (position) => {
                clearTimeout(timeoutId);
                console.log('✅ 基础定位成功!', position);

                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toLocaleTimeString(),
                    type: '基础定位'
                };

                setCurrentLocation(location);
                setLocationHistory(prev => [location, ...prev.slice(0, 4)]);

                Alert.alert('基础定位成功!',
                    `纬度: ${location.latitude.toFixed(6)}\n经度: ${location.longitude.toFixed(6)}\n精度: ${location.accuracy}米\n使用: React Native内置API`
                );
            },
            (error) => {
                clearTimeout(timeoutId);
                console.error('❌ 基础定位失败:', error);
                let message = '基础定位失败';
                switch (error.code) {
                    case 1:
                        message = '位置权限被拒绝';
                        break;
                    case 2:
                        message = '网络错误或位置服务不可用';
                        break;
                    case 3:
                        message = '定位请求超时';
                        break;
                    default:
                        message = `未知错误 (${error.code}): ${error.message}`;
                }
                setError(message);
                Alert.alert('基础定位失败', message);
            },
            {
                enableHighAccuracy: false,
                timeout: 8000,
                maximumAge: 30000
            }
        );
    };

    // 强制清理所有定位请求
    const forceStopLocation = () => {
        console.log('🛑 强制停止所有定位请求...');

        // 清理所有可能的监听器
        if (nativeGeolocation && nativeGeolocation.clearWatch) {
            try {
                // 清理所有可能的watch ID
                for (let i = 0; i < 10; i++) {
                    nativeGeolocation.clearWatch(i);
                }
            } catch (e) {
                console.log('清理watch时出错:', e);
            }
        }

        if (Geolocation && Geolocation.stopObserving) {
            try {
                Geolocation.stopObserving();
            } catch (e) {
                console.log('停止Geolocation观察时出错:', e);
            }
        }

        setCurrentLocation(null);
        setError(null);
        Alert.alert('已强制停止', '所有定位请求已被强制停止');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.title}>📱 定位功能调试</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>权限状态:</Text>
                    <Text style={[styles.value,
                    permissionStatus === '已授权' ? styles.success : styles.error
                    ]}>
                        {permissionStatus}
                    </Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>🔐 请求位置权限</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={testLocationOnce}>
                    <Text style={styles.buttonText}>📍 GPS高精度定位</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={testNetworkLocation}>
                    <Text style={styles.buttonText}>🌐 网络定位测试</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={testLocationContinuous}>
                    <Text style={styles.buttonText}>🔄 连续定位测试</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={checkSystemSettings}>
                    <Text style={styles.buttonText}>⚙️ 检查系统设置</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#FF6B35' }]}
                    onPress={testEmergencyLocation}
                >
                    <Text style={styles.buttonText}>🚨 紧急定位测试</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#28a745' }]}
                    onPress={testBasicLocation}
                >
                    <Text style={styles.buttonText}>🔧 最基础定位</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#dc3545' }]}
                    onPress={forceStopLocation}
                >
                    <Text style={styles.buttonText}>🛑 强制停止定位</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={clearHistory}>
                    <Text style={styles.buttonText}>🗑️ 清除记录</Text>
                </TouchableOpacity>
            </View>

            {error && (
                <View style={styles.errorSection}>
                    <Text style={styles.errorTitle}>❌ 错误信息</Text>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {currentLocation && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 当前位置</Text>
                    <Text style={styles.location}>
                        纬度: {currentLocation.latitude.toFixed(6)}{'\n'}
                        经度: {currentLocation.longitude.toFixed(6)}{'\n'}
                        精度: {currentLocation.accuracy}米{'\n'}
                        时间: {currentLocation.timestamp}
                        {currentLocation.altitude && `\n海拔: ${currentLocation.altitude}米`}
                        {currentLocation.speed && `\n速度: ${currentLocation.speed}m/s`}
                    </Text>
                </View>
            )}

            {locationHistory.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 定位历史</Text>
                    {locationHistory.map((loc, index) => (
                        <View key={index} style={styles.historyItem}>
                            <Text style={styles.historyText}>
                                {loc.timestamp}: {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} (±{loc.accuracy}m)
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 故障排除</Text>
                <Text style={styles.helpText}>
                    1. 确保已授权位置权限{'\n'}
                    2. 检查GPS是否已开启{'\n'}
                    3. 尝试在户外开阔地带测试{'\n'}
                    4. 确保网络连接正常{'\n'}
                    5. 重启应用或设备{'\n'}
                    6. 检查设备位置服务是否开启
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    section: {
        backgroundColor: '#ffffff',
        margin: 10,
        padding: 15,
        borderRadius: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#333333',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333333',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#666666',
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
    },
    success: {
        color: '#28a745',
    },
    error: {
        color: '#dc3545',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
    location: {
        fontSize: 14,
        fontFamily: 'monospace',
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 6,
        lineHeight: 20,
    },
    historyItem: {
        backgroundColor: '#f8f9fa',
        padding: 8,
        borderRadius: 4,
        marginBottom: 5,
    },
    historyText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    errorSection: {
        backgroundColor: '#f8d7da',
        margin: 10,
        padding: 15,
        borderRadius: 8,
        borderColor: '#dc3545',
        borderWidth: 1,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#721c24',
        marginBottom: 5,
    },
    errorText: {
        fontSize: 14,
        color: '#721c24',
    },
    helpText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    },
});