import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Modal,
    Alert,
    Image,
    Animated,
    Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { merchantService } from '../services/merchantService';
import { recommendationService } from '../services/recommendationService'; // 1. 引入推荐服务
import { edgeSynergyService } from '../services/edgeSynergyService'; // 引入端云协同服务引擎
import { voiceInferenceService } from '../services/VoiceInferenceService'; // 原生离线语音引擎
import RestaurantCard from '../components/RestaurantCard';
import { authService } from '../services/authService';
import locationService from '../services/locationService'; // 定位服务
import LocationDisplay from '../components/LocationDisplay'; // 位置显示组件
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import StatusCapsule from '../components/StatusCapsule'; // 状态胶囊组件（内置开发者面板触发）
import ActiveRecommendationModal from '../components/ActiveRecommendationModal'; // 主动推荐弹窗
import WeatherAlertModal from '../components/WeatherAlertModal'; // 天气感知弹窗
import DevModePanel from '../components/DevModePanel'; // 开发者面板
import { useHealthContext } from '../hooks/useHealthContext'; // 健康上下文
import weatherService, { WeatherData } from '../services/weatherService'; // 天气服务
import { debounce, cacheService } from '../utils/cacheUtils'; // 防抖和缓存工具

const HomeScreen = ({ navigation }: any) => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [user, setUser] = useState<any>(null);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [lastLoadTime, setLastLoadTime] = useState(0); // 记录上次加载时间
    const [hasInitialData, setHasInitialData] = useState(false); // 标记是否已有初始数据
    const isLoadingRef = useRef(false); // 防止重复请求的 ref

    // --- 新增: 端云协同与语音状态 ---
    const [isSynergyMode, setIsSynergyMode] = useState(false); // 是否处于端云协同推荐模式
    const [synergyPhase, setSynergyPhase] = useState<0 | 1 | 2>(0); // 0:不活跃, 1:端侧分析阶段, 2:云端处理阶段
    const [isListening, setIsListening] = useState(false); // 是否正在监听原生麦克风
    const [realtimeText, setRealtimeText] = useState(''); // 实时显示的语音转文字字幕

    // --- 新增: 动画驱动 Refs ---
    const scanAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const packetAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    // --- 新增: NutriVision 状态 ---
    const [tempImage, setTempImage] = useState<any>(null); // 临时存储选中的图片
    const [selectedTags, setSelectedTags] = useState<string[]>([]); // 用户选的标签
    const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
    
    // --- 新增: NutriVision 模式选择状态 ---
    const [modeSelectionVisible, setModeSelectionVisible] = useState(false);
    const [selectedVisionMode, setSelectedVisionMode] = useState<'menu' | 'food'>('menu');

    // 常用健康标签
    const HEALTH_TAGS = ["花生过敏", "海鲜过敏", "乳糖不耐受", "低糖", "低脂", "高蛋白", "素食"];
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
    // 使用 ref 实时追踪最新状态，打破语音回调的闭包陷阱
    const currentLocationRef = useRef<any>(null);
    const weatherDataRef = useRef<WeatherData | null>(null);

    useEffect(() => {
        currentLocationRef.current = currentLocation;
    }, [currentLocation]);

    useEffect(() => {
        weatherDataRef.current = weatherData;
    }, [weatherData]);

    // 初始化加载
    useEffect(() => {
        console.log('🚀 HomeScreen初始化开始');
        console.log('🔧 强制重置loading状态，解除可能的死锁');
        setLoading(false); // 强制重置loading状态

        loadUser();

        // 测试API连接
        testAPIConnection();

        // 🧠 初始化 Vosk 和 端侧大模型 (SLM)
        voiceInferenceService.init().catch(e => console.error("语音/大模型初始化失败:", e));

        // 不要立即调用loadData，等待LocationDisplay提供位置
    }, []);

    // --- 新增: 端云协同双阶段动画控制 ---
    useEffect(() => {
        let scanAnimLoop: Animated.CompositeAnimation;
        let pulseAnimLoop: Animated.CompositeAnimation;
        let packetAnimLoop: Animated.CompositeAnimation;
        let floatAnimLoop: Animated.CompositeAnimation;

        if (synergyPhase === 1) {
            scanAnim.setValue(0);
            pulseAnim.setValue(0);
            scanAnimLoop = Animated.loop(
                Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            );
            pulseAnimLoop = Animated.loop(
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true })
            );
            scanAnimLoop.start();
            pulseAnimLoop.start();
        } else if (synergyPhase === 2) {
            packetAnim.setValue(0);
            floatAnim.setValue(0);
            packetAnimLoop = Animated.loop(
                Animated.timing(packetAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            );
            floatAnimLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
                ])
            );
            packetAnimLoop.start();
            floatAnimLoop.start();
        }

        return () => {
            scanAnimLoop?.stop();
            pulseAnimLoop?.stop();
            packetAnimLoop?.stop();
            floatAnimLoop?.stop();
        };
    }, [synergyPhase, scanAnim, pulseAnim, packetAnim, floatAnim]);

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
            console.log('🔧 测试推荐API连接... (使用动态配置)');
            const testParams = {
                userId: 'test',
                latitude: 39.9042,
                longitude: 116.4074,
                address: '测试位置',
                query: '测试连接',
                maxResults: 1,
            };

            const response = await recommendationService.getV2Recommendations(testParams);
            console.log('🔧 测试响应数据:', response);
        } catch (error) {
            console.error('🔧 API连接测试失败:', error);
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const shouldReload = (newLocation: any) => {
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTime;

        if (!hasInitialData) {
            console.log('📋 首次加载数据');
            return true;
        }

        if (timeSinceLastLoad < 30000) {
            console.log('⏱️ 距离上次加载不足30秒，跳过');
            return false;
        }

        if (!currentLocation) {
            console.log('📍 没有当前位置，需要加载');
            return true;
        }

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

    // --- 启动原声录音监听 ---
    const startVoiceAssistant = async () => {
        try {
            setRealtimeText('请说话...');
            setIsListening(true);

            await voiceInferenceService.startListening(
                (partialText) => {
                    if (partialText) setRealtimeText(partialText);
                },
                async (finalText) => {
                    setIsListening(false);
                    if (!finalText || !finalText.trim()) {
                        Alert.alert('提示', '未能听清您的指令，请重试');
                        return;
                    }
                    // 录音结束，进入端侧大模型意图提取流程
                    handleVoiceInferenceComplete(finalText);
                }
            );
        } catch (error) {
            setIsListening(false);
            Alert.alert("麦克风启动失败", "请确保应用拥有录音权限，并已放置模型文件。");
            console.warn("启动语音失败:", error);
        }
    };

    // --- 处理 SLM 意图提纯与协同 ---
    const handleVoiceInferenceComplete = async (finalText: string) => {
        setSynergyPhase(1); // 启动阶段一动画

        try {
            // 1. 本地大语言模型 (SLM) 推理，提取 JSON 约束
            console.log('🧠 送入端侧大模型分析:', finalText);
            const jsonResultStr = await voiceInferenceService.processIntent(finalText);
            const parsedConstraints = JSON.parse(jsonResultStr);

            // 兜底机制：判断是否是闲聊或无点餐需求
            if (Object.keys(parsedConstraints).length === 0 || !parsedConstraints.query) {
                setSynergyPhase(0);
                Alert.alert('提示', '未检测到与点餐相关的需求。');
                return;
            }

            // 2. 动画平滑过渡到云端 Agent
            setSynergyPhase(2);

            // 从 ref 中读取最新真实的经纬度和天气，不再使用闭包里的旧数据
            const loc = currentLocationRef.current || { latitude: 39.9042, longitude: 116.4074, address: '北京' };
            const currentWeather = weatherDataRef.current;

            console.log('📍 语音请求使用的真实坐标:', loc);

            // 3. 将大模型提取出的纯净结构化数据交由端云协同服务
            const result = await edgeSynergyService.processVoiceIntent(parsedConstraints, loc, currentWeather);

            if (result.isFallbackNeeded) {
                // 触发了容错降级
                Alert.alert(
                    '健康守护拦截',
                    result.message || '周边暂无严格符合您健康约束的餐品，已为您恢复默认推荐。',
                    [{
                        text: '好的', onPress: () => {
                            setIsSynergyMode(false);
                            loadData(currentLocation);
                        }
                    }]
                );
            } else {
                // 成功获取到协同推荐结果
                const list = result.data?.recommendations || result.data?.restaurants || [];
                setRestaurants(list);
                setIsSynergyMode(true);
            }
        } catch (error) {
            console.error('端云协同请求异常或模型解析失败:', error);
            Alert.alert('错误', '本地意图分析或云端请求失败，将使用默认推荐');
            setIsSynergyMode(false);
            loadData(currentLocation);
        } finally {
            setSynergyPhase(0); // 彻底结束动画
        }
    };

    // 修改后的数据加载逻辑（带缓存和防重复请求）
    const loadData = useCallback(async (providedLocation = null, skipWeatherFetch = false, forceRefresh = false) => {
        // 防止重复请求
        if (isLoadingRef.current || synergyPhase > 0) {
            if (__DEV__) console.log('⏳ 正在加载中，跳过重复请求');
            return;
        }

        isLoadingRef.current = true;

        const timeoutId = setTimeout(() => {
            console.warn('⚠️ loadData执行超时，强制重置loading状态');
            setLoading(false);
            setRefreshing(false);
            isLoadingRef.current = false;
        }, 30000);

        try {
            setLoading(true);
            setIsSynergyMode(false);

            let location: any = providedLocation;

            if (!location) {
                if (currentLocation) {
                    location = currentLocation;
                } else {
                    setLoading(false);
                    isLoadingRef.current = false;
                    return;
                }
            }

            setCurrentLocation(location);

            // 并行请求：天气和推荐数据同时发起
            const weatherPromise = !skipWeatherFetch
                ? fetchWeather(location.latitude, location.longitude)
                : Promise.resolve(weatherData);

            let currentUser = user;
            if (!currentUser) {
                currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            }

            // 生成缓存键
            const cacheKey = {
                lat: Math.round(location.latitude * 100) / 100, // 精度到小数点后2位
                lng: Math.round(location.longitude * 100) / 100,
                userId: currentUser?.id || 'guest',
            };

            // 尝试从缓存获取推荐数据（非强制刷新时）
            if (!forceRefresh) {
                const cachedRecommendations = await cacheService.get('recommendations', cacheKey);
                if (cachedRecommendations && cachedRecommendations.length > 0) {
                    if (__DEV__) console.log('✅ 使用缓存的推荐数据:', cachedRecommendations.length, '条');
                    setRestaurants(cachedRecommendations);
                    setHasInitialData(true);
                    setLoading(false);
                    setRefreshing(false);
                    isLoadingRef.current = false;
                    clearTimeout(timeoutId);
                    // 后台静默更新天气
                    weatherPromise.catch(() => {});
                    return;
                }
            }

            const recommendParams = {
                userId: currentUser?.id || 'guest',
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address,
                healthContext: {
                    daily_steps: health.dailySteps,
                    recent_steps_30min: health.recentSteps30min,
                    daily_distance: health.dailyDistance,
                    daily_calories: health.dailyCalories,
                    heart_rate: health.heartRate,
                    resting_heart_rate: health.restingHeartRate,
                    avg_heart_rate: health.avgHeartRate,
                    max_heart_rate: health.maxHeartRate,
                    min_heart_rate: health.minHeartRate,
                    activity_status: health.activityStatus,
                    is_post_workout: health.isPostWorkout,
                    recent_workout_duration: health.recentWorkoutDuration,
                    recent_workout_calories: health.recentWorkoutCalories,
                    recent_workout_type: health.recentWorkoutType,
                    pressure_value: health.pressureValue,
                    avg_pressure: health.avgPressure,
                    pressure_level: health.pressureLevel,
                    last_sleep_duration: health.lastSleepDuration,
                    last_sleep_duration_hours: health.lastSleepDurationHours,
                    last_sleep_score: health.lastSleepScore,
                    sleep_quality: health.sleepQuality,
                    last_deep_sleep_duration: health.lastDeepSleepDuration,
                    last_light_sleep_duration: health.lastLightSleepDuration,
                    last_rem_sleep_duration: health.lastRemSleepDuration,
                    blood_oxygen: health.bloodOxygen,
                    avg_blood_oxygen: health.avgBloodOxygen,
                    blood_oxygen_status: health.bloodOxygenStatus,
                    today_relax_duration: health.todayRelaxDuration,
                    light_lux: health.lightLux,
                    light_level: health.lightLevel,
                    overall_health_status: health.overallHealthStatus,
                    activity_level: health.activityLevel,
                    needs_rest: health.needsRest,
                    is_well_rested: health.isWellRested,
                    has_wearable_device: health.hasWearableDevice,
                    device_type: health.deviceType,
                },
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

            if (__DEV__) console.log('🚀 发送推荐请求');
            const response = await recommendationService.getV2Recommendations(recommendParams);

            const list = response.recommendations || response.restaurants || (Array.isArray(response) ? response : []);

            if (!list || list.length === 0) {
                if (__DEV__) console.log('📭 推荐为空，使用兜底数据');
                const fallback = await merchantService.getRecommendedMerchants();
                setRestaurants(fallback);
            } else {
                if (__DEV__) console.log('✅ 获取到智能推荐数据:', list.length, '条');
                setRestaurants(list);
                setHasInitialData(true);
                // 缓存推荐结果
                await cacheService.set('recommendations', cacheKey, list);
            }

        } catch (error) {
            console.error('❌ 加载推荐失败，切换到兜底逻辑:', error);
            try {
                const fallback = await merchantService.getRecommendedMerchants();
                setRestaurants(fallback);
            } catch (fallbackError) {
                console.error('❌ 兜底数据加载也失败:', fallbackError);
                setRestaurants([]);
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
            setRefreshing(false);
            setLastLoadTime(Date.now());
            isLoadingRef.current = false;
        }
    }, [currentLocation, user, health, weatherData, synergyPhase]);

    // 防抖版本的 loadData，用于位置变化时调用
    const debouncedLoadData = useMemo(
        () => debounce((location: any) => {
            loadData(location, false, false);
        }, 500),
        [loadData]
    );

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        loadData(currentLocation, false, true); // 强制刷新，跳过缓存
    }, [currentLocation, loadData]);

    const handleLogout = async () => {
        await authService.logout();
        navigation.replace('Login');
    };

    // --- NutriVision 处理逻辑 (双轨制改造) ---
    const startNutriVision = () => {
        // 第一步：先弹出模式选择，展示双轨制的黑科技
        setModeSelectionVisible(true);
    };

    const handleModeSelect = (mode: 'menu' | 'food') => {
        setModeSelectionVisible(false);
        setSelectedVisionMode(mode);
        
        // 增加一点点延迟让动画更平滑
        setTimeout(() => {
            Alert.alert(
                mode === 'food' ? "实景单品透视" : "全菜单营养扫雷",
                "请拍摄或上传您的美食照片",
                [
                    { text: "取消", style: "cancel" },
                    { text: "从相册选择", onPress: () => pickImage('gallery', mode) },
                    { text: "拍照", onPress: () => pickImage('camera', mode) },
                ]
            );
        }, 300);
    };

    const pickImage = async (type: 'camera' | 'gallery', mode: 'menu' | 'food') => {
        const options: any = {
            mediaType: 'photo',
            includeBase64: true,
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.6,
        };

        const callback = (response: any) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                Alert.alert('错误', response.errorMessage);
                return;
            }
            if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];

                if (asset.fileSize) {
                    const sizeInKB = asset.fileSize / 1024;
                    const sizeInMB = sizeInKB / 1024;
                    if (sizeInMB > 3) {
                        Alert.alert('图片过大', '即使压缩后图片仍然过大，请选择其他图片。');
                        return;
                    }
                }

                setTempImage(asset);
                setSelectedTags([]);
                setPreferencesModalVisible(true);
            }
        };

        if (type === 'camera') {
            await launchCamera(options, callback);
        } else {
            await launchImageLibrary(options, callback);
        }
    };

    const confirmAnalysis = () => {
        setPreferencesModalVisible(false);
        if (tempImage) {
            // 将选中的模式向下传递，驱动不同的 API 和 UI
            navigation.navigate('NutriVisionResult', {
                imageUri: tempImage.uri,
                imageBase64: tempImage.base64,
                healthTags: selectedTags,
                mode: selectedVisionMode 
            });
        }
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <LocationDisplay
                onLocationChange={(loc) => {
                    // 使用防抖处理位置变化
                    const isCurrentDefault = currentLocation &&
                        Math.abs(currentLocation.latitude - 39.9042) < 0.001 &&
                        Math.abs(currentLocation.longitude - 116.4074) < 0.001;
                    const isNewRealGPS = loc &&
                        !(Math.abs(loc.latitude - 39.9042) < 0.001 && Math.abs(loc.longitude - 116.4074) < 0.001);

                    // 首次从默认位置切换到真实位置，立即加载
                    if (isCurrentDefault && isNewRealGPS) {
                        setCurrentLocation(loc);
                        loadData(loc);
                        return;
                    }

                    // 微小变化时直接忽略
                    if (currentLocation && hasInitialData) {
                        const latDiff = Math.abs(loc.latitude - currentLocation.latitude);
                        const lonDiff = Math.abs(loc.longitude - currentLocation.longitude);
                        if (latDiff < 0.001 && lonDiff < 0.001) {
                            return;
                        }
                    }

                    setCurrentLocation(loc);
                    // 使用防抖处理位置变化触发的数据加载
                    if (shouldReload(loc)) {
                        debouncedLoadData(loc);
                    }
                }}
                showRefresh={true}
            />

            <StatusCapsule
                weather={weatherData ? {
                    condition: weatherData.condition,
                    temperature: weatherData.temperature,
                } : undefined}
                onPress={() => {
                    console.log('状态胶囊被点击');
                }}
            />

            <View style={styles.welcomeRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.welcomeText}>今天吃点什么?</Text>
                    <Text style={styles.userName}>{user?.username || user?.nickname || '朋友'}</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('OrderList')}
                        style={{ padding: spacing.sm }}
                    >
                        <Text style={{ color: colors.textPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>📜 订单</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>退出</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.visionCard} onPress={startNutriVision}>
                <View style={styles.visionIconContainer}>
                    <Text style={{ fontSize: 24 }}>📸</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.visionTitle}>拍一拍：实景菜单营养透视</Text>
                    <Text style={styles.visionSubtitle}>AI 识别热量、过敏原，定制健康推荐</Text>
                </View>
                <View style={styles.visionArrow}>
                    <Text style={{ color: '#fff' }}>→</Text>
                </View>
            </TouchableOpacity>

            {__DEV__ && (
                <View style={{ marginBottom: spacing.md }}>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowDevPanel(true);
                            }}
                            style={{ flex: 1, padding: spacing.md, backgroundColor: colors.primarySoft, borderRadius: borderRadius.lg, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>🏃 健康模拟</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('LocationDebug')}
                            style={{ flex: 1, padding: spacing.md, backgroundColor: colors.infoBg, borderRadius: borderRadius.lg, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.info, fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>🔍 位置调试</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                        <TouchableOpacity
                            onPress={() => {
                                health.simulateJustFinishedWorkout();
                                setShowActiveRecommendation(true);
                            }}
                            style={{ flex: 1, padding: spacing.md, backgroundColor: colors.errorBg, borderRadius: borderRadius.lg, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.error, fontWeight: fontWeight.bold, fontSize: fontSize.md }}>💪 模拟刚跑完步</Text>
                            <Text style={{ color: colors.error, fontSize: fontSize.xs, marginTop: 2 }}>心率145 / 步数12000</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                health.setDevMode(true);
                                health.setSimulatedLightLux(20);
                            }}
                            style={{ flex: 1, padding: spacing.md, backgroundColor: colors.infoBg, borderRadius: borderRadius.lg, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.accent, fontWeight: fontWeight.bold, fontSize: fontSize.md }}>🌙 模拟暗光场景</Text>
                            <Text style={{ color: colors.accent, fontSize: fontSize.xs, marginTop: 2 }}>20 lux / 夜间室内</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <TouchableOpacity
                            onPress={() => {
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
                            }}
                            style={{ flex: 1, padding: spacing.md, backgroundColor: colors.successBg, borderRadius: borderRadius.lg, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.success, fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>🌧️ 模拟大雨</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
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
                            }}
                            style={{ flex: 1, padding: spacing.md, backgroundColor: colors.errorBg, borderRadius: borderRadius.lg, alignItems: 'center' }}
                        >
                            <Text style={{ color: colors.error, fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>🥵 模拟高温</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

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
                <TouchableOpacity
                    style={[styles.micButton, isListening && styles.micButtonActive]}
                    onPress={startVoiceAssistant}
                >
                    <Text style={{ color: isListening ? colors.textOnPrimary : colors.primary, fontSize: 18 }}>
                        {isListening ? '👂' : '🎤'}
                    </Text>
                </TouchableOpacity>
            </View>

            {isSynergyMode && (
                <View style={styles.synergyBanner}>
                    <Text style={styles.synergyBannerText}>✨ 本地健康守卫已启动：为您筛选符合隐私约束的安全餐品</Text>
                </View>
            )}
        </View>
    );

    // --- 动画插值计算 ---
    const scanTranslateY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 300] });
    const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
    const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
    const packetTranslateY = packetAnim.interpolate({ inputRange: [0, 1], outputRange: [150, -50] });
    const packetOpacity = packetAnim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] });
    const floatTranslateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <FlatList
                data={restaurants}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({ item }) => {
                    const displayItem = { ...item };
                    if (isSynergyMode) {
                        displayItem.tags = [...(displayItem.tags || []), '🛡️ 符合健康约束'];
                    }
                    return (
                        <RestaurantCard
                            restaurant={displayItem}
                            onPress={(r) => {
                                navigation.navigate('RestaurantDetail', { restaurant: r });
                            }}
                        />
                    );
                }}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    !(loading || synergyPhase > 0) ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>暂时没有推荐餐厅</Text>
                        </View>
                    ) : null
                }
            />

            {/* 常规 Loading 遮罩 */}
            {loading && !refreshing && synergyPhase === 0 && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}

            {/* --- 新增: 极其酷炫的端云协同双阶段沉浸式动画 Modal --- */}
            <Modal visible={synergyPhase > 0} transparent={true} animationType="fade">
                <View style={styles.synModalBg}>
                    <SafeAreaView style={{ flex: 1 }}>

                        {/* 顶部安全徽章 */}
                        <View style={styles.synHeader}>
                            <View style={styles.synBadge}>
                                <Text style={styles.synBadgeText}>Secure Environment</Text>
                            </View>
                        </View>

                        {/* 阶段 1: 端侧分析 */}
                        {synergyPhase === 1 && (
                            <View style={styles.synPhaseContainer}>
                                <View style={styles.synPhoneFrame}>
                                    <Animated.View style={[styles.synScanLine, { transform: [{ translateY: scanTranslateY }] }]} />

                                    <View style={styles.synCenterNode}>
                                        <Animated.View style={[styles.synPulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
                                        <View style={styles.synChipBox}>
                                            <Text style={{ fontSize: 50 }}>🧠</Text>
                                            <View style={styles.synShieldMini}>
                                                <Text style={{ fontSize: 14 }}>🛡️</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.synTextContainer}>
                                    <Text style={styles.synMainTitle}>🧠 端侧大模型正在分析</Text>
                                    <Text style={styles.synMainTitle}>意图与隐私约束...</Text>

                                    <View style={styles.synStatusPill}>
                                        <View style={styles.synDot} />
                                        <Text style={styles.synStatusPillText}>Analyzing intent...</Text>
                                    </View>
                                    <Text style={styles.synSubTitle}>Privacy Protected (隐私已保护)</Text>
                                </View>
                            </View>
                        )}

                        {/* 阶段 2: 云端上传 */}
                        {synergyPhase === 2 && (
                            <View style={styles.synPhaseContainer}>

                                <Animated.View style={[styles.synCloudTop, { transform: [{ translateY: floatTranslateY }] }]}>
                                    <View style={styles.synCloudBox}>
                                        <Text style={{ fontSize: 60 }}>☁️</Text>
                                    </View>
                                </Animated.View>

                                <View style={styles.synBeamArea}>
                                    <View style={styles.synDashedLine} />
                                    <Animated.View style={[styles.synDataPacket, { transform: [{ translateY: packetTranslateY }], opacity: packetOpacity }]} />
                                </View>

                                <View style={styles.synPhoneFrameSmall}>
                                    <View style={styles.synUnlockBox}>
                                        <Text style={{ fontSize: 34 }}>🔓</Text>
                                    </View>
                                    <Text style={styles.synLocalSafeText}>LOCAL SAFE</Text>
                                </View>

                                <View style={styles.synTextContainer}>
                                    <Text style={styles.synMainTitle}>☁️ 脱敏请求已发送</Text>
                                    <Text style={styles.synMainTitleDark}>云端 Agent 正在规划推荐...</Text>

                                    <View style={styles.synStatusPillSafe}>
                                        <Text style={{ fontSize: 14, marginRight: 4 }}>🛡️</Text>
                                        <Text style={styles.synStatusPillTextSafe}>Privacy Protected / 隐私保护中</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                    </SafeAreaView>
                </View>
            </Modal>

            {/* 原声录音时的动态呼吸弹窗 */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isListening}
                onRequestClose={() => setIsListening(false)}
            >
                <View style={styles.modalCenteredView}>
                    <View style={styles.voiceModalView}>
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.xl }} />
                        <Text style={styles.modalTitle}>正在聆听您的需求...</Text>

                        <View style={{ minHeight: 40, justifyContent: 'center', marginVertical: spacing.md }}>
                            <Text style={{ color: colors.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold, textAlign: 'center' }}>
                                “{realtimeText}”
                            </Text>
                        </View>

                        <Text style={styles.modalSubtitle}>例如：”我生理期，推荐点热的甜品”</Text>
                        <Text style={{ color: colors.textTertiary, fontSize: fontSize.sm, marginTop: spacing.md }}>（语音及意图分析完全在手机本地进行，极度保护隐私）</Text>
                    </View>
                </View>
            </Modal>

            {/* --- 新增：双轨制视觉模式选择弹窗 --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modeSelectionVisible}
                onRequestClose={() => setModeSelectionVisible(false)}
            >
                <View style={styles.modalCenteredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>选择视觉引擎</Text>
                        <Text style={styles.modalSubtitle}>请根据您的拍摄内容选择对应模式</Text>

                        <View style={{ width: '100%', gap: spacing.md, marginBottom: spacing.xl }}>
                            <TouchableOpacity 
                                style={[styles.modeCard, { borderColor: colors.primary }]}
                                onPress={() => handleModeSelect('food')}
                            >
                                <View style={styles.modeIconBox}><Text style={{fontSize: 28}}>🍱</Text></View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.modeTitle}>拍单道菜品 <Text style={{color: colors.primary, fontSize: 12}}>极速</Text></Text>
                                    <Text style={styles.modeDesc}>启用自研本地 CV 模型，瞬间识别食物种类并联调云端知识图谱。</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.modeCard}
                                onPress={() => handleModeSelect('menu')}
                            >
                                <View style={[styles.modeIconBox, { backgroundColor: '#e3f2fd' }]}><Text style={{fontSize: 28}}>📋</Text></View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.modeTitle}>拍复杂菜单</Text>
                                    <Text style={styles.modeDesc}>启用云端多模态大语言模型，直接进行整页菜单 OCR 与分析。</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalBtn, styles.modalBtnCancel, { width: '100%' }]}
                            onPress={() => setModeSelectionVisible(false)}
                        >
                            <Text style={styles.modalBtnTextCancel}>取消</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* 健康标签偏好弹窗 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={preferencesModalVisible}
                onRequestClose={() => setPreferencesModalVisible(false)}
            >
                <View style={styles.modalCenteredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>有些忌口或偏好吗？</Text>
                        <Text style={styles.modalSubtitle}>选择标签，让 AI 帮您避雷 (可多选)</Text>

                        <View style={styles.tagsContainer}>
                            {HEALTH_TAGS.map((tag) => (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tagButton,
                                        selectedTags.includes(tag) && styles.tagButtonSelected
                                    ]}
                                    onPress={() => toggleTag(tag)}
                                >
                                    <Text style={[
                                        styles.tagText,
                                        selectedTags.includes(tag) && styles.tagTextSelected
                                    ]}>{tag}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setPreferencesModalVisible(false)}
                            >
                                <Text style={styles.modalBtnTextCancel}>取消</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm]}
                                onPress={confirmAnalysis}
                            >
                                <Text style={styles.modalBtnTextConfirm}>开始分析</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ActiveRecommendationModal
                visible={showActiveRecommendation}
                onClose={() => setShowActiveRecommendation(false)}
                onViewRecommendations={() => {
                    console.log('📍 查看推荐餐食，刷新推荐列表...');
                    setShowActiveRecommendation(false);
                    if (currentLocation) {
                        loadData(currentLocation, true);
                    }
                }}
            />

            <DevModePanel
                visible={showDevPanel}
                onClose={() => setShowDevPanel(false)}
            />

            <WeatherAlertModal
                visible={showWeatherAlert}
                weather={weatherData}
                onClose={() => setShowWeatherAlert(false)}
                onAcceptRecommendation={() => {
                    console.log('🌤️ 接受天气推荐，刷新推荐列表...');
                    setShowWeatherAlert(false);
                    if (currentLocation) {
                        loadData(currentLocation, true);
                    }
                }}
            />
        </SafeAreaView>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 48,
    },
    headerContainer: {
        marginBottom: spacing.section,
    },
    welcomeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingTop: spacing.sm,
    },
    welcomeText: {
        fontSize: fontSize.md,
        color: colors.textTertiary,
        fontWeight: fontWeight.medium,
        letterSpacing: 0.3,
    },
    userName: {
        fontSize: fontSize.title,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    logoutBtn: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primarySoft,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.frostedBorder,
    },
    logoutText: {
        color: colors.primary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize.sm,
    },
    // 搜索栏 - 磨砂效果 + 圆角
    searchContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    searchInput: {
        flex: 1,
        backgroundColor: colors.backgroundSection,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.xl,
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },
    searchButton: {
        width: 50,
        height: 50,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.primary,
    },
    micButton: {
        width: 50,
        height: 50,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.primaryLight,
    },
    micButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        ...shadows.primary,
    },
    // 隐私协同Banner
    synergyBanner: {
        backgroundColor: colors.successBg,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginTop: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.frostedBorder,
    },
    synergyBannerText: {
        color: colors.secondary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize.sm,
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: spacing.xxl,
    },
    emptyText: {
        color: colors.textTertiary,
        fontSize: fontSize.lg,
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(250, 250, 248, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },

    // --- 端云协同 Modal ---
    synModalBg: {
        flex: 1,
        backgroundColor: colors.background,
    },
    synHeader: {
        width: '100%',
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.xxl,
        alignItems: 'flex-end',
    },
    synBadge: {
        backgroundColor: colors.primarySoft,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    synBadgeText: {
        color: colors.primary,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    synPhaseContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    synPhoneFrame: {
        width: 200,
        height: 340,
        backgroundColor: colors.surface,
        borderRadius: 44,
        borderWidth: 2,
        borderColor: colors.border,
        ...shadows.xl,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },
    synScanLine: {
        position: 'absolute',
        top: 0,
        width: '100%',
        height: 52,
        backgroundColor: 'rgba(242, 120, 75, 0.25)',
        zIndex: 10,
    },
    synCenterNode: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    synPulseRing: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(242, 120, 75, 0.12)',
    },
    synChipBox: {
        backgroundColor: colors.background,
        padding: spacing.xl,
        borderRadius: borderRadius.xxl,
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...shadows.md,
    },
    synShieldMini: {
        position: 'absolute',
        bottom: -6,
        right: -6,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.xs,
        ...shadows.sm,
    },
    synTextContainer: {
        alignItems: 'center',
        paddingHorizontal: spacing.xxl,
    },
    synMainTitle: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
        lineHeight: 32,
    },
    synMainTitleDark: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.medium,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    synStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primarySoft,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    synDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginRight: spacing.sm,
    },
    synStatusPillText: {
        color: colors.primary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize.sm,
    },
    synSubTitle: {
        color: colors.textTertiary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
    synCloudTop: {
        marginBottom: spacing.lg,
        zIndex: 10,
    },
    synCloudBox: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.xxl,
        ...shadows.lg,
    },
    synBeamArea: {
        height: 160,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    synDashedLine: {
        position: 'absolute',
        height: '100%',
        width: 1,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        opacity: 0.2,
    },
    synDataPacket: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.primary,
        ...shadows.md,
        borderWidth: 2,
        borderColor: colors.surface,
    },
    synPhoneFrameSmall: {
        width: 170,
        height: 220,
        backgroundColor: colors.surface,
        borderRadius: 36,
        borderWidth: 2,
        borderColor: colors.border,
        ...shadows.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    synUnlockBox: {
        width: 68,
        height: 68,
        backgroundColor: colors.primarySoft,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    synLocalSafeText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
        color: colors.textTertiary,
        letterSpacing: 2,
    },
    synStatusPillSafe: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginTop: spacing.lg,
    },
    synStatusPillTextSafe: {
        color: colors.textSecondary,
        fontWeight: fontWeight.semibold,
        fontSize: fontSize.sm,
    },

    // --- Modal Styles - 磨砂风格 ---
    voiceModalView: {
        width: '90%',
        backgroundColor: colors.frostedBgStrong,
        borderRadius: borderRadius.xxl,
        padding: spacing.xxl,
        alignItems: 'center',
        ...shadows.xl,
        borderWidth: 1,
        borderColor: colors.frostedBorder,
    },
    // NutriVision卡片 - 主色渐变风格
    visionCard: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.xxl,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
        ...shadows.primary,
    },
    visionIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    visionTitle: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    visionSubtitle: {
        color: 'rgba(255,255,255,0.88)',
        fontSize: fontSize.sm,
        marginTop: spacing.xs,
    },
    visionArrow: {
        marginLeft: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.18)',
        width: 32,
        height: 32,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCenteredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.overlay,
    },
    modalView: {
        width: '88%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xxl,
        padding: spacing.xxl,
        alignItems: 'center',
        ...shadows.xl,
    },
    modalTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        marginBottom: spacing.sm,
        color: colors.textPrimary,
    },
    modalSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
    },
    
    // --- 新增: 模式选择弹窗样式 ---
    modeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderLight,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
    },
    modeIconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    modeTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    modeDesc: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        lineHeight: 18,
    },

    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    tagButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    tagButtonSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tagText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
    tagTextSelected: {
        color: colors.textOnPrimary,
        fontWeight: fontWeight.semibold,
    },
    modalActions: {
        flexDirection: 'row',
        width: '100%',
        gap: spacing.md,
    },
    modalBtn: {
        flex: 1,
        borderRadius: borderRadius.xxl,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    modalBtnCancel: {
        backgroundColor: colors.backgroundSection,
    },
    modalBtnConfirm: {
        backgroundColor: colors.primary,
        ...shadows.primary,
    },
    modalBtnTextCancel: {
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    modalBtnTextConfirm: {
        color: colors.textOnPrimary,
        fontWeight: fontWeight.bold,
    },
});

export default HomeScreen;