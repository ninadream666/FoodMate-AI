import React, { useState, useEffect } from 'react';
import platformService from '../../services/admin/platformService';

// 服务分类标签颜色配置
const CATEGORY_COLORS = {
    '基础服务': 'bg-primary-bg text-primary border border-primary/20',        // 品牌橙
    'PAYMENT': 'bg-primary-bg text-primary border border-primary/20',         
    '配送服务': 'bg-warning-bg text-warning border border-warning/20',       // 暖黄橙
    'DELIVERY': 'bg-warning-bg text-warning border border-warning/20',        
    '流量服务': 'bg-error-bg text-error border border-error/20',            // 砖红橙
    'MARKETING': 'bg-error-bg text-error border border-error/20',             
    '运营服务': 'bg-[#FDF8F3] text-[#B45309] border border-[#B45309]/20', // 焦糖橙
    'DATA_ANALYTICS': 'bg-[#FDF8F3] text-[#B45309] border border-[#B45309]/20', 
    'DEFAULT': 'bg-background-section text-text-secondary border border-border-light'
};

// 服务状态标签组件
const StatusBadge = ({ status }) => {
    const statusConfig = {
        ACTIVE: { text: '已启用', class: 'bg-success-bg text-success border border-success/20', icon: 'check_circle' },
        INACTIVE: { text: '已禁用', class: 'bg-error-bg text-error border border-error/20', icon: 'cancel' },
        DRAFT: { text: '草稿', class: 'bg-background-section text-text-secondary border border-border-light', icon: 'draft' }
    };

    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${config.class}`}>
            <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
            {config.text}
        </span>
    );
};

// 计费类型标签组件
const FeeTypeBadge = ({ feeType, feeDisplay }) => {
    const unifiedClass = 'bg-surface text-text-secondary border border-border-light shadow-sm';
    
    const typeConfig = {
        PERCENTAGE: { text: '百分比', class: unifiedClass, icon: 'percent' },
        FIXED: { text: '固定', class: unifiedClass, icon: 'payments' },
        TIERED: { text: '阶梯', class: unifiedClass, icon: 'trending_up' }
    };

    const config = typeConfig[feeType] || typeConfig.FIXED;

    return (
        <div className="flex items-center justify-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${config.class}`}>
                <span className="material-symbols-outlined text-[12px]">{config.icon}</span>
                {config.text}
            </span>
            <span className="text-sm font-bold text-text-primary">{feeDisplay}</span>
        </div>
    );
};

