import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { profileService } from '../services/profileService';

const SurveyScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(false);
    const [flavor, setFlavor] = useState('');
    const [cuisines, setCuisines] = useState<string[]>([]);
    const [allergies, setAllergies] = useState<string[]>([]);
    const [otherAllergy, setOtherAllergy] = useState('');
    const [showOtherInput, setShowOtherInput] = useState(false);

    // 选项配置
    const FLAVOR_OPTIONS = [
        { label: '无辣不欢', emoji: '🌶️', id: 'spicy' },
        { label: '清淡养生', emoji: '🥗', id: 'light' },
        { label: '酸甜可口', emoji: '🍅', id: 'sour_sweet' },
        { label: '咸香浓郁', emoji: '🥩', id: 'salty' },
    ];

    const CUISINE_OPTIONS = [
        { label: '川湘菜', emoji: '🌶️', id: 'sichuan' },
        { label: '粤菜点心', emoji: '🥟', id: 'cantonese' },
        { label: '日韩料理', emoji: '🍣', id: 'japanese' },
        { label: '西式快餐', emoji: '🍔', id: 'western' },
        { label: '轻食沙拉', emoji: '🥗', id: 'salad' },
        { label: '地方小吃', emoji: '🍜', id: 'snacks' },
    ];

    const ALLERGY_OPTIONS = ['不吃香菜', '不吃葱蒜', '海鲜过敏', '花生过敏', '无'];

    // 多选切换逻辑
    const toggleSelection = (list: string[], setList: Function, item: string) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 合并“其他”忌口
            let finalAllergies = [...allergies];
            if (showOtherInput && otherAllergy.trim()) {
                finalAllergies.push(otherAllergy.trim());
            }

            const profileData = {
                preferences: { taste: flavor },
                tags: cuisines,
                allergies: finalAllergies,
            };

            await profileService.updateProfile(profileData);
            Alert.alert('设置成功', 'AI 推荐引擎已根据您的喜好初始化！', [
                { text: '开启美食之旅', onPress: () => navigation.replace('Home') }
            ]);
        } catch (error) {
            Alert.alert('保存失败', '请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* 头部进度 */}
            <View style={styles.header}>
                <Text style={styles.title}>定制您的专属美味</Text>
                <Text style={styles.subtitle}>花 10 秒钟告诉 AI 您的口味偏好</Text>
                <View style={styles.progressContainer}>
                    <Text style={styles.stepText}>Step 1/1</Text>
                    <View style={styles.progressBar}>
                        <View style={styles.progressFill} />
                    </View>
                </View>
            </View>

            {/* Q1: 口味 (单选) */}
            <View style={styles.section}>
                <Text style={styles.question}>1. 您平时喜欢的口味倾向？(单选)</Text>
                <View style={styles.grid}>
                    {FLAVOR_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.id}
                            style={[styles.card, flavor === opt.id && styles.activeCard]}
                            onPress={() => setFlavor(opt.id)}
                        >
                            <Text style={styles.emoji}>{opt.emoji}</Text>
                            <Text style={[styles.label, flavor === opt.id && styles.activeLabel]}>{opt.label}</Text>
                            {flavor === opt.id && <Text style={styles.checkIcon}>✓</Text>}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Q2: 菜系 (多选) */}
            <View style={styles.section}>
                <Text style={styles.question}>2. 您偏好的菜系？(多选)</Text>
                <View style={styles.grid}>
                    {CUISINE_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt.id}
                            style={[styles.chip, cuisines.includes(opt.id) && styles.activeChip]}
                            onPress={() => toggleSelection(cuisines, setCuisines, opt.id)}
                        >
                            <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                            <Text style={[styles.chipLabel, cuisines.includes(opt.id) && styles.activeChipLabel]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Q3: 忌口 (多选) */}
            <View style={styles.section}>
                <Text style={styles.question}>3. 有什么忌口吗？</Text>
                <View style={styles.tagContainer}>
                    {ALLERGY_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.tag, allergies.includes(opt) && styles.activeTag]}
                            onPress={() => {
                                if (opt === '无') {
                                    setAllergies(['无']);
                                    setShowOtherInput(false);
                                } else {
                                    const newList = allergies.filter(i => i !== '无');
                                    toggleSelection(newList, setAllergies, opt);
                                }
                            }}
                        >
                            <Text style={[styles.tagText, allergies.includes(opt) && styles.activeTagText]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={[styles.tag, showOtherInput && styles.activeTag]}
                        onPress={() => setShowOtherInput(!showOtherInput)}
                    >
                        <Text style={[styles.tagText, showOtherInput && styles.activeTagText]}>其他</Text>
                    </TouchableOpacity>
                </View>

                {showOtherInput && (
                    <TextInput
                        style={styles.input}
                        placeholder="请输入其他忌口，如：芒果..."
                        value={otherAllergy}
                        onChangeText={setOtherAllergy}
                    />
                )}
            </View>

            {/* 底部按钮 */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>开启美食之旅</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.replace('Home')} style={styles.skipBtn}>
                    <Text style={styles.skipText}>跳过 (稍后设置)</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

// 北欧风主题
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../theme/NordicTheme';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.xl,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },
    title: {
        fontSize: fontSize.title,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    progressContainer: {
        width: '100%',
        marginTop: spacing.xl,
    },
    stepText: {
        textAlign: 'right',
        fontSize: fontSize.xs,
        color: colors.textTertiary,
        marginBottom: spacing.xs,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.primaryBg,
        borderRadius: borderRadius.sm,
    },
    progressFill: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
    },

    section: { marginBottom: spacing.xxxl },
    question: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },

    // Card Styles (Flavor) - 北欧磨砂风格
    card: {
        width: '48%',
        aspectRatio: 1,
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.cardBorder,
    },
    activeCard: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryBg,
        ...shadows.sm,
    },
    emoji: { fontSize: 32, marginBottom: spacing.sm },
    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
    },
    activeLabel: { color: colors.primary },
    checkIcon: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },

    // Chip Styles (Cuisine) - 北欧风格
    chip: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.cardBg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    activeChip: {
        backgroundColor: colors.primaryBg,
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    chipEmoji: { fontSize: 20, marginRight: spacing.sm },
    chipLabel: {
        fontSize: fontSize.sm,
        color: colors.textPrimary,
    },
    activeChipLabel: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },

    // Tag Styles (Allergies) - 北欧胶囊风格
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    tag: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    activeTag: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        ...shadows.sm,
    },
    tagText: {
        color: colors.textSecondary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
    activeTagText: {
        color: colors.textOnPrimary,
        fontWeight: fontWeight.bold,
    },
    input: {
        marginTop: spacing.md,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        fontSize: fontSize.md,
        color: colors.textPrimary,
    },

    footer: {
        alignItems: 'center',
        marginTop: spacing.md,
    },
    submitBtn: {
        width: '100%',
        height: 54,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.primary,
    },
    submitText: {
        color: colors.textOnPrimary,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    skipBtn: { marginTop: spacing.lg },
    skipText: {
        color: colors.textTertiary,
        fontSize: fontSize.sm,
    },
});

export default SurveyScreen;