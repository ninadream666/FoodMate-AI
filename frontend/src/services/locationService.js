// src/services/locationService.js
// 地理定位服务

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

// 默认位置（仅在无法获取定位时使用）
const DEFAULT_LOCATION = {
    latitude: 39.9042,
    longitude: 116.4074,
    address: '定位失败，请检查权限设置'
};

class LocationService {
    constructor() {
        this.currentLocation = null;
        this.watchId = null;
        this.lastRequestTime = 0;
        this.isRequesting = false;
        this.REQUEST_INTERVAL = 10000; // 10秒间隔
    }

    // 请求定位权限
    async requestLocationPermission() {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: '位置权限',
                        message: 'FoodMate 需要访问您的位置信息来推荐附近的美食',
                        buttonNegative: '拒绝',
                        buttonPositive: '允许',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn('权限请求失败:', err);
                return false;
            }
        }
        return true; // iOS 权限在 Info.plist 中配置
    }

    // 获取当前位置
    async getCurrentLocation() {
        return new Promise((resolve) => {
            // 检查Geolocation是否可用
            if (!Geolocation) {
                console.error('❌ Geolocation模块未正确导入');
                resolve(DEFAULT_LOCATION);
                return;
            }

            console.log('🚀 开始双策略定位流程...');
            console.log('📱 设备信息: Platform=' + Platform.OS);

            let isResolved = false; // 防止多次resolve

            // 添加额外的超时保护（防止系统层面卡住）
            const emergencyTimeout = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    console.log('⏰ 紧急超时保护触发（30秒），使用默认位置');
                    resolve(DEFAULT_LOCATION);
                }
            }, 30000);

            // 首先尝试高精度定位
            const highAccuracyOptions = {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0,
                forceRequestLocation: true,
                forceLocationManager: false,
                showLocationDialog: true,
                distanceFilter: 0,
            };

            console.log('🎆 尝试高精度GPS定位...', highAccuracyOptions);
            const startTime = Date.now();

            Geolocation.getCurrentPosition(
                (position) => {
                    if (isResolved) return;
                    isResolved = true;
                    clearTimeout(emergencyTimeout);

                    const elapsed = Date.now() - startTime;
                    console.log(`✅ 高精度定位成功! 耗时: ${elapsed}ms`, position);
                    console.log('📍 GPS细节:', {
                        纬度: position.coords.latitude,
                        经度: position.coords.longitude,
                        精度: position.coords.accuracy + 'm',
                        时间戳: new Date(position.timestamp).toLocaleTimeString()
                    });
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        address: `纬度: ${position.coords.latitude.toFixed(6)}, 经度: ${position.coords.longitude.toFixed(6)}`
                    };
                    this.currentLocation = location;
                    resolve(location);
                },
                (error) => {
                    if (isResolved) return;

                    const elapsed = Date.now() - startTime;
                    console.warn(`⚠️ 高精度定位失败(耗时${elapsed}ms)，错误详情:`, {
                        错误码: error.code,
                        错误消息: error.message,
                        TIMEOUT: error.TIMEOUT,
                        PERMISSION_DENIED: error.PERMISSION_DENIED,
                        POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE
                    });

                    // 如果高精度失败，尝试网络定位
                    console.log('🌐 切换到网络定位策略...');
                    const networkStartTime = Date.now();
                    const networkOptions = {
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 5 * 60 * 1000, // 允许5分钟内的缓存
                    };

                    Geolocation.getCurrentPosition(
                        (position) => {
                            if (isResolved) return;
                            isResolved = true;
                            clearTimeout(emergencyTimeout);

                            const networkElapsed = Date.now() - networkStartTime;
                            console.log(`✅ 网络定位成功! 耗时: ${networkElapsed}ms`, position);
                            const location = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                                address: `纬度: ${position.coords.latitude.toFixed(6)}, 经度: ${position.coords.longitude.toFixed(6)} (网络定位)`
                            };
                            this.currentLocation = location;
                            resolve(location);
                        },
                        (networkError) => {
                            if (isResolved) return;
                            isResolved = true;
                            clearTimeout(emergencyTimeout);

                            console.error('❌ 网络定位也失败:', networkError);
                            let message = '定位失败';

                            switch (networkError.code) {
                                case 1: // PERMISSION_DENIED
                                    message = '位置权限被拒绝，请在设置中开启位置权限';
                                    break;
                                case 2: // POSITION_UNAVAILABLE
                                    message = '位置服务不可用，请检查GPS或网络';
                                    break;
                                case 3: // TIMEOUT
                                    message = '定位超时，请确保GPS已开启';
                                    break;
                                case 4: // PLAY_SERVICE_NOT_AVAILABLE
                                    message = 'Google Play服务不可用';
                                    break;
                                case 5: // SETTINGS_NOT_SATISFIED
                                    message = '位置设置不满足要求';
                                    break;
                                default:
                                    message = `定位错误 (${networkError.code}): ${networkError.message}`;
                            }

                            console.log('📍 位置获取最终失败，使用默认位置:', message);
                            // 移除弹窗，避免干扰用户体验
                            // Alert.alert('定位提示', message);
                            resolve(DEFAULT_LOCATION);
                        },
                        networkOptions
                    );
                },
                highAccuracyOptions
            );
        });
    }

    // 检查位置服务是否开启
    async checkLocationEnabled() {
        return new Promise((resolve) => {
            // 检查Geolocation是否可用
            if (!Geolocation) {
                console.error('❌ Geolocation模块未正确导入');
                resolve(false);
                return;
            }

            Geolocation.requestAuthorization('whenInUse')
                .then((result) => {
                    console.log('位置服务授权结果:', result);
                    resolve(result === 'granted');
                })
                .catch((error) => {
                    console.warn('检查位置服务失败:', error);
                    resolve(false);
                });
        });
    }

    // 获取位置（带权限检查）
    async getLocationWithPermission() {
        // 全局防重复调用机制
        const now = Date.now();
        if (this.isRequesting) {
            console.log('🔍 LocationService: 正在定位中，跳过重复请求');
            return this.currentLocation || DEFAULT_LOCATION;
        }

        if (now - this.lastRequestTime < this.REQUEST_INTERVAL) {
            console.log('🔍 LocationService: 距离上次定位不足10秒，返回缓存位置');
            return this.currentLocation || DEFAULT_LOCATION;
        }

        this.isRequesting = true;
        this.lastRequestTime = now;

        try {
            console.log('🔍 开始完整定位流程...');

            // 1. 检查并请求权限
            const hasPermission = await this.requestLocationPermission();
            if (!hasPermission) {
                console.warn('位置权限被拒绝，使用默认位置');
                // 移除弹窗，用默认位置代替
                // Alert.alert('权限不足', '需要位置权限才能获取真实位置');
                return DEFAULT_LOCATION;
            }

            // 2. 检查位置服务是否开启
            const isLocationEnabled = await this.checkLocationEnabled();
            if (!isLocationEnabled) {
                console.warn('⚠️ 位置服务检查失败，但继续尝试定位...');
                // 即使服务检查失败，也继续尝试获取位置
            } else {
                console.log('✅ 位置服务检查通过');
            }

            // 3. 获取位置
            console.log('📍 权限和服务都正常，开始定位...');
            const location = await this.getCurrentLocation();
            this.currentLocation = location; // 缓存位置
            return location;
        } catch (error) {
            console.error('获取位置失败:', error);
            return DEFAULT_LOCATION;
        } finally {
            this.isRequesting = false; // 重置请求状态
        }
    }

    // 开始监听位置变化
    startWatchingLocation(callback) {
        const options = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 10000,
            interval: 5000,
            fastestInterval: 2000,
        };

        this.watchId = Geolocation.watchPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    address: `纬度: ${position.coords.latitude.toFixed(4)}, 经度: ${position.coords.longitude.toFixed(4)}`
                };
                this.currentLocation = location;
                callback(location);
            },
            (error) => {
                console.warn('位置监听错误:', error);
                callback(DEFAULT_LOCATION);
            },
            options
        );

        return this.watchId;
    }

    // 停止监听位置变化
    stopWatchingLocation() {
        if (this.watchId) {
            Geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    // 获取缓存的位置
    getCachedLocation() {
        return this.currentLocation || DEFAULT_LOCATION;
    }

    // 计算两点间距离（千米）
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球半径（千米）
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // 紧急定位方法 - 更激进的参数
    async getLocationEmergency() {
        return new Promise((resolve, reject) => {
            if (!Geolocation) {
                console.error('❌ Geolocation模块不可用');
                reject(new Error('Geolocation模块不可用'));
                return;
            }

            console.log('🚨 启动紧急定位模式...');

            const emergencyOptions = {
                enableHighAccuracy: false, // 先用网络定位，更快
                timeout: 60000, // 60秒超时
                maximumAge: 10 * 60 * 1000, // 允许10分钟缓存
            };

            Geolocation.getCurrentPosition(
                (position) => {
                    console.log('🎯 紧急定位成功:', position);
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        address: `紧急定位: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
                    };
                    resolve(location);
                },
                (error) => {
                    console.error('💥 紧急定位也失败:', error);
                    reject(error);
                },
                emergencyOptions
            );
        });
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}

// 导出单例
export const locationService = new LocationService();
export default locationService;