// 服务表单对话框组件
const ServiceFormModal = ({ isOpen, onClose, service = null, onSave, showAlert }) => {
    const [formData, setFormData] = useState({
        serviceName: '',
        serviceCode: '',
        category: 'PAYMENT',
        description: '',
        feeType: 'PERCENTAGE',
        feeValue: 0,
        billingCycle: 'MONTHLY',
        minOrderAmount: 0,
        isMandatory: false,
        sortOrder: 0
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (service) {
            setFormData({
                serviceName: service.serviceName || '',
                serviceCode: service.serviceCode || '',
                category: service.category || 'PAYMENT',
                description: service.description || '',
                feeType: service.feeType || 'PERCENTAGE',
                feeValue: service.feeValue || 0,
                billingCycle: service.billingCycle || 'MONTHLY',
                minOrderAmount: service.minOrderAmount || 0,
                isMandatory: service.isMandatory || false,
                sortOrder: service.sortOrder || 0
            });
        } else {
            setFormData({
                serviceName: '',
                serviceCode: '',
                category: 'PAYMENT',
                description: '',
                feeType: 'PERCENTAGE',
                feeValue: 0,
                billingCycle: 'MONTHLY',
                minOrderAmount: 0,
                isMandatory: false,
                sortOrder: 0
            });
        }
        setErrors({});
    }, [service, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const newErrors = {};
            if (!formData.serviceName.trim()) newErrors.serviceName = '服务名称不能为空';
            if (!formData.serviceCode.trim()) newErrors.serviceCode = '服务代码不能为空';
            if (formData.feeValue < 0) newErrors.feeValue = '费用不能为负数';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setLoading(false);
                return;
            }

            if (service) {
                await platformService.updateService(service.id, formData);
                showAlert('服务修改成功');
            } else {
                await platformService.createService(formData);
                showAlert('新服务创建成功');
            }

            onSave();
            onClose();
        } catch (error) {
            setErrors({ general: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
                <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-background-section">
                    <h3 className="text-lg font-extrabold text-text-primary">
                        {service ? '编辑服务' : '新增服务'}
                    </h3>
                    <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-background">
                    {errors.general && (
                        <div className="p-4 bg-error-bg border border-error/20 rounded-xl flex items-center gap-2 text-error text-sm font-bold">
                            <span className="material-symbols-outlined">error</span>
                            {errors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">服务名称 <span className="text-error">*</span></label>
                            <input
                                type="text"
                                className={`w-full h-11 px-4 rounded-xl bg-surface border ${errors.serviceName ? 'border-error ring-1 ring-error/20' : 'border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20'} text-text-primary text-sm outline-none transition-all`}
                                value={formData.serviceName}
                                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                            />
                            {errors.serviceName && <p className="text-xs text-error mt-1.5 font-bold">{errors.serviceName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">服务代码 <span className="text-error">*</span></label>
                            <input
                                type="text"
                                className={`w-full h-11 px-4 rounded-xl bg-surface border ${errors.serviceCode ? 'border-error ring-1 ring-error/20' : 'border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20'} text-text-primary text-sm outline-none transition-all`}
                                value={formData.serviceCode}
                                onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                            />
                            {errors.serviceCode && <p className="text-xs text-error mt-1.5 font-bold">{errors.serviceCode}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">服务类别</label>
                            <select
                                className="w-full h-11 px-4 rounded-xl bg-surface border border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20 text-text-primary text-sm font-bold outline-none transition-all"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="PAYMENT">支付服务</option>
                                <option value="DELIVERY">配送服务</option>
                                <option value="MARKETING">营销服务</option>
                                <option value="DATA_ANALYTICS">数据分析</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">计费类型</label>
                            <select
                                className="w-full h-11 px-4 rounded-xl bg-surface border border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20 text-text-primary text-sm font-bold outline-none transition-all"
                                value={formData.feeType}
                                onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                            >
                                <option value="PERCENTAGE">百分比</option>
                                <option value="FIXED">固定费用</option>
                                <option value="TIERED">阶梯计费</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">费用值</label>
                            <input
                                type="number"
                                step="0.01"
                                className={`w-full h-11 px-4 rounded-xl bg-surface border ${errors.feeValue ? 'border-error ring-1 ring-error/20' : 'border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20'} text-text-primary text-sm outline-none transition-all`}
                                value={formData.feeValue}
                                onChange={(e) => setFormData({ ...formData, feeValue: parseFloat(e.target.value) || 0 })}
                            />
                            {errors.feeValue && <p className="text-xs text-error mt-1.5 font-bold">{errors.feeValue}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">计费周期</label>
                            <select
                                className="w-full h-11 px-4 rounded-xl bg-surface border border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20 text-text-primary text-sm font-bold outline-none transition-all"
                                value={formData.billingCycle}
                                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                            >
                                <option value="DAILY">每日</option>
                                <option value="WEEKLY">每周</option>
                                <option value="MONTHLY">每月</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-primary mb-1.5">服务描述</label>
                        <textarea
                            rows={3}
                            className="w-full p-4 rounded-xl bg-surface border border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20 text-text-primary text-sm outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">最小订单金额</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full h-11 px-4 rounded-xl bg-surface border border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20 text-text-primary text-sm outline-none transition-all"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-primary mb-1.5">排序顺序</label>
                            <input
                                type="number"
                                className="w-full h-11 px-4 rounded-xl bg-surface border border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20 text-text-primary text-sm outline-none transition-all"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border-light">
                        <span className="text-sm font-bold text-text-primary">是否设为必选服务</span>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isMandatory: !formData.isMandatory })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ml-auto ${formData.isMandatory ? 'bg-primary' : 'bg-border'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isMandatory ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border-light">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-surface border border-border-light shadow-sm transition-colors text-sm"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:opacity-90 shadow-primary transition-all active:scale-95 text-sm disabled:opacity-50"
                        >
                            {loading ? '保存中...' : '保存修改'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 平台服务管理主页面
const Services = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedServices, setSelectedServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [editingService, setEditingService] = useState(null);

    // 全局定制化弹窗状态
    const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
    const showConfirm = (message, onConfirmCallback) => setDialog({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
    const showAlert = (message) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });

    // 加载服务列表
    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await platformService.getAllServices();
            setServices(response || []);
        } catch (error) {
            console.error('获取服务列表失败:', error);
            showAlert('获取服务列表失败，请检查网络');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // 筛选服务
    const filteredServices = services.filter(service => {
        const matchesSearch = service.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.serviceCode?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    // 单项/全选复选框处理
    const handleSelectService = (id) => {
        setSelectedServices(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedServices(filteredServices.map(s => s.id));
        } else {
            setSelectedServices([]);
        }
    };

    // 切换服务状态
    const handleToggleStatus = (service) => {
        const actionStr = service.status === 'ACTIVE' ? '禁用' : '启用';
        showConfirm(`确定要${actionStr}服务 "${service.serviceName}" 吗？`, async () => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            try {
                await platformService.toggleServiceStatus(service.id);
                fetchServices();
                showAlert(`操作成功，服务已${actionStr}`);
            } catch (error) {
                console.error('切换服务状态失败:', error);
                showAlert(`操作失败: ${error.message}`);
            }
        });
    };

    // 删除服务
    const handleDeleteService = (service) => {
        showConfirm(`确定要彻底删除 "${service.serviceName}" 吗？此操作无法恢复。`, async () => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            try {
                await platformService.deleteService(service.id);
                fetchServices();
                showAlert('服务已成功删除');
            } catch (error) {
                console.error('删除服务失败:', error);
                showAlert(`删除失败: ${error.message}`);
            }
        });
    };

    // 批量操作
    const handleBatchOperation = async (operation) => {
        if (selectedServices.length === 0) return;

        const actionText = operation === 'activate' ? '启用' : '禁用';
        showConfirm(`确定要批量${actionText}选中的 ${selectedServices.length} 个服务吗？`, async () => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            try {
                if (operation === 'activate') {
                    await platformService.batchUpdateServices(selectedServices, { status: 'ACTIVE' });
                } else if (operation === 'deactivate') {
                    await platformService.batchUpdateServices(selectedServices, { status: 'INACTIVE' });
                }

                setSelectedServices([]);
                fetchServices();
                showAlert(`已批量${actionText}所选服务`);
            } catch (error) {
                console.error('批量操作失败:', error);
                showAlert(`批量操作失败: ${error.message}`);
            }
        });
    };

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500 min-h-screen">
            <div className="space-y-6 p-6 md:p-8 max-w-[1400px] mx-auto">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">服务管理</h1>
                        <p className="text-text-secondary text-sm font-medium">配置、管理平台提供的各项增值与基础服务</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingService(null);
                            setShowServiceModal(true);
                        }}
                        className="flex items-center justify-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-primary transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span>新增服务</span>
                    </button>
                </div>

                {/* 筛选和搜索栏 */}
                <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4 flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                        <div className="w-full lg:max-w-md relative group">
                            <input
                                type="text"
                                placeholder="搜索服务名称或代码..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-11 pl-11 pr-4 rounded-xl bg-background-section border border-transparent focus:border-border-light text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all outline-none"
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors text-[20px]">search</span>
                        </div>
                        <div className="flex gap-2 items-center flex-wrap">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-11 px-4 border border-border-light rounded-xl bg-surface text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <option value="all">全部状态</option>
                                <option value="ACTIVE">已启用</option>
                                <option value="INACTIVE">已禁用</option>
                                <option value="DRAFT">草稿</option>
                            </select>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="h-11 px-4 border border-border-light rounded-xl bg-surface text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <option value="all">全部类别</option>
                                <option value="PAYMENT">支付服务</option>
                                <option value="DELIVERY">配送服务</option>
                                <option value="MARKETING">营销服务</option>
                                <option value="DATA_ANALYTICS">数据分析</option>
                            </select>
                            <button
                                onClick={fetchServices}
                                className="flex items-center justify-center h-11 w-11 bg-surface border border-border-light text-text-secondary rounded-xl hover:bg-surface-hover hover:text-primary transition-colors shadow-sm"
                                title="刷新"
                            >
                                <span className="material-symbols-outlined text-[20px]">refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* 批量操作控制台 */}
                    {selectedServices.length > 0 && (
                        <div className="flex items-center gap-3 pt-3 border-t border-border-light animate-in fade-in slide-in-from-top-1">
                            <span className="text-sm font-bold text-text-primary bg-primary-soft text-primary px-3 py-1.5 rounded-lg border border-primary/20">
                                已选择 {selectedServices.length} 项
                            </span>
                            <button
                                onClick={() => handleBatchOperation('activate')}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-success-bg text-success border border-success/20 rounded-lg text-sm font-bold hover:bg-success hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                批量启用
                            </button>
                            <button
                                onClick={() => handleBatchOperation('deactivate')}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-error-bg text-error border border-error/20 rounded-lg text-sm font-bold hover:bg-error hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">cancel</span>
                                批量禁用
                            </button>
                        </div>
                    )}
                </div>

                {/* 服务列表表格 */}
                <div className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-24">
                            <div className="flex flex-col items-center gap-3 text-text-tertiary">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <span className="font-bold text-sm">加载中...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-background-section border-b border-border-light">
                                    <tr>
                                        <th className="px-6 py-4 text-center w-12">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/50"
                                                checked={filteredServices.length > 0 && selectedServices.length === filteredServices.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-left whitespace-nowrap w-[35%]">服务信息</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">类别</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">计费方式</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">状态</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">订阅数</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {filteredServices.length > 0 ? (
                                        filteredServices.map(service => {
                                            return (
                                                <tr key={service.id} className={`hover:bg-surface-hover transition-colors ${selectedServices.includes(service.id) ? 'bg-primary-soft/30' : ''}`}>
                                                    <td className="px-6 py-5 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/50"
                                                            checked={selectedServices.includes(service.id)}
                                                            onChange={() => handleSelectService(service.id)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-5 text-left">
                                                        <div className="flex flex-col">
                                                            <p className="font-extrabold text-text-primary text-base mb-0.5">{service.serviceName}</p>
                                                            {service.description ? (
                                                                <p className="text-sm text-text-secondary font-medium line-clamp-1" title={service.description}>{service.description}</p>
                                                            ) : (
                                                                <p className="text-sm text-text-tertiary font-medium italic">暂无描述</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        {/* 应用完善的中文类别映射机制 */}
                                                        <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-md ${CATEGORY_COLORS[service.categoryName] || CATEGORY_COLORS[service.category] || CATEGORY_COLORS.DEFAULT}`}>
                                                            {service.categoryName || service.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <FeeTypeBadge
                                                            feeType={service.feeType}
                                                            feeDisplay={service.feeDisplay}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center justify-start gap-2 w-[130px] mx-auto">
                                                            <StatusBadge status={service.status} />
                                                            {service.isMandatory && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-warning bg-warning-bg border border-warning/20 shrink-0 whitespace-nowrap">
                                                                    必选
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="text-sm font-black text-text-primary">
                                                            {service.subscriberCount || service.subscriptionCount || service.merchantCount || service.subscribers || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => handleToggleStatus(service)}
                                                                className={`p-2 rounded-lg transition-colors ${
                                                                    service.status === 'ACTIVE' 
                                                                    ? 'text-text-tertiary hover:text-error hover:bg-error-bg' 
                                                                    : 'text-text-tertiary hover:text-success hover:bg-success-bg'
                                                                }`}
                                                                title={service.status === 'ACTIVE' ? '禁用' : '启用'}
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">
                                                                    {service.status === 'ACTIVE' ? 'pause' : 'play_arrow'}
                                                                </span>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingService(service);
                                                                    setShowServiceModal(true);
                                                                }}
                                                                className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary-soft transition-colors"
                                                                title="编辑"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteService(service)}
                                                                className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error-bg transition-colors"
                                                                title="删除"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="bg-background-section p-6 rounded-full mb-2">
                                                        <span className="material-symbols-outlined text-text-disabled text-5xl">inbox</span>
                                                    </div>
                                                    <h3 className="text-lg font-extrabold text-text-primary mb-1">暂无服务数据</h3>
                                                    <p className="text-sm font-medium text-text-secondary mb-5">尝试调整搜索条件或点击上方新增服务</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 服务表单对话框 */}
                <ServiceFormModal
                    isOpen={showServiceModal}
                    onClose={() => {
                        setShowServiceModal(false);
                        setEditingService(null);
                    }}
                    service={editingService}
                    onSave={fetchServices}
                    showAlert={showAlert}
                />

                {/* 全局基础定制化Modal弹窗 */}
                {dialog.isOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
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
        </div>
    );
};

export default Services;