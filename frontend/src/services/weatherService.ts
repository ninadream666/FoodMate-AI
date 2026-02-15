/**
 * weatherService.ts - 天气服务
 * 
 * 功能：
 * 1. 获取实时天气数据
 * 2. 天气状况分析
 * 3. 配送影响评估
 */

import { API_CONFIG } from '../config/serviceConfig';

// 天气数据接口
export interface WeatherData {
    condition: string;      // 天气状况：晴、多云、小雨、大雨等
    temperature: number;    // 温度（摄氏度）
    humidity: number;       // 湿度（%）
    windSpeed: number;      // 风速（km/h）
    icon: string;           // 天气图标
    isRaining: boolean;     // 是否下雨
    isHeavyRain: boolean;   // 是否大雨
    isExtreme: boolean;     // 是否极端天气
    deliveryImpact: 'none' | 'minor' | 'moderate' | 'severe'; // 配送影响
    recommendation: string; // 天气推荐语
}

// 默认天气数据
const DEFAULT_WEATHER: WeatherData = {
    condition: '晴',
    temperature: 25,
    humidity: 50,
    windSpeed: 10,
    icon: '☀️',
    isRaining: false,
    isHeavyRain: false,
    isExtreme: false,
    deliveryImpact: 'none',
    recommendation: '天气晴好，适合外出就餐',
};

class WeatherService {
    private cache: { data: WeatherData; timestamp: number; location: string } | null = null;
    private cacheTimeout = 10 * 60 * 1000; // 10分钟缓存

    /**
     * 获取天气数据
     * @param latitude 纬度
     * @param longitude 经度
     */
    async getWeather(latitude: number, longitude: number): Promise<WeatherData> {
        const locationKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;

        // 检查缓存
        if (this.cache &&
            this.cache.location === locationKey &&
            Date.now() - this.cache.timestamp < this.cacheTimeout) {
            console.log('🌤️ 使用缓存的天气数据');
            return this.cache.data;
        }

        try {
            // 创建超时控制器
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // 调用后端天气API
            const response = await fetch(
                `${API_CONFIG.API_HOST}:8087/api/v2/mcp/tool/get_weather_analysis`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        latitude,
                        longitude,
                    }),
                    signal: controller.signal,
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn('⚠️ 天气API响应异常:', response.status);
                return this.getDefaultWeather();
            }

            const data = await response.json();
            console.log('🌤️ 天气API响应:', data);

            // 解析天气数据
            const weather = this.parseWeatherResponse(data);

            // 更新缓存
            this.cache = {
                data: weather,
                timestamp: Date.now(),
                location: locationKey,
            };

