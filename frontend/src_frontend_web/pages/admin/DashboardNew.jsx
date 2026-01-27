import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../services/admin/dashboardService';

// 统计卡片组件
const StatCard = ({ title, value, icon, color = 'blue', change, changeType, onClick }) => (
    <div
        className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
                {change && (
                    <p className={`text-sm mt-2 flex items-center gap-1 ${changeType === 'increase' ? 'text-green-600' :
                        changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                        {changeType === 'increase' && <span className="material-symbols-outlined text-[16px]">trending_up</span>}
                        {changeType === 'decrease' && <span className="material-symbols-outlined text-[16px]">trending_down</span>}
                        {change}
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-full bg-${color}-100`}>
                <span className={`material-symbols-outlined text-[24px] text-${color}-600`}>{icon}</span>
            </div>
        </div>
    </div>
);

// 快速操作卡片组件
const QuickActionCard = ({ title, description, icon, color, onClick }) => (
    <div
        className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-${color}-500`}
        onClick={onClick}
    >
        <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg bg-${color}-100`}>
                <span className={`material-symbols-outlined text-[20px] text-${color}-600`}>{icon}</span>
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </div>
    </div>
);

// 仪表盘主页面
const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalMerchants: 0,
        totalOrders: 0,
        totalRevenue: 0,
        todayOrders: 0,
        todayRevenue: 0,
        activeServices: 0,
        pendingSettlements: 0
    });

    const [recentData, setRecentData] = useState({
        recentOrders: [],
        recentSettlements: [],
        alerts: []
    });

    // 加载仪表盘数据
    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 从后端API获取仪表盘数据
            const overview = await dashboardService.getDashboardOverview();

            // 设置统计数据
            setStats({
                totalUsers: overview.totalUserCount || 0,
                totalMerchants: overview.totalMerchantCount || 0,
                totalOrders: overview.totalOrderCount || 0,
                totalRevenue: overview.totalRevenue || 0,
                todayOrders: overview.todayOrderCount || 0,
                todayRevenue: overview.todayRevenue || 0,
                activeServices: overview.activeServiceCount || 0,
                pendingSettlements: overview.pendingSettlement || 0
            });

            // 获取系统通知
            const notifications = await dashboardService.getSystemNotifications().catch(() => []);

            // 设置最近数据
            setRecentData({
                recentOrders: overview.recentOrders || [],
                recentSettlements: overview.recentSettlements || [],
                alerts: Array.isArray(notifications) ? notifications.map((n, i) => ({
                    id: n.id || i,
                    type: n.type || 'info',
                    message: n.message || n.content,
                    time: n.createdAt || n.time || ''
                })) : []
            });

        } catch (error) {
            console.error('获取仪表盘数据失败:', error);
            // 如果API失败，显示空数据而非报错
            setStats({
                totalUsers: 0,
                totalMerchants: 0,
                totalOrders: 0,
                totalRevenue: 0,
                todayOrders: 0,
                todayRevenue: 0,
                activeServices: 0,
                pendingSettlements: 0
            });
            setRecentData({
                recentOrders: [],
                recentSettlements: [],
                alerts: [{ id: 1, type: 'warning', message: '无法连接后端服务，请检查网络', time: '' }]
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const quickActions = [
        {
            title: '生成结算单',
            description: '为符合条件的商家生成结算单',
            icon: 'calculate',
            color: 'blue',
            onClick: () => console.log('生成结算单')
        },
        {
            title: '服务管理',
            description: '管理平台增值服务配置',
            icon: 'settings',
            color: 'green',
            onClick: () => console.log('跳转服务管理')
        },
        {
            title: '商家审核',
            description: '审核待入驻商家申请',
            icon: 'business',
            color: 'orange',
            onClick: () => console.log('跳转商家审核')
        },
        {
            title: '系统监控',
            description: '查看系统运行状态',
            icon: 'monitor_heart',
            color: 'purple',
            onClick: () => console.log('跳转系统监控')
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">加载数据中...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8">
            {/* 页面标题 */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
                <p className="text-gray-600 mt-1">欢迎回来，这里是您的平台管理概览</p>
            </div>

            {/* 系统告警 */}
            {recentData.alerts.length > 0 && (
                <div className="mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-yellow-600">notification_important</span>
                            <h3 className="font-medium text-yellow-800">系统提醒</h3>
                        </div>
                        <div className="space-y-2">
                            {recentData.alerts.map(alert => (
                                <div key={alert.id} className="flex items-center justify-between text-sm">
                                    <span className="text-yellow-700">{alert.message}</span>
                                    <span className="text-yellow-600">{alert.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 核心统计指标 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="总用户数"
                    value={stats.totalUsers?.toLocaleString()}
                    icon="people"
                    color="blue"
                    change="+12.5%"
                    changeType="increase"
                />
                <StatCard
                    title="入驻商家"
                    value={stats.totalMerchants?.toLocaleString()}
                    icon="business"
                    color="green"
                    change="+8.2%"
                    changeType="increase"
                />
                <StatCard
                    title="总订单数"
                    value={stats.totalOrders?.toLocaleString()}
                    icon="shopping_bag"
                    color="purple"
                    change="+15.8%"
                    changeType="increase"
                />
                <StatCard
                    title="平台总收入"
                    value={`¥${(stats.totalRevenue / 10000).toFixed(1)}万`}
                    icon="payments"
                    color="orange"
                    change="+22.3%"
                    changeType="increase"
                />
            </div>

            {/* 今日数据 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="今日订单"
                    value={stats.todayOrders?.toLocaleString()}
                    icon="today"
                    color="blue"
                />
                <StatCard
                    title="今日收入"
                    value={`¥${stats.todayRevenue?.toLocaleString()}`}
                    icon="account_balance_wallet"
                    color="green"
                />
                <StatCard
                    title="启用服务"
                    value={stats.activeServices}
                    icon="verified"
                    color="purple"
                />
                <StatCard
                    title="待处理结算"
                    value={stats.pendingSettlements}
                    icon="pending_actions"
                    color="orange"
                />
            </div>

            {/* 最近订单 */}
            <div className="max-w-4xl">
                {/* 最近订单 */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">最近订单</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {recentData.recentOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{order.orderNo}</p>
                                        <p className="text-sm text-gray-500">{order.merchantName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">¥{order.amount}</p>
                                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${(() => {
                                            // 支持新的对象结构
                                            const statusCode = typeof order.status === 'object' && order.status !== null
                                                ? order.status.code
                                                : order.status;

                                            return statusCode === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                statusCode === 'PREPARING' ? 'bg-yellow-100 text-yellow-700' :
                                                    statusCode === 'DELIVERING' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700';
                                        })()
                                            }`}>
                                            {(() => {
                                                // 支持新的对象结构
                                                const statusCode = typeof order.status === 'object' && order.status !== null
                                                    ? order.status.code
                                                    : order.status;
                                                const statusDescription = typeof order.status === 'object' && order.status !== null
                                                    ? order.status.description
                                                    : '';

                                                // 优先显示描述，然后是代码的中文映射，最后是原始值
                                                if (statusDescription) {
                                                    return statusDescription;
                                                } else if (statusCode === 'COMPLETED') {
                                                    return '已完成';
                                                } else if (statusCode === 'PREPARING') {
                                                    return '制作中';
                                                } else if (statusCode === 'DELIVERING') {
                                                    return '配送中';
                                                } else {
                                                    return statusCode || '未知状态';
                                                }
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-center">
                            <button className="text-blue-600 text-sm hover:text-blue-700">
                                查看全部订单
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;