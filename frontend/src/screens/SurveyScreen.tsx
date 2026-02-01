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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff5ec' },
    content: { padding: 20, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1c130d', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#666' },
    progressContainer: { width: '100%', marginTop: 20 },
    stepText: { textAlign: 'right', fontSize: 12, color: '#666', marginBottom: 4 },
    progressBar: { height: 8, backgroundColor: '#fed7aa', borderRadius: 4 },
    progressFill: { width: '100%', height: '100%', backgroundColor: '#f97316', borderRadius: 4 },

    section: { marginBottom: 30 },
    question: { fontSize: 18, fontWeight: 'bold', color: '#1c130d', marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

    // Card Styles (Flavor)
    card: {
        width: '48%', aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12,
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent'
    },
    activeCard: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
    emoji: { fontSize: 32, marginBottom: 8 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    activeLabel: { color: '#f97316' },
    checkIcon: { position: 'absolute', top: 8, right: 8, color: '#f97316', fontWeight: 'bold' },

    // Chip Styles (Cuisine)
    chip: {
        width: '48%', flexDirection: 'row', alignItems: 'center', padding: 12,
        backgroundColor: '#fff', borderRadius: 8, marginBottom: 10
    },
    activeChip: { backgroundColor: '#ffedd5', borderWidth: 1, borderColor: '#f97316' },
    chipEmoji: { fontSize: 20, marginRight: 8 },
    chipLabel: { fontSize: 14, color: '#333' },
    activeChipLabel: { color: '#c2410c', fontWeight: 'bold' },

    // Tag Styles (Allergies)
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
    activeTag: { backgroundColor: '#f97316', borderColor: '#f97316' },
    tagText: { color: '#666' },
    activeTagText: { color: '#fff', fontWeight: 'bold' },
    input: { marginTop: 10, backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#fed7aa' },

    footer: { alignItems: 'center', marginTop: 10 },
    submitBtn: { width: '100%', height: 50, backgroundColor: '#f97316', borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#f97316', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    skipBtn: { marginTop: 16 },
    skipText: { color: '#999' },
});

export default SurveyScreen;