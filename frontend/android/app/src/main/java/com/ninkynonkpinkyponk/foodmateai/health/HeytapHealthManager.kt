package com.ninkynonkpinkyponk.foodmateai.health

import android.app.Activity
import android.content.Context
import android.util.Log
import com.heytap.databaseengine.HeytapHealthApi
import com.heytap.databaseengine.apiv2.HResponse
import com.heytap.databaseengine.apiv3.DataReadRequest
import com.heytap.databaseengine.apiv3.data.DataSet
import com.heytap.databaseengine.apiv3.data.DataType
import com.heytap.databaseengine.apiv3.data.Element
import com.heytap.databaseengine.apiv2.auth.AuthResult
import com.heytap.databaseengine.model.proxy.UserDeviceInfoProxy
import com.heytap.databaseengine.apiv2.common.util.InstallUtils

/**
 * OPPO健康服务SDK管理器
 * 封装所有与HeytapHealth SDK的交互
 */
class HeytapHealthManager(private val context: Context) {

    companion object {
        private const val TAG = "HeytapHealthManager"

        // 错误码
        const val SUCCESS = 100000
        const val ERR_PARAMETER_ERROR = 100001
        const val ERR_SQLITE_EXCEPTION = 100002
        const val ERR_BINDER_EXCEPTION = 100003
        const val ERR_LOGIN_STATUS = 100004
        const val ERR_REMOTE_EXCEPTION = 100005
        const val ERR_PERMISSION_DENY = 100006
        const val ERR_HEALTH_APP_NOT_INSTALLED = 100007
        const val ERR_HEALTH_APP_VERSION_LOW = 100008
        const val ERR_DATA_TYPE_NOT_SUPPORT = 100009
        const val ERR_FUN_NOT_IMPL = 100011
        const val ERR_AUTH_FAILURE = 100012
        const val ERR_STORAGE_SPACE_LOW = 100013
        const val ERR_AUTH_CANCEL = 100014
        const val ERR_BIND_SERVICE_FAIL = 100015
        const val ERR_DATA_INSERT = 101001
        const val ERR_DATA_READ = 101002
        const val ERR_DATA_DELETE = 101003
        const val ERR_DATA_SYNCING = 101004
        const val ERR_QUERY_EMPTY = 101005
        const val ERR_CHECK_SCOPE_EXCEPTION = 101006
        const val ERR_DATA_INVALID = 101007

        // 健康APP包名
        private const val HEALTH_APP_PACKAGE = "com.heytap.health"

        @Volatile
        private var instance: HeytapHealthManager? = null

        fun getInstance(context: Context): HeytapHealthManager {
            return instance ?: synchronized(this) {
                instance ?: HeytapHealthManager(context.applicationContext).also { instance = it }
            }
        }
    }

    private var isInitialized = false
    private var isAuthorized = false
    private var authorizedScopes: List<String> = emptyList()

    // 回调接口
    interface HealthCallback<T> {
        fun onSuccess(data: T)
        fun onFailure(errorCode: Int, message: String)
    }

    /**
     * 初始化SDK
     */
    fun initialize(enableLogging: Boolean = false) {
        HeytapHealthApi.setLoggable(enableLogging)
        isInitialized = true
        Log.i(TAG, "HeytapHealthManager initialized, logging: $enableLogging")
    }

    /**
     * 检查健康APP是否安装
     */
    fun isHealthAppInstalled(): Boolean {
        return InstallUtils.isAppInstalled(context, HEALTH_APP_PACKAGE)
    }

    /**
     * 引导用户下载健康APP
     */
    fun downloadHealthApp(activity: Activity) {
        InstallUtils.DownloadApp(activity)
    }

    /**
     * 请求授权
     */
    fun requestAuthorization(activity: Activity, callback: HealthCallback<AuthResult>) {
        if (!isHealthAppInstalled()) {
            callback.onFailure(ERR_HEALTH_APP_NOT_INSTALLED, "OPPO健康APP未安装")
            return
        }

        HeytapHealthApi.getInstance().authorityApi().request(activity, object : HResponse<AuthResult> {
            override fun onSuccess(result: AuthResult) {
                isAuthorized = true
                Log.i(TAG, "Authorization successful")
                callback.onSuccess(result)
            }

            override fun onFailure(errorCode: Int) {
                Log.e(TAG, "Authorization failed: $errorCode")
                callback.onFailure(errorCode, getErrorMessage(errorCode))
            }
        })
    }

