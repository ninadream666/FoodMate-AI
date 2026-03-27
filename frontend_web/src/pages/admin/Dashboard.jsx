import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../services/admin/dashboardService.js';
import { runApiDiagnostic } from '../../utils/apiDiagnostic.js';

// 加载调试工具
if (typeof window !== 'undefined') {
    import('../../utils/statsDebugger.js');
    import('../../utils/fieldMapper.js');
}

// 统计指标卡片组件 (北欧风重构版)
const KpiCard = ({ title, value, icon, trend, isUp = true, colorClass, onClick }) => (
    <div
        className="bg-surface rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-card transition-all cursor-pointer group"
        onClick={onClick}
    >
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm font-bold text-text-secondary">{title}</p>
                <h3 className="text-2xl font-extrabold text-text-primary mt-1 tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${colorClass}`}>
                <span className="material-symbols-outlined text-[28px]">{icon}</span>
            </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
            <span className={`flex items-center font-bold px-2 py-0.5 rounded-md ${isUp
                ? "text-success bg-success-bg"
                : "text-error bg-error-bg"
                }`}>
                <span className="material-symbols-outlined text-[14px] mr-1">
                    {isUp ? "trending_up" : "trending_down"}
                </span>
                {trend}
            </span>
            <span className="text-text-tertiary font-medium">较昨日</span>
        </div>
    </div>
);

