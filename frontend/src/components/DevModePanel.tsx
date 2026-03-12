/**
 * DevModePanel.tsx - 开发者调试面板
 * 
 * 功能：
 * 1. 开发者模式开关
 * 2. 心率滑动条 (60-180 bpm)
 * 3. 步数输入
 * 4. 活动状态选择
 * 5. 环境光线模拟（预设按钮 + lux输入）
 * 6. 一键模拟“刚跑完步”
 * 7. 重置状态按钮
 * 8. 剩余时间倒计时
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
    Animated,
} from 'react-native';
import { useHealthContext, ActivityStatus } from '../hooks/useHealthContext';
import { lightLevelIcon, lightLevelLabel } from '../hooks/useAmbientLight';

interface DevModePanelProps {
    visible: boolean;
    onClose: () => void;
}

const DevModePanel: React.FC<DevModePanelProps> = ({ visible, onClose }) => {
    const health = useHealthContext();
    const [stepsInput, setStepsInput] = useState(String(health.dailySteps));
    const [luxInput, setLuxInput] = useState(String(health.lightLux));

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
                        <Text style={styles.headerTitle}>🛠️ 开发者模式</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 开发者模式开关 */}
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Text style={styles.rowIcon}>🔧</Text>
                            <Text style={styles.rowLabel}>启用模拟数据</Text>
                        </View>
                        <Switch
                            value={health.isDevMode}
                            onValueChange={health.setDevMode}
                            trackColor={{ false: '#ddd', true: '#e85a2d' }}
                            thumbColor={health.isDevMode ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    {/* 分割线 */}
                    <View style={styles.divider} />

                    {/* 当前状态显示 */}
                    <View style={styles.statusBox}>
                        <Text style={styles.statusTitle}>当前模拟状态</Text>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusItem}>❤️ {health.heartRate} bpm</Text>
                            <Text style={styles.statusItem}>👟 {health.dailySteps} 步</Text>
                            <Text style={styles.statusItem}>
                                {health.isPostWorkout ? '🏃 运动后' : '🧘 正常'}
                            </Text>
                        </View>
                        <View style={[styles.statusRow, { marginTop: 6 }]}>
                            <Text style={styles.statusItem}>
                                {lightLevelIcon(health.lightLevel)} {lightLevelLabel(health.lightLevel)} ({health.lightLux} lux)
                            </Text>
                        </View>
                        {health.isPostWorkout && (
                            <Text style={styles.countdownText}>
                                ⏱️ 状态将在 {health.getRemainingTimeFormatted()} 后重置
                            </Text>
                        )}
                    </View>

                    {/* 心率控制 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>❤️ 心率 (bpm)</Text>
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
                        <Text style={styles.sectionTitle}>👟 今日步数</Text>
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
                        <Text style={styles.sectionTitle}>🎯 活动状态</Text>
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

                    {/* 环境光线控制 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💡 环境光线 (lux)</Text>
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
                                    <Text style={[styles.presetLabel, { fontSize: 9 }]}>{preset.value} lux</Text>
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
                            <Text style={{ fontSize: 12, color: '#999', marginLeft: 6 }}>lux</Text>
                        </View>
                    </View>

                    {/* 分割线 */}
                    <View style={styles.divider} />

                    {/* 快捷操作 */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.primaryBtn]}
                            onPress={health.simulateJustFinishedWorkout}
                        >
                            <Text style={styles.actionBtnText}>🏃 模拟刚跑完步</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.secondaryBtn]}
                            onPress={health.resetAllStates}
                        >
                            <Text style={[styles.actionBtnText, styles.secondaryBtnText]}>
                                🔄 重置状态
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 传感器状态 */}
                    <View style={styles.sensorStatus}>
                        <Text style={styles.sensorText}>
                            📱 传感器: 步数{health.isPedometerAvailable ? '✅' : '❌'} 光线{health.isLightSensorAvailable ? '✅' : '❌'}
                        </Text>
                        {health.pedometerError && (
                            <Text style={styles.errorText}>{health.pedometerError}</Text>
                        )}
                        {health.lightSensorError && (
                            <Text style={styles.errorText}>{health.lightSensorError}</Text>
                        )}
                    </View>
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeBtn: {
        padding: 8,
    },
    closeBtnText: {
        fontSize: 20,
        color: '#999',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    rowLabel: {
        fontSize: 16,
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },
    statusBox: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statusItem: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    countdownText: {
        fontSize: 12,
        color: '#e85a2d',
        textAlign: 'center',
        marginTop: 8,
        fontWeight: '600',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    presetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    presetBtn: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        minWidth: 58,
    },
    presetBtnActive: {
        backgroundColor: '#fff3e0',
    },
    presetBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    presetLabel: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    quickBtn: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
    },
    quickBtnText: {
        fontSize: 14,
        color: '#666',
    },
    activityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    activityBtn: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
    },
    activityBtnActive: {
        backgroundColor: '#fff3e0',
        borderWidth: 1,
        borderColor: '#e85a2d',
    },
    activityIcon: {
        fontSize: 24,
    },
    activityLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    activityLabelActive: {
        color: '#e85a2d',
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    primaryBtn: {
        backgroundColor: '#e85a2d',
    },
    secondaryBtn: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    secondaryBtnText: {
        color: '#666',
    },
    sensorStatus: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    sensorText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 11,
        color: '#dc3545',
        textAlign: 'center',
        marginTop: 4,
    },
    trigger: {
        position: 'absolute',
        top: 10,
        left: 10,
        padding: 5,
        zIndex: 999,
    },
    triggerText: {
        fontSize: 20,
        opacity: 0.3,
    },
});

export default DevModePanel;
