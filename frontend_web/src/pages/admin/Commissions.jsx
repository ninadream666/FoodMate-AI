import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import settlementService from '../../services/admin/settlementService';
import platformService from '../../services/admin/platformService';

// 服务分类标签颜色配置 (北欧语义化 - 同色系暖橙调，支持中英文全量匹配)
const CATEGORY_COLORS = {
    '基础服务': 'bg-primary-bg text-primary border border-primary/20',        
    '支付服务': 'bg-primary-bg text-primary border border-primary/20',        
    'PAYMENT': 'bg-primary-bg text-primary border border-primary/20',        
    '配送服务': 'bg-warning-bg text-warning border border-warning/20',       
    'DELIVERY': 'bg-warning-bg text-warning border border-warning/20',       
    '流量服务': 'bg-error-bg text-error border border-error/20',            
    '营销服务': 'bg-error-bg text-error border border-error/20',            
    'MARKETING': 'bg-error-bg text-error border border-error/20',            
    '运营服务': 'bg-[#FDF8F3] text-[#B45309] border border-[#B45309]/20', 
    '数据分析': 'bg-[#FDF8F3] text-[#B45309] border border-[#B45309]/20', 
    'ANALYTICS': 'bg-[#FDF8F3] text-[#B45309] border border-[#B45309]/20', 
    'DEFAULT': 'bg-background-section text-text-secondary border border-border-light'
};

