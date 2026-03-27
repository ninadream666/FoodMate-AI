import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../services/admin/dashboardService';

// 样式字典映射 (避免 Tailwind 动态类名被 Tree-shaking 裁掉)
const colorStyles = {
    blue: { bg: 'bg-info-bg', text: 'text-info', border: 'border-info/20' },
    green: { bg: 'bg-success-bg', text: 'text-success', border: 'border-success/20' },
    purple: { bg: 'bg-primary-bg', text: 'text-primary', border: 'border-primary/20' },
    orange: { bg: 'bg-warning-bg', text: 'text-warning', border: 'border-warning/20' },
    default: { bg: 'bg-background-section', text: 'text-text-secondary', border: 'border-border-light' }
};

// 统计卡片组件 (北欧风重构版)
const StatCard = ({ title, value, icon, color = 'blue', change, changeType, onClick }) => {
    const style = colorStyles[color] || colorStyles.default;
    
    return (
        <div
            className="bg-surface rounded-2xl shadow-sm border border-border-light p-6 cursor-pointer hover:shadow-card transition-all group"
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-bold text-text-secondary">{title}</p>
                    <p className="text-2xl font-extrabold text-text-primary mt-2 tracking-tight">{value}</p>
                    {change && (
                        <p className={`text-sm mt-2 flex items-center font-bold gap-1 ${changeType === 'increase' ? 'text-success' :
                            changeType === 'decrease' ? 'text-error' : 'text-text-tertiary'
                            }`}>
                            {changeType === 'increase' && <span className="material-symbols-outlined text-[16px]">trending_up</span>}
                            {changeType === 'decrease' && <span className="material-symbols-outlined text-[16px]">trending_down</span>}
                            {change}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${style.bg} ${style.text}`}>
                    <span className="material-symbols-outlined text-[28px]">{icon}</span>
                </div>
            </div>
        </div>
    );
};

// 快速操作卡片组件
const QuickActionCard = ({ title, description, icon, color, onClick }) => {
    const style = colorStyles[color] || colorStyles.default;

    return (
        <div
            className={`bg-surface rounded-2xl shadow-sm border p-6 cursor-pointer hover:shadow-card transition-all border-l-4 ${style.border}`}
            onClick={onClick}
        >
            <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${style.bg} ${style.text}`}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
                <div className="flex-1">
                    <h3 className="font-extrabold text-text-primary mb-1">{title}</h3>
                    <p className="text-sm font-medium text-text-secondary">{description}</p>
                </div>
                <span className="material-symbols-outlined text-text-disabled">chevron_right</span>
            </div>
        </div>
    );
};

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
            <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
                    <span className="text-text-secondary font-bold text-sm">加载数据中...</span>
                </div>
            </div>
        );
    }

    return (
        // 背景改为透明以继承布局
        <div className="p-2 md:p-4 bg-transparent animate-in fade-in duration-500">
            {/* 页面标题 */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">仪表盘</h1>
                <p className="text-text-secondary mt-1 font-medium">欢迎回来，这里是您的平台管理概览</p>
            </div>

            {/* 系统告警 */}
            {recentData.alerts.length > 0 && (
                <div className="mb-6 animate-in slide-in-from-top-2">
                    <div className="bg-warning-bg border border-warning/20 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-warning">notification_important</span>
                            <h3 className="font-extrabold text-warning tracking-wide">系统提醒</h3>
                        </div>
                        <div className="space-y-2">
                            {recentData.alerts.map(alert => (
                                <div key={alert.id} className="flex items-center justify-between text-sm">
                                    <span className="text-warning font-medium">{alert.message}</span>
                                    <span className="text-warning opacity-80 font-bold text-xs">{alert.time}</span>
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
                <div className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden">
                    <div className="px-6 py-5 border-b border-border-light bg-background-section flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-text-primary tracking-tight">最近订单</h3>
                        <button className="text-primary text-sm font-bold hover:opacity-80 transition-opacity">查看全部</button>
                    </div>
                    <div className="p-0">
                        <div className="flex flex-col">
                            {recentData.recentOrders.length === 0 ? (
                                <div className="p-10 text-center text-text-tertiary font-bold">暂无近期订单</div>
                            ) : recentData.recentOrders.map((order, index) => (
                                <div key={order.id} className={`flex items-center justify-between p-5 hover:bg-surface-hover transition-colors ${index !== recentData.recentOrders.length - 1 ? 'border-b border-border-light' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 bg-background-section rounded-full flex items-center justify-center text-text-tertiary">
                                            <span className="material-symbols-outlined text-[20px]">receipt</span>
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-text-primary font-mono">{order.orderNo}</p>
                                            <p className="text-xs font-bold text-text-secondary mt-0.5">{order.merchantName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1.5">
                                        <p className="font-extrabold text-text-primary text-base font-display">¥{order.amount}</p>
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded-md font-bold ${(() => {
                                            const statusCode = typeof order.status === 'object' && order.status !== null
                                                ? order.status.code
                                                : order.status;

                                            return statusCode === 'COMPLETED' ? 'bg-success-bg text-success' :
                                                statusCode === 'PREPARING' ? 'bg-warning-bg text-warning' :
                                                    statusCode === 'DELIVERING' ? 'bg-info-bg text-info' :
                                                        'bg-background-section text-text-secondary border border-border-light';
                                        })()
                                            }`}>
                                            {(() => {
                                                const statusCode = typeof order.status === 'object' && order.status !== null
                                                    ? order.status.code
                                                    : order.status;
                                                const statusDescription = typeof order.status === 'object' && order.status !== null
                                                    ? order.status.description
                                                    : '';

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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;