    /**
     * 校验授权状态
     */
    fun checkAuthorization(callback: HealthCallback<List<String>>) {
        HeytapHealthApi.getInstance().authorityApi().valid(object : HResponse<List<String>> {
            override fun onSuccess(scopes: List<String>) {
                authorizedScopes = scopes
                isAuthorized = scopes.isNotEmpty()
                Log.i(TAG, "Auth scopes: $scopes")
                callback.onSuccess(scopes)
            }

            override fun onFailure(errorCode: Int) {
                Log.e(TAG, "Auth check failed: $errorCode")
                callback.onFailure(errorCode, getErrorMessage(errorCode))
            }
        })
    }

    /**
     * 取消授权
     */
    fun revokeAuthorization(callback: HealthCallback<Boolean>) {
        HeytapHealthApi.getInstance().authorityApi().revoke(object : HResponse<List<Any>> {
            override fun onSuccess(result: List<Any>) {
                isAuthorized = false
                authorizedScopes = emptyList()
                Log.i(TAG, "Authorization revoked")
                callback.onSuccess(true)
            }

            override fun onFailure(errorCode: Int) {
                Log.e(TAG, "Revoke failed: $errorCode")
                callback.onFailure(errorCode, getErrorMessage(errorCode))
            }
        })
    }

    /**
     * 获取用户信息（openId）
     */
    fun getUserInfo(callback: HealthCallback<Map<String, Any>>) {
        HeytapHealthApi.getInstance().userInfoApi().readInfo(object : HResponse<List<DataSet>> {
            override fun onSuccess(dataSets: List<DataSet>) {
                val result = mutableMapOf<String, Any>()
                dataSets.forEach { dataSet ->
                    dataSet.dataPoints.forEach { dataPoint ->
                        dataPoint.getValue(Element.ELEMENT_OPENID)?.let {
                            result["openId"] = it
                        }
                    }
                }
                callback.onSuccess(result)
            }

            override fun onFailure(errorCode: Int) {
                callback.onFailure(errorCode, getErrorMessage(errorCode))
            }
        })
    }

    /**
     * 查询绑定设备
     */
    fun queryBoundDevices(callback: HealthCallback<List<DeviceInfo>>) {
        HeytapHealthApi.getInstance().deviceApi().deviceInfoApi()
            .queryBoundDevice(object : HResponse<List<UserDeviceInfoProxy>> {
                override fun onSuccess(devices: List<UserDeviceInfoProxy>) {
                    val deviceList = devices.map { device ->
                        DeviceInfo(
                            deviceName = device.deviceName ?: "",
                            deviceType = device.deviceType,
                            subDeviceType = device.subDeviceType,
                            model = device.model ?: ""
                        )
                    }
                    callback.onSuccess(deviceList)
                }

                override fun onFailure(errorCode: Int) {
                    callback.onFailure(errorCode, getErrorMessage(errorCode))
                }
            })
    }

    // ==================== 健康数据读取接口 ====================