// 统计卡片组件
const StatCard = ({ icon, label, value, trend, isUp = true, onClick }) => (
    <div
        className="bg-surface rounded-2xl shadow-sm border border-border-light p-6 hover:shadow-card transition-shadow cursor-pointer group"
        onClick={onClick}
    >
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <p className="text-sm font-bold text-text-secondary">{label}</p>
                <p className="text-2xl font-extrabold text-text-primary mt-2 tracking-tight">{value}</p>
                {trend && (
                    <p className={`text-sm mt-2 flex items-center font-bold gap-1 ${isUp ? 'text-success' : 'text-error'
                        }`}>
                        <span className="material-symbols-outlined text-[16px]">
                            {isUp ? 'trending_up' : 'trending_down'}
                        </span>
                        {trend}
                    </p>
                )}
            </div>
            <div className="p-3 rounded-xl bg-primary-bg text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">{icon}</span>
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

    // 定制化弹窗状态
    const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
    const showAlert = (message) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });

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
            showAlert('导出报表功能开发中...');
        } catch (err) {
            console.error('导出失败:', err);
        }
    };

    // 跳转到平台服务管理页面
    const handleManageServices = () => {
        navigate('/admin/services');
    };

    if (loading && activeTab === '统计概览') {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-text-secondary font-bold">加载数据中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500 min-h-screen">
            <div className="space-y-6 p-6 md:p-8 max-w-[1400px] mx-auto">
                {/* 错误提示 */}
                {error && (
                    <div className="bg-warning-bg border border-warning/20 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
                        <span className="material-symbols-outlined text-warning">warning</span>
                        <span className="text-warning font-bold text-sm">{error}</span>
                        <button
                            onClick={loadCommissionData}
                            className="ml-auto text-warning hover:opacity-80 text-sm font-bold underline"
                        >
                            重试连接
                        </button>
                    </div>
                )}

                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">分成管理</h1>
                        <p className="text-text-secondary text-sm font-medium">管理平台佣金规则、查看实时收益记录及统计报表</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportReport}
                            className="flex items-center gap-2 h-10 px-4 bg-surface border border-border-light rounded-xl text-text-secondary text-sm font-bold hover:bg-surface-hover hover:text-primary transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            <span>导出报表</span>
                        </button>
                        <button
                            onClick={handleManageServices}
                            className="flex items-center gap-2 h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-primary active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                            服务设置
                        </button>
                    </div>
                </div>

                {/* 选项卡 */}
                <div className="border-b border-border-light">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('统计概览')}
                            className={`py-3 px-1 border-b-[3px] font-bold text-sm transition-colors ${activeTab === '统计概览'
                                ? 'border-primary text-text-primary'
                                : 'border-transparent text-text-secondary hover:text-primary hover:border-primary/30'
                                }`}
                        >
                            佣金统计概览
                        </button>
                        <button
                            onClick={() => setActiveTab('服务配置')}
                            className={`py-3 px-1 border-b-[3px] font-bold text-sm transition-colors ${activeTab === '服务配置'
                                ? 'border-primary text-text-primary'
                                : 'border-transparent text-text-secondary hover:text-primary hover:border-primary/30'
                                }`}
                        >
                            平台服务分成配置
                        </button>
                    </nav>
                </div>

                {/* 统计卡片组 */}
                {activeTab === '统计概览' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-2">
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
                                onClick={() => showAlert('查看本月详情功能开发中')}
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                            {/* 佣金收入趋势图 */}
                            <div className="lg:col-span-2 bg-surface rounded-2xl shadow-sm border border-border-light p-6 hover:shadow-card transition-shadow">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-text-primary tracking-tight">佣金收入趋势</h3>
                                        <p className="text-sm font-medium text-text-secondary mt-0.5">过去7天平台服务收入统计</p>
                                    </div>
                                    <button
                                        onClick={loadCommissionData}
                                        className="text-sm font-bold text-primary hover:opacity-80 flex items-center gap-1 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                                        刷新
                                    </button>
                                </div>
                                {/* 趋势图表展示 */}
                                <div className="h-64 flex items-end justify-between gap-3 px-2 mt-4">
                                    {trendData.map((item, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                            <div className="w-full max-w-[40px] bg-background-section rounded-t-lg relative h-full flex items-end justify-center group cursor-pointer overflow-hidden">
                                                <div
                                                    className="w-full bg-primary/80 group-hover:bg-primary transition-all rounded-t-lg relative"
                                                    style={{ height: `${item.value || 5}%`, minHeight: '4px' }}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-text-primary text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                        ¥{(item.amount || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-text-tertiary">
                                                {item.date || (i === trendData.length - 1 ? '今日' : `12-${i + 24}`)}
                                            </span>
                                        </div>
                                    ))}
                                    {trendData.length === 0 && (
                                        <div className="w-full h-full flex items-center justify-center text-text-tertiary font-bold text-sm">
                                            暂无趋势数据
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 商家贡献排名 */}
                            <div className="bg-surface rounded-2xl shadow-sm border border-border-light p-6 hover:shadow-card transition-shadow">
                                <h3 className="text-lg font-extrabold text-text-primary tracking-tight mb-6">商家贡献前五</h3>
                                <div className="space-y-5">
                                    {topMerchants.length === 0 ? (
                                        <div className="text-center py-10 text-text-tertiary font-bold text-sm">暂无排名数据</div>
                                    ) : topMerchants.map((merchant, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className={`size-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${idx === 0 ? 'bg-warning text-white shadow-md' : idx === 1 ? 'bg-text-tertiary text-white' : idx === 2 ? 'bg-[#D97706]/60 text-white' : 'bg-background-section text-text-secondary'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <p className="text-sm font-bold text-text-primary truncate">{merchant.name}</p>
                                                    <p className="text-sm font-black font-display text-text-primary">¥{merchant.value.toLocaleString()}</p>
                                                </div>
                                                <div className="w-full bg-background-section rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full rounded-full transition-all"
                                                        style={{ width: `${merchant.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* 平台服务分成配置选项卡 */}
                {activeTab === '服务配置' && (
                    <div className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden animate-in fade-in">
                        <div className="px-6 py-5 border-b border-border-light flex flex-col sm:flex-row sm:items-center justify-between bg-background-section gap-4">
                            <div>
                                <h3 className="text-lg font-extrabold text-text-primary tracking-tight">平台服务分成配置</h3>
                                <p className="text-sm font-medium text-text-secondary mt-0.5">分成比例通过平台服务订阅机制管理，商家订阅服务时按服务费率计算分成</p>
                            </div>
                            <button
                                onClick={handleManageServices}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-primary active:scale-95 whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined text-[18px]">settings</span>
                                管理服务
                            </button>
                        </div>

                        {platformServices.length === 0 ? (
                            <div className="p-20 text-center">
                                <span className="material-symbols-outlined text-6xl text-text-disabled mb-4">inventory_2</span>
                                <p className="text-text-secondary font-bold mb-4">暂无平台服务数据</p>
                                <button
                                    onClick={handleManageServices}
                                    className="text-primary hover:opacity-80 font-bold text-sm underline"
                                >
                                    前往服务管理创建服务
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-background-section border-b border-border-light">
                                        <tr>
                                            {/* 遵循北欧规范：首列靠左，其余绝对居中 */}
                                            <th className="px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest text-left whitespace-nowrap">服务名称</th>
                                            <th className="px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">服务类型</th>
                                            <th className="px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">服务费率</th>
                                            <th className="px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">状态</th>
                                            <th className="px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">订阅商家数</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light">
                                        {platformServices
                                            .filter(service =>
                                                !searchTerm ||
                                                (service.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                (service.category || '').toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .map((service) => {
                                                const serviceType = service.category || service.type || 'PAYMENT';
                                                
                                                // 动态映射中英文服务类型
                                                const typeMapping = {
                                                    '支付服务': '基础服务',
                                                    '配送服务': '配送服务',
                                                    '营销服务': '流量服务',
                                                    '数据分析': '运营服务',
                                                    '其他服务': '运营服务',
                                                    'PAYMENT': '基础服务',
                                                    'DELIVERY': '配送服务',
                                                    'MARKETING': '流量服务',
                                                    'ANALYTICS': '运营服务',
                                                    'DATA_ANALYTICS': '运营服务',
                                                    'OTHERS': '运营服务',
                                                    'BASIC': '基础服务',
                                                    'TRAFFIC': '流量服务',
                                                    'OPERATION': '运营服务'
                                                };
                                                const displayType = typeMapping[serviceType] || serviceType || '-';
                                                const typeColor = CATEGORY_COLORS[displayType] || CATEGORY_COLORS.DEFAULT;
                                                
                                                return (
                                                    <tr key={service.id} className="hover:bg-surface-hover transition-colors">
                                                        <td className="px-6 py-5 whitespace-nowrap text-left">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-10 bg-primary-soft text-primary rounded-xl flex items-center justify-center shrink-0">
                                                                    <span className="material-symbols-outlined text-[20px]">{service.icon || 'widgets'}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <p className="text-base font-extrabold text-text-primary mb-0.5">{service.name || service.serviceName}</p>
                                                                    <p className="text-xs font-medium text-text-secondary truncate max-w-[200px]">{service.description || '-'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-md ${typeColor}`}>
                                                                {displayType}
                                                            </span>
                                                        </td>
                                                        {/* 服务费率：统一为黑色、小字号的粗体，对标 ServicesNew.jsx */}
                                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                                            <span className="text-sm font-black text-text-primary tracking-tight">
                                                                {(() => {
                                                                    if (service.feeRate) return `${(service.feeRate * 100).toFixed(1)}%`;
                                                                    else if (service.commissionRate) return `${service.commissionRate}%`;
                                                                    else return service.feeDisplay || '-';
                                                                })()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                                            <div className="flex items-center justify-center">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${service.status === '已启用' || service.status === 'ACTIVE' || service.status === 'active'
                                                                    ? 'bg-success-bg text-success border border-success/20'
                                                                    : 'bg-background-section text-text-secondary border border-border-light'
                                                                    }`}>
                                                                    <span className="material-symbols-outlined text-[14px]">
                                                                        {service.status === '已启用' || service.status === 'ACTIVE' || service.status === 'active' ? 'check_circle' : 'cancel'}
                                                                    </span>
                                                                    {service.status === '已启用' || service.status === 'ACTIVE' || service.status === 'active' ? '已启用' : '已停用'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                                            {/* 兼容各种可能的后端字段名，兜底为 0 */}
                                                            <span className="text-sm font-black text-text-primary">
                                                                {service.subscriberCount || service.subscriptionCount || service.merchantCount || service.subscribers || 0} 家
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 全局定制化 Modal 弹窗 */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
                        <div className="p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 bg-info-bg text-info">
                                <span className="material-symbols-outlined text-[28px]">info</span>
                            </div>
                            <h3 className="text-lg font-extrabold text-text-primary mb-2">提示</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">{dialog.message}</p>
                        </div>
                        <div className="px-6 py-4 bg-background-section border-t border-border-light flex justify-center gap-3">
                            <button
                                onClick={dialog.onConfirm}
                                className="flex-1 py-2.5 rounded-xl font-bold bg-primary text-white hover:opacity-90 transition-colors shadow-primary text-sm"
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Commissions;