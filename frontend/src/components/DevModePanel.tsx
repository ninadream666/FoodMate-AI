/**
 * DevModePanel.tsx - 开发者调试面板
 *
 * 功能：
 * 1. 开发者模式开关
 * 2. 心率滑动条（60-180bpm）
 * 3. 步数输入
 * 4. 活动状态选择
 * 5. 环境光线模拟（预设按钮 + lux输入）
 * 6. 压力值模拟
 * 7. 血氧值模拟
 * 8. 睡眠数据模拟
 * 9. 一键模拟场景
 * 10. OPPO健康SDK状态显示
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Switch,
    TextInput,
    ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useHealthContext, ActivityStatus } from '../hooks/useHealthContext';
import { lightLevelIcon, lightLevelLabel } from '../hooks/useAmbientLight';

interface DevModePanelProps {
    visible: boolean;
    onClose: () => void;
    onRefreshRecommendations?: () => void;
}

const DevModePanel: React.FC<DevModePanelProps> = ({ visible, onClose, onRefreshRecommendations }) => {
    const health = useHealthContext();
    const [stepsInput, setStepsInput] = useState(String(health.dailySteps));
    const [luxInput, setLuxInput] = useState(String(health.lightLux));
    const [pressureInput, setPressureInput] = useState(String(health.pressureValue));
    const [bloodOxygenInput, setBloodOxygenInput] = useState(String(health.bloodOxygen));
    const [sleepScoreInput, setSleepScoreInput] = useState(String(health.lastSleepScore));
    const [sleepDurationInput, setSleepDurationInput] = useState(String(health.lastSleepDuration));

    // 活动状态选项
    const activityOptions: { label: string; value: ActivityStatus; icon: string }[] = [
        { label: '静止', value: 'still', icon: '🧘' },
        { label: '步行', value: 'walking', icon: '🚶' },
        { label: '跑步', value: 'running', icon: '🏃' },
        { label: '骑行', value: 'cycling', icon: '🚴' },
    ];

    // 心率预设
    const heartRatePresets = [
        { label: '休息', value: 65, color: '#4CAF50' },
        { label: '正常', value: 75, color: '#8BC34A' },
        { label: '轻度', value: 100, color: '#FFC107' },
        { label: '中度', value: 130, color: '#FF9800' },
        { label: '高强度', value: 160, color: '#F44336' },
    ];

    // 光线预设
    const lightPresets = [
        { label: '暗光', value: 20, icon: '🌙', color: '#5c6bc0' },
        { label: '室内', value: 300, icon: '💡', color: '#ffc107' },
        { label: '户外', value: 8000, icon: '🌤️', color: '#ff9800' },
        { label: '强光', value: 40000, icon: '☀️', color: '#f44336' },
    ];

    // 压力预设
    const pressurePresets = [
        { label: '放松', value: 25, color: '#4CAF50' },
        { label: '正常', value: 50, color: '#8BC34A' },
        { label: '中等', value: 70, color: '#FF9800' },
        { label: '偏高', value: 90, color: '#F44336' },
    ];

    // 血氧预设
    const bloodOxygenPresets = [
        { label: '正常', value: 98, color: '#4CAF50' },
        { label: '良好', value: 95, color: '#8BC34A' },
        { label: '偏低', value: 92, color: '#FF9800' },
        { label: '低氧', value: 88, color: '#F44336' },
    ];

    const handleStepsChange = (text: string) => {
        setStepsInput(text);
        const value = parseInt(text, 10);
        if (!isNaN(value) && value >= 0) {
            health.setSimulatedSteps(value);
        }
    };

    const handleLuxChange = (text: string) => {
        setLuxInput(text);
        const value = parseInt(text, 10);
        if (!isNaN(value) && value >= 0) {
            health.setSimulatedLightLux(value);
        }
    };

    const handlePressureChange = (text: string) => {
        setPressureInput(text);
        const value = parseInt(text, 10);
        if (!isNaN(value) && value >= 1 && value <= 100) {
            health.setSimulatedPressure(value);
        }
    };

    const handleBloodOxygenChange = (text: string) => {
        setBloodOxygenInput(text);
        const value = parseInt(text, 10);
        if (!isNaN(value) && value >= 0 && value <= 100) {
            health.setSimulatedBloodOxygen(value);
        }
    };

    const handleSleepScoreChange = (text: string) => {
        setSleepScoreInput(text);
        const value = parseInt(text, 10);
        if (!isNaN(value) && value >= 0 && value <= 100) {
            health.setSimulatedSleepScore(value);
        }
    };

    const handleSleepDurationChange = (text: string) => {
        setSleepDurationInput(text);
        const value = parseInt(text, 10);
        if (!isNaN(value) && value >= 0) {
            health.setSimulatedSleepDuration(value);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* 标题栏 */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>开发者模式</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
                        {/* 开发者模式开关 */}
                        <View style={styles.row}>
                            <View style={styles.rowLeft}>
                                <Text style={styles.rowLabel}>启用模拟数据</Text>
                            </View>
                            <Switch
                                value={health.isDevMode}
                                onValueChange={health.setDevMode}
                                trackColor={{ false: '#ddd', true: '#e85a2d' }}
                                thumbColor={health.isDevMode ? '#fff' : '#f4f3f4'}
                            />
                        </View>

                        {/* OPPO健康SDK状态 */}
                        <View style={styles.sdkStatusBox}>
                            <Text style={styles.sdkStatusTitle}>OPPO健康SDK状态</Text>
                            <View style={styles.sdkStatusRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                    <Feather name={health.isOppoHealthAvailable ? 'check-circle' : 'x-circle'} size={14} color={health.isOppoHealthAvailable ? colors.success : colors.error} />
                                    <Text style={[styles.sdkStatusItem, { marginLeft: 4 }]}>可用</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                    <Feather name={health.isOppoHealthAuthorized ? 'check-circle' : 'x-circle'} size={14} color={health.isOppoHealthAuthorized ? colors.success : colors.error} />
                                    <Text style={[styles.sdkStatusItem, { marginLeft: 4 }]}>已授权</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Feather name={health.hasWearableDevice ? 'watch' : 'x-circle'} size={14} color={health.hasWearableDevice ? colors.success : colors.error} />
                                    <Text style={[styles.sdkStatusItem, { marginLeft: 4 }]}>穿戴设备</Text>
                                </View>
                            </View>
                            {health.oppoHealthError && (
                                <Text style={styles.errorText}>{health.oppoHealthError}</Text>
                            )}
                            {!health.isOppoHealthAuthorized && health.isOppoHealthAvailable && (
                                <TouchableOpacity
                                    style={styles.authBtn}
                                    onPress={health.requestOppoHealthAuth}
                                >
                                    <Text style={styles.authBtnText}>请求授权</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* 分割线 */}
                        <View style={styles.divider} />

                        {/* 当前状态显示 */}
                        <View style={styles.statusBox}>
                            <Text style={styles.statusTitle}>当前健康状态</Text>
                            <View style={styles.statusGrid}>
                                <View style={styles.statusGridItem}>
                                    <Text style={styles.statusLabel}>心率</Text>
                                    <Text style={styles.statusValue}>{health.heartRate}</Text>
                                    <Text style={styles.statusUnit}>bpm</Text>
                                </View>
                                <View style={styles.statusGridItem}>
                                    <Text style={styles.statusLabel}>步数</Text>
                                    <Text style={styles.statusValue}>{health.dailySteps}</Text>
                                    <Text style={styles.statusUnit}>步</Text>
                                </View>
                                <View style={styles.statusGridItem}>
                                    <Text style={styles.statusLabel}>压力</Text>
                                    <Text style={styles.statusValue}>{health.pressureValue}</Text>
                                    <Text style={styles.statusUnit}>{health.pressureLevel}</Text>
                                </View>
                                <View style={styles.statusGridItem}>
                                    <Text style={styles.statusLabel}>血氧</Text>
                                    <Text style={styles.statusValue}>{health.bloodOxygen}%</Text>
                                    <Text style={styles.statusUnit}>{health.bloodOxygenStatus}</Text>
                                </View>
                                <View style={styles.statusGridItem}>
                                    <Text style={styles.statusLabel}>睡眠</Text>
                                    <Text style={styles.statusValue}>{health.lastSleepDurationHours.toFixed(1)}h</Text>
                                    <Text style={styles.statusUnit}>{health.sleepQuality}</Text>
                                </View>
                                <View style={styles.statusGridItem}>
                                    <Text style={styles.statusLabel}>光线</Text>
                                    <Text style={styles.statusValue}>{health.lightLux}</Text>
                                    <Text style={styles.statusUnit}>lux</Text>
                                </View>
                            </View>
                            {health.isPostWorkout && (
                                <Text style={styles.countdownText}>
                                    运动后状态 {health.getRemainingTimeFormatted()}
                                </Text>
                            )}
                        </View>

                        {/* 心率控制 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>心率 (bpm)</Text>
                            <View style={styles.presetRow}>
                                {heartRatePresets.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.value}
                                        style={[
                                            styles.presetBtn,
                                            health.heartRate === preset.value && styles.presetBtnActive,
                                            { borderColor: preset.color },
                                        ]}
                                        onPress={() => health.setSimulatedHeartRate(preset.value)}
                                    >
                                        <Text style={[
                                            styles.presetBtnText,
                                            health.heartRate === preset.value && { color: preset.color },
                                        ]}>
                                            {preset.value}
                                        </Text>
                                        <Text style={styles.presetLabel}>{preset.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 步数控制 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>今日步数</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.input}
                                    value={stepsInput}
                                    onChangeText={handleStepsChange}
                                    keyboardType="numeric"
                                    placeholder="输入步数"
                                />
                                <TouchableOpacity
                                    style={styles.quickBtn}
                                    onPress={() => {
                                        setStepsInput('12000');
                                        health.setSimulatedSteps(12000);
                                    }}
                                >
                                    <Text style={styles.quickBtnText}>12000步</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 活动状态 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>活动状态</Text>
                            <View style={styles.activityRow}>
                                {activityOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.activityBtn,
                                            health.activityStatus === option.value && styles.activityBtnActive,
                                        ]}
                                        onPress={() => health.setSimulatedActivityStatus(option.value)}
                                    >
                                        <Text style={styles.activityIcon}>{option.icon}</Text>
                                        <Text style={[
                                            styles.activityLabel,
                                            health.activityStatus === option.value && styles.activityLabelActive,
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 压力值控制 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>压力值 (1-100)</Text>
                            <View style={styles.presetRow}>
                                {pressurePresets.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.value}
                                        style={[
                                            styles.presetBtn,
                                            health.pressureValue === preset.value && styles.presetBtnActive,
                                            { borderColor: preset.color },
                                        ]}
                                        onPress={() => {
                                            health.setSimulatedPressure(preset.value);
                                            setPressureInput(String(preset.value));
                                        }}
                                    >
                                        <Text style={[
                                            styles.presetBtnText,
                                            health.pressureValue === preset.value && { color: preset.color },
                                        ]}>
                                            {preset.value}
                                        </Text>
                                        <Text style={styles.presetLabel}>{preset.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={[styles.inputRow, { marginTop: 8 }]}>
                                <TextInput
                                    style={styles.input}
                                    value={pressureInput}
                                    onChangeText={handlePressureChange}
                                    keyboardType="numeric"
                                    placeholder="输入压力值 (1-100)"
                                />
                            </View>
                        </View>

                        {/* 血氧控制 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>血氧 (%)</Text>
                            <View style={styles.presetRow}>
                                {bloodOxygenPresets.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.value}
                                        style={[
                                            styles.presetBtn,
                                            health.bloodOxygen === preset.value && styles.presetBtnActive,
                                            { borderColor: preset.color },
                                        ]}
                                        onPress={() => {
                                            health.setSimulatedBloodOxygen(preset.value);
                                            setBloodOxygenInput(String(preset.value));
                                        }}
                                    >
                                        <Text style={[
                                            styles.presetBtnText,
                                            health.bloodOxygen === preset.value && { color: preset.color },
                                        ]}>
                                            {preset.value}%
                                        </Text>
                                        <Text style={styles.presetLabel}>{preset.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 睡眠数据控制 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>睡眠数据（昨晚）</Text>
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>评分</Text>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={sleepScoreInput}
                                        onChangeText={handleSleepScoreChange}
                                        keyboardType="numeric"
                                        placeholder="0-100"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>时长(分)</Text>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={sleepDurationInput}
                                        onChangeText={handleSleepDurationChange}
                                        keyboardType="numeric"
                                        placeholder="分钟"
                                    />
                                </View>
                            </View>
                            <View style={[styles.presetRow, { marginTop: 8 }]}>
                                <TouchableOpacity
                                    style={styles.sleepPresetBtn}
                                    onPress={() => {
                                        health.setSimulatedSleepScore(92);
                                        health.setSimulatedSleepDuration(480);
                                        setSleepScoreInput('92');
                                        setSleepDurationInput('480');
                                    }}
                                >
                                    <Text style={styles.sleepPresetText}>😊 优秀睡眠 (8h)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.sleepPresetBtn}
                                    onPress={() => {
                                        health.setSimulatedSleepScore(45);
                                        health.setSimulatedSleepDuration(240);
                                        setSleepScoreInput('45');
                                        setSleepDurationInput('240');
                                    }}
                                >
                                    <Text style={styles.sleepPresetText}>😫 睡眠不足 (4h)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 环境光线控制 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>环境光线 (lux)</Text>
                            <View style={styles.presetRow}>
                                {lightPresets.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.value}
                                        style={[
                                            styles.presetBtn,
                                            health.lightLux === preset.value && styles.presetBtnActive,
                                            { borderColor: preset.color },
                                        ]}
                                        onPress={() => {
                                            health.setSimulatedLightLux(preset.value);
                                            setLuxInput(String(preset.value));
                                        }}
                                    >
                                        <Text style={[
                                            styles.presetBtnText,
                                            health.lightLux === preset.value && { color: preset.color },
                                        ]}>
                                            {preset.icon}
                                        </Text>
                                        <Text style={styles.presetLabel}>{preset.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={[styles.inputRow, { marginTop: 8 }]}>
                                <TextInput
                                    style={styles.input}
                                    value={luxInput}
                                    onChangeText={handleLuxChange}
                                    keyboardType="numeric"
                                    placeholder="输入 lux 值 (0-50000)"
                                />
                            </View>
                        </View>

                        {/* 分割线 */}
                        <View style={styles.divider} />

                        {/* 一键模拟场景 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>一键模拟场景</Text>
                            <View style={styles.scenarioGrid}>
                                <TouchableOpacity
                                    style={[styles.scenarioBtn, { backgroundColor: colors.backgroundSection }]}
                                    onPress={health.simulateJustFinishedWorkout}
                                >
                                    <Text style={styles.scenarioText}>刚跑完步</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.scenarioBtn, { backgroundColor: colors.backgroundSection }]}
                                    onPress={health.simulateGoodSleep}
                                >
                                    <Text style={styles.scenarioText}>睡眠充足</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.scenarioBtn, { backgroundColor: colors.backgroundSection }]}
                                    onPress={health.simulateHighStress}
                                >
                                    <Text style={styles.scenarioText}>高压力</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.scenarioBtn, { backgroundColor: colors.backgroundSection }]}
                                    onPress={health.simulateLowBloodOxygen}
                                >
                                    <Text style={styles.scenarioText}>低血氧</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 分割线 */}
                        <View style={styles.divider} />

                        {/* 操作按钮 */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.secondaryBtn]}
                                onPress={health.resetAllStates}
                            >
                                <Text style={[styles.actionBtnText, styles.secondaryBtnText]}>
                                    重置状态
                                </Text>
                            </TouchableOpacity>

                            {health.isOppoHealthAuthorized && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.primaryBtn]}
                                    onPress={health.refreshOppoHealthData}
                                >
                                    <Text style={styles.actionBtnText}>🔃 刷新数据</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* 传感器状态 */}
                        <View style={styles.sensorStatus}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name={health.isLightSensorAvailable ? 'sun' : 'sun'} size={14} color={health.isLightSensorAvailable ? colors.success : colors.textTertiary} />
                                <Text style={[styles.sensorText, { marginLeft: 4 }]}>
                                    光线传感器{health.isLightSensorAvailable ? ' 已连接' : ' 未连接'}
                                </Text>
                            </View>
                            {health.lightSensorError && (
                                <Text style={styles.errorText}>{health.lightSensorError}</Text>
                            )}
                        </View>
                    </ScrollView>

                    {/* 底部按钮 */}
                    <TouchableOpacity style={styles.bottomCloseBtn} onPress={() => {
                        onRefreshRecommendations?.();
                        onClose();
                    }}>
                        <Text style={styles.bottomCloseBtnText}>应用并刷新推荐</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// 开发者模式触发器（隐藏按钮）