// 商家行组件 (北欧风重构版)
const MerchantRow = ({ id, name, category, date, status, statusClass, avatar, onViewDetails }) => (
    <tr className="hover:bg-surface-hover transition-colors border-b border-divider last:border-b-0">
        {/* 修复：第一列贴合左侧 */}
        <td className="px-6 py-4 font-bold text-text-primary text-left">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-background-section border border-border-light overflow-hidden flex-shrink-0">
                    {avatar ? (
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-text-tertiary text-[20px]">store</span>
                        </div>
                    )}
                </div>
                {name}
            </div>
        </td>
        {/* 其他列居中对齐 */}
        <td className="px-6 py-4 text-sm text-text-secondary font-medium text-center">{category}</td>
        <td className="px-6 py-4 text-sm text-text-secondary font-medium text-center">{date}</td>
        <td className="px-6 py-4 text-center">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${statusClass}`}>
                {status}
            </span>
        </td>
        <td className="px-6 py-4 text-center text-sm">
            <button
                onClick={() => onViewDetails(id)}
                className="text-primary font-bold hover:opacity-80 transition-colors"
            >
                查看详情
            </button>
        </td>
    </tr>
);

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [diagnosing, setDiagnosing] = useState(false);
    const [timeFilter, setTimeFilter] = useState('today'); // 时间筛选状态
    
    const [dashboardData, setDashboardData] = useState(null);
    const [kpiData, setKpiData] = useState({
        totalSales: { amount: 0, trend: '0%', isUp: true },
        newUsers: { count: 0, trend: '0%', isUp: true },
        activeMerchants: { count: 0, trend: '0%', isUp: true },
        todayOrders: { count: 0, trend: '0%', isUp: true }
    });
    const [latestMerchants, setLatestMerchants] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // 获取数据
    useEffect(() => {
        // 检查是否有 token，没有则不发起请求
        const token = localStorage.getItem('adminToken');
        console.log('🔐 Dashboard认证检查:', {
            hasToken: !!token,
            tokenLength: token?.length,
            tokenStart: token?.substring(0, 20)
        });

        if (!token) {
            console.log('ℹ️ 未找到admin token，跳过仪表盘数据获取');
            return;
        }

        const fetchDashboardData = async () => {
            setLoading(true);
            console.log(`📈 开始获取仪表盘数据 (筛选: ${timeFilter})...`);

            try {
                // 获取仪表盘概览数据
                console.log('🔄 获取仪表盘概览数据...');
                const overview = await dashboardService.getDashboardOverview();
                console.log('✅ 仪表盘概览数据获取成功:', overview);
                console.log('🔍 数据详细分析:', {
                    totalRevenue: overview.totalRevenue,
                    totalSales: overview.totalSales,
                    totalUserCount: overview.totalUserCount,
                    userCount: overview.userCount,
                    activeMerchantCount: overview.activeMerchantCount,
                    totalMerchantCount: overview.totalMerchantCount,
                    merchantCount: overview.merchantCount,
                    todayOrderCount: overview.todayOrderCount,
                    orderCount: overview.orderCount,
                    所有字段: Object.keys(overview),
                    非零字段: Object.entries(overview).filter(([k, v]) => v !== 0 && v !== null && v !== undefined)
                });
                setDashboardData(overview);

                // 从概览数据中提取 KPI
                const newKpiData = {
                    totalSales: {
                        amount: overview.totalRevenue || overview.totalSales || overview.revenue || 0,
                        trend: `${overview.orderGrowthRate >= 0 ? '+' : ''}${(overview.orderGrowthRate || 0).toFixed(1)}%`,
                        isUp: (overview.orderGrowthRate || 0) >= 0
                    },
                    newUsers: {
                        count: overview.totalUserCount || overview.userCount || overview.totalCount || 0,
                        trend: `${overview.userGrowthRate >= 0 ? '+' : ''}${(overview.userGrowthRate || 0).toFixed(1)}%`,
                        isUp: (overview.userGrowthRate || 0) >= 0
                    },
                    activeMerchants: {
                        count: overview.activeMerchantCount || overview.totalMerchantCount || overview.merchantCount || overview.activeCount || overview.totalCount || 0,
                        trend: `${overview.merchantGrowthRate >= 0 ? '+' : ''}${(overview.merchantGrowthRate || 0).toFixed(1)}%`,
                        isUp: (overview.merchantGrowthRate || 0) >= 0
                    },
                    todayOrders: {
                        count: overview.todayOrderCount || overview.orderCount || overview.totalOrderCount || overview.totalCount || 0,
                        trend: `${overview.orderGrowthRate >= 0 ? '+' : ''}${(overview.orderGrowthRate || 0).toFixed(1)}%`,
                        isUp: (overview.orderGrowthRate || 0) >= 0
                    }
                };

                console.log('📊 解析后的KPI数据:', newKpiData);
                setKpiData(newKpiData);

                // 从概览数据中提取最新商家
                if (overview.topMerchants && overview.topMerchants.length > 0) {
                    const merchants = overview.topMerchants.map(m => ({
                        id: m.merchantId || m.id,
                        name: m.merchantName || m.name,
                        category: m.category || '餐饮',
                        registeredAt: m.registeredAt || '最近',
                        status: m.status || 'ACTIVE',
                        revenue: m.revenue || 0
                    }));
                    console.log('🏪 提取的商家数据:', merchants);
                    setLatestMerchants(merchants);
                } else {
                    console.warn('⚠️ 未找到商家数据');
                }

                // 获取系统通知
                try {
                    console.log('🔔 获取系统通知...');
                    const notificationsResponse = await dashboardService.getSystemNotifications();
                    console.log('✅ 系统通知获取成功:', notificationsResponse);
                    setNotifications(notificationsResponse);
                } catch (e) {
                    console.warn('⚠️ 系统通知获取失败:', e);
                    setNotifications([]);
                }
            } catch (error) {
                console.error('获取仪表盘数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [timeFilter]); // 当时间筛选改变时重新请求

    // 手动刷新数据
    const refreshDashboardData = async () => {
        console.log('🔄 手动刷新仪表盘数据...');
        setLoading(true);
        try {
            const overview = await dashboardService.getDashboardOverview();
            console.log('✅ 手动刷新成功:', overview);
            setDashboardData(overview);

            const newKpiData = {
                totalSales: {
                    amount: overview.totalRevenue || overview.totalSales || 0,
                    trend: `${overview.orderGrowthRate >= 0 ? '+' : ''}${(overview.orderGrowthRate || 0).toFixed(1)}%`,
                    isUp: (overview.orderGrowthRate || 0) >= 0
                },
                newUsers: {
                    count: overview.totalUserCount || overview.userCount || 0,
                    trend: `${overview.userGrowthRate >= 0 ? '+' : ''}${(overview.userGrowthRate || 0).toFixed(1)}%`,
                    isUp: (overview.userGrowthRate || 0) >= 0
                },
                activeMerchants: {
                    count: overview.activeMerchantCount || overview.totalMerchantCount || overview.merchantCount || 0,
                    trend: `${overview.merchantGrowthRate >= 0 ? '+' : ''}${(overview.merchantGrowthRate || 0).toFixed(1)}%`,
                    isUp: (overview.merchantGrowthRate || 0) >= 0
                },
                todayOrders: {
                    count: overview.todayOrderCount || overview.orderCount || 0,
                    trend: `${overview.orderGrowthRate >= 0 ? '+' : ''}${(overview.orderGrowthRate || 0).toFixed(1)}%`,
                    isUp: (overview.orderGrowthRate || 0) >= 0
                }
            };
            setKpiData(newKpiData);
        } catch (error) {
            console.error('手动刷新失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 格式化数值
    const formatNumber = (num) => {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    };

    // 格式化金额
    const formatAmount = (amount) => {
        if (amount >= 10000) {
            return '¥' + (amount / 10000).toFixed(1) + '万';
        }
        return '¥' + amount.toLocaleString();
    };

    // 获取状态显示信息 (语义化颜色)
    const getStatusInfo = (status) => {
        switch (status) {
            case 'PENDING':
                return { text: '待审核', class: 'bg-warning-bg text-warning' };
            case 'ACTIVE':
                return { text: '正常', class: 'bg-success-bg text-success' };
            case 'REJECTED':
                return { text: '已拒绝', class: 'bg-error-bg text-error' };
            default:
                return { text: status, class: 'bg-background-section text-text-secondary border border-border-light' };
        }
    };

    return (
        <div className="bg-transparent font-sans text-text-primary antialiased min-h-screen animate-in fade-in duration-500">
            <div className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto">
                {/* 标题与筛选 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">平台数据概览</h2>
                        </div>
                        <button
                            onClick={refreshDashboardData}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-light hover:bg-surface-hover text-text-secondary hover:text-primary rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                            title="刷新数据"
                        >
                            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                                refresh
                            </span>
                            刷新
                        </button>
                        <button
                            onClick={async () => {
                                console.log('🔍 手动触发所有统计接口测试...');
                                try {
                                    // 测试Dashboard
                                    const overview = await dashboardService.getDashboardOverview();
                                    console.log('📊 Dashboard API详细响应:', overview);

                                    // 测试分成管理统计
                                    const settlementStats = await import('../../services/admin/settlementService.js').then(m => m.default.getSettlementStats().catch(e => null));
                                    console.log('💰 分成统计数据:', settlementStats);

                                    // 测试优惠券统计
                                    const couponStats = await import('../../services/admin/marketingService.js').then(m => m.default.getCouponStats().catch(e => null));
                                    console.log('🎫 优惠券统计数据:', couponStats);

                                    console.log('🔢 Dashboard字段映射分析:', {
                                        revenue: {
                                            totalRevenue: overview.totalRevenue,
                                            totalSales: overview.totalSales,
                                            revenue: overview.revenue
                                        },
                                        users: {
                                            totalUserCount: overview.totalUserCount,
                                            userCount: overview.userCount,
                                            totalCount: overview.totalCount
                                        },
                                        merchants: {
                                            activeMerchantCount: overview.activeMerchantCount,
                                            totalMerchantCount: overview.totalMerchantCount,
                                            merchantCount: overview.merchantCount,
                                            activeCount: overview.activeCount
                                        },
                                        orders: {
                                            todayOrderCount: overview.todayOrderCount,
                                            orderCount: overview.orderCount,
                                            totalOrderCount: overview.totalOrderCount
                                        }
                                    });

                                    if (window.testStatsApis) {
                                        window.testStatsApis();
                                    }

                                    // 强制刷新数据
                                    await refreshDashboardData();
                                } catch (error) {
                                    console.error('❌ 统计接口测试失败:', error);
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-primary-soft hover:opacity-80 text-primary rounded-xl text-sm font-bold transition-all shadow-sm"
                            title="测试所有统计接口"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                bug_report
                            </span>
                            全面测试
                        </button>
                    </div>
                    
                    {/* 右上角动态筛选按钮 */}
                    <div className="flex items-center bg-surface p-1 rounded-xl border border-border-light shadow-sm">
                        {['today', 'week', 'month'].map(filter => (
                            <button 
                                key={filter}
                                onClick={() => setTimeFilter(filter)}
                                className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                    timeFilter === filter 
                                    ? 'bg-primary text-white shadow-md' 
                                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                                }`}
                            >
                                {filter === 'today' ? '今日' : filter === 'week' ? '本周' : '本月'}
                            </button>
                        ))}
                        <div className="w-px h-4 bg-border-light mx-1"></div>
                        <button className="px-3 py-1.5 rounded-lg text-text-tertiary hover:text-primary transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                        </button>
                    </div>
                </div>

                {/* KPI 卡片组 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        title="总销售额"
                        value={formatAmount(kpiData.totalSales.amount)}
                        icon="payments"
                        trend={kpiData.totalSales.trend}
                        isUp={kpiData.totalSales.isUp}
                        colorClass="bg-primary-bg text-primary"
                    />
                    <KpiCard
                        title="今日订单"
                        value={formatNumber(kpiData.todayOrders.count)}
                        icon="shopping_bag"
                        trend={kpiData.todayOrders.trend}
                        isUp={kpiData.todayOrders.isUp}
                        colorClass="bg-info-bg text-info"
                    />
                    <KpiCard
                        title="新增用户"
                        value={formatNumber(kpiData.newUsers.count)}
                        icon="person_add"
                        trend={kpiData.newUsers.trend}
                        isUp={kpiData.newUsers.isUp}
                        colorClass="bg-success-bg text-success"
                    />
                    <KpiCard
                        title="活跃商家"
                        value={formatNumber(kpiData.activeMerchants.count)}
                        icon="store"
                        trend={kpiData.activeMerchants.trend}
                        isUp={kpiData.activeMerchants.isUp}
                        colorClass="bg-warning-bg text-warning"
                    />
                </div>

                {/* API诊断工具 - 当数据全为0时显示 */}
                {(kpiData.totalSales.amount === 0 &&
                    kpiData.todayOrders.count === 0 &&
                    kpiData.newUsers.count === 0 &&
                    kpiData.activeMerchants.count === 0) && (
                        <div className="bg-warning-bg border border-warning/20 rounded-2xl p-6 shadow-sm animate-in fade-in">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-warning text-2xl">warning</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-warning">统计数据异常</h3>
                                    <p className="text-warning/80 font-medium text-sm mt-0.5">所有统计数据显示为0，可能是API连接问题或数据库为空</p>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    setDiagnosing(true);
                                    try {
                                        await runApiDiagnostic();
                                    } finally {
                                        setDiagnosing(false);
                                    }
                                }}
                                disabled={diagnosing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-warning hover:opacity-90 text-white rounded-xl font-bold shadow-sm disabled:opacity-50 transition-all active:scale-95"
                            >
                                {diagnosing ? (
                                    <>
                                        <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span>诊断中...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">bug_report</span>
                                        <span>运行 API 连接诊断</span>
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-warning/70 font-bold mt-3">
                                点击按钮将测试所有API连接，诊断结果会显示在浏览器控制台中 (F12)
                            </p>
                        </div>
                    )}

                {/* 底部列表区 */}
                <div className="grid grid-cols-1 gap-6 pb-8">
                    <div className="bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-border-light bg-background-section flex justify-between items-center">
                            <h3 className="text-base font-extrabold text-text-primary tracking-tight">最新入驻商家</h3>
                            <button
                                className="text-sm text-primary font-bold hover:opacity-80 transition-opacity"
                                onClick={() => window.location.href = '/admin/merchants'}
                            >
                                查看全部
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-background-section border-b border-border-light">
                                    <tr>
                                        {/* 第一列左对齐，其余列居中对齐 */}
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-left">商家名称</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">类别</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">注册日期</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">状态</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-text-tertiary font-bold">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    数据加载中...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : latestMerchants.length > 0 ? (
                                        latestMerchants.map((merchant) => {
                                            const statusInfo = getStatusInfo(merchant.status);
                                            return (
                                                <MerchantRow
                                                    key={merchant.id}
                                                    id={merchant.id}
                                                    name={merchant.name}
                                                    category={merchant.category}
                                                    date={merchant.registeredAt}
                                                    status={statusInfo.text}
                                                    statusClass={statusInfo.class}
                                                    avatar={merchant.avatar}
                                                    onViewDetails={() => console.log('查看商家详情', merchant.id)}
                                                />
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-text-tertiary font-bold">
                                                暂无入驻记录
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部悬浮提示 */}
            {notifications.length > 0 && (
                <div className="fixed bottom-8 right-8 bg-surface border border-border-light px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5 cursor-pointer">
                    <div className="size-10 bg-primary-bg rounded-full flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">notifications_active</span>
                    </div>
                    <div>
                        <p className="font-extrabold text-sm text-text-primary">{notifications[0].title}</p>
                        <p className="text-xs font-medium text-text-secondary mt-0.5">{notifications[0].message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;