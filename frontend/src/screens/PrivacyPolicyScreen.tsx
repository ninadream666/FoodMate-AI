import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme/NordicTheme';

const PrivacyPolicyScreen = () => {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                <Text style={styles.title}>FoodMate AI隐私政策</Text>
                <Text style={styles.updateDate}>最后更新日期：2026年3月</Text>

                <Text style={styles.sectionTitle}>一、我们收集的信息</Text>
                <Text style={styles.paragraph}>
                    为了向您提供智能饮食推荐服务，我们可能会收集以下信息：
                </Text>
                <Text style={styles.listItem}>1. 账户信息：手机号、用户名、头像等注册信息。</Text>
                <Text style={styles.listItem}>2. 位置信息：用于搜索附近餐厅和计算配送距离，仅在您授权后获取。</Text>
                <Text style={styles.listItem}>3. 健康数据：心率、步数、睡眠、血氧、压力值等，来自可穿戴设备或手动输入，用于个性化营养推荐。所有健康数据仅在本地设备处理，不会上传至云端存储。</Text>
                <Text style={styles.listItem}>4. 环境数据：环境光线强度（通过设备光线传感器），用于自适应界面显示。</Text>
                <Text style={styles.listItem}>5. 订单数据：历史订单记录，用于优化推荐算法和提供订单服务。</Text>
                <Text style={styles.listItem}>6. 饮食偏好：您主动填写的口味偏好、过敏原、饮食限制等。</Text>

                <Text style={styles.sectionTitle}>二、我们如何使用信息</Text>
                <Text style={styles.listItem}>1. 基于位置提供附近餐厅搜索和配送服务。</Text>
                <Text style={styles.listItem}>2. 基于健康数据提供个性化饮食推荐（参考 ISSN、AHA、WHO 等国际营养标准）。</Text>
                <Text style={styles.listItem}>3. 基于天气和环境数据调整推荐策略（如高温推荐清凉食物，大雨优先近距离商家）。</Text>
                <Text style={styles.listItem}>4. 基于订单历史和偏好数据优化推荐算法。</Text>
                <Text style={styles.listItem}>5. 提供订单管理、配送追踪等核心服务功能。</Text>

                <Text style={styles.sectionTitle}>三、端云协同隐私保护</Text>
                <Text style={styles.paragraph}>
                    FoodMate AI 采用端云协同架构保护您的隐私：
                </Text>
                <Text style={styles.listItem}>1. 端侧处理：健康数据（心率、血氧、睡眠等）在您的设备本地完成分析，仅将脱敏后的饮食约束（如"避免冰冷食物"）发送至云端。</Text>
                <Text style={styles.listItem}>2. 云端处理：云端仅接收脱敏约束和位置信息，不存储原始健康数据。</Text>
                <Text style={styles.listItem}>3. 匿名推荐：端云协同模式下使用匿名用户标识，云端无法关联到您的真实身份。</Text>

                <Text style={styles.sectionTitle}>四、信息存储与安全</Text>
                <Text style={styles.listItem}>1. 健康数据仅存储在您的设备本地，不上传至服务器。</Text>
                <Text style={styles.listItem}>2. 账户和订单数据使用 JWT Token 加密传输，服务端采用加密存储。</Text>
                <Text style={styles.listItem}>3. 位置信息仅在请求推荐时实时使用，不做持久化存储。</Text>
                <Text style={styles.listItem}>4. 我们不会将您的个人信息出售、出租或以其他方式提供给第三方。</Text>

                <Text style={styles.sectionTitle}>五、您的权利</Text>
                <Text style={styles.listItem}>1. 访问权：您可以随时在个人中心查看和修改个人信息。</Text>
                <Text style={styles.listItem}>2. 删除权：您可以要求删除您的账户及所有关联数据。</Text>
                <Text style={styles.listItem}>3. 撤回授权：您可以随时在系统设置中关闭位置、传感器等权限。</Text>
                <Text style={styles.listItem}>4. 数据导出：您可以申请导出您的订单和偏好数据。</Text>

                <Text style={styles.sectionTitle}>六、第三方服务</Text>
                <Text style={styles.paragraph}>
                    本应用使用以下第三方服务，这些服务有各自的隐私政策：
                </Text>
                <Text style={styles.listItem}>1. 高德地图：提供位置定位和 POI 搜索服务。</Text>
                <Text style={styles.listItem}>2. 和风天气：提供实时天气数据。</Text>
                <Text style={styles.listItem}>3. OPPO 健康 SDK：读取可穿戴设备健康数据（需用户授权）。</Text>

                <Text style={styles.sectionTitle}>七、未成年人保护</Text>
                <Text style={styles.paragraph}>
                    我们非常重视对未成年人个人信息的保护。如果您是14周岁以下的未成年人，请在监护人的陪同下阅读本政策，并在征得监护人同意后使用我们的服务。
                </Text>

                <Text style={styles.sectionTitle}>八、政策更新</Text>
                <Text style={styles.paragraph}>
                    我们可能会不时更新本隐私政策。更新后的政策将在应用内发布，重大变更将通过应用内通知告知您。继续使用本应用即表示您同意更新后的隐私政策。
                </Text>

                <Text style={styles.sectionTitle}>九、联系我们</Text>
                <Text style={styles.paragraph}>
                    如您对本隐私政策有任何疑问或建议，请通过应用内反馈功能联系我们。
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>FoodMate AI 团队</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.xl,
        paddingBottom: spacing.xxxl,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    updateDate: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
        textAlign: 'center',
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.textPrimary,
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },
    paragraph: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: spacing.md,
    },
    listItem: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: spacing.sm,
        paddingLeft: spacing.sm,
    },
    footer: {
        marginTop: spacing.xxl,
        alignItems: 'center',
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    footerText: {
        fontSize: fontSize.sm,
        color: colors.textTertiary,
    },
});

export default PrivacyPolicyScreen;