export const DevModeTrigger: React.FC = () => {
    const [tapCount, setTapCount] = useState(0);
    const [visible, setVisible] = useState(false);

    const handleTap = () => {
        const newCount = tapCount + 1;
        setTapCount(newCount);

        if (newCount >= 5) {
            setVisible(true);
            setTapCount(0);
        }

        // 2秒后重置计数
        setTimeout(() => setTapCount(0), 2000);
    };

    return (
        <>
            <TouchableOpacity
                style={styles.trigger}
                onPress={handleTap}
                activeOpacity={1}
            >
                <Text style={styles.triggerText}>🍽️</Text>
            </TouchableOpacity>
            <DevModePanel visible={visible} onClose={() => setVisible(false)} />
        </>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.xl,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    closeBtn: {
        padding: spacing.sm,
    },
    closeBtnText: {
        fontSize: fontSize.xl,
        color: colors.textTertiary,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowIcon: {
        fontSize: fontSize.xl,
        marginRight: spacing.sm,
    },
    rowLabel: {
        fontSize: fontSize.lg,
        color: colors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: spacing.md,
    },
    sdkStatusBox: {
        backgroundColor: colors.infoBg,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    sdkStatusTitle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        fontWeight: fontWeight.semibold,
    },
    sdkStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    sdkStatusItem: {
        fontSize: fontSize.sm,
        color: colors.textPrimary,
    },
    authBtn: {
        marginTop: spacing.md,
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        alignSelf: 'center',
        ...shadows.sm,
    },
    authBtnText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
    },
    statusBox: {
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    statusTitle: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        fontWeight: fontWeight.semibold,
    },
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statusGridItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    statusIcon: {
        fontSize: fontSize.xl,
    },
    statusLabel: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        fontWeight: fontWeight.bold,
    },
    statusValue: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    statusUnit: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
    },
    countdownText: {
        fontSize: fontSize.sm,
        color: colors.primary,
        textAlign: 'center',
        marginTop: spacing.sm,
        fontWeight: fontWeight.semibold,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    presetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    presetBtn: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 54,
        backgroundColor: colors.surface,
    },
    presetBtnActive: {
        backgroundColor: colors.primaryBg,
        borderColor: colors.primary,
    },
    presetBtnText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    presetLabel: {
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
    },
    quickBtn: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quickBtnText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    activityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    activityBtn: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activityBtnActive: {
        backgroundColor: colors.primaryBg,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    activityIcon: {
        fontSize: fontSize.xxl,
    },
    activityLabel: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    activityLabelActive: {
        color: colors.primary,
        fontWeight: fontWeight.semibold,
    },
    sleepPresetBtn: {
        flex: 1,
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        marginHorizontal: spacing.xs,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    sleepPresetText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    scenarioGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    scenarioBtn: {
        width: '47%',
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    scenarioIcon: {
        fontSize: fontSize.xxxl,
    },
    scenarioText: {
        fontSize: fontSize.sm,
        color: colors.textPrimary,
        marginTop: spacing.xs,
        fontWeight: fontWeight.medium,
    },
    actionRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        ...shadows.primary,
    },
    secondaryBtn: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionBtnText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.textOnPrimary,
    },
    secondaryBtnText: {
        color: colors.textSecondary,
    },
    sensorStatus: {
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    sensorText: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    errorText: {
        fontSize: fontSize.xs,
        color: colors.error,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    trigger: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        padding: spacing.xs,
        zIndex: 999,
    },
    triggerText: {
        fontSize: fontSize.xl,
        opacity: 0.3,
    },
    bottomCloseBtn: {
        backgroundColor: colors.backgroundSection,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        marginHorizontal: -spacing.xl,
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
    },
    bottomCloseBtnText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.textSecondary,
    },
});

export default DevModePanel;
