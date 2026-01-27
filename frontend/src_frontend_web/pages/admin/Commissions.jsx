import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import settlementService from '../../services/admin/settlementService';
import platformService from '../../services/admin/platformService';

// 统计卡片组件
const StatCard = ({ icon, label, value, trend, isUp = true, onClick }) => (
    <div
        className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
                {trend && (
                    <p className={`text-sm mt-2 flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-600'
                        }`}>
                        <span className="material-symbols-outlined text-[16px]">
                            {isUp ? 'trending_up' : 'trending_down'}
                        </span>
                        {trend}
                    </p>
                )}
            </div>
            <div className="p-3 rounded-full bg-orange-100">
                <span className="material-symbols-outlined text-[24px] text-[#ee8c2b]">{icon}</span>
            </div>
        </div>
    </div>
);

// 分成管理主组件
const Commissions = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        todayCommission: '0.00',
        monthlyCommission: '0.00',
        pendingAmount: '0.00',
        avgRate: '0',
        todayTrend: '+0%',
        monthlyTrend: '+0%',
        pendingTrend: '+0%',
        rateTrend: '0%'
    });
    const [platformServices, setPlatformServices] = useState([]);
    const [topMerchants, setTopMerchants] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('统计概览');

    useEffect(() => {
        loadCommissionData();
    }, []);

    useEffect(() => {
        if (activeTab === '服务配置') {
            loadPlatformServices();
        }
    }, [activeTab]);

    // 加载分成统计数据 (使用新的settlement统计接口)
    const loadCommissionData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 获取分成统计数据
            console.log('📊 获取分成统计数据...');
            const statsData = await settlementService.getSettlementStats();
            console.log('✅ 分成统计数据:', statsData);

            // 处理统计数据
            if (statsData) {
                setStats({
                    todayCommission: formatCurrency(statsData.totalAmount || statsData.todayAmount || 0),
                    monthlyCommission: formatCurrency(statsData.pendingAmount || statsData.monthlyAmount || 0),
                    pendingAmount: formatCurrency(statsData.paidAmount || statsData.pendingSettlement || 0),
                    avgRate: (statsData.averageSettlementAmount || statsData.avgRate || 0).toFixed(1),
                    todayTrend: formatTrend(statsData.monthlyGrowthRate || 0),
                    monthlyTrend: formatTrend(statsData.monthlyGrowthRate || 0),
                    pendingTrend: '+0%',
                    rateTrend: formatTrend(0)
                });
            } else {
                setError('无法获取分成统计数据，请检查后端服务');
            }

            // 获取商家贡献和趋势数据（保持现有逻辑作为后备）
            try {
                const [topMerchantsData, trendsData] = await Promise.all([
                    platformService.getTopMerchantContributions(5).catch(err => {
                        console.warn('获取商家贡献排名失败:', err);
                        return [];
                    }),
                    settlementService.getSettlementTrend('week').catch(err => {
                        console.warn('获取分成趋势失败，使用默认数据:', err);
                        return [];
                    })
                ]);

                // 处理商家贡献数据
                if (topMerchantsData && Array.isArray(topMerchantsData) && topMerchantsData.length > 0) {
                    const maxValue = Math.max(...topMerchantsData.map(m => m.commission || m.value || 0));
                    setTopMerchants(topMerchantsData.map(m => ({
                        name: m.merchantName || m.name,
                        value: m.commission || m.value || 0,
                        percentage: maxValue > 0 ? Math.round(((m.commission || m.value || 0) / maxValue) * 100) : 0
                    })));
                } else {
                    setTopMerchants([]);
                }

                // 处理趋势数据
                if (trendsData && Array.isArray(trendsData) && trendsData.length > 0) {
                    const maxTrend = Math.max(...trendsData.map(t => t.totalAmount || t.amount || t.value || 0));
                    setTrendData(trendsData.map(t => ({
                        date: t.date || t.label,
                        value: maxTrend > 0 ? Math.round(((t.totalAmount || t.amount || t.value || 0) / maxTrend) * 100) : 0,
                        amount: t.totalAmount || t.amount || t.value || 0
                    })));
                } else {
                    setTrendData([]);
                }
            } catch (trendError) {
                console.error('获取趋势数据失败:', trendError);
                setTopMerchants([]);
                setTrendData([]);
            }

        } catch (err) {
            console.error('加载分成数据失败:', err);
            setError('后端服务连接失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    // 加载平台服务列表 (用于显示分成比例配置)
    const loadPlatformServices = async () => {
        try {
            const response = await platformService.getServices({ page: 0, size: 100 });
            if (response && response.content) {
                setPlatformServices(response.content);
            } else if (Array.isArray(response)) {
                setPlatformServices(response);
            } else {
                setPlatformServices([]);
            }
        } catch (err) {
            console.error('加载平台服务失败:', err);
            setPlatformServices([]);
        }
    };

    // 格式化货币
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    // 格式化趋势
    const formatTrend = (value) => {
        if (!value && value !== 0) return '+0%';
        const num = parseFloat(value);
        return num >= 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;
    };

    const handleExportReport = async () => {
        try {
            alert('导出报表功能开发中...');
        } catch (err) {
            console.error('导出失败:', err);
        }
    };

    // 跳转到平台服务管理页面
    const handleManageServices = () => {
        navigate('/admin/services');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7f6] text-[#1b140d] font-['Inter']">
            <div className="space-y-8 p-6 md:p-8">
                {/* 错误提示 */}
                {error && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                        <span className="material-symbols-outlined text-yellow-600">warning</span>
                        <span className="text-yellow-800 text-sm">{error}</span>
                        <button
                            onClick={loadCommissionData}
                            className="ml-auto text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                            重试连接
                        </button>
                    </div>
                )}

                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b140d]">分成管理</h1>
                        <p className="text-[#9a734c] text-base">管理平台佣金规则、查看实时收益记录及统计报表</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportReport}
                            className="flex items-center gap-2 h-10 px-4 bg-white border border-[#e7dbcf] rounded-lg text-[#1b140d] text-sm font-bold hover:bg-gray-50 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            <span>导出报表</span>
                        </button>
                        <button
                            onClick={handleManageServices}
                            className="flex items-center gap-2 h-10 px-4 bg-[#ee8c2b] text-white rounded-lg text-sm font-bold hover:bg-[#d97b1e] shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                            服务设置
                        </button>
                    </div>
                </div>

                {/* 选项卡 */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('统计概览')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === '统计概览'
                                ? 'border-[#ee8c2b] text-[#ee8c2b]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            佣金统计概览
                        </button>
                        <button
                            onClick={() => setActiveTab('服务配置')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === '服务配置'
                                ? 'border-[#ee8c2b] text-[#ee8c2b]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            平台服务分成配置
                        </button>
                    </nav>
                </div>

                {/* 统计卡片组 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon="payments"
                        label="今日预估佣金"
                        value={`¥${stats.todayCommission}`}
                        trend={stats.todayTrend}
                        isUp={!stats.todayTrend.startsWith('-')}
                        onClick={() => navigate('/admin/settlements')}
                    />
                    <StatCard
                        icon="calendar_month"
                        label="本月累计佣金"
                        value={`¥${stats.monthlyCommission}`}
                        trend={stats.monthlyTrend}
                        isUp={!stats.monthlyTrend.startsWith('-')}
                        onClick={() => alert('查看本月详情')}
                    />
                    <StatCard
                        icon="account_balance_wallet"
                        label="待结算金额"
                        value={`¥${stats.pendingAmount}`}
                        trend={stats.pendingTrend}
                        isUp={!stats.pendingTrend.startsWith('-')}
                        onClick={() => navigate('/admin/settlements')}
                    />
                    <StatCard
                        icon="percent"
                        label="平均佣金率"
                        value={`${stats.avgRate}%`}
                        trend={stats.rateTrend}
                        isUp={!stats.rateTrend.startsWith('-')}
                        onClick={() => setActiveTab('服务配置')}
                    />
                </div>

                {/* 内容区域 */}
                {activeTab === '统计概览' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 佣金收入趋势图 */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">佣金收入趋势</h3>
                                    <p className="text-sm text-gray-600">过去7天平台服务收入统计</p>
                                </div>
                                <button
                                    onClick={loadCommissionData}
                                    className="text-sm text-[#ee8c2b] hover:text-[#d97b1e] flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-base">refresh</span>
                                    刷新
                                </button>
                            </div>
                            {/* 趋势图表展示 */}
                            <div className="h-64 flex items-end justify-between gap-2 px-2">
                                {trendData.map((item, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full bg-gray-200 rounded-t relative h-full">
                                            <div
                                                className="w-full bg-[#ee8c2b] rounded-t transition-all hover:bg-[#d97b1e] group relative"
                                                style={{ height: `${item.value || item}%` }}
                                                title={`¥${(item.amount || 0).toLocaleString()}`}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {item.date || (i === trendData.length - 1 ? '今日' : `12-${i + 24}`)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 商家贡献排名 */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">商家贡献前五</h3>
                            <div className="space-y-4">
                                {topMerchants.map((merchant, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">{merchant.name}</p>
                                                <p className="text-sm font-bold text-gray-900">¥{merchant.value.toLocaleString()}</p>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-[#ee8c2b] h-2 rounded-full transition-all"
                                                    style={{ width: `${merchant.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 平台服务分成配置选项卡 */}
                {activeTab === '服务配置' && (
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">平台服务分成配置</h3>
                                <p className="text-sm text-gray-500 mt-1">分成比例通过平台服务订阅机制管理，商家订阅服务时按服务费率计算分成</p>
                            </div>
                            <button
                                onClick={handleManageServices}
                                className="flex items-center gap-2 px-4 py-2 bg-[#ee8c2b] text-white rounded-lg text-sm font-medium hover:bg-[#d97b1e]"
                            >
                                <span className="material-symbols-outlined text-lg">settings</span>
                                管理服务
                            </button>
                        </div>

                        {platformServices.length === 0 ? (
                            <div className="p-12 text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300">inventory_2</span>
                                <p className="text-gray-500 mt-4">暂无平台服务数据</p>
                                <button
                                    onClick={handleManageServices}
                                    className="mt-4 text-[#ee8c2b] hover:text-[#d97b1e] font-medium"
                                >
                                    前往服务管理创建服务
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务名称</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务类型</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务费率</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订阅商家数</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {platformServices
                                            .filter(service =>
                                                !searchTerm ||
                                                (service.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                (service.category || '').toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .map((service) => (
                                                <tr key={service.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-orange-100 rounded-lg">
                                                                <span className="material-symbols-outlined text-[#ee8c2b]">
                                                                    {service.icon || 'widgets'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{service.name}</p>
                                                                <p className="text-xs text-gray-500">{service.description || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {(() => {
                                                            const serviceType = service.category || service.type;
                                                            const typeMapping = {
                                                                '支付服务': '支付服务',
                                                                '配送服务': '配送服务',
                                                                '营销服务': '营销服务',
                                                                '数据分析': '数据分析',
                                                                '其他服务': '其他服务',
                                                                'PAYMENT': '支付服务',
                                                                'DELIVERY': '配送服务',
                                                                'MARKETING': '营销服务',
                                                                'ANALYTICS': '数据分析',
                                                                'OTHERS': '其他服务',
                                                                'payment': '支付服务',
                                                                'delivery': '配送服务',
                                                                'marketing': '营销服务',
                                                                'analytics': '数据分析',
                                                                'others': '其他服务'
                                                            };
                                                            return typeMapping[serviceType] || serviceType || '-';
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-lg font-bold text-[#ee8c2b]">
                                                            {(() => {
                                                                console.log('🔍 服务费率数据:', {
                                                                    serviceName: service.name,
                                                                    feeRate: service.feeRate,
                                                                    commissionRate: service.commissionRate,
                                                                    allFields: Object.keys(service)
                                                                });

                                                                if (service.feeRate) {
                                                                    return `${(service.feeRate * 100).toFixed(1)}%`;
                                                                } else if (service.commissionRate) {
                                                                    return `${service.commissionRate}%`;
                                                                } else {
                                                                    return '-';
                                                                }
                                                            })()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.status === '已启用' || service.status === 'ACTIVE' || service.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {service.status === '已启用' || service.status === 'ACTIVE' || service.status === 'active' ? '已启用' : '已停用'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {service.subscriberCount || service.merchantCount || 0} 家
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Commissions;