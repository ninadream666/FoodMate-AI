import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';
import { addressService } from '../services/addressService';

const AddressEditScreen = ({ navigation }: any) => {
    const [city, setCity] = useState('');
    const [street, setStreet] = useState('');
    const [detail, setDetail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!city.trim() || !street.trim()) {
            Alert.alert('提示', '请填写城市和街道信息');
            return;
        }

        setLoading(true);
        try {
            // 构造后端需要的参数
            const payload = {
                city,
                street,
                detail,
                // Web端逻辑：联系人和电话暂不传，由后端直接取当前用户
            };

            await addressService.addAddress(payload);
            Alert.alert('成功', '地址保存成功', [
                { text: '确定', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('保存失败', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>城市 <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="例如：北京市"
                        value={city}
                        onChangeText={setCity}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>街道/小区 <Text style={styles.required}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="例如：中关村大街1号"
                        value={street}
                        onChangeText={setStreet}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>门牌号/详细信息</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="例如：A座 101室 (选填)"
                        value={detail}
                        onChangeText={setDetail}
                    />
                </View>

                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveText}>保存地址</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.xl,
    },
    form: {
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    inputGroup: { marginBottom: spacing.xl },
    label: {
        fontSize: fontSize.md,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        fontWeight: fontWeight.semibold,
    },
    required: { color: colors.error },
    input: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontSize: fontSize.lg,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.md,
        ...shadows.primary,
    },
    saveText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
});

export default AddressEditScreen;