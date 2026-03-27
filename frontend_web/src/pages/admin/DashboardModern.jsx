import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../services/admin/dashboardService';
import userService from '../../services/admin/userService';
import merchantService from '../../services/admin/merchantService';
import orderService from '../../services/admin/orderService';

// 统计指标卡片组件 (北欧风重构版)
const KpiCard = ({ title, value, icon, trend, isUp = true, colorClass, onClick }) => (
    <div
        className="bg-surface rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-card transition-all cursor-pointer group"
        onClick={onClick}
    >
        <div className="flex items-center gap-4 mb-4">
            <div className={`size-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${colorClass}`}>
                <span className="material-symbols-outlined text-white">{icon}</span>
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-text-secondary">{title}</p>
                <h3 className="text-2xl font-extrabold text-text-primary mt-1 tracking-tight">{value}</h3>
            </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
            <span className={`flex items-center font-bold px-2.5 py-1 rounded-md ${isUp
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

// 快速操作按钮组件
const QuickAction = ({ icon, label, colorClass, onClick }) => (
    <button
        className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border-light hover:border-primary hover:bg-primary-soft transition-all group bg-surface shadow-sm"
        onClick={onClick}
    >
        <div className={`size-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${colorClass}`}>
            <span className="material-symbols-outlined text-white">{icon}</span>
        </div>
        <span className="text-sm font-bold text-text-primary group-hover:text-primary mt-1">{label}</span>
    </button>
);

function Dashboard() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({
        totalOrders: 0,
        activeUsers: 0,
        totalRevenue: 0,
        activeMerchants: 0,
        orderGrowth: 0,
        userGrowth: 0,
        revenueGrowth: 0,
        merchantGrowth: 0
    });

    const [loading, setLoading] = useState(true);

    const [recentActivity, setRecentActivity] = useState([
        { id: 1, type: 'order', user: '张三', action: '下单', time: '5分钟前', status: 'success' },
        { id: 2, type: 'merchant', user: '王记餐厅', action: '上线新菜品', time: '15分钟前', status: 'info' },
        { id: 3, type: 'user', user: '李四', action: '完成订单', time: '25分钟前', status: 'success' },
        { id: 4, type: 'system', user: '系统', action: '自动结算', time: '1小时前', status: 'warning' }
    ]);

    // 加载仪表盘数据
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // 并行请求多个接口获取数据
            const [orderStats, userStats, merchantStats] = await Promise.all([
                orderService.getOrderStats().catch(() => null),
                userService.getUserStats().catch(() => null),
                merchantService.getMerchantStats().catch(() => null)
            ]);

            setDashboardData({
                totalOrders: orderStats?.totalOrders || 0,
                activeUsers: userStats?.activeUsers || 0,
                totalRevenue: orderStats?.totalRevenue || 0,
                activeMerchants: merchantStats?.totalMerchants || 0,
                orderGrowth: orderStats?.growthRate || 0,
                userGrowth: userStats?.growthRate || 0,
                revenueGrowth: orderStats?.revenueGrowthRate || 0,
                merchantGrowth: merchantStats?.growthRate || 0
            });
        } catch (error) {
            console.error('加载仪表盘数据失败:', error);
            // 使用默认值
            setDashboardData({
                totalOrders: 12580,
                activeUsers: 8435,
                totalRevenue: 1258000,
                activeMerchants: 342,
                orderGrowth: 12.5,
                userGrowth: 8.3,
                revenueGrowth: 15.2,
                merchantGrowth: 5.8
            });
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { icon: 'storefront', label: '商家审核', color: 'bg-[#5DA97A]', onClick: () => navigate('/admin/merchants') },
        { icon: 'receipt_long', label: '订单管理', color: 'bg-[#7BA3C4]', onClick: () => navigate('/admin/orders') },
        { icon: 'group', label: '用户管理', color: 'bg-[#F2784B]', onClick: () => navigate('/admin/users') },
        { icon: 'campaign', label: '营销活动', color: 'bg-[#E5A84B]', onClick: () => navigate('/admin/marketing') },
        { icon: 'attach_money', label: '财务报表', color: 'bg-[#D96054]', onClick: () => navigate('/admin/settlements') },
        { icon: 'settings', label: '系统设置', color: 'bg-[#A0A7B0]', onClick: () => navigate('/admin/system-monitor') }
    ];

    return (
        // 背景改为 bg-transparent 继承 AdminLayout 的渐变背景
        <div className="min-h-screen bg-transparent text-text-primary font-sans animate-in fade-in duration-500">
            <div className="space-y-8 p-2">
            {/* 页面标题 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">控制台</h1>
                    <p className="text-text-secondary text-base">实时监控平台运营指标和业务数据</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 h-10 px-4 bg-surface border border-border-light rounded-xl text-text-secondary text-sm font-bold hover:bg-surface-hover hover:text-primary transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span>导出报告</span>
                    </button>
                    <button 
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="flex items-center gap-2 h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-primary disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        <span>{loading ? '加载中...' : '刷新数据'}</span>
                    </button>
                </div>
            </div>

            {/* KPI 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="今日订单"
                    value={dashboardData.totalOrders.toLocaleString()}
                    icon="receipt_long"
                    trend={`+${dashboardData.orderGrowth}%`}
                    isUp={true}
                    colorClass="bg-info"
                    onClick={() => navigate('/admin/orders')}
                />
                <KpiCard
                    title="活跃用户"
                    value={dashboardData.activeUsers.toLocaleString()}
                    icon="group"
                    trend={`+${dashboardData.userGrowth}%`}
                    isUp={true}
                    colorClass="bg-success"
                    onClick={() => navigate('/admin/users')}
                />
                <KpiCard
                    title="今日收入"
                    value={`¥${(dashboardData.totalRevenue / 10000).toFixed(1)}万`}
                    icon="attach_money"
                    trend={`+${dashboardData.revenueGrowth}%`}
                    isUp={true}
                    colorClass="bg-primary"
                    onClick={() => navigate('/admin/settlements')}
                />
                <KpiCard
                    title="合作商家"
                    value={dashboardData.activeMerchants.toLocaleString()}
                    icon="storefront"
                    trend={`+${dashboardData.merchantGrowth}%`}
                    isUp={true}
                    colorClass="bg-warning"
                    onClick={() => navigate('/admin/merchants')}
                />
            </div>

            {/* 快速操作 */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 bg-primary-bg rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>bolt</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-text-primary tracking-tight">快速操作</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {quickActions.map((action, index) => (
                        <QuickAction
                            key={index}
                            icon={action.icon}
                            label={action.label}
                            colorClass={action.color}
                            onClick={action.onClick}
                        />
                    ))}
                </div>
            </section>

            {/* 最近活动 */}
            <section className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light bg-background-section flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-info-bg rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-info" style={{ fontSize: '18px' }}>timeline</span>
                        </div>
                        <h3 className="text-base font-bold text-text-primary">实时动态</h3>
                    </div>
                    <button className="text-primary text-sm font-bold hover:opacity-80 transition-colors">查看全部</button>
                </div>
                <div className="p-6">
                    <div className="space-y-2">
                        {recentActivity.map((activity) => {
                            // 动态映射状态颜色
                            let statusStyle = "bg-background-section text-text-secondary";
                            if (activity.status === 'success') statusStyle = "bg-success-bg text-success";
                            if (activity.status === 'warning') statusStyle = "bg-warning-bg text-warning";
                            if (activity.status === 'info') statusStyle = "bg-info-bg text-info";

                            return (
                                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover border border-transparent hover:border-border-light transition-all">
                                    <div className={`size-10 rounded-full flex items-center justify-center ${statusStyle}`}>
                                        <span className="material-symbols-outlined text-sm">
                                            {activity.type === 'order' ? 'receipt' :
                                                activity.type === 'merchant' ? 'storefront' :
                                                    activity.type === 'user' ? 'person' : 'settings'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-text-primary">
                                            <span className="font-extrabold">{activity.user}</span> {activity.action}
                                        </p>
                                        <p className="text-xs font-bold text-text-tertiary mt-0.5">{activity.time}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
        </div>
    );
}

export default Dashboard;