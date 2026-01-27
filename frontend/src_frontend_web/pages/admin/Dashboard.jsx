import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../services/admin/dashboardService';
import { runApiDiagnostic } from '../../utils/apiDiagnostic';

// 加载调试工具
if (typeof window !== 'undefined') {
    import('../../utils/statsDebugger.js');
    import('../../utils/fieldMapper.js');
}

// 统计指标卡片组件
const KpiCard = ({ title, value, icon, trend, isUp = true, colorClass, onClick }) => (
    <div
        className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
    >
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${colorClass}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
            <span className={`flex items-center font-medium px-1.5 py-0.5 rounded ${isUp
                ? "text-emerald-600 bg-emerald-50"
                : "text-rose-600 bg-rose-50"
                }`}>
                <span className="material-symbols-outlined text-[16px] mr-0.5">
                    {isUp ? "trending_up" : "trending_down"}
                </span>
                {trend}
            </span>
            <span className="text-gray-400">较昨日</span>
        </div>
    </div>
);

// 快速操作按钮组件
const QuickAction = ({ icon, label, colorClass, onClick }) => (
    <button
        className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group gap-3"
        onClick={onClick}
    >
        <div className={`size-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${colorClass}`}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
);

// 商家行组件
const MerchantRow = ({ id, name, category, date, status, statusClass, avatar, onViewDetails }) => (
    <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gray-200 overflow-hidden">
                {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600 text-sm">store</span>
                    </div>
                )}
            </div>
            {name}
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">{category}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{date}</td>
        <td className="px-6 py-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                {status}
            </span>
        </td>
        <td className="px-6 py-4 text-right text-sm font-medium">
            <button
                onClick={() => onViewDetails(id)}
                className="text-blue-600 hover:text-blue-900"
            >
                查看详情
            </button>
        </td>
    </tr>
);

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [diagnosing, setDiagnosing] = useState(false);
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
            console.log('📈 开始获取仪表盘数据...');

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
    }, []);

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

    // 获取状态显示信息
    const getStatusInfo = (status) => {
        switch (status) {
            case 'PENDING':
                return { text: '待审核', class: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' };
            case 'ACTIVE':
                return { text: '正常', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' };
            case 'REJECTED':
                return { text: '已拒绝', class: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400' };
            default:
                return { text: status, class: 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400' };
        }
    };

    return (
        <div className="bg-[#f8f7f6] dark:bg-[#221910] font-['Inter'] text-slate-900 dark:text-slate-100 antialiased min-h-screen">
            <div className="space-y-8 p-6 md:p-8">
                {/* 标题与筛选 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">平台数据概览</h2>
                        </div>
                        <button
                            onClick={refreshDashboardData}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            title="刷新数据"
                        >
                            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
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
                                    const settlementStats = await import('../../services/admin/settlementService').then(m => m.default.getSettlementStats().catch(e => null));
                                    console.log('💰 分成统计数据:', settlementStats);

                                    // 测试优惠券统计
                                    const couponStats = await import('../../services/admin/marketingService').then(m => m.default.getCouponStats().catch(e => null));
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
                            className="flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-sm font-medium transition-colors"
                            title="测试所有统计接口"
                        >
                            <span className="material-symbols-outlined text-sm">
                                bug_report
                            </span>
                            全面测试
                        </button>
                    </div>
                    <div className="flex bg-white dark:bg-[#2a2018] p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <button className="px-4 py-1.5 rounded-md bg-[#ee8c2b]/10 text-[#ee8c2b] text-sm font-medium shadow-sm">今日</button>
                        <button className="px-4 py-1.5 rounded-md text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5">本周</button>
                        <button className="px-4 py-1.5 rounded-md text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5">本月</button>
                        <button className="px-3 py-1.5 rounded-md text-slate-400 hover:text-[#ee8c2b]">
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
                        colorClass="bg-[#ee8c2b]/10 text-[#ee8c2b]"
                    />
                    <KpiCard
                        title="今日订单"
                        value={formatNumber(kpiData.todayOrders.count)}
                        icon="shopping_bag"
                        trend={kpiData.todayOrders.trend}
                        isUp={kpiData.todayOrders.isUp}
                        colorClass="bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                    />
                    <KpiCard
                        title="新增用户"
                        value={formatNumber(kpiData.newUsers.count)}
                        icon="person_add"
                        trend={kpiData.newUsers.trend}
                        isUp={kpiData.newUsers.isUp}
                        colorClass="bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                    />
                    <KpiCard
                        title="活跃商家"
                        value={formatNumber(kpiData.activeMerchants.count)}
                        icon="store"
                        trend={kpiData.activeMerchants.trend}
                        isUp={kpiData.activeMerchants.isUp}
                        colorClass="bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                    />
                </div>
                {/* API诊断工具 - 当数据全为0时显示 */}
                {(kpiData.totalSales.amount === 0 &&
                    kpiData.todayOrders.count === 0 &&
                    kpiData.newUsers.count === 0 &&
                    kpiData.activeMerchants.count === 0) && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">统计数据异常</h3>
                                    <p className="text-amber-700 dark:text-amber-300">所有统计数据显示为0，可能是API连接问题</p>
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
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                {diagnosing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span>诊断中...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">bug_report</span>
                                        <span>运行API连接诊断</span>
                                    </>
                                )}
                            </button>
                            <p className="text-sm text-amber-600 dark:text-amber-300 mt-2">
                                点击按钮将测试所有API连接，诊断结果会显示在浏览器控制台中
                            </p>
                        </div>
                    )}
                {/* 底部功能区 */}
                <div className="grid grid-cols-1 gap-6 pb-8">
                    <div className="bg-white dark:bg-[#2a2018] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">最新入驻商家</h3>
                            <button
                                className="text-sm text-[#ee8c2b] font-medium hover:underline"
                                onClick={() => window.location.href = '/admin/merchants'}
                            >
                                查看全部
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">商家名称</th>
                                        <th className="px-6 py-3">类别</th>
                                        <th className="px-6 py-3">注册日期</th>
                                        <th className="px-6 py-3">状态</th>
                                        <th className="px-6 py-3">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-[#ee8c2b] border-t-transparent rounded-full animate-spin"></div>
                                                    加载中...
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
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                                暂无数据
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
                <div className="fixed bottom-8 right-8 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-bounce cursor-pointer">
                    <span className="material-symbols-outlined text-[#ee8c2b]">notifications_active</span>
                    <div>
                        <p className="font-bold text-sm">{notifications[0].title}</p>
                        <p className="text-xs opacity-80">{notifications[0].message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;