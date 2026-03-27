import React, { useState, useEffect } from 'react';
import platformService from '../../services/admin/platformService';

const Services = () => {
    const [services, setServices] = useState([]);
    const [statistics, setStatistics] = useState({
        totalServices: 0,
        activeServices: 0,
        totalRevenue: 0,
        totalSubscribers: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);

    // 全局定制化弹窗状态
    const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
    const showConfirm = (message, onConfirmCallback) => setDialog({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
    const showAlert = (message) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });

    const fetchServicesData = async () => {
        try {
            setLoading(true);
            setError(null);
            const servicesData = await platformService.getServices();

            if (Array.isArray(servicesData)) {
                setServices(servicesData);
            } else if (servicesData?.content) {
                setServices(servicesData.content);
            } else {
                setServices([]);
            }

            try {
                const statsData = await platformService.getServiceStatistics();
                if (statsData) {
                    setStatistics({
                        totalServices: statsData.totalServices || servicesData?.length || 0,
                        activeServices: statsData.activeServices || 0,
                        totalRevenue: statsData.totalRevenue || 0,
                        totalSubscribers: statsData.totalSubscribers || 0
                    });
                }
            } catch (statsErr) {
                const serviceList = Array.isArray(servicesData) ? servicesData : (servicesData?.content || []);
                setStatistics({
                    totalServices: serviceList.length,
                    activeServices: serviceList.filter(s => s.status === 'ACTIVE').length,
                    totalRevenue: 0,
                    totalSubscribers: 0
                });
            }
        } catch (err) {
            console.error('获取平台服务失败:', err);
            setError('获取数据失败，请检查网络连接');
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServicesData();
    }, []);

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || service.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeText = (type) => {
        const typeMap = {
            promotion: '推广服务',
            analytics: '数据分析',
            support: '扶持服务',
            delivery: '配送服务',
            payment: '支付服务',
            marketing: '营销服务'
        };
        return typeMap[type] || type;
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            active: { text: '启用中', color: 'text-success bg-success-bg border border-success/20' },
            inactive: { text: '已停用', color: 'text-error bg-error-bg border border-error/20' },
            pending: { text: '待审核', color: 'text-warning bg-warning-bg border border-warning/20' }
        };
        return statusMap[status] || statusMap.pending;
    };

    const formatNumber = (num) => {
        if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    const handleToggleStatus = (service) => {
        const isActivating = service.status !== 'active';
        const actionStr = isActivating ? '启用' : '停用';
        showConfirm(`确定要${actionStr}服务 "${service.name}" 吗？`, () => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            // Mock API Call
            showAlert(`操作成功：服务已${actionStr}。`);
            fetchServicesData();
        });
    };

    const ServiceCard = ({ service }) => {
        const statusInfo = getStatusInfo(service.status);

        return (
            <div className="bg-surface rounded-2xl p-6 border border-border-light hover:shadow-card hover:border-primary/30 transition-all duration-300 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-bg rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[28px]">
                                {service.icon || 'star'}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-text-primary text-lg">{service.name}</h3>
                            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mt-0.5">{getTypeText(service.type)}</p>
                        </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${statusInfo.color}`}>
                        {statusInfo.text}
                    </span>
                </div>

                <p className="text-text-secondary text-sm leading-relaxed mb-6 min-h-[40px]">{service.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-6 text-center bg-background-section p-4 rounded-xl border border-border-light">
                    <div className="flex flex-col gap-1">
                        <div className="text-xl font-black font-display text-text-primary">
                            {service.price === 0 ? '免费' : `¥${service.price}`}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-text-tertiary">
                            {service.price > 0 ? `/${service.period === 'month' ? '月' : '年'}` : '收费模式'}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 border-x border-border-light">
                        <div className="text-xl font-black font-display text-text-primary">
                            {formatNumber(service.subscribers)}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-text-tertiary">订阅数</div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-sm font-bold text-text-primary mt-1">{service.target || '不限'}</div>
                        <div className="text-[10px] font-bold uppercase text-text-tertiary mt-auto">目标客群</div>
                    </div>
                </div>

                <div className="mb-6 flex-1">
                    <h4 className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-widest">包含特性</h4>
                    <div className="flex flex-wrap gap-2">
                        {service.features?.map((feature, index) => (
                            <span key={index} className="px-2.5 py-1 bg-surface border border-border-light text-xs font-medium text-text-secondary rounded-md shadow-sm">
                                {feature}
                            </span>
                        )) || <span className="text-sm text-text-tertiary">暂无特性说明</span>}
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border-light">
                    <button className="flex-1 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl text-sm font-bold shadow-primary transition-all">
                        查看详情
                    </button>
                    <button className="flex items-center justify-center p-2.5 bg-surface border border-border-light hover:bg-surface-hover text-text-secondary rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button 
                        onClick={() => handleToggleStatus(service)}
                        className={`flex items-center justify-center p-2.5 rounded-xl border transition-colors ${service.status === 'active'
                        ? 'border-error/20 text-error hover:bg-error-bg'
                        : 'border-success/20 text-success hover:bg-success-bg'
                        }`}
                        title={service.status === 'active' ? '停用' : '启用'}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {service.status === 'active' ? 'block' : 'check_circle'}
                        </span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500">
            <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
                {/* 页面头部 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">平台服务</h1>
                        <p className="text-text-secondary text-sm font-medium">配置、管理平台提供的各项增值与基础服务</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="h-10 px-6 bg-primary hover:opacity-90 text-white rounded-xl font-bold flex items-center gap-2 shadow-primary transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        新建服务
                    </button>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="bg-error-bg border border-error/20 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                        <span className="material-symbols-outlined text-error text-[20px]">error</span>
                        <p className="text-error font-bold text-sm">{error}</p>
                    </div>
                )}

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-surface rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-card transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">总服务数</p>
                                <p className="text-3xl font-extrabold text-text-primary mt-1 tracking-tight">
                                    {loading ? '...' : statistics.totalServices}
                                </p>
                            </div>
                            <div className="size-12 bg-info-bg rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-info text-[24px]">miscellaneous_services</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-card transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">启用中</p>
                                <p className="text-3xl font-extrabold text-success mt-1 tracking-tight">
                                    {loading ? '...' : statistics.activeServices}
                                </p>
                            </div>
                            <div className="size-12 bg-success-bg rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-success text-[24px]">check_circle</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-card transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">总订阅数</p>
                                <p className="text-3xl font-extrabold text-primary mt-1 tracking-tight">
                                    {loading ? '...' : formatNumber(statistics.totalSubscribers)}
                                </p>
                            </div>
                            <div className="size-12 bg-primary-bg rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[24px]">group</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-card transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">总营收</p>
                                <p className="text-3xl font-extrabold text-warning mt-1 tracking-tight font-display">
                                    {loading ? '...' : `¥${statistics.totalRevenue.toLocaleString()}`}
                                </p>
                            </div>
                            <div className="size-12 bg-warning-bg rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-warning text-[24px]">payments</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 搜索和筛选 */}
                <div className="bg-surface p-4 rounded-2xl border border-border-light shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="w-full lg:max-w-md relative group">
                        <input
                            type="text"
                            placeholder="搜索服务名称..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 rounded-xl bg-background-section border border-transparent focus:border-border-light text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all outline-none"
                        />
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors text-[20px]">search</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-11 px-4 border border-border-light rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold cursor-pointer"
                        >
                            <option value="all">全部类型</option>
                            <option value="promotion">推广服务</option>
                            <option value="analytics">数据分析</option>
                            <option value="support">扶持服务</option>
                            <option value="delivery">配送服务</option>
                            <option value="payment">支付服务</option>
                            <option value="marketing">营销服务</option>
                        </select>
                        <button
                            onClick={fetchServicesData}
                            className="flex items-center justify-center h-11 w-11 bg-surface border border-border-light text-text-secondary rounded-xl hover:bg-surface-hover hover:text-primary transition-colors shadow-sm"
                            title="刷新"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                    </div>
                </div>

                {/* 服务列表 */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="flex flex-col items-center gap-3 text-text-tertiary">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="font-bold text-sm">加载中...</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                                <ServiceCard key={service.id} service={service} />
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-surface border border-dashed border-border-light rounded-2xl">
                                <div className="bg-background-section p-6 rounded-full mb-4">
                                    <span className="material-symbols-outlined text-text-disabled text-5xl">miscellaneous_services</span>
                                </div>
                                <h3 className="text-lg font-extrabold text-text-primary mb-1">没有找到符合条件的服务</h3>
                                <p className="text-sm font-medium text-text-secondary mb-5">尝试调整搜索条件或创建新的服务</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl font-bold shadow-primary transition-all text-sm"
                                >
                                    创建第一个服务
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 新建服务 Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
                        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-background-section">
                            <h3 className="text-lg font-bold text-text-primary">新建平台服务</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-center py-10 text-text-secondary font-bold border border-dashed border-border-light rounded-xl">
                                表单内容待接入真实后端接口...
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-background border-t border-border-light flex justify-end gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-surface transition-colors border border-border-light shadow-sm text-sm">
                                取消
                            </button>
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl font-bold bg-primary text-white hover:opacity-90 transition-colors shadow-primary text-sm">
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 全局基础定制化 Modal */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
                        <div className="p-6 text-center">
                            <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${
                                dialog.type === 'confirm' ? 'bg-primary-soft text-primary' : 'bg-info-bg text-info'
                            }`}>
                                <span className="material-symbols-outlined text-[28px]">
                                    {dialog.type === 'confirm' ? 'help' : 'info'}
                                </span>
                            </div>
                            <h3 className="text-lg font-extrabold text-text-primary mb-2">
                                {dialog.type === 'confirm' ? '确认操作' : '提示'}
                            </h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                {dialog.message}
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-background-section border-t border-border-light flex justify-center gap-3">
                            {dialog.type === 'confirm' && (
                                <button
                                    onClick={() => setDialog({ ...dialog, isOpen: false })}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-surface transition-colors border border-border-light shadow-sm text-sm"
                                >
                                    取消
                                </button>
                            )}
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

export default Services;