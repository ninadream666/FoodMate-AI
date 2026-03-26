/**
 * NordicTheme.ts - 北欧风格主题配置
 *
 * 设计原则（参考三张参考图）：
 * 1. 简约 + 质感：干净不是空白，节制中的细节表达
 * 2. 浅底渐变：温和的背景色过渡（奶白到淡灰）
 * 3. 磨砂风格：毛玻璃效果的卡片（ClipRRect / Container 风格）
 * 4. 阴影只在可点元素上，列表以分组留白区隔
 * 5. 底部导航轻而稳：图+文组合，选中态主色填充
 * 6. 北欧风 ≠ 冷淡风：语音搜索、配送时间等细节体现人情味
 *
 * 配色参考：Image1（温暖珊瑚橙北欧外卖App）
 * 渐变/阴影参考：Image2（浅底渐变，阴影只在可点元素）
 * 卡片风格参考：Image3（磨砂风格卡片，圆角图片）
 */

// ============================================================
// 主色调 - 温暖柔和的北欧配色（参考 Image1）
// ============================================================
export const colors = {
  // 主色 - 温暖的珊瑚橙/杏色系（Image1 主按钮/强调色）
  primary: '#F2784B',           // 主色-柔和珊瑚橙（比原来更温暖、饱和度稍低）
  primaryLight: '#F9A882',      // 浅杏色（hover / 浅背景）
  primaryDark: '#D9613A',       // 深橙色（pressed 状态）
  primaryBg: '#FFF6F2',         // 极浅暖橙背景（磨砂底色 / 选中类别底）
  primarySoft: '#FDEEE8',       // 柔和橙底（tag / badge 底色）

  // 辅助色 - 柔和的北欧绿（健康/成功语义）
  secondary: '#5DA97A',         // 柔和森林绿
  secondaryLight: '#B5DDCA',    // 极浅绿
  accent: '#7BA3C4',            // 柔和天空蓝（信息/链接）

  // 中性色 - 北欧风格的暖灰调（参考 Image2 浅底渐变）
  white: '#FFFFFF',
  background: '#FAFAF8',        // 主背景（微暖奶白——不纯白，有质感）
  backgroundGradientStart: '#FFFFFF',       // 渐变起点：纯白
  backgroundGradientEnd: '#F4F2EE',         // 渐变终点：暖灰米色
  backgroundSection: '#F7F6F3',             // 分组区域底色（留白区隔用）

  surface: '#FFFFFF',           // 卡片表面（纯白）
  surfaceHover: '#FDFCFB',      // 悬停态（微暖）
  surfaceFrosted: 'rgba(255, 255, 255, 0.92)', // 磨砂卡片表面（Image3）

  border: '#EDE9E3',            // 边框色（暖灰，比原来更柔和）
  borderLight: '#F5F2ED',       // 浅边框
  divider: '#F2EFEA',           // 分隔线（几乎不可见的柔和分隔）

  // 文字色 - 柔和但清晰
  textPrimary: '#2C3038',       // 主要文字（暖深灰，不纯黑）
  textSecondary: '#6E7581',     // 次要文字
  textTertiary: '#A0A7B0',      // 提示文字 / 辅助信息
  textDisabled: '#CDD1D6',      // 禁用文字
  textOnPrimary: '#FFFFFF',     // 主色上的文字（纯白）

  // 状态色 - 柔和的北欧色调
  success: '#5DA97A',
  successBg: '#EDF7F1',
  warning: '#E5A84B',
  warningBg: '#FDF6E8',
  error: '#D96054',
  errorBg: '#FDF0EF',
  info: '#7BA3C4',
  infoBg: '#EEF4FA',

  // 磨砂效果色 - 核心视觉效果（Image3 卡片风格）
  frostedBg: 'rgba(255, 255, 255, 0.85)',
  frostedBgStrong: 'rgba(255, 255, 255, 0.94)',
  frostedBorder: 'rgba(0, 0, 0, 0.05)',
  overlay: 'rgba(44, 48, 56, 0.3)',

  // 卡片磨砂效果专用
  cardBg: 'rgba(255, 255, 255, 0.88)',
  cardBorder: 'rgba(0, 0, 0, 0.04)',
  cardBgSolid: '#FFFFFF',      // 不需要半透明时的纯白卡片底

  // 标签/徽章专用柔和底色
  tagBg: '#F3F1ED',
  tagBgActive: '#FFF6F2',
};

// ============================================================
// 间距系统（8pt 网格，留白区隔）
// ============================================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 28,   // 分组间距（Image2 列表以分组留白区隔）
};

// ============================================================
// 圆角（Image1 圆形按钮 + Image3 圆角卡片）
// ============================================================
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  full: 9999,
};

// ============================================================
// 字体大小
// ============================================================
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

// ============================================================
// 字重
// ============================================================
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================================
// 阴影配置 - 只用于可点击元素（Image2 核心原则）
// ============================================================
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // 极细阴影 - 仅用于极轻微的分层感
  xs: {
    shadowColor: '#2C3038',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 0.5,
  },
  // 小阴影 - 用于可点击卡片的默认态
  sm: {
    shadowColor: '#2C3038',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  // 中等阴影 - 用于可点击卡片的 hover / pressed 态
  md: {
    shadowColor: '#2C3038',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // 大阴影 - 用于浮层 / 弹窗
  lg: {
    shadowColor: '#2C3038',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  // 超大阴影 - 用于模态框
  xl: {
    shadowColor: '#2C3038',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  // 主色阴影 - 用于主按钮（温暖的橙色光晕）
  primary: {
    shadowColor: '#F2784B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  // 磨砂卡片阴影 - 柔和扩散（Image3）
  frosted: {
    shadowColor: '#2C3038',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  // 可点击卡片阴影（仅可点击元素使用！Image2 核心原则）
  card: {
    shadowColor: '#2C3038',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
};

// ============================================================
// 常用组件样式 - 北欧磨砂风格
// ============================================================
export const componentStyles = {
  // 磨砂卡片样式 - 核心视觉元素（Image3）
  frostedCard: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.frosted,
  },

  // 普通卡片样式（不可点击时无阴影 —— Image2 原则）
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // 可点击卡片（带阴影 —— Image2 原则）
  cardTouchable: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },

  // 圆形图标按钮（Image1 Popular Category 圆形按钮）
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

  // 主按钮 - 温暖珊瑚橙（Image1 CTA 按钮风格）
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xxl,
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

  // 分组容器 - 留白区隔（Image2）
  sectionContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.section,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  // 底部导航（Image1：轻而稳，图+文）
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },

  // 列表项容器（无阴影，通过留白分隔 —— Image2）
  listItem: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
};

// ============================================================
// 类别圆形图标样式（Image1 Popular Category 模块）
// ============================================================
export const categoryStyles = {
  container: {
    alignItems: 'center' as const,
    marginRight: spacing.lg,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSection,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  iconWrapperActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primaryLight,
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

// ============================================================
// 磨砂列表项样式（Image3 卡片风格）
// ============================================================
export const frostedListItem = {
  // 不可点击的列表项（无阴影）
  container: {
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  // 可点击的列表项（有阴影 —— Image2）
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

// ============================================================
// 导出默认主题
// ============================================================
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
