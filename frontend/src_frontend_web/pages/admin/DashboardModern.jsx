import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../../services/admin/dashboardService';
import userService from '../../services/admin/userService';
import merchantService from '../../services/admin/merchantService';
import orderService from '../../services/admin/orderService';

// 统计指标卡片组件
const KpiCard = ({ title, value, icon, trend, isUp = true, colorClass, onClick }) => (
    <div
        className="bg-white rounded-xl p-6 border border-[#e7dbcf] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        onClick={onClick}
    >
        <div className="flex items-center gap-4 mb-4">
            <div className={`size-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${colorClass}`}>
                <span className="material-symbols-outlined text-white">{icon}</span>
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-[#9a734c]">{title}</p>
                <h3 className="text-2xl font-bold text-[#1b140d] mt-1">{value}</h3>
            </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
            <span className={`flex items-center font-medium px-2 py-1 rounded-full ${isUp
                ? "text-emerald-700 bg-emerald-100"
                : "text-red-700 bg-red-100"
                }`}>
                <span className="material-symbols-outlined text-[14px] mr-1">
                    {isUp ? "trending_up" : "trending_down"}
                </span>
                {trend}
            </span>
            <span className="text-[#9a734c]">较昨日</span>
        </div>
    </div>
);

// 快速操作按钮组件
const QuickAction = ({ icon, label, colorClass, onClick }) => (
    <button
        className="flex flex-col items-center justify-center p-6 rounded-xl border border-[#e7dbcf] hover:border-[#ee8c2b] hover:bg-[#ee8c2b]/5 transition-all group gap-3 bg-white shadow-sm"
        onClick={onClick}
    >
        <div className={`size-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${colorClass}`}>
            <span className="material-symbols-outlined text-white">{icon}</span>
        </div>
        <span className="text-sm font-medium text-[#1b140d] group-hover:text-[#ee8c2b]">{label}</span>
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
        { icon: 'storefront', label: '商家审核', color: 'bg-blue-500', onClick: () => navigate('/admin/merchants') },
        { icon: 'receipt_long', label: '订单管理', color: 'bg-green-500', onClick: () => navigate('/admin/orders') },
        { icon: 'group', label: '用户管理', color: 'bg-purple-500', onClick: () => navigate('/admin/users') },
        { icon: 'campaign', label: '营销活动', color: 'bg-orange-500', onClick: () => navigate('/admin/marketing') },
        { icon: 'attach_money', label: '财务报表', color: 'bg-emerald-500', onClick: () => navigate('/admin/settlements') },
        { icon: 'settings', label: '系统设置', color: 'bg-gray-500', onClick: () => navigate('/admin/system-monitor') }
    ];

    return (
        <div className="min-h-screen bg-[#f8f7f6] text-[#1b140d] font-['Inter']">
            <div className="space-y-8 p-6 md:p-8">
            {/* 页面标题 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b140d]">控制台</h1>
                    <p className="text-[#9a734c] text-base">实时监控平台运营指标和业务数据</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 h-10 px-4 bg-white border border-[#e7dbcf] rounded-lg text-[#1b140d] text-sm font-bold hover:bg-gray-50 shadow-sm">
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span>导出报告</span>
                    </button>
                    <button 
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="flex items-center gap-2 h-10 px-4 bg-[#ee8c2b] text-white rounded-lg text-sm font-bold hover:bg-[#d97b1e] shadow-sm disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span>
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
                    colorClass="bg-blue-500"
                    onClick={() => navigate('/admin/orders')}
                />
                <KpiCard
                    title="活跃用户"
                    value={dashboardData.activeUsers.toLocaleString()}
                    icon="group"
                    trend={`+${dashboardData.userGrowth}%`}
                    isUp={true}
                    colorClass="bg-green-500"
                    onClick={() => navigate('/admin/users')}
                />
                <KpiCard
                    title="今日收入"
                    value={`¥${(dashboardData.totalRevenue / 10000).toFixed(1)}万`}
                    icon="attach_money"
                    trend={`+${dashboardData.revenueGrowth}%`}
                    isUp={true}
                    colorClass="bg-emerald-500"
                    onClick={() => navigate('/admin/settlements')}
                />
                <KpiCard
                    title="合作商家"
                    value={dashboardData.activeMerchants.toLocaleString()}
                    icon="storefront"
                    trend={`+${dashboardData.merchantGrowth}%`}
                    isUp={true}
                    colorClass="bg-orange-500"
                    onClick={() => navigate('/admin/merchants')}
                />
            </div>

            {/* 快速操作 */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-8 bg-[#ee8c2b]/10 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#ee8c2b]" style={{ fontSize: '18px' }}>flash_on</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1b140d]">快速操作</h3>
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
            <section className="bg-white rounded-xl shadow-sm border border-[#e7dbcf] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e7dbcf] bg-gray-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600" style={{ fontSize: '18px' }}>timeline</span>
                        </div>
                        <h3 className="text-base font-bold text-[#1b140d]">实时动态</h3>
                    </div>
                    <button className="text-[#ee8c2b] text-sm font-medium hover:underline">查看全部</button>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
                                <div className={`size-10 rounded-full flex items-center justify-center ${activity.status === 'success' ? 'bg-green-100 text-green-600' :
                                    activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                        activity.status === 'info' ? 'bg-blue-100 text-blue-600' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    <span className="material-symbols-outlined text-sm">
                                        {activity.type === 'order' ? 'receipt' :
                                            activity.type === 'merchant' ? 'storefront' :
                                                activity.type === 'user' ? 'person' : 'settings'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[#1b140d]">
                                        <span className="font-bold">{activity.user}</span> {activity.action}
                                    </p>
                                    <p className="text-xs text-[#9a734c]">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
        </div>
    );
}

export default Dashboard;