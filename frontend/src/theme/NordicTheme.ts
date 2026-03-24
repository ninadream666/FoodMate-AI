/**
 * NordicTheme.ts - 北欧风格主题配置
 *
 * 设计原则：
 * 1. 简约 + 质感：干净不是空白，节制中的细节表达
 * 2. 浅底渐变：温和的背景色过渡（米白到淡灰）
 * 3. 磨砂风格：毛玻璃效果的卡片
 * 4. 阴影只在可点元素上
 * 5. 分组留白区隔
 *
 * 参考：北欧简约风外卖App设计
 */

// 主色调 - 温暖柔和的北欧配色
export const colors = {
  // 主色 - 温暖的珊瑚橙/杏色系
  primary: '#E8734A',        // 主色-温暖珊瑚橙
  primaryLight: '#F5A07A',   // 浅杏色
  primaryDark: '#D45A32',    // 深橙色
  primaryBg: '#FFF8F5',      // 极浅暖橙背景（磨砂底色）

  // 辅助色 - 柔和的北欧绿
  secondary: '#5B9A6F',      // 柔和绿色（成功/健康）
  secondaryLight: '#A8D5BA',
  accent: '#6B8CAE',         // 柔和蓝灰色（强调）

  // 中性色 - 北欧风格的暖灰调
  white: '#FFFFFF',
  background: '#FAF9F7',     // 主背景（温暖米白）
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#F5F3F0',  // 暖灰色渐变终点

  surface: '#FFFFFF',        // 卡片表面
  surfaceHover: '#FDFCFB',   // 悬停状态（微暖）
  surfaceFrosted: 'rgba(255, 255, 255, 0.92)', // 磨砂卡片表面

  border: '#EBE8E4',         // 边框色（暖灰）
  borderLight: '#F5F3F0',    // 浅边框
  divider: '#F0EDE9',        // 分隔线

  // 文字色 - 柔和的深色
  textPrimary: '#2D3339',    // 主要文字（柔和深灰）
  textSecondary: '#6B7280',  // 次要文字
  textTertiary: '#9CA3AF',   // 提示文字
  textDisabled: '#D1D5DB',   // 禁用文字
  textOnPrimary: '#FFFFFF',  // 主色上的文字

  // 状态色 - 柔和的北欧色调
  success: '#5B9A6F',
  successBg: '#E8F5EC',
  warning: '#E5A84B',
  warningBg: '#FDF6E8',
  error: '#D96054',
  errorBg: '#FDF0EF',
  info: '#6B8CAE',
  infoBg: '#EDF3F8',

  // 磨砂效果色 - 核心视觉效果
  frostedBg: 'rgba(255, 255, 255, 0.88)',
  frostedBgStrong: 'rgba(255, 255, 255, 0.95)',
  frostedBorder: 'rgba(235, 232, 228, 0.6)',
  overlay: 'rgba(45, 51, 57, 0.35)',

  // 卡片磨砂效果专用
  cardBg: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(0, 0, 0, 0.04)',
};

// 间距系统
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// 圆角
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// 字体大小
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  hero: 32,
};

// 字重
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// 阴影配置 - 只用于可点击元素（北欧极简风格，阴影柔和）
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // 极细阴影 - 用于列表项分隔
  xs: {
    shadowColor: '#2D3339',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 0.5,
  },
  // 小阴影 - 用于卡片悬浮
  sm: {
    shadowColor: '#2D3339',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  // 中等阴影 - 用于可点击卡片
  md: {
    shadowColor: '#2D3339',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  // 大阴影 - 用于浮层
  lg: {
    shadowColor: '#2D3339',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  // 超大阴影 - 用于模态框
  xl: {
    shadowColor: '#2D3339',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  // 主色阴影 - 用于主按钮（温暖的橙色光晕）
  primary: {
    shadowColor: '#E8734A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  // 磨砂卡片阴影 - 柔和扩散
  frosted: {
    shadowColor: '#2D3339',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  // 卡片阴影 - 仅可点击元素使用
  card: {
    shadowColor: '#2D3339',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
};

// 常用组件样式 - 北欧磨砂风格
export const componentStyles = {
  // 磨砂卡片样式 - 核心视觉元素
  frostedCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.frosted,
  },

  // 普通卡片样式（可点击时才有阴影）
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // 可点击卡片（带阴影）
  cardTouchable: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },

  // 圆形图标按钮
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },

  // 主按钮 - 温暖的主色
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadows.primary,
  },

  // 输入框 - 磨砂效果
  input: {
    backgroundColor: colors.surfaceFrosted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },

  // 分组容器 - 留白区隔
  sectionContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // 底部导航
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },

  // 列表项容器（无阴影，通过边框分隔）
  listItem: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
};

// 类别圆形图标样式（Popular Category）
export const categoryStyles = {
  container: {
    alignItems: 'center' as const,
    marginRight: spacing.lg,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceFrosted,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconWrapperActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
};

// 磨砂列表项样式
export const frostedListItem = {
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  containerTouchable: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
};

// 导出默认主题
const NordicTheme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  componentStyles,
  categoryStyles,
  frostedListItem,
};

export default NordicTheme;
