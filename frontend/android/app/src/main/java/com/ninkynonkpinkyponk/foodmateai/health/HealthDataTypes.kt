package com.ninkynonkpinkyponk.foodmateai.health

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

/**
 * OPPO健康数据类型定义
 * 用于封装从SDK获取的各类健康数据
 */

// ==================== 设备信息 ====================

data class DeviceInfo(
    val deviceName: String,
    val deviceType: Int,        // 1=手表, 2=手环, 3=RX手表, 100=体脂秤
    val subDeviceType: Int,     // 1=ECG版本
    val model: String
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putString("deviceName", deviceName)
        putInt("deviceType", deviceType)
        putInt("subDeviceType", subDeviceType)
        putString("model", model)
        putString("deviceTypeName", getDeviceTypeName())
    }

    private fun getDeviceTypeName(): String = when (deviceType) {
        1 -> "手表"
        2 -> "手环"
        3 -> "RX手表"
        100 -> "体脂秤"
        else -> "未知设备"
    }
}

// ==================== 心率数据 ====================

data class HeartRateData(
    val timestamp: Long,        // 数据产生时间戳 (ms)
    val heartRate: Int          // 心率值 (40-220 BPM)
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("timestamp", timestamp.toDouble())
        putInt("heartRate", heartRate)
    }
}

data class HeartRateCountData(
    val date: Long,             // 日期 (格式如 20220501)
    val maxHeartRate: Int,
    val minHeartRate: Int,
    val avgHeartRate: Int,
    val restingHeartRate: Int   // 静息心率
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("date", date.toDouble())
        putInt("maxHeartRate", maxHeartRate)
        putInt("minHeartRate", minHeartRate)
        putInt("avgHeartRate", avgHeartRate)
        putInt("restingHeartRate", restingHeartRate)
    }
}

// ==================== 每日活动数据 ====================

data class DailyActivityData(
    val startTimestamp: Long,
    val endTimestamp: Long,
    val steps: Int,             // 步数
    val distance: Int,          // 距离 (米)
    val calories: Int           // 消耗卡路里
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("startTimestamp", startTimestamp.toDouble())
        putDouble("endTimestamp", endTimestamp.toDouble())
        putInt("steps", steps)
        putInt("distance", distance)
        putInt("calories", calories)
    }
}

data class DailyActivityCountData(
    val date: Long,
    val totalSteps: Int,
    val totalDistance: Int,
    val totalCalories: Int
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("date", date.toDouble())
        putInt("totalSteps", totalSteps)
        putInt("totalDistance", totalDistance)
        putInt("totalCalories", totalCalories)
    }
}

// ==================== 压力数据 ====================

data class PressureData(
    val timestamp: Long,
    val pressureValue: Int      // 压力值 (1-100, 越高压力越大)
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("timestamp", timestamp.toDouble())
        putInt("pressureValue", pressureValue)
        putString("pressureLevel", getPressureLevel())
    }

    private fun getPressureLevel(): String = when {
        pressureValue <= 29 -> "放松"
        pressureValue <= 59 -> "正常"
        pressureValue <= 79 -> "中等"
        else -> "偏高"
    }
}

data class PressureCountData(
    val date: Long,
    val maxPressure: Float,
    val minPressure: Float,
    val avgPressure: Float
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("date", date.toDouble())
        putDouble("maxPressure", maxPressure.toDouble())
        putDouble("minPressure", minPressure.toDouble())
        putDouble("avgPressure", avgPressure.toDouble())
    }
}

// ==================== 睡眠数据 ====================

data class SleepData(
    val sleepInTime: Long,          // 入睡时间
    val sleepOutTime: Long,         // 出睡时间
    val totalSleepTime: Int,        // 总睡眠时长 (分钟)
    val totalDeepSleepTime: Int,    // 深睡时长 (分钟)
    val totalLightSleepTime: Int,   // 浅睡时长 (分钟)
    val totalRemSleepTime: Int,     // REM时长 (分钟)
    val totalWakeTime: Int,         // 清醒时长 (分钟)
    val wakeCount: Int,             // 清醒次数
    val sleepScore: Int,            // 睡眠评分 (0-100)
    val sleepDetailJson: String     // 睡眠阶段详情JSON
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("sleepInTime", sleepInTime.toDouble())
        putDouble("sleepOutTime", sleepOutTime.toDouble())
        putInt("totalSleepTime", totalSleepTime)
        putInt("totalDeepSleepTime", totalDeepSleepTime)
        putInt("totalLightSleepTime", totalLightSleepTime)
        putInt("totalRemSleepTime", totalRemSleepTime)
        putInt("totalWakeTime", totalWakeTime)
        putInt("wakeCount", wakeCount)
        putInt("sleepScore", sleepScore)
        putString("sleepDetailJson", sleepDetailJson)
        putString("sleepQuality", getSleepQuality())
        putDouble("sleepDurationHours", totalSleepTime / 60.0)
    }

    private fun getSleepQuality(): String = when {
        sleepScore >= 90 -> "优秀"
        sleepScore >= 80 -> "良好"
        sleepScore >= 60 -> "一般"
        else -> "较差"
    }
}