    /**
     * 读取心率详情数据
     */
    fun readHeartRate(startTime: Long, endTime: Long, callback: HealthCallback<List<HeartRateData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_HEART_RATE)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<HeartRateData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(HeartRateData(
                        timestamp = point.startTimeStamp,
                        heartRate = point.getValue(Element.ELEMENT_HEART_RATE) as? Int ?: 0
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取心率统计数据
     */
    fun readHeartRateCount(startTime: Long, endTime: Long, callback: HealthCallback<List<HeartRateCountData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_HEART_RATE_COUNT)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<HeartRateCountData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(HeartRateCountData(
                        date = point.timeStamp,
                        maxHeartRate = (point.getValue(Element.ELEMENT_MAX) as? Number)?.toInt() ?: 0,
                        minHeartRate = (point.getValue(Element.ELEMENT_MIN) as? Number)?.toInt() ?: 0,
                        avgHeartRate = (point.getValue(Element.ELEMENT_AVERAGE) as? Number)?.toInt() ?: 0,
                        restingHeartRate = (point.getValue(Element.ELEMENT_REST_HR) as? Number)?.toInt() ?: 0
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取每日活动详情数据
     */
    fun readDailyActivity(startTime: Long, endTime: Long, callback: HealthCallback<List<DailyActivityData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_DAILY_ACTIVITY)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<DailyActivityData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(DailyActivityData(
                        startTimestamp = point.startTimeStamp,
                        endTimestamp = point.timeStamp,
                        steps = point.getValue(Element.ELEMENT_STEP) as? Int ?: 0,
                        distance = point.getValue(Element.ELEMENT_DISTANCE) as? Int ?: 0,
                        calories = point.getValue(Element.ELEMENT_CALORIE) as? Int ?: 0
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取每日活动统计数据
     */
    fun readDailyActivityCount(startTime: Long, endTime: Long, callback: HealthCallback<List<DailyActivityCountData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_DAILY_ACTIVITY_COUNT)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<DailyActivityCountData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(DailyActivityCountData(
                        date = point.timeStamp,
                        totalSteps = point.getValue(Element.ELEMENT_STEP) as? Int ?: 0,
                        totalDistance = point.getValue(Element.ELEMENT_DISTANCE) as? Int ?: 0,
                        totalCalories = point.getValue(Element.ELEMENT_CALORIE) as? Int ?: 0
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取压力详情数据
     */
    fun readPressure(startTime: Long, endTime: Long, callback: HealthCallback<List<PressureData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_PRESSURE)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<PressureData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(PressureData(
                        timestamp = point.startTimeStamp,
                        pressureValue = point.getValue(Element.ELEMENT_PRESSURE) as? Int ?: 0
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取压力统计数据
     */
    fun readPressureCount(startTime: Long, endTime: Long, callback: HealthCallback<List<PressureCountData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_PRESSURE_COUNT)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<PressureCountData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(PressureCountData(
                        date = point.timeStamp,
                        maxPressure = (point.getValue(Element.ELEMENT_MAX) as? Number)?.toFloat() ?: 0f,
                        minPressure = (point.getValue(Element.ELEMENT_MIN) as? Number)?.toFloat() ?: 0f,
                        avgPressure = (point.getValue(Element.ELEMENT_AVERAGE) as? Number)?.toFloat() ?: 0f
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取睡眠详情数据
     * 根据SDK文档：睡眠数据通过 ELEMENT_SLEEP_DAY_FRAGS 返回 JSON 格式的详细数据
     * JSON 中包含 totalSleepTime, totalDeepSleepTime, totalLightlySleepTime, totalREMSleepTime, totalWakeTime, wakeCount
     */
    fun readSleep(startTime: Long, endTime: Long, callback: HealthCallback<List<SleepData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_SLEEP)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<SleepData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    // 睡眠数据主要通过 sleepDetailJson 解析
                    val sleepJson = point.getValue(Element.ELEMENT_SLEEP_DAY_FRAGS) as? String ?: ""

                    // 尝试从各个元素获取数据，如果SDK不支持则从JSON解析
                    result.add(SleepData(
                        sleepInTime = (point.getValue(Element.ELEMENT_FALL_ASLEEP) as? Number)?.toLong() ?: 0L,
                        sleepOutTime = (point.getValue(Element.ELEMENT_SLEEP_OUT) as? Number)?.toLong() ?: 0L,
                        totalSleepTime = (point.getValue(Element.ELEMENT_DURATION) as? Number)?.toInt() ?: 0,
                        totalDeepSleepTime = (point.getValue(Element.ELEMENT_TOTAL_DEEP_SLEEP_TIME) as? Number)?.toInt() ?: 0,
                        totalLightSleepTime = (point.getValue(Element.ELEMENT_TOTAL_LIGHTLY_SLEEP_TIME) as? Number)?.toInt() ?: 0,
                        totalRemSleepTime = 0, // 从 sleepDetailJson 解析
                        totalWakeTime = (point.getValue(Element.ELEMENT_TOTAL_WAKE_UP_TIME) as? Number)?.toInt() ?: 0,
                        wakeCount = 0, // 从 sleepDetailJson 解析
                        sleepScore = (point.getValue(Element.ELEMENT_SLEEP_SCORE) as? Number)?.toInt() ?: 0,
                        sleepDetailJson = sleepJson
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取睡眠统计数据
     */
    fun readSleepCount(startTime: Long, endTime: Long, callback: HealthCallback<List<SleepCountData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_SLEEP_COUNT)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<SleepCountData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(SleepCountData(
                        date = point.timeStamp,
                        avgSleepTime = (point.getValue(Element.ELEMENT_AVERAGE) as? Number)?.toInt() ?: 0,
                        avgSleepScore = (point.getValue(Element.ELEMENT_SLEEP_SCORE) as? Number)?.toInt() ?: 0
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取血氧详情数据
     */
    fun readBloodOxygen(startTime: Long, endTime: Long, callback: HealthCallback<List<BloodOxygenData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_BLOOD_OXYGEN)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<BloodOxygenData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(BloodOxygenData(
                        timestamp = point.startTimeStamp,
                        bloodOxygenValue = point.getValue(Element.ELEMENT_BLOOD_OXYGEN) as? Int ?: 0,
                        bloodOxygenType = point.getValue(Element.ELEMENT_TYPE) as? Int ?: 0
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取血氧统计数据
     */
    fun readBloodOxygenCount(startTime: Long, endTime: Long, callback: HealthCallback<List<BloodOxygenCountData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_BLOOD_OXYGEN_COUNT)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<BloodOxygenCountData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(BloodOxygenCountData(
                        date = point.timeStamp,
                        maxBloodOxygen = (point.getValue(Element.ELEMENT_MAX) as? Number)?.toFloat() ?: 0f,
                        minBloodOxygen = (point.getValue(Element.ELEMENT_MIN) as? Number)?.toFloat() ?: 0f,
                        avgBloodOxygen = (point.getValue(Element.ELEMENT_AVERAGE) as? Number)?.toFloat() ?: 0f
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取心电记录数据
     */
    fun readEcg(startTime: Long, endTime: Long, callback: HealthCallback<List<EcgData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_ECG)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<EcgData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(EcgData(
                        startTimestamp = point.startTimeStamp,
                        endTimestamp = point.timeStamp,
                        avgHeartRate = point.getValue(Element.ELEMENT_HEART_RATE) as? Int ?: 0,
                        expertInterpretation = point.getValue(Element.ELEMENT_ECG_EXPERT_INTERPRETATION) as? String ?: ""
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取运动记录概要数据
     * 根据SDK文档：运动开始/结束时间为秒级时间戳，需要转换为毫秒
     */
    fun readSportMetadata(startTime: Long, endTime: Long, callback: HealthCallback<List<SportMetadata>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_SPORT_METADATA)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<SportMetadata>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(SportMetadata(
                        startTimestamp = (point.getValue(Element.ELEMENT_START_TIMESTAMP) as? Number)?.toLong()?.times(1000) ?: 0L,
                        endTimestamp = (point.getValue(Element.ELEMENT_END_TIMESTAMP) as? Number)?.toLong()?.times(1000) ?: 0L,
                        sportMode = point.getValue(Element.ELEMENT_SPORT_MODE) as? Int ?: 0,
                        avgHeartRate = point.getValue(Element.ELEMENT_AVG_HEART_RATE) as? Int ?: 0,
                        calories = point.getValue(Element.ELEMENT_CALORIE) as? Int ?: 0,
                        duration = point.getValue(Element.ELEMENT_DURATION) as? Int ?: 0,
                        distance = point.getValue(Element.ELEMENT_DISTANCE) as? Int ?: 0,
                        deviceCategory = point.getValue(Element.ELEMENT_DEVICE_CATEGORY) as? String ?: ""
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取听力详情数据
     */
    fun readHearingHealth(startTime: Long, endTime: Long, callback: HealthCallback<List<HearingHealthData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_HEARING_HEALTH)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<HearingHealthData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(HearingHealthData(
                        timestamp = point.startTimeStamp,
                        hearingValue = (point.getValue(Element.ELEMENT_HEARING_HEALTH) as? Number)?.toFloat() ?: 0f,
                        duration = (point.getValue(Element.ELEMENT_DURATION) as? Number)?.toLong() ?: 0L
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取放松详情数据
     */
    fun readRelax(startTime: Long, endTime: Long, callback: HealthCallback<List<RelaxData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_RELAX)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<RelaxData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(RelaxData(
                        timestamp = point.startTimeStamp,
                        type = point.getValue(Element.ELEMENT_TYPE) as? Int ?: 0,
                        subType = point.getValue(Element.ELEMENT_SUB_TYPE) as? Int ?: 0,
                        pressureValue = point.getValue(Element.ELEMENT_PRESSURE) as? Int ?: 0,
                        duration = (point.getValue(Element.ELEMENT_DURATION) as? Number)?.toLong() ?: 0L
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取听力统计数据
     */
    fun readHearingHealthCount(startTime: Long, endTime: Long, callback: HealthCallback<List<HearingHealthCountData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_HEARING_HEALTH_COUNT)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<HearingHealthCountData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(HearingHealthCountData(
                        date = point.timeStamp,
                        maxHearing = (point.getValue(Element.ELEMENT_MAX) as? Number)?.toFloat() ?: 0f,
                        minHearing = (point.getValue(Element.ELEMENT_MIN) as? Number)?.toFloat() ?: 0f,
                        avgHearing = (point.getValue(Element.ELEMENT_AVERAGE) as? Number)?.toFloat() ?: 0f,
                        totalDuration = (point.getValue(Element.ELEMENT_DURATION) as? Number)?.toLong() ?: 0L
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    /**
     * 读取放松统计数据
     */
    fun readRelaxCount(startTime: Long, endTime: Long, callback: HealthCallback<List<RelaxCountData>>) {
        val request = DataReadRequest.Builder()
            .read(DataType.TYPE_RELAX_COUNT)
            .setTimeRange(startTime, endTime)
            .build()

        readData(request, callback) { dataSets ->
            val result = mutableListOf<RelaxCountData>()
            dataSets.forEach { dataSet ->
                dataSet.dataPoints.forEach { point ->
                    result.add(RelaxCountData(
                        date = point.timeStamp,
                        totalDuration = (point.getValue(Element.ELEMENT_DURATION) as? Number)?.toLong() ?: 0L
                    ))
                }
            }
            callback.onSuccess(result)
        }
    }

    // ==================== 通用数据读取方法 ====================

    private fun <T> readData(
        request: DataReadRequest,
        callback: HealthCallback<T>,
        onSuccess: (List<DataSet>) -> Unit
    ) {
        HeytapHealthApi.getInstance().dataApi().read(request, object : HResponse<List<DataSet>> {
            override fun onSuccess(dataSets: List<DataSet>) {
                onSuccess(dataSets)
            }

            override fun onFailure(errorCode: Int) {
                Log.e(TAG, "Data read failed: $errorCode")
                callback.onFailure(errorCode, getErrorMessage(errorCode))
            }
        })
    }

    /**
     * 获取错误信息
     */
    private fun getErrorMessage(errorCode: Int): String {
        return when (errorCode) {
            SUCCESS -> "成功"
            ERR_PARAMETER_ERROR -> "参数错误"
            ERR_SQLITE_EXCEPTION -> "数据库数据处理异常"
            ERR_BINDER_EXCEPTION -> "Binder错误"
            ERR_LOGIN_STATUS -> "帐号登录状态错误"
            ERR_REMOTE_EXCEPTION -> "远程服务器错误"
            ERR_PERMISSION_DENY -> "没有权限"
            ERR_HEALTH_APP_NOT_INSTALLED -> "健康APP未安装"
            ERR_HEALTH_APP_VERSION_LOW -> "健康APP版本过低"
            ERR_DATA_TYPE_NOT_SUPPORT -> "当前版本不支持该类型数据"
            ERR_FUN_NOT_IMPL -> "方法未实现"
            ERR_AUTH_FAILURE -> "授权失败"
            ERR_STORAGE_SPACE_LOW -> "手机存储过低"
            ERR_AUTH_CANCEL -> "授权取消"
            ERR_BIND_SERVICE_FAIL -> "绑定服务失败"
            ERR_DATA_INSERT -> "数据插入失败"
            ERR_DATA_READ -> "数据读取失败"
            ERR_DATA_DELETE -> "数据删除失败"
            ERR_DATA_SYNCING -> "正在同步数据"
            ERR_QUERY_EMPTY -> "读取数据为空"
            ERR_CHECK_SCOPE_EXCEPTION -> "检测权限时发生异常"
            ERR_DATA_INVALID -> "数据不可信，超过正常边界范围"
            else -> "未知错误: $errorCode"
        }
    }

    // ==================== 辅助方法 ====================

    fun isAuthorized(): Boolean = isAuthorized

    fun getAuthorizedScopes(): List<String> = authorizedScopes
}
