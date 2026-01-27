import React, { useState, useEffect } from 'react';
import platformService from '../../services/admin/platformService';

// 服务分类标签颜色配置
const CATEGORY_COLORS = {
    PAYMENT: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400',
    DELIVERY: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400',
    MARKETING: 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400',
    DATA_ANALYTICS: 'bg-orange-100 text-orange-800 dark:bg-orange-500/10 dark:text-orange-400'
};

// 服务状态标签组件
const StatusBadge = ({ status }) => {
    const statusConfig = {
        ACTIVE: { text: '已启用', class: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400', icon: 'check_circle' },
        INACTIVE: { text: '已禁用', class: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400', icon: 'cancel' },
        DRAFT: { text: '草稿', class: 'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400', icon: 'draft' }
    };

    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
            <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
            {config.text}
        </span>
    );
};

// 计费类型标签组件
const FeeTypeBadge = ({ feeType, feeDisplay }) => {
    const typeConfig = {
        PERCENTAGE: { text: '百分比', class: 'bg-blue-100 text-blue-800', icon: 'percent' },
        FIXED: { text: '固定', class: 'bg-green-100 text-green-800', icon: 'payments' },
        TIERED: { text: '阶梯', class: 'bg-purple-100 text-purple-800', icon: 'trending_up' }
    };

    const config = typeConfig[feeType] || typeConfig.FIXED;

    return (
        <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.class}`}>
                <span className="material-symbols-outlined text-[12px]">{config.icon}</span>
                {config.text}
            </span>
            <span className="text-sm font-medium text-gray-900">{feeDisplay}</span>
        </div>
    );
};

// 服务表单对话框组件
const ServiceFormModal = ({ isOpen, onClose, service = null, onSave }) => {
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
            // 验证表单
            const newErrors = {};
            if (!formData.serviceName.trim()) newErrors.serviceName = '服务名称不能为空';
            if (!formData.serviceCode.trim()) newErrors.serviceCode = '服务代码不能为空';
            if (formData.feeValue < 0) newErrors.feeValue = '费用不能为负数';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            if (service) {
                await platformService.updateService(service.id, formData);
            } else {
                await platformService.createService(formData);
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="fixed inset-0 bg-black opacity-25" onClick={onClose}></div>
                <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            {service ? '编辑服务' : '新增服务'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.general && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{errors.general}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    服务名称 *
                                </label>
                                <input
                                    type="text"
                                    className={`w-full p-2 border rounded-md ${errors.serviceName ? 'border-red-300' : 'border-gray-300'}`}
                                    value={formData.serviceName}
                                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                                />
                                {errors.serviceName && <p className="text-xs text-red-600 mt-1">{errors.serviceName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    服务代码 *
                                </label>
                                <input
                                    type="text"
                                    className={`w-full p-2 border rounded-md ${errors.serviceCode ? 'border-red-300' : 'border-gray-300'}`}
                                    value={formData.serviceCode}
                                    onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                                />
                                {errors.serviceCode && <p className="text-xs text-red-600 mt-1">{errors.serviceCode}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    服务类别
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    计费类型
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.feeType}
                                    onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                                >
                                    <option value="PERCENTAGE">百分比</option>
                                    <option value="FIXED">固定费用</option>
                                    <option value="TIERED">阶梯计费</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    费用值
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className={`w-full p-2 border rounded-md ${errors.feeValue ? 'border-red-300' : 'border-gray-300'}`}
                                    value={formData.feeValue}
                                    onChange={(e) => setFormData({ ...formData, feeValue: parseFloat(e.target.value) || 0 })}
                                />
                                {errors.feeValue && <p className="text-xs text-red-600 mt-1">{errors.feeValue}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    计费周期
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                服务描述
                            </label>
                            <textarea
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    最小订单金额
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.minOrderAmount}
                                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    排序顺序
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isMandatory"
                                className="rounded border-gray-300 text-blue-600"
                                checked={formData.isMandatory}
                                onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                            />
                            <label htmlFor="isMandatory" className="ml-2 text-sm text-gray-700">
                                必选服务
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </form>
                </div>
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

    // 加载服务列表
    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await platformService.getAllServices();
            setServices(response || []);
        } catch (error) {
            console.error('获取服务列表失败:', error);
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

    // 切换服务状态
    const handleToggleStatus = async (serviceId) => {
        try {
            await platformService.toggleServiceStatus(serviceId);
            fetchServices();
        } catch (error) {
            console.error('切换服务状态失败:', error);
        }
    };

    // 删除服务
    const handleDeleteService = async (serviceId) => {
        if (!window.confirm('确定要删除这个服务吗？')) return;

        try {
            await platformService.deleteService(serviceId);
            fetchServices();
        } catch (error) {
            console.error('删除服务失败:', error);
        }
    };

    // 批量操作
    const handleBatchOperation = async (operation) => {
        if (selectedServices.length === 0) return;

        try {
            if (operation === 'activate') {
                await platformService.batchUpdateServices(selectedServices, { status: 'ACTIVE' });
            } else if (operation === 'deactivate') {
                await platformService.batchUpdateServices(selectedServices, { status: 'INACTIVE' });
            }

            setSelectedServices([]);
            fetchServices();
        } catch (error) {
            console.error('批量操作失败:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f7f6] text-[#1b140d] font-['Inter']">
            <div className="space-y-8 p-6 md:p-8">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b140d]">服务管理</h1>
                        <p className="text-[#9a734c] text-base">管理平台提供的各类增值服务</p>
                    </div>
                    <button
                        onClick={() => setShowServiceModal(true)}
                        className="flex items-center gap-2 h-10 px-4 bg-[#ee8c2b] text-white rounded-lg text-sm font-bold hover:bg-[#d97b1e] shadow-sm"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        <span>新增服务</span>
                    </button>
                </div>

                {/* 筛选和搜索栏 */}
                <div className="bg-white rounded-xl border border-[#e7dbcf] shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="搜索服务名称或代码..."
                                    className="w-full pl-10 pr-4 py-2 border border-[#e7dbcf] rounded-md focus:ring-2 focus:ring-[#ee8c2b] focus:border-[#ee8c2b]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <select
                                className="px-3 py-2 border border-[#e7dbcf] rounded-md"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">全部状态</option>
                                <option value="ACTIVE">已启用</option>
                                <option value="INACTIVE">已禁用</option>
                                <option value="DRAFT">草稿</option>
                            </select>
                            <select
                                className="px-3 py-2 border border-[#e7dbcf] rounded-md"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">全部类别</option>
                                <option value="PAYMENT">支付服务</option>
                                <option value="DELIVERY">配送服务</option>
                                <option value="MARKETING">营销服务</option>
                                <option value="DATA_ANALYTICS">数据分析</option>
                            </select>
                        </div>
                    </div>

                    {selectedServices.length > 0 && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                            <span className="text-sm text-gray-600">
                                已选择 {selectedServices.length} 项
                            </span>
                            <button
                                onClick={() => handleBatchOperation('activate')}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                            >
                                批量启用
                            </button>
                            <button
                                onClick={() => handleBatchOperation('deactivate')}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                            >
                                批量禁用
                            </button>
                        </div>
                    )}
                </div>

                {/* 服务列表 */}
                <div className="bg-white rounded-lg shadow-sm border">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="text-gray-600">加载中...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-900">服务信息</th>
                                        <th className="text-left p-4 font-medium text-gray-900">类别</th>
                                        <th className="text-left p-4 font-medium text-gray-900">计费方式</th>
                                        <th className="text-left p-4 font-medium text-gray-900">状态</th>
                                        <th className="text-left p-4 font-medium text-gray-900">订阅数</th>
                                        <th className="text-left p-4 font-medium text-gray-900">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredServices.map((service) => (
                                        <tr key={service.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {service.serviceName}
                                                    </div>
                                                    {service.description && (
                                                        <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                                            {service.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${CATEGORY_COLORS[service.category] || CATEGORY_COLORS.PAYMENT}`}>
                                                    {service.categoryName || service.category}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <FeeTypeBadge
                                                    feeType={service.feeType}
                                                    feeDisplay={service.feeDisplay}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <StatusBadge status={service.status} />
                                                {service.isMandatory && (
                                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                                        必选
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-medium">
                                                    {service.subscriptionCount || 0}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(service.id)}
                                                        className={`p-1.5 rounded text-white text-sm ${service.status === 'ACTIVE'
                                                            ? 'bg-red-600 hover:bg-red-700'
                                                            : 'bg-green-600 hover:bg-green-700'
                                                            }`}
                                                        title={service.status === 'ACTIVE' ? '禁用' : '启用'}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">
                                                            {service.status === 'ACTIVE' ? 'pause' : 'play_arrow'}
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingService(service);
                                                            setShowServiceModal(true);
                                                        }}
                                                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                        title="编辑"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteService(service.id)}
                                                        className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                                                        title="删除"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredServices.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-3">
                                        <span className="material-symbols-outlined text-[48px]">inbox</span>
                                    </div>
                                    <p className="text-gray-500">暂无服务数据</p>
                                </div>
                            )}
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
                />
            </div>
        </div>
    );
};

export default Services;