data class SleepCountData(
    val date: Long,
    val avgSleepTime: Int,          // 平均睡眠时长 (分钟)
    val avgSleepScore: Int          // 平均睡眠评分
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("date", date.toDouble())
        putInt("avgSleepTime", avgSleepTime)
        putInt("avgSleepScore", avgSleepScore)
        putDouble("avgSleepDurationHours", avgSleepTime / 60.0)
    }
}

// ==================== 血氧数据 ====================

data class BloodOxygenData(
    val timestamp: Long,
    val bloodOxygenValue: Int,      // 血氧值 (0-100%)
    val bloodOxygenType: Int        // 类型: 0=日常, 1=睡眠, 2=自动间隔, 3=手动, 4=鼾症
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("timestamp", timestamp.toDouble())
        putInt("bloodOxygenValue", bloodOxygenValue)
        putInt("bloodOxygenType", bloodOxygenType)
        putString("bloodOxygenTypeName", getBloodOxygenTypeName())
        putString("bloodOxygenStatus", getBloodOxygenStatus())
    }

    private fun getBloodOxygenTypeName(): String = when (bloodOxygenType) {
        0 -> "日常血氧"
        1 -> "睡眠血氧"
        2 -> "自动间隔测试"
        3 -> "手动测试"
        4 -> "鼾症血氧"
        else -> "未知类型"
    }

    private fun getBloodOxygenStatus(): String = when {
        bloodOxygenValue >= 95 -> "正常"
        bloodOxygenValue >= 90 -> "偏低"
        else -> "低氧"
    }
}

data class BloodOxygenCountData(
    val date: Long,
    val maxBloodOxygen: Float,
    val minBloodOxygen: Float,
    val avgBloodOxygen: Float
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("date", date.toDouble())
        putDouble("maxBloodOxygen", maxBloodOxygen.toDouble())
        putDouble("minBloodOxygen", minBloodOxygen.toDouble())
        putDouble("avgBloodOxygen", avgBloodOxygen.toDouble())
    }
}

// ==================== 心电数据 ====================

data class EcgData(
    val startTimestamp: Long,
    val endTimestamp: Long,
    val avgHeartRate: Int,
    val expertInterpretation: String    // 专家解读JSON
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("startTimestamp", startTimestamp.toDouble())
        putDouble("endTimestamp", endTimestamp.toDouble())
        putInt("avgHeartRate", avgHeartRate)
        putString("expertInterpretation", expertInterpretation)
    }
}

// ==================== 运动记录数据 ====================

data class SportMetadata(
    val startTimestamp: Long,       // 运动开始时间 (ms)
    val endTimestamp: Long,         // 运动结束时间 (ms)
    val sportMode: Int,             // 运动类型
    val avgHeartRate: Int,          // 平均心率
    val calories: Int,              // 消耗卡路里
    val duration: Int,              // 运动时长 (秒)
    val distance: Int,              // 距离 (米)
    val deviceCategory: String      // 设备类型
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("startTimestamp", startTimestamp.toDouble())
        putDouble("endTimestamp", endTimestamp.toDouble())
        putInt("sportMode", sportMode)
        putString("sportModeName", getSportModeName())
        putInt("avgHeartRate", avgHeartRate)
        putInt("calories", calories)
        putInt("duration", duration)
        putDouble("durationMinutes", duration / 60.0)
        putInt("distance", distance)
        putDouble("distanceKm", distance / 1000.0)
        putString("deviceCategory", deviceCategory)
    }

    private fun getSportModeName(): String = when (sportMode) {
        1 -> "户外跑步"
        2 -> "室内跑步"
        3 -> "户外骑行"
        4 -> "室内骑行"
        5 -> "户外步行"
        6 -> "室内步行"
        7 -> "游泳"
        8 -> "自由训练"
        9 -> "椭圆机"
        10 -> "划船机"
        11 -> "登山"
        12 -> "瑜伽"
        13 -> "跳绳"
        14 -> "高尔夫"
        15 -> "羽毛球"
        16 -> "网球"
        17 -> "乒乓球"
        18 -> "篮球"
        19 -> "足球"
        20 -> "排球"
        else -> "其他运动"
    }
}

