import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { merchantService } from '../services/merchantService';
import { recommendationService } from '../services/recommendationService'; // 1. 引入推荐服务
import RestaurantCard from '../components/RestaurantCard';
import { authService } from '../services/authService';
import locationService from '../services/locationService'; // 定位服务
import LocationDisplay from '../components/LocationDisplay'; // 位置显示组件
import StatusCapsule from '../components/StatusCapsule'; // 状态胶囊组件（内置开发者面板触发）
import ActiveRecommendationModal from '../components/ActiveRecommendationModal'; // 主动推荐弹窗
import WeatherAlertModal from '../components/WeatherAlertModal'; // 天气感知弹窗
import DevModePanel from '../components/DevModePanel'; // 开发者面板
import { useHealthContext } from '../hooks/useHealthContext'; // 健康上下文
import weatherService, { WeatherData } from '../services/weatherService'; // 天气服务

const HomeScreen = ({ navigation }: any) => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [user, setUser] = useState<any>(null);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [lastLoadTime, setLastLoadTime] = useState(0); // 记录上次加载时间
    const [hasInitialData, setHasInitialData] = useState(false); // 标记是否已有初始数据

    // 健康上下文
    const health = useHealthContext();
    // 主动推荐弹窗状态
    const [showActiveRecommendation, setShowActiveRecommendation] = useState(false);
    // 开发者面板状态
    const [showDevPanel, setShowDevPanel] = useState(false);
    // 天气感知弹窗状态
    const [showWeatherAlert, setShowWeatherAlert] = useState(false);
    // 上一次运动状态（用于检测变化）
    const prevPostWorkoutRef = useRef(false);
    // 上一次天气状态（用于检测变化）
    const prevWeatherRef = useRef<string | null>(null);
    // 天气数据
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    // 天气弹窗已显示标记（避免重复弹出）
    const weatherAlertShownRef = useRef(false);

    // 初始化加载
    useEffect(() => {
        console.log('🚀 HomeScreen初始化开始');
        console.log('🔧 强制重置loading状态，解除可能的死锁');
        setLoading(false); // 强制重置loading状态

        loadUser();

        // 测试API连接
        testAPIConnection();
        // 不要立即调用loadData，等待LocationDisplay提供位置
    }, []);

    // 监测运动状态变化，触发主动推荐弹窗
    useEffect(() => {
        // 检测从非运动后状态变为运动后状态
        if (health.isPostWorkout && !prevPostWorkoutRef.current) {
            console.log('🏃 检测到运动结束，显示主动推荐弹窗');
            setShowActiveRecommendation(true);
            // 自动刷新推荐（带健康上下文）
            if (currentLocation) {
                loadData(currentLocation);
            }
        }
        prevPostWorkoutRef.current = health.isPostWorkout;
    }, [health.isPostWorkout]);

    // 获取天气数据
    const fetchWeather = async (latitude: number, longitude: number) => {
        try {
            console.log('🌤️ 获取天气数据...');
            const weather = await weatherService.getWeather(latitude, longitude);
            setWeatherData(weather);
            console.log('🌤️ 天气数据:', weather);

            // 检测天气变化，弹出提醒
            const currentCondition = weather.condition;
            const shouldShowAlert =
                (weather.isRaining || weather.isHeavyRain || weather.isExtreme ||
                    weather.temperature > 35 || weather.temperature < 5) &&
                !weatherAlertShownRef.current;

            // 如果天气状况发生变化且需要提醒
            if (shouldShowAlert && prevWeatherRef.current !== currentCondition) {
                console.log('⚠️ 检测到需要提醒的天气:', currentCondition);
                setShowWeatherAlert(true);
                weatherAlertShownRef.current = true;
                // 30分钟后重置，允许再次弹出
                setTimeout(() => {
                    weatherAlertShownRef.current = false;
                }, 30 * 60 * 1000);
            }
            prevWeatherRef.current = currentCondition;

            return weather;
        } catch (error) {
            console.error('获取天气失败:', error);
            return null;
        }
    };

    const loadUser = async () => {
        const u = await authService.getCurrentUser();
        setUser(u);
    };



    const testAPIConnection = async () => {
        try {
            console.log('🔧 测试推荐API连接...');
            const testParams = {
                user_id: 'test',
                location: {
                    address: '测试位置',
                    latitude: 39.9042,
                    longitude: 116.4074,
                },
                query: '测试连接',
                max_results: 1,
            };

            const response = await fetch('http://192.168.1.16:8087/api/v2/agents/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testParams)
            });

            console.log('🔧 测试响应状态:', response.status);
            const data = await response.json();
            console.log('🔧 测试响应数据:', data);
        } catch (error) {
            console.error('🔧 API连接测试失败:', error);
        }
    };

    // 计算两个位置之间的距离（米）
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // 地球半径（米）
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // 距离（米）
    };

    // 检查是否需要重新加载（防抖和距离检查）
    const shouldReload = (newLocation: any) => {
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTime;

        // 如果还没有初始数据，立即加载
        if (!hasInitialData) {
            console.log('📋 首次加载数据');
            return true;
        }

        // 防抖：30秒内不重复加载
        if (timeSinceLastLoad < 30000) {
            console.log('⏱️ 距离上次加载不足30秒，跳过');
            return false;
        }

        // 如果没有当前位置，需要加载
        if (!currentLocation) {
            console.log('📍 没有当前位置，需要加载');
            return true;
        }

        // 检查位置变化：超过100米才重新加载
        const distance = calculateDistance(
            currentLocation.latitude, currentLocation.longitude,
            newLocation.latitude, newLocation.longitude
        );

        if (distance > 100) {
            console.log(`🚶 位置显著变化：${distance.toFixed(0)}米，重新加载`);
            return true;
        }

        console.log(`📌 位置微小变化：${distance.toFixed(0)}米，不重新加载`);
        return false;
    };

    // 2. 修改后的数据加载逻辑
    // skipWeatherFetch: 跳过天气API调用（用于模拟时保留模拟天气）
    const loadData = async (providedLocation = null, skipWeatherFetch = false) => {
        console.log('🏁 loadData 函数被调用! 参数:', providedLocation ? '有位置' : '无位置', '跳过天气:', skipWeatherFetch);

        // 防止重复加载
        if (loading) {
            console.log('⏳ 正在加载中，跳过重复请求');
            return;
        }

        // 设置超时保护，确保loading状态不会永久卡住
        const timeoutId = setTimeout(() => {
            console.warn('⚠️ loadData执行超时，强制重置loading状态');
            setLoading(false);
            setRefreshing(false);
        }, 30000); // 30秒超时

        try {
            console.log('🏁 loadData开始执行，设置loading=true');
            setLoading(true);

            let location: any = providedLocation;

            // 如果没有提供位置，使用当前位置或等待位置更新
            if (!location) {
                if (currentLocation) {
                    location = currentLocation;
                    console.log('📍 使用已有位置:', location.address);
                } else {
                    console.log('⏳ 等待位置更新...');
                    setLoading(false); // 重要：重置loading状态
                    return; // 等待LocationDisplay提供位置
                }
            }

            console.log('📍 使用位置详情:', {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
                accuracy: location.accuracy
            });

            console.log('👤 用户状态检查:', { hasUser: !!user, userId: user?.id });

            setCurrentLocation(location);

            // 获取天气数据（异步，不阻塞主流程）- 可跳过以保留模拟数据
            if (!skipWeatherFetch) {
                fetchWeather(location.latitude, location.longitude);
            } else {
                console.log('🌤️ 跳过天气获取（保留模拟天气）');
            }

            // 检查是否是北京默认位置
            if (Math.abs(location.latitude - 39.9042) < 0.001 && Math.abs(location.longitude - 116.4074) < 0.001) {
                console.warn('⚠️ 警告：使用的是默认北京位置，不是真实位置');
            }

            // 确保用户已加载（如果没有用户，等待一下或使用默认值）
            let currentUser = user;
            if (!currentUser) {
                console.log('⏳ 用户信息还未加载，尝试重新获取...');
                currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            }

            // 调用智能推荐 API - 保持完整精度
            const recommendParams = {
                userId: currentUser?.id || 'guest',
                latitude: location.latitude, // 不进行数字转换，保持原始精度
                longitude: location.longitude,
                address: location.address,
                // 添加健康上下文
                healthContext: {
                    dailySteps: health.dailySteps,
                    recentSteps30min: health.recentSteps30min,
                    heartRate: health.heartRate,
                    activityStatus: health.activityStatus,
                    isPostWorkout: health.isPostWorkout,
                },
                // 添加天气上下文
                weatherContext: weatherData ? {
                    condition: weatherData.condition,
                    temperature: weatherData.temperature,
                    humidity: weatherData.humidity,
                    windSpeed: weatherData.windSpeed,
                    isRaining: weatherData.isRaining,
                    isHeavyRain: weatherData.isHeavyRain,
                    deliveryImpact: weatherData.deliveryImpact,
                } : undefined,
            };

            console.log('🚀 发送推荐请求参数:', recommendParams);
            console.log('🏃 健康上下文:', recommendParams.healthContext);
            console.log('🌦️ 天气上下文:', recommendParams.weatherContext);
            console.log('📡 即将调用recommendationService.getV2Recommendations...');
            const response = await recommendationService.getV2Recommendations(recommendParams);
            console.log('🎯 推荐服务原始响应:', response);

            // 打印详细的推荐信息，便于调试
            if (response?.recommendations?.[0]) {
                const firstRec = response.recommendations[0];
                console.log('🔍 首个推荐详情:', {
                    name: firstRec.name,
                    score: firstRec.score,
                    reason: firstRec.reason,
                    features: firstRec.features,
                    restaurant_id: firstRec.restaurant_id
                });
            }

            // 兼容后端可能返回的多种格式
            const list = response.recommendations || response.restaurants || (Array.isArray(response) ? response : []);
            console.log('📋 解析后的餐厅列表:', {
                hasResponse: !!response,
                listLength: list.length,
                listSample: list.slice(0, 2)
            });

            // 如果推荐为空（可能是新用户且后端没数据），尝试获取普通列表兜底
            if (!list || list.length === 0) {
                console.log('📭 推荐为空，使用兜底数据');
                const fallback = await merchantService.getRecommendedMerchants();
                console.log('🏪 获取到兜底餐厅数据:', fallback.length, '条');
                setRestaurants(fallback);
            } else {
                console.log('✅ 获取到智能推荐数据:', list.length, '条');
                setRestaurants(list);
                setHasInitialData(true); // 标记已有数据
            }

        } catch (error) {
            console.error('❌ 加载推荐失败，切换到兜底逻辑:', error);
            // 出错也使用兜底数据，保证首页不白屏
            try {
                const fallback = await merchantService.getRecommendedMerchants();
                console.log('🏪 兜底数据加载成功:', fallback.length, '条');
                setRestaurants(fallback);
            } catch (fallbackError) {
                console.error('❌ 兜底数据加载也失败:', fallbackError);
                setRestaurants([]);
            }
        } finally {
            clearTimeout(timeoutId); // 清除超时定时器
            console.log('🏁 数据加载完成，重置loading状态');
            setLoading(false);
            setRefreshing(false);
            setLastLoadTime(Date.now()); // 记录加载时间
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData(currentLocation); // 使用当前位置刷新
    };

    const handleLogout = async () => {
        await authService.logout();
        navigation.replace('Login');
    };

    // 渲染头部组件 (搜索框 + 欢迎语)
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* 位置显示 */}
            <LocationDisplay
                onLocationChange={async (loc) => {
                    console.log('🔄 位置更新:', loc);

                    // 检查是否从默认位置变为真实GPS位置
                    const isCurrentDefault = currentLocation &&
                        Math.abs(currentLocation.latitude - 39.9042) < 0.001 &&
                        Math.abs(currentLocation.longitude - 116.4074) < 0.001;
                    const isNewRealGPS = loc &&
                        !(Math.abs(loc.latitude - 39.9042) < 0.001 && Math.abs(loc.longitude - 116.4074) < 0.001);

                    if (isCurrentDefault && isNewRealGPS) {
                        console.log('🎯 从默认北京位置切换到真实GPS，强制重新加载推荐');
                        setCurrentLocation(loc);
                        console.log('💫 即将调用loadData，当前loading状态:', loading);
                        try {
                            await loadData(loc); // 强制使用真实GPS重新加载
                        } catch (error) {
                            console.error('❌ loadData调用出错:', error);
                            setLoading(false);
                        }
                        return;
                    }

                    // 简单的距离和时间检查
                    const now = Date.now();
                    const timeSinceLastLoad = now - lastLoadTime;

                    // 如果有当前位置，计算距离变化
                    if (currentLocation && hasInitialData) {
                        const latDiff = Math.abs(loc.latitude - currentLocation.latitude);
                        const lonDiff = Math.abs(loc.longitude - currentLocation.longitude);
                        const smallChange = latDiff < 0.001 && lonDiff < 0.001; // 大约100米内

                        if (smallChange && timeSinceLastLoad < 30000) {
                            console.log(`📌 位置微调(${latDiff.toFixed(6)}, ${lonDiff.toFixed(6)})且时间间隔${Math.round(timeSinceLastLoad / 1000)}秒 < 30秒，跳过重载`);
                            setCurrentLocation(loc); // 更新位置但不重新加载
                            return;
                        }
                    }

                    console.log('💫 位置显著变化或首次加载，调用loadData');
                    setCurrentLocation(loc);

                    console.log('💫 即将调用loadData，当前loading状态:', loading);
                    try {
                        await loadData(loc); // 使用新位置加载数据
                    } catch (error) {
                        console.error('❌ loadData调用出错:', error);
                        setLoading(false); // 确保在出错时重置loading状态
                    }
                }}
                showRefresh={true}
            />

            {/* 状态胶囊 - 显示天气和健康状态 */}
            <StatusCapsule
                weather={weatherData ? {
                    condition: weatherData.condition,
                    temperature: weatherData.temperature,
                } : undefined}
                onPress={() => {
                    // 点击可以打开开发者面板（5次点击触发）
                    console.log('状态胶囊被点击');
                }}
            />

            {/* 欢迎语 */}
            <View style={styles.welcomeRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.welcomeText}>今天吃点什么?</Text>
                    <Text style={styles.userName}>{user?.username || user?.nickname || '朋友'}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('OrderList')}
                        style={{ padding: 8 }}
                    >
                        <Text style={{ color: '#333', fontWeight: 'bold' }}>📜 订单</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>退出</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 开发者工具栏（仅开发模式显示） */}
            {__DEV__ && (
                <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        <TouchableOpacity
                            onPress={() => {
                                console.log('🛠️ 打开健康模拟面板');
                                setShowDevPanel(true);
                            }}
                            style={{ flex: 1, padding: 10, backgroundColor: '#fff3e0', borderRadius: 8, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#e85a2d', fontWeight: 'bold' }}>🏃 健康模拟</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('LocationDebug')}
                            style={{ flex: 1, padding: 10, backgroundColor: '#e3f2fd', borderRadius: 8, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>🔍 位置调试</Text>
                        </TouchableOpacity>
                    </View>
                    {/* 快捷模拟：运动结束 */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        <TouchableOpacity
                            onPress={() => {
                                console.log('🏃‍♂️ 一键模拟：刚跑完步');
                                health.simulateJustFinishedWorkout();
                                // 直接显示弹窗（不依赖 useEffect）
                                setShowActiveRecommendation(true);
                                // 用户在弹窗内点击"查看推荐"时会刷新推荐列表
                            }}
                            style={{ flex: 1, padding: 12, backgroundColor: '#fce4ec', borderRadius: 8, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#c2185b', fontWeight: 'bold', fontSize: 14 }}>💪 模拟刚跑完步</Text>
                            <Text style={{ color: '#c2185b', fontSize: 10, marginTop: 2 }}>心率145 / 步数12000</Text>
                        </TouchableOpacity>
                    </View>
                    {/* 天气模拟按钮 */}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => {
                                console.log('🌧️ 模拟大雨天气');
                                const rainWeather: WeatherData = {
                                    condition: '大雨',
                                    temperature: 18,
                                    humidity: 95,
                                    windSpeed: 20,
                                    icon: '🌧️',
                                    isRaining: true,
                                    isHeavyRain: true,
                                    isExtreme: false,
                                    deliveryImpact: 'severe',
                                    recommendation: '外面雨很大，已为您优先筛选配送运力充足、包装防水的商家',
                                };
                                setWeatherData(rainWeather);
                                setShowWeatherAlert(true);
                                // 注意：不要在这里调用 loadData()，因为它会重新获取真实天气并覆盖模拟数据
                                // 用户点击弹窗中的"查看推荐"按钮时会刷新推荐
                            }}
                            style={{ flex: 1, padding: 10, backgroundColor: '#e8f5e9', borderRadius: 8, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#388e3c', fontWeight: 'bold' }}>🌧️ 模拟大雨</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                console.log('🥵 模拟高温天气');
                                const hotWeather: WeatherData = {
                                    condition: '晴',
                                    temperature: 38,
                                    humidity: 40,
                                    windSpeed: 5,
                                    icon: '☀️',
                                    isRaining: false,
                                    isHeavyRain: false,
                                    isExtreme: false,
                                    deliveryImpact: 'minor',
                                    recommendation: '天气炎热，为您推荐清凉解暑的美食',
                                };
                                setWeatherData(hotWeather);
                                setShowWeatherAlert(true);
                                // 注意：不要在这里调用 loadData()，用户点击弹窗按钮时会刷新推荐
                            }}
                            style={{ flex: 1, padding: 10, backgroundColor: '#ffebee', borderRadius: 8, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>🥵 模拟高温</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* 搜索框 */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="搜索餐厅、菜系..."
                    value={searchText}
                    onChangeText={setSearchText}
                />
                <TouchableOpacity style={styles.searchButton}>
                    <Text style={{ color: '#fff' }}>🔍</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <FlatList
                data={restaurants}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                    <RestaurantCard
                        restaurant={item}
                        onPress={(r) => {
                            // 跳转并传参
                            navigation.navigate('RestaurantDetail', { restaurant: r });
                        }}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>暂时没有推荐餐厅</Text>
                        </View>
                    ) : null
                }
            />

            {loading && !refreshing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#e85a2d" />
                </View>
            )}

            {/* 主动推荐弹窗（运动结束后自动弹出） */}
            <ActiveRecommendationModal
                visible={showActiveRecommendation}
                onClose={() => setShowActiveRecommendation(false)}
                onViewRecommendations={() => {
                    // 点击查看推荐时，刷新推荐列表（带健康上下文）
                    console.log('📍 查看推荐餐食，刷新推荐列表...');
                    setShowActiveRecommendation(false);
                    if (currentLocation) {
                        loadData(currentLocation, true); // 跳过天气获取
                    }
                }}
            />

            {/* 开发者健康模拟面板 */}
            <DevModePanel
                visible={showDevPanel}
                onClose={() => setShowDevPanel(false)}
            />

            {/* 天气感知弹窗 */}
            <WeatherAlertModal
                visible={showWeatherAlert}
                weather={weatherData}
                onClose={() => setShowWeatherAlert(false)}
                onAcceptRecommendation={() => {
                    // 刷新推荐（使用当前天气数据，不重新获取）
                    console.log('🌤️ 接受天气推荐，刷新推荐列表...');
                    setShowWeatherAlert(false);
                    if (currentLocation) {
                        loadData(currentLocation, true); // skipWeatherFetch=true 保留模拟天气
                    }
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 20,
    },
    welcomeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    logoutBtn: {
        padding: 8,
    },
    logoutText: {
        color: '#e85a2d',
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 16,
        height: 44,
        borderWidth: 1,
        borderColor: '#eee',
    },
    searchButton: {
        width: 44,
        height: 44,
        backgroundColor: '#e85a2d',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default HomeScreen;