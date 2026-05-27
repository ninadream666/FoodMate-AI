package com.ninkynonkpinkyponk.foodmateai.health

import android.util.Log
import android.app.Activity
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Calendar
import com.heytap.databaseengine.apiv2.auth.AuthResult

/**
 * React Native 原生模块 - OPPO健康SDK桥接
 * 提供JS层调用原生OPPO健康SDK的能力
 */
class HeytapHealthModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "HeytapHealthModule"
        const val MODULE_NAME = "HeytapHealthModule"

        // 事件名称
        const val EVENT_AUTH_SUCCESS = "onAuthSuccess"
        const val EVENT_AUTH_FAILURE = "onAuthFailure"
        const val EVENT_DATA_UPDATE = "onHealthDataUpdate"
    }

    init {
        Log.w(TAG, ">>> HeytapHealthModule CREATED <<<")
    }

    private val healthManager: HeytapHealthManager by lazy {
        HeytapHealthManager.getInstance(reactApplicationContext)
    }

    override fun getName(): String {
        Log.w(TAG, ">>> getName called, returning $MODULE_NAME <<<")
        return MODULE_NAME
    }

    /**
     * 初始化SDK
     */
    @ReactMethod
    fun initialize(enableLogging: Boolean, promise: Promise) {
        Log.w(TAG, "initialize called, enableLogging=$enableLogging")
        try {
            healthManager.initialize(enableLogging)
            Log.w(TAG, "initialize success")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Initialize failed", e)
            promise.reject("INIT_ERROR", e.message)
        }
    }

    /**
     * 检查健康APP是否安装
     */
    @ReactMethod
    fun isHealthAppInstalled(promise: Promise) {
        Log.w(TAG, "isHealthAppInstalled called")
        try {
            val installed = healthManager.isHealthAppInstalled()
            Log.w(TAG, "isHealthAppInstalled result: $installed")
            promise.resolve(installed)
        } catch (e: Exception) {
            Log.e(TAG, "isHealthAppInstalled error", e)
            promise.reject("CHECK_ERROR", e.message)
        }
    }

    /**
     * 下载健康APP
     */
    @ReactMethod
    fun downloadHealthApp() {
        getCurrentActivity()?.let { activity ->
            healthManager.downloadHealthApp(activity)
        }
    }

    /**
     * 请求授权
     */
    @ReactMethod
    fun requestAuthorization(promise: Promise) {
        Log.w(TAG, "requestAuthorization called")
        val activity = getCurrentActivity()
        if (activity == null) {
            Log.e(TAG, "requestAuthorization: NO_ACTIVITY")
            promise.reject("NO_ACTIVITY", "当前没有可用的Activity")
            return
        }
        Log.w(TAG, "requestAuthorization: activity found, calling SDK...")

        healthManager.requestAuthorization(activity, object : HeytapHealthManager.HealthCallback<AuthResult> {
            override fun onSuccess(data: AuthResult) {
                Log.w(TAG, "requestAuthorization: SUCCESS")
                val result = Arguments.createMap().apply {
                    putBoolean("success", true)
                }
                promise.resolve(result)
                sendEvent(EVENT_AUTH_SUCCESS, result)
            }

            override fun onFailure(errorCode: Int, message: String) {
                Log.e(TAG, "requestAuthorization: FAILED code=$errorCode msg=$message")
                promise.reject(errorCode.toString(), message)
                val errorMap = Arguments.createMap().apply {
                    putInt("errorCode", errorCode)
                    putString("message", message)
                }
                sendEvent(EVENT_AUTH_FAILURE, errorMap)
            }
        })
    }

    /**
     * 校验授权状态
     */
    @ReactMethod
    fun checkAuthorization(promise: Promise) {
        Log.w(TAG, "checkAuthorization called")
        healthManager.checkAuthorization(object : HeytapHealthManager.HealthCallback<List<String>> {
            override fun onSuccess(data: List<String>) {
                Log.w(TAG, "checkAuthorization SUCCESS, scopes=$data")
                val result = Arguments.createMap().apply {
                    putBoolean("isAuthorized", data.isNotEmpty())
                    putArray("scopes", Arguments.fromList(data))
                }
                promise.resolve(result)
            }

            override fun onFailure(errorCode: Int, message: String) {
                Log.e(TAG, "checkAuthorization FAILED: code=$errorCode msg=$message")
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 取消授权
     */
    @ReactMethod
    fun revokeAuthorization(promise: Promise) {
        healthManager.revokeAuthorization(object : HeytapHealthManager.HealthCallback<Boolean> {
            override fun onSuccess(data: Boolean) {
                promise.resolve(data)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 获取用户信息
     */
    @ReactMethod
    fun getUserInfo(promise: Promise) {
        healthManager.getUserInfo(object : HeytapHealthManager.HealthCallback<Map<String, Any>> {
            override fun onSuccess(data: Map<String, Any>) {
                val result = Arguments.createMap().apply {
                    data.forEach { (key, value) ->
                        when (value) {
                            is String -> putString(key, value)
                            is Int -> putInt(key, value)
                            is Double -> putDouble(key, value)
                            is Boolean -> putBoolean(key, value)
                        }
                    }
                }
                promise.resolve(result)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 查询绑定设备
     */
    @ReactMethod
    fun queryBoundDevices(promise: Promise) {
        healthManager.queryBoundDevices(object : HeytapHealthManager.HealthCallback<List<DeviceInfo>> {
            override fun onSuccess(data: List<DeviceInfo>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    // ==================== 健康数据读取接口 ====================

    /**
     * 读取心率数据 (最近N天)
     */
    @ReactMethod
    fun readHeartRate(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readHeartRate(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<HeartRateData>> {
            override fun onSuccess(data: List<HeartRateData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取心率统计数据 (最近N天)
     */
    @ReactMethod
    fun readHeartRateCount(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readHeartRateCount(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<HeartRateCountData>> {
            override fun onSuccess(data: List<HeartRateCountData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取每日活动数据 (今日)
     */
    @ReactMethod
    fun readDailyActivity(promise: Promise) {
        val (startTime, endTime) = getTodayTimeRange()
        healthManager.readDailyActivity(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<DailyActivityData>> {
            override fun onSuccess(data: List<DailyActivityData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取每日活动统计数据 (最近N天)
     */
    @ReactMethod
    fun readDailyActivityCount(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readDailyActivityCount(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<DailyActivityCountData>> {
            override fun onSuccess(data: List<DailyActivityCountData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取压力数据 (最近N天)
     */
    @ReactMethod
    fun readPressure(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readPressure(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<PressureData>> {
            override fun onSuccess(data: List<PressureData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取压力统计数据 (最近N天)
     */
    @ReactMethod
    fun readPressureCount(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readPressureCount(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<PressureCountData>> {
            override fun onSuccess(data: List<PressureCountData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取睡眠数据 (最近N天)
     */
    @ReactMethod
    fun readSleep(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readSleep(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<SleepData>> {
            override fun onSuccess(data: List<SleepData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取睡眠统计数据 (最近N天)
     */
    @ReactMethod
    fun readSleepCount(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readSleepCount(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<SleepCountData>> {
            override fun onSuccess(data: List<SleepCountData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取血氧数据 (最近N天)
     */
    @ReactMethod
    fun readBloodOxygen(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readBloodOxygen(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<BloodOxygenData>> {
            override fun onSuccess(data: List<BloodOxygenData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取血氧统计数据 (最近N天)
     */
    @ReactMethod
    fun readBloodOxygenCount(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readBloodOxygenCount(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<BloodOxygenCountData>> {
            override fun onSuccess(data: List<BloodOxygenCountData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取心电数据 (最近N天)
     */
    @ReactMethod
    fun readEcg(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readEcg(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<EcgData>> {
            override fun onSuccess(data: List<EcgData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取运动记录数据 (最近N天)
     */
    @ReactMethod
    fun readSportMetadata(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readSportMetadata(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<SportMetadata>> {
            override fun onSuccess(data: List<SportMetadata>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取听力健康数据 (最近N天)
     */
    @ReactMethod
    fun readHearingHealth(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readHearingHealth(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<HearingHealthData>> {
            override fun onSuccess(data: List<HearingHealthData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取放松数据 (最近N天)
     */
    @ReactMethod
    fun readRelax(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readRelax(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<RelaxData>> {
            override fun onSuccess(data: List<RelaxData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取听力统计数据 (最近N天)
     */
    @ReactMethod
    fun readHearingHealthCount(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readHearingHealthCount(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<HearingHealthCountData>> {
            override fun onSuccess(data: List<HearingHealthCountData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 读取放松统计数据 (最近N天)
     */
    @ReactMethod
    fun readRelaxCount(days: Int, promise: Promise) {
        val (startTime, endTime) = getTimeRange(days)
        healthManager.readRelaxCount(startTime, endTime, object : HeytapHealthManager.HealthCallback<List<RelaxCountData>> {
            override fun onSuccess(data: List<RelaxCountData>) {
                val array = data.toWritableArray { it.toWritableMap() }
                promise.resolve(array)
            }

            override fun onFailure(errorCode: Int, message: String) {
                promise.reject(errorCode.toString(), message)
            }
        })
    }

    /**
     * 获取综合健康状态
     * 一次性获取所有相关健康数据用于推荐
     */
    @ReactMethod
    fun getComprehensiveHealthState(promise: Promise) {
        Log.w(TAG, "getComprehensiveHealthState called")
        val now = System.currentTimeMillis()
        val todayStart = getTodayStartTime()
        val yesterdayStart = todayStart - 24 * 60 * 60 * 1000L

        var state = ComprehensiveHealthState()
        var completedRequests = 0
        val totalRequests = 6

        fun checkComplete() {
            completedRequests++
            Log.w(TAG, "checkComplete: $completedRequests/$totalRequests")
            if (completedRequests >= totalRequests) {
                Log.w(TAG, "ALL DATA COMPLETE: steps=${state.dailySteps} hr=${state.currentHeartRate} pressure=${state.currentPressure} sleep=${state.lastSleepDuration} spo2=${state.currentBloodOxygen}")
                promise.resolve(state.toWritableMap())
            }
        }

        // 1. 获取今日活动统计数据（全天汇总，与健康APP一致）
        healthManager.readDailyActivityCount(todayStart, now, object : HeytapHealthManager.HealthCallback<List<DailyActivityCountData>> {
            override fun onSuccess(data: List<DailyActivityCountData>) {
                Log.w(TAG, "dailyActivityCount: count=${data.size}")
                if (data.isNotEmpty()) {
                    val latest = data.last()
                    val caloriesKcal = latest.totalCalories / 1000
                    Log.w(TAG, "dailyActivityCount: steps=${latest.totalSteps} dist=${latest.totalDistance} cal=${caloriesKcal}kcal")
                    state = state.copy(
                        dailySteps = latest.totalSteps,
                        dailyDistance = latest.totalDistance,
                        dailyCalories = caloriesKcal
                    )
                }
                checkComplete()
            }
            override fun onFailure(errorCode: Int, message: String) {
                Log.w(TAG, "getComprehensive dailyActivityCount onFailure: code=$errorCode msg=$message")
                checkComplete()
            }
        })

        // 2. 获取心率数据
        healthManager.readHeartRate(todayStart, now, object : HeytapHealthManager.HealthCallback<List<HeartRateData>> {
            override fun onSuccess(data: List<HeartRateData>) {
                if (data.isNotEmpty()) {
                    val currentHr = data.last().heartRate
                    val avgHr = data.map { it.heartRate }.average().toInt()
                    val maxHr = data.maxOfOrNull { it.heartRate } ?: 0
                    val minHr = data.minOfOrNull { it.heartRate } ?: 0
                    state = state.copy(
                        currentHeartRate = currentHr,
                        avgHeartRate = avgHr,
                        maxHeartRate = maxHr,
                        minHeartRate = minHr
                    )
                }
                checkComplete()
            }
            override fun onFailure(errorCode: Int, message: String) {
                Log.w(TAG, "getComprehensive onFailure: code=$errorCode msg=$message")
                checkComplete()
            }
        })

        // 3. 获取压力数据
        healthManager.readPressure(todayStart, now, object : HeytapHealthManager.HealthCallback<List<PressureData>> {
            override fun onSuccess(data: List<PressureData>) {
                if (data.isNotEmpty()) {
                    val currentPressure = data.last().pressureValue
                    val avgPressure = data.map { it.pressureValue }.average().toFloat()
                    state = state.copy(
                        currentPressure = currentPressure,
                        avgPressure = avgPressure
                    )
                }
                checkComplete()
            }
            override fun onFailure(errorCode: Int, message: String) {
                Log.w(TAG, "getComprehensive onFailure: code=$errorCode msg=$message")
                checkComplete()
            }
        })

        // 4. 获取昨晚睡眠数据
        healthManager.readSleep(yesterdayStart, todayStart, object : HeytapHealthManager.HealthCallback<List<SleepData>> {
            override fun onSuccess(data: List<SleepData>) {
                if (data.isNotEmpty()) {
                    val lastSleep = data.last()
                    state = state.copy(
                        lastSleepDuration = lastSleep.totalSleepTime,
                        lastSleepScore = lastSleep.sleepScore,
                        lastDeepSleepDuration = lastSleep.totalDeepSleepTime,
                        lastRemSleepDuration = lastSleep.totalRemSleepTime
                    )
                }
                checkComplete()
            }
            override fun onFailure(errorCode: Int, message: String) {
                Log.w(TAG, "getComprehensive onFailure: code=$errorCode msg=$message")
                checkComplete()
            }
        })

        // 5. 获取血氧数据
        healthManager.readBloodOxygen(todayStart, now, object : HeytapHealthManager.HealthCallback<List<BloodOxygenData>> {
            override fun onSuccess(data: List<BloodOxygenData>) {
                if (data.isNotEmpty()) {
                    val currentSpO2 = data.last().bloodOxygenValue
                    val avgSpO2 = data.map { it.bloodOxygenValue }.average().toFloat()
                    state = state.copy(
                        currentBloodOxygen = currentSpO2,
                        avgBloodOxygen = avgSpO2
                    )
                }
                checkComplete()
            }
            override fun onFailure(errorCode: Int, message: String) {
                Log.w(TAG, "getComprehensive onFailure: code=$errorCode msg=$message")
                checkComplete()
            }
        })

        // 6. 获取最近运动记录
        val oneHourAgo = now - 60 * 60 * 1000L
        healthManager.readSportMetadata(oneHourAgo, now, object : HeytapHealthManager.HealthCallback<List<SportMetadata>> {
            override fun onSuccess(data: List<SportMetadata>) {
                if (data.isNotEmpty()) {
                    val lastWorkout = data.last()
                    val isRecent = (now - lastWorkout.endTimestamp) < 30 * 60 * 1000L // 30分钟内
                    state = state.copy(
                        recentWorkoutDuration = lastWorkout.duration / 60,
                        recentWorkoutCalories = lastWorkout.calories,
                        recentWorkoutType = getSportModeName(lastWorkout.sportMode),
                        isPostWorkout = isRecent,
                        lastWorkoutTimestamp = lastWorkout.endTimestamp
                    )
                }
                checkComplete()
            }
            override fun onFailure(errorCode: Int, message: String) {
                Log.w(TAG, "getComprehensive onFailure: code=$errorCode msg=$message")
                checkComplete()
            }
        })
    }

    // ==================== 工具方法 ====================

    private fun getTimeRange(days: Int): Pair<Long, Long> {
        val endTime = System.currentTimeMillis()
        val startTime = endTime - days.toLong() * 24 * 60 * 60 * 1000
        return Pair(startTime, endTime)
    }

    private fun getTodayTimeRange(): Pair<Long, Long> {
        val endTime = System.currentTimeMillis()
        val startTime = getTodayStartTime()
        return Pair(startTime, endTime)
    }

    private fun getTodayStartTime(): Long {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }

    private fun getSportModeName(sportMode: Int): String = when (sportMode) {
        1 -> "户外跑步"
        2 -> "室内跑步"
        3 -> "户外骑行"
        4 -> "室内骑行"
        5 -> "户外步行"
        6 -> "室内步行"
        7 -> "游泳"
        8 -> "自由训练"
        else -> "运动"
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // 添加事件监听器支持
    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in Event Emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in Event Emitter
    }
}