// ==================== 听力健康数据 ====================

data class HearingHealthData(
    val timestamp: Long,
    val hearingValue: Float,        // 听力值 (分贝)
    val duration: Long              // 持续时长 (秒)
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("timestamp", timestamp.toDouble())
        putDouble("hearingValue", hearingValue.toDouble())
        putDouble("duration", duration.toDouble())
        putString("hearingLevel", getHearingLevel())
    }

    private fun getHearingLevel(): String = when {
        hearingValue <= 40 -> "安静"
        hearingValue <= 60 -> "正常"
        hearingValue <= 80 -> "较响"
        hearingValue <= 100 -> "很响"
        else -> "危险"
    }
}

data class HearingHealthCountData(
    val date: Long,
    val maxHearing: Float,
    val minHearing: Float,
    val avgHearing: Float,
    val totalDuration: Long         // 总时长 (秒)
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("date", date.toDouble())
        putDouble("maxHearing", maxHearing.toDouble())
        putDouble("minHearing", minHearing.toDouble())
        putDouble("avgHearing", avgHearing.toDouble())
        putDouble("totalDuration", totalDuration.toDouble())
    }
}

// ==================== 放松数据 ====================

data class RelaxData(
    val timestamp: Long,
    val type: Int,                  // 类型: -2=全部, 1=呼吸, 2=冥想, 3=游戏
    val subType: Int,               // 子类型
    val pressureValue: Int,         // 压力值
    val duration: Long              // 持续时长 (秒)
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("timestamp", timestamp.toDouble())
        putInt("type", type)
        putString("typeName", getTypeName())
        putInt("subType", subType)
        putString("subTypeName", getSubTypeName())
        putInt("pressureValue", pressureValue)
        putDouble("duration", duration.toDouble())
        putDouble("durationMinutes", duration / 60.0)
    }

    private fun getTypeName(): String = when (type) {
        -2 -> "全部类型"
        1 -> "呼吸"
        2 -> "冥想"
        3 -> "游戏"
        else -> "未知"
    }

    private fun getSubTypeName(): String = when (type) {
        1 -> when (subType) {
            1 -> "自然呼吸"
            2 -> "蜂鸣式呼吸"
            3 -> "助眠式呼吸"
            else -> "未知"
        }
        2 -> when (subType) {
            1 -> "情绪觉知"
            2 -> "躯体扫描"
            3 -> "工作小憩"
            4 -> "正念行走"
            5 -> "助眠冥想"
            else -> "未知"
        }
        3 -> when (subType) {
            1 -> "捏泡泡"
            2 -> "打地鼠"
            else -> "未知"
        }
        else -> "未知"
    }
}

data class RelaxCountData(
    val date: Long,
    val totalDuration: Long         // 当日放松总时长 (秒)
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putDouble("date", date.toDouble())
        putDouble("totalDuration", totalDuration.toDouble())
        putDouble("totalDurationMinutes", totalDuration / 60.0)
    }
}

// ==================== 综合健康状态 ====================

/**
 * 综合健康状态数据
 * 用于前端推荐系统
 */