            return weather;
        } catch (error) {
            console.error('❌ 获取天气数据失败:', error);
            return this.getDefaultWeather();
        }
    }

    /**
     * 解析后端天气响应
     */
    private parseWeatherResponse(data: any): WeatherData {
        try {
            // 处理MCP工具响应格式
            const weatherInfo = data.result?.weather || data.weather || data;

            const condition = weatherInfo.text || weatherInfo.condition || '晴';
            const temp = weatherInfo.temp || weatherInfo.temperature || 25;
            const humidity = weatherInfo.humidity || 50;
            const windSpeed = weatherInfo.windSpeed || weatherInfo.wind_speed || 10;

            // 判断天气状况
            const isRaining = this.checkIsRaining(condition);
            const isHeavyRain = this.checkIsHeavyRain(condition);
            const isExtreme = this.checkIsExtreme(condition, temp, windSpeed);
            const deliveryImpact = this.assessDeliveryImpact(condition, windSpeed, isHeavyRain);

            return {
                condition,
                temperature: parseInt(temp),
                humidity: parseInt(humidity),
                windSpeed: parseFloat(windSpeed),
                icon: this.getWeatherIcon(condition),
                isRaining,
                isHeavyRain,
                isExtreme,
                deliveryImpact,
                recommendation: this.getRecommendation(condition, isRaining, isHeavyRain, temp),
            };
        } catch (error) {
            console.error('解析天气数据失败:', error);
            return DEFAULT_WEATHER;
        }
    }

    /**
     * 获取默认天气（基于时间模拟）
     */
    private getDefaultWeather(): WeatherData {
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour > 18;

        return {
            ...DEFAULT_WEATHER,
            condition: isNight ? '晴' : '晴',
            icon: isNight ? '🌙' : '☀️',
            temperature: isNight ? 18 : 25,
        };
    }

    /**
     * 检查是否下雨
     */
    private checkIsRaining(condition: string): boolean {
        const rainKeywords = ['雨', '阵雨', '雷阵雨', '小雨', '中雨', '大雨', '暴雨', '雷雨'];
        return rainKeywords.some(keyword => condition.includes(keyword));
    }

    /**
     * 检查是否大雨
     */
    private checkIsHeavyRain(condition: string): boolean {
        const heavyRainKeywords = ['大雨', '暴雨', '大暴雨', '特大暴雨', '雷暴'];
        return heavyRainKeywords.some(keyword => condition.includes(keyword));
    }

    /**
     * 检查是否极端天气
     */
    private checkIsExtreme(condition: string, temp: number, windSpeed: number): boolean {
        const extremeKeywords = ['暴雨', '暴雪', '台风', '冰雹', '雷暴', '沙尘暴'];
        const hasExtremeCondition = extremeKeywords.some(keyword => condition.includes(keyword));
        const isExtremeTemp = temp > 40 || temp < -10;
        const isExtremeWind = windSpeed > 50;

        return hasExtremeCondition || isExtremeTemp || isExtremeWind;
    }

    /**
     * 评估配送影响
     */
    private assessDeliveryImpact(
        condition: string,
        windSpeed: number,
        isHeavyRain: boolean
    ): 'none' | 'minor' | 'moderate' | 'severe' {
        if (isHeavyRain || windSpeed > 40) return 'severe';
        if (this.checkIsRaining(condition) || windSpeed > 25) return 'moderate';
        if (condition.includes('雪') || condition.includes('雾')) return 'minor';
        return 'none';
    }

    /**
     * 获取天气图标
     */
    private getWeatherIcon(condition: string): string {
        const iconMap: Record<string, string> = {
            '晴': '☀️',
            '晴天': '☀️',
            '多云': '⛅',
            '阴': '☁️',
            '阴天': '☁️',
            '小雨': '🌧️',
            '中雨': '🌧️',
            '大雨': '🌧️',
            '暴雨': '⛈️',
            '雷阵雨': '⛈️',
            '雷雨': '⛈️',
            '小雪': '🌨️',
            '中雪': '🌨️',
            '大雪': '❄️',
            '雾': '🌫️',
            '霾': '😷',
        };

        for (const [keyword, icon] of Object.entries(iconMap)) {
            if (condition.includes(keyword)) return icon;
        }
        return '🌤️';
    }

    /**
     * 获取天气推荐语
     */
    private getRecommendation(
        condition: string,
        isRaining: boolean,
        isHeavyRain: boolean,
        temp: number
    ): string {
        if (isHeavyRain) {
            return '外面雨很大，已为您优先筛选配送运力充足、包装防水的商家';
        }
        if (isRaining) {
            return '外面正在下雨，配送可能略有延迟，建议选择附近商家';
        }
        if (temp > 35) {
            return '天气炎热，为您推荐清凉解暑的美食';
        }
        if (temp < 5) {
            return '天气寒冷，为您推荐热乎乎的暖身美食';
        }
        if (condition.includes('雪')) {
            return '外面正在下雪，配送可能延迟，请耐心等待';
        }
        return '天气适宜，祝您用餐愉快';
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache = null;
    }
}

export const weatherService = new WeatherService();
export default weatherService;
