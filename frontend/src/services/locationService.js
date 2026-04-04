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
        return true; // iOS权限在Info.plist中配置
    }

    // 获取当前位置（快速优先策略：网络定位和GPS并行竞速）
    async getCurrentLocation() {
        return new Promise((resolve) => {
            if (!Geolocation) {
                console.error('❌ Geolocation模块未正确导入');
                resolve(DEFAULT_LOCATION);
                return;
            }

            // 如果有缓存且不超过60秒，直接返回
            if (this.currentLocation && (Date.now() - this.lastRequestTime < 60000)) {
                console.log('⚡ 使用60秒内缓存位置，秒返回');
                resolve(this.currentLocation);
                return;
            }

            console.log('🚀 开始并行竞速定位...');
            const startTime = Date.now();
            let isResolved = false;

            const resolveOnce = (location, source) => {
                if (isResolved) return;
                isResolved = true;
                const elapsed = Date.now() - startTime;
                console.log(`✅ ${source}定位成功! 耗时: ${elapsed}ms`);
                this.currentLocation = location;
                resolve(location);
            };

            // 紧急超时保护
            const emergencyTimeout = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    console.log('⏰ 超时保护触发（10秒），使用默认位置');
                    resolve(DEFAULT_LOCATION);
                }
            }, 10000);

            const makeLocation = (position, source) => ({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                address: `纬度: ${position.coords.latitude.toFixed(6)}, 经度: ${position.coords.longitude.toFixed(6)}`
            });

            // 策略1: 网络定位（快，允许缓存）
            Geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(emergencyTimeout);
                    resolveOnce(makeLocation(position, '网络'), '网络');
                },
                (error) => {
                    console.warn('⚠️ 网络定位失败:', error.message);
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 5 * 60 * 1000 }
            );

            // 策略2: GPS高精度（慢但准，谁先到用谁）
            Geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(emergencyTimeout);
                    resolveOnce(makeLocation(position, 'GPS'), 'GPS');
                },
                (error) => {
                    console.warn('⚠️ GPS定位失败:', error.message);
                    // 两个都失败时用默认
                    setTimeout(() => {
                        if (!isResolved) {
                            isResolved = true;
                            clearTimeout(emergencyTimeout);
                            console.log('📍 所有定位失败，使用默认位置');
                            resolve(DEFAULT_LOCATION);
                        }
                    }, 500);
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000, forceRequestLocation: true, showLocationDialog: true }
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

            // 检查并请求权限
            const hasPermission = await this.requestLocationPermission();
            if (!hasPermission) {
                console.warn('位置权限被拒绝，使用默认位置');
                return DEFAULT_LOCATION;
            }

            // 检查位置服务是否开启
            const isLocationEnabled = await this.checkLocationEnabled();
            if (!isLocationEnabled) {
                console.warn('⚠️ 位置服务检查失败，但继续尝试定位...');
                // 即使服务检查失败，也继续尝试获取位置
            } else {
                console.log('✅ 位置服务检查通过');
            }

            // 获取位置
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