data class ComprehensiveHealthState(
    // 今日活动
    val dailySteps: Int = 0,
    val dailyDistance: Int = 0,
    val dailyCalories: Int = 0,

    // 心率
    val currentHeartRate: Int = 75,
    val restingHeartRate: Int = 65,
    val avgHeartRate: Int = 75,
    val maxHeartRate: Int = 0,
    val minHeartRate: Int = 0,

    // 压力
    val currentPressure: Int = 50,
    val avgPressure: Float = 50f,

    // 睡眠 (昨晚)
    val lastSleepDuration: Int = 0,     // 分钟
    val lastSleepScore: Int = 0,
    val lastDeepSleepDuration: Int = 0,
    val lastRemSleepDuration: Int = 0,

    // 血氧
    val currentBloodOxygen: Int = 98,
    val avgBloodOxygen: Float = 98f,

    // 运动记录
    val recentWorkoutDuration: Int = 0,     // 最近运动时长 (分钟)
    val recentWorkoutCalories: Int = 0,
    val recentWorkoutType: String = "",
    val isPostWorkout: Boolean = false,     // 是否刚运动完
    val lastWorkoutTimestamp: Long = 0,

    // 放松
    val todayRelaxDuration: Int = 0,        // 今日放松时长 (分钟)

    // 设备信息
    val hasWearableDevice: Boolean = false,
    val deviceType: String = ""
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        // 活动数据
        putInt("dailySteps", dailySteps)
        putInt("dailyDistance", dailyDistance)
        putInt("dailyCalories", dailyCalories)

        // 心率数据
        putInt("currentHeartRate", currentHeartRate)
        putInt("restingHeartRate", restingHeartRate)
        putInt("avgHeartRate", avgHeartRate)
        putInt("maxHeartRate", maxHeartRate)
        putInt("minHeartRate", minHeartRate)

        // 压力数据
        putInt("currentPressure", currentPressure)
        putDouble("avgPressure", avgPressure.toDouble())
        putString("pressureLevel", getPressureLevel())

        // 睡眠数据
        putInt("lastSleepDuration", lastSleepDuration)
        putDouble("lastSleepDurationHours", lastSleepDuration / 60.0)
        putInt("lastSleepScore", lastSleepScore)
        putString("sleepQuality", getSleepQuality())
        putInt("lastDeepSleepDuration", lastDeepSleepDuration)
        putInt("lastRemSleepDuration", lastRemSleepDuration)

        // 血氧数据
        putInt("currentBloodOxygen", currentBloodOxygen)
        putDouble("avgBloodOxygen", avgBloodOxygen.toDouble())
        putString("bloodOxygenStatus", getBloodOxygenStatus())

        // 运动数据
        putInt("recentWorkoutDuration", recentWorkoutDuration)
        putInt("recentWorkoutCalories", recentWorkoutCalories)
        putString("recentWorkoutType", recentWorkoutType)
        putBoolean("isPostWorkout", isPostWorkout)
        putDouble("lastWorkoutTimestamp", lastWorkoutTimestamp.toDouble())

        // 放松数据
        putInt("todayRelaxDuration", todayRelaxDuration)

        // 设备信息
        putBoolean("hasWearableDevice", hasWearableDevice)
        putString("deviceType", deviceType)

        // 综合健康评估
        putString("overallHealthStatus", getOverallHealthStatus())
        putString("activityLevel", getActivityLevel())
        putBoolean("needsRest", needsRest())
        putBoolean("isWellRested", isWellRested())
    }

    private fun getPressureLevel(): String = when {
        currentPressure <= 29 -> "放松"
        currentPressure <= 59 -> "正常"
        currentPressure <= 79 -> "中等"
        else -> "偏高"
    }

    private fun getSleepQuality(): String = when {
        lastSleepScore >= 90 -> "优秀"
        lastSleepScore >= 80 -> "良好"
        lastSleepScore >= 60 -> "一般"
        lastSleepScore > 0 -> "较差"
        else -> "无数据"
    }

    private fun getBloodOxygenStatus(): String = when {
        currentBloodOxygen >= 95 -> "正常"
        currentBloodOxygen >= 90 -> "偏低"
        currentBloodOxygen > 0 -> "低氧"
        else -> "无数据"
    }

    private fun getOverallHealthStatus(): String {
        var score = 0
        var factors = 0

        // 睡眠评分
        if (lastSleepScore > 0) {
            score += lastSleepScore
            factors++
        }

        // 压力评分 (反向，压力越低越好)
        if (currentPressure > 0) {
            score += (100 - currentPressure)
            factors++
        }

        // 血氧评分
        if (currentBloodOxygen > 0) {
            score += currentBloodOxygen
            factors++
        }

        // 活动评分 (假设10000步为满分)
        val activityScore = minOf(dailySteps * 100 / 10000, 100)
        score += activityScore
        factors++

        if (factors == 0) return "无数据"

        val avgScore = score / factors
        return when {
            avgScore >= 85 -> "优秀"
            avgScore >= 70 -> "良好"
            avgScore >= 50 -> "一般"
            else -> "需关注"
        }
    }

    private fun getActivityLevel(): String = when {
        dailySteps >= 10000 -> "活跃"
        dailySteps >= 7000 -> "适中"
        dailySteps >= 3000 -> "轻度"
        dailySteps > 0 -> "久坐"
        else -> "无数据"
    }

    fun needsRest(): Boolean {
        // 压力高或睡眠不足时需要休息
        return currentPressure >= 70 || (lastSleepDuration in 1..359)
    }

    fun isWellRested(): Boolean {
        // 睡眠充足且压力正常
        return lastSleepDuration >= 420 && currentPressure <= 50
    }
}

// ==================== 工具函数 ====================

/**
 * 将列表转换为WritableArray
 */
fun <T> List<T>.toWritableArray(transform: (T) -> WritableMap): WritableArray {
    return Arguments.createArray().apply {
        this@toWritableArray.forEach { item ->
            pushMap(transform(item))
        }
    }
}
