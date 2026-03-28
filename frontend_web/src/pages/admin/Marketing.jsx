import React, { useState, useEffect } from 'react';
import marketingService from '../../services/admin/marketingService';
import { runMarketingTests } from '../../utils/testMarketingFeatures';
import { testMarketingApiDirectly, checkBackendApiImplementation } from '../../utils/debugMarketingApi';
import { debugCouponIssue } from '../../utils/couponIssueDebug';

// 优惠券类型标签 (北欧语义化配色 - 解决中英混合与颜色区分问题)
const TypeBadge = ({ type }) => {
    // 统一映射表：支持后端返回的各种英文常量和中文名称
    const typeMap = {
        // 满减类 - 使用主色调 (Coral/Primary)
        'DISCOUNT': { text: '满减优惠', class: 'bg-primary-soft text-primary border border-primary/20', icon: 'payments' },
        'THRESHOLD_REDUCTION': { text: '满减优惠', class: 'bg-primary-soft text-primary border border-primary/20', icon: 'payments' },
        '满减优惠': { text: '满减优惠', class: 'bg-primary-soft text-primary border border-primary/20', icon: 'payments' },
        
        // 折扣类 - 使用蓝色调 (Info/Blue)
        'PERCENTAGE': { text: '折扣优惠', class: 'bg-info-bg text-info border border-info/20', icon: 'percent' },
        '折扣优惠': { text: '折扣优惠', class: 'bg-info-bg text-info border border-info/20', icon: 'percent' },
        
        // 配送类 - 使用绿色调 (Success/Green)
        'FREE_DELIVERY': { text: '免配送费', class: 'bg-success-bg text-success border border-success/20', icon: 'local_shipping' },
        'FREE_SHIPPING': { text: '免配送费', class: 'bg-success-bg text-success border border-success/20', icon: 'local_shipping' },
        '免运费券': { text: '免配送费', class: 'bg-success-bg text-success border border-success/20', icon: 'local_shipping' },

        // 无门槛类 - 北欧紫 (补全映射)
        'NO_THRESHOLD': { text: '无门槛券', class: 'bg-purple-100 text-purple-600 border border-purple-200', icon: 'confirmation_number' },

        // 代金券/其他 - 使用黄色调 (Warning/Yellow)
        'CASH': { text: '代金券', class: 'bg-warning-bg text-warning border border-warning/20', icon: 'toll' }
    };

    // 尝试直接匹配或大写匹配
    const config = typeMap[type] || typeMap[String(type || '').toUpperCase()] || { 
        text: type || '未知类型', 
        class: 'bg-background-section text-text-secondary border border-border-light', 
        icon: 'confirmation_number' 
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${config.class}`}>
            <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
            {config.text}
        </span>
    );
};

// 状态标签 (北欧语义化配色 - 优化显示优先级)
const StatusBadge = ({ enabled, isExpired }) => {
    // 逻辑：如果管理员禁用了，优先显示已禁用。如果启用了但时间过了，显示已过期。
    if (!enabled) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-error-bg text-error border border-error/20">
                <span className="material-symbols-outlined text-[14px]">pause_circle</span>
                已禁用
            </span>
        );
    }
    if (isExpired) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-background-section text-text-tertiary border border-border-light">
                <span className="material-symbols-outlined text-[14px]">history</span>
                已过期
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-success-bg text-success border border-success/20">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            启用中
        </span>
    );
};

const Marketing = () => {
    const [couponTemplates, setCouponTemplates] = useState([]);
    const [statistics, setStatistics] = useState({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalReach: 0,
        averageConversion: 0,
        totalBudget: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'DISCOUNT',
        优惠金额: '',
        最大优惠金额: '',
        最低消费金额: '',
        开始时间: '',
        结束时间: '',
        发放数量: '',
        description: ''
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [issueFormData, setIssueFormData] = useState({
        userId: '',
        userIds: '',
        remark: '',
        issueType: '单个发放' // '单个发放' or '批量发放'
    });
    const [issueLoading, setIssueLoading] = useState(false);

    // ================= 全局定制化弹窗状态 (对齐 Users.jsx) =================
    const [dialog, setDialog] = useState({ 
        isOpen: false, 
        type: 'alert', // 'alert' or 'confirm'
        title: '',
        message: '', 
        onConfirm: null 
    });

    const showConfirm = (title, message, onConfirmCallback) => {
        setDialog({ 
            isOpen: true, 
            type: 'confirm', 
            title: title || '确认操作',
            message, 
            onConfirm: () => {
                onConfirmCallback();
                setDialog(prev => ({ ...prev, isOpen: false }));
            } 
        });
    };

    const showAlert = (message, title = '提示') => {
        setDialog({ 
            isOpen: true, 
            type: 'alert', 
            title,
            message, 
            onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) 
        });
    };

    const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));
    // ======================================================================

    // 数据获取函数
    const fetchMarketingData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 开始获取营销数据...');

            // 获取优惠券模板列表
            try {
                console.log('📋 请求优惠券模板列表...');
                let templatesData = null;

                // 首先尝试标准的管理员API路径
                try {
                    templatesData = await marketingService.getCouponTemplates();
                    console.log('✅ 标准API路径成功');
                } catch (apiError) {
                    console.warn('⚠️ 标准API路径失败，尝试直接API调用...', apiError.message);

                    // 如果标准路径失败，尝试直接调用不同的API路径
                    const { testMarketingApiDirectly } = await import('../../utils/debugMarketingApi');
                    const result = await testMarketingApiDirectly();

                    if (result.success) {
                        console.log('✅ 找到可用的API路径:', result.path);
                        templatesData = result.data;
                    } else {
                        throw apiError; // 如果所有路径都失败，抛出原始错误
                    }
                }

                console.log('📋 优惠券模板API响应:', templatesData);
                console.log('📋 响应类型:', typeof templatesData);
                console.log('📋 是否为数组:', Array.isArray(templatesData));

                if (Array.isArray(templatesData)) {
                    console.log(`✅ 获取到 ${templatesData.length} 个优惠券模板`);
                    setCouponTemplates(templatesData);
                } else if (templatesData?.content && Array.isArray(templatesData.content)) {
                    console.log(`✅ 从content字段获取到 ${templatesData.content.length} 个优惠券模板`);
                    setCouponTemplates(templatesData.content);
                } else if (templatesData?.data && Array.isArray(templatesData.data)) {
                    console.log(`✅ 从data字段获取到 ${templatesData.data.length} 个优惠券模板`);
                    setCouponTemplates(templatesData.data);
                } else {
                    console.warn('⚠️ 优惠券模板响应格式不正确:', templatesData);
                    setCouponTemplates([]);
                }
            } catch (e) {
                console.error('❌ 获取优惠券模板失败:', e);
                console.error('错误状态码:', e.response?.status);
                console.error('错误消息:', e.response?.data);
                console.error('完整错误:', e);
                setCouponTemplates([]);

                // 设置更具体的错误信息
                if (e.response?.status === 404) {
                    setError('优惠券模板API不存在，请检查后端服务配置');
                } else if (e.response?.status === 401) {
                    setError('认证失败，请重新登录');
                } else if (e.response?.status >= 500) {
                    setError('服务器错误，请稍后重试');
                } else {
                    const errorMsg = e.message || (typeof e === 'string' ? e : '未知错误');
                    setError(`获取优惠券模板失败: ${errorMsg}`);
                }
            }

            // 获取优惠券统计
            try {
                console.log('📊 获取优惠券统计数据...');
                const statsData = await marketingService.getCouponStats();
                console.log('✅ 优惠券统计数据:', statsData);

                if (statsData) {
                    // 支持后端可能返回的 data 嵌套结构
                    const actualStats = statsData.data || statsData;
                    
                    // 确保数值类型转换正确
                    const mappedStats = {
                        totalCampaigns: Math.max(0, parseInt(actualStats.totalTemplates || actualStats.totalCount) || 0),
                        activeCampaigns: Math.max(0, parseInt(actualStats.activeTemplates || actualStats.activeCount) || 0),
                        totalReach: Math.max(0, parseInt(actualStats.totalIssued || actualStats.issuedCount) || 0),
                        averageConversion: Math.max(0, parseFloat(actualStats.usageRate || actualStats.conversionRate) || 0),
                        totalBudget: Math.max(0, parseFloat(actualStats.totalSavings || actualStats.totalUsed || actualStats.totalAmount) || 0)
                    };

                    console.log('🎯 映射后的统计数据:', mappedStats);
                    setStatistics(mappedStats);
                } else {
                    console.warn('⚠️ 优惠券统计数据为空');
                    setStatistics({ totalCampaigns: 0, activeCampaigns: 0, totalReach: 0, averageConversion: 0, totalBudget: 0 });
                }
            } catch (e) {
                console.error('❌ 获取营销统计失败:', e);
                console.error('错误详情:', e.response?.data || e.message);
                setStatistics({ totalCampaigns: 0, activeCampaigns: 0, totalReach: 0, averageConversion: 0, totalBudget: 0 });
            }
        } catch (err) {
            console.error('营销服务连接失败:', err);
            setError('获取数据失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    // 创建优惠券模板处理函数
    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        try {
            // 数据验证
            if (!formData.name.trim()) {
                showAlert('请输入优惠券名称');
                setSubmitLoading(false);
                return;
            }
            if (!formData.优惠金额 || formData.优惠金额 <= 0) {
                showAlert('请输入有效的折扣金额');
                setSubmitLoading(false);
                return;
            }
            if (new Date(formData.结束时间) <= new Date(formData.开始时间)) {
                showAlert('结束时间必须大于开始时间');
                setSubmitLoading(false);
                return;
            }

            // 构建请求数据（按后端API规范）
            const templateData = {
                name: formData.name.trim(),
                type: formData.type,
                discountValue: parseFloat(formData.优惠金额),
                maxDiscount: formData.最大优惠金额 ? parseFloat(formData.最大优惠金额) : null,
                minOrderAmount: formData.最低消费金额 ? parseFloat(formData.最低消费金额) : 0,
                totalQuantity: formData.发放数量 ? parseInt(formData.发放数量) : null,
                enabled: true,
                stackable: false,
                validFrom: new Date(formData.开始时间).toISOString().split('.')[0], 
                validUntil: new Date(formData.结束时间).toISOString().split('.')[0],
                exclusiveIds: "[]",
                applicableMerchantIds: "[]"
            };

            console.log('🚀 准备创建优惠券模板:', templateData);
            await marketingService.createCouponTemplate(templateData);

            // 成功后重置表单并关闭模态框
            setFormData({
                name: '',
                type: 'DISCOUNT',
                优惠金额: '',
                最大优惠金额: '',
                最低消费金额: '',
                开始时间: '',
                结束时间: '',
                发放数量: '',
                description: ''
            });
            setShowCreateModal(false);

            // 刷新数据
            await fetchMarketingData();
            showAlert('优惠券模板创建成功！', '成功');
        } catch (error) {
            console.error('创建优惠券失败:', error);
            showAlert('创建失败：' + (error.response?.data?.message || error.message || '未知错误'));
        } finally {
            setSubmitLoading(false);
        }
    };

    // 打开发放优惠券模态框
    const handleOpenIssueModal = (template) => {
        setSelectedTemplate(template);
        setIssueFormData({
            userId: '',
            userIds: '',
            remark: '',
            issueType: '单个发放'
        });
        setShowIssueModal(true);
    };

    // 发放优惠券处理函数
    const handleIssueCoupon = async (e) => {
        e.preventDefault();
        if (!selectedTemplate) return;

        setIssueLoading(true);
        try {
            if (issueFormData.issueType === '单个发放') {
                // 单个发放
                if (!issueFormData.userId.trim()) {
                    showAlert('请输入用户ID');
                    setIssueLoading(false);
                    return;
                }

                const issueData = {
                    couponTemplateId: selectedTemplate.id,
                    userId: parseInt(issueFormData.userId.trim()),
                    remark: issueFormData.remark.trim() || '管理员发放'
                };

                // 在发放前进行诊断（开发环境）
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔧 开发环境：执行发放前诊断...');
                    await debugCouponIssue.fullDiagnosis(issueData);
                }

                await marketingService.adminIssueCoupon(issueData);
                showAlert('优惠券发放成功！', '成功');
            } else {
                // 批量发放
                if (!issueFormData.userIds.trim()) {
                    showAlert('请输入用户ID列表');
                    setIssueLoading(false);
                    return;
                }

                // 解析用户ID列表（支持逗号、换行分隔）
                const userIds = issueFormData.userIds
                    .split(/[,\n\r\s]+/)
                    .map(id => id.trim())
                    .filter(id => id && !isNaN(id))
                    .map(id => parseInt(id));

                if (userIds.length === 0) {
                    showAlert('请输入有效的用户ID');
                    setIssueLoading(false);
                    return;
                }

                const issueData = {
                    couponTemplateId: selectedTemplate.id,
                    userIds: userIds,
                    remark: issueFormData.remark.trim() || '管理员批量发放'
                };

                await marketingService.adminIssueCouponBatch(issueData);
                showAlert(`成功向${userIds.length}个用户发放优惠券！`, '批量成功');
            }

            // 关闭模态框并重置表单
            setShowIssueModal(false);
            setSelectedTemplate(null);
            setIssueFormData({
                userId: '',
                userIds: '',
                remark: '',
                issueType: '单个发放'
            });
        } catch (error) {
            console.error('发放优惠券失败:', error);
            // 提供更详细的错误信息
            let errorMsg = '发放失败：';
            if (error.response) {
                const { status, data } = error.response;
                errorMsg += `服务器错误 ${status}`;
                if (data && data.message) {
                    errorMsg += ` - ${data.message}`;
                } else if (data && typeof data === 'string') {
                    errorMsg += ` - ${data}`;
                }
            } else if (error.message) {
                errorMsg += error.message;
            } else {
                errorMsg += '未知错误，请检查网络连接和后端服务状态';
            }
            showAlert(errorMsg);
        } finally {
            setIssueLoading(false);
        }
    };

    // 发放表单数据变更处理
    const handleIssueFormChange = (field, value) => {
        setIssueFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 表单数据变更处理
    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 切换优惠券模板状态
    const handleToggleTemplate = async (template) => {
        const action = template.enabled ? '禁用' : '启用';
        showConfirm(
            `${action}确认`, 
            `确定要${action}优惠券模板「${template.name}」吗？`, 
            async () => {
                try {
                    console.log(`🔄 ${action}优惠券模板:`, template.name, template.id);
                    await marketingService.toggleCouponTemplate(template.id);
                    await fetchMarketingData();
                    showAlert(`${action}成功！优惠券模板「${template.name}」已${action}。`, '成功');
                } catch (error) {
                    console.error('切换模板状态失败:', error);
                    showAlert(`${action}失败：${error.response?.data?.message || error.message}`);
                }
            }
        );
    };

    // 删除优惠券模板
    const handleDeleteTemplate = async (template) => {
        // 安全检查逻辑
        const isIssued = (template.issuedQuantity || template.issuedCount || 0) > 0;
        if (isIssued) {
            showAlert(`无法删除优惠券模板「${template.name}」\n\n原因：已有 ${template.issuedQuantity || template.issuedCount} 张优惠券被发放\n建议：请使用"禁用"功能代替删除`, '删除受限');
            return;
        }

        showConfirm(
            '⚠️ 危险操作', 
            `确定要彻底删除优惠券模板「${template.name}」吗？\n\n此操作不可撤销，模板删除后将无法恢复。`, 
            async () => {
                try {
                    console.log('🗑️ 删除优惠券模板:', template.name, template.id);
                    await marketingService.deleteCouponTemplate(template.id);
                    await fetchMarketingData();
                    showAlert(`删除成功！优惠券模板「${template.name}」已从系统中移除。`, '成功');
                } catch (error) {
                    console.error('删除模板失败:', error);
                    // 针对 500 错误的详细反馈
                    let errorMsg = '删除失败：';
                    if (error.response?.status === 500) {
                        errorMsg += '服务器内部错误 (500)。可能是由于该模板与其他业务数据（如历史订单）存在关联，或者代理转发配置错误。';
                    } else {
                        errorMsg += (error.response?.data?.message || error.message || '未知异常');
                    }
                    showAlert(errorMsg);
                }
            }
        );
    };

    useEffect(() => {
        fetchMarketingData();
    }, []);

    // 筛选和搜索逻辑
    const filteredCouponTemplates = couponTemplates.filter(template => {
        // 调试：打印每个模板的结构
        if (couponTemplates.length > 0 && template === couponTemplates[0]) {
            console.log('🔍 优惠券模板数据结构:', template);
        }

        const templateName = template?.name || template?.title || template?.templateName || '';
        const templateEnabled = template?.enabled !== undefined ? template.enabled : template?.status === 'active';

        const matchesSearch = !searchTerm || templateName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && templateEnabled) ||
            (statusFilter === 'paused' && !templateEnabled);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500 min-h-screen">
            <div className="space-y-6 p-6 md:p-8 max-w-[1400px] mx-auto">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">营销管理</h1>
                        <p className="text-text-secondary text-sm font-medium">设计优惠策略与券包发放系统</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={async () => {
                                try {
                                    console.log('🧪 测试优惠券统计API...');
                                    const timestamp = Date.now();
                                    const directResponse = await fetch(`/api/admin/coupons/stats?t=${timestamp}`);
                                    if (!directResponse.ok) throw new Error(`HTTP error! status: ${directResponse.status}`);
                                    const data = await directResponse.json();
                                    showAlert(`API调用成功！数据: ${JSON.stringify(data, null, 2)}`, '调试信息');
                                } catch (error) {
                                    console.error('❌ API调用失败:', error);
                                    showAlert(`API调用失败: ${error.message}`, '调试失败');
                                }
                            }}
                            className="flex items-center gap-2 h-10 px-4 bg-surface border border-border-light rounded-xl text-text-secondary text-sm font-bold hover:bg-surface-hover hover:text-primary transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">analytics</span>
                            <span>API测试</span>
                        </button>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center justify-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-primary transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>创建优惠券</span>
                        </button>
                    </div>
                </div>

                {/* 统计卡片 (还原所有统计项) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                        { label: '总模板数', value: loading ? '...' : (statistics.totalCampaigns || 0), icon: 'confirmation_number', color: 'text-info', bg: 'bg-info-bg' },
                        { label: '启用中', value: loading ? '...' : (statistics.activeCampaigns || 0), icon: 'check_circle', color: 'text-success', bg: 'bg-success-bg' },
                        { label: '总发放量', value: loading ? '...' : (statistics.totalReach || 0), icon: 'send', color: 'text-primary', bg: 'bg-primary-soft' },
                        { label: '平均转化', value: loading ? '...' : `${statistics.averageConversion}%`, icon: 'trending_up', color: 'text-warning', bg: 'bg-warning-bg' },
                        { label: '总计节省', value: loading ? '...' : `¥${(statistics.totalBudget || 0).toLocaleString()}`, icon: 'account_balance_wallet', color: 'text-error', bg: 'bg-error-bg' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-surface p-5 rounded-2xl border border-border-light shadow-sm hover:shadow-card transition-shadow flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">{stat.label}</span>
                                <span className={`material-symbols-outlined ${stat.color} ${stat.bg} p-1.5 rounded-xl text-[18px]`}>{stat.icon}</span>
                            </div>
                            <div className="text-2xl font-extrabold text-text-primary mt-2 tracking-tight">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="bg-error-bg border border-error/20 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-error">error</span>
                            <span className="text-error font-bold text-sm">{typeof error === 'string' ? error : (error.message || '数据加载失败')}</span>
                        </div>
                        <button onClick={() => { setError(null); fetchMarketingData(); }} className="text-error hover:opacity-80 text-sm font-bold underline">重试</button>
                    </div>
                )}

                {/* 筛选和搜索栏 */}
                <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-tertiary group-focus-within:text-primary transition-colors text-[20px]">search</span>
                        <input
                            type="text"
                            placeholder="搜索优惠券名称..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 rounded-xl bg-background-section border border-transparent focus:border-border-light text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-11 px-4 border border-border-light rounded-xl bg-surface text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                            <option value="all">全部状态</option>
                            <option value="active">启用中</option>
                            <option value="paused">已禁用</option>
                        </select>
                        <button
                            onClick={fetchMarketingData}
                            className="flex items-center justify-center h-11 w-11 bg-surface border border-border-light text-text-secondary rounded-xl hover:bg-surface-hover hover:text-primary transition-colors shadow-sm"
                            title="刷新数据"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                    </div>
                </div>

                {/* 优惠券表格 (严格对齐 Nordic 表格规范：首列靠左，其余居中) */}
                <div className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden">
                    <div className="px-6 py-5 border-b border-border-light bg-background-section flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-text-primary tracking-tight">
                            优惠券模板列表
                            <span className="ml-2 text-sm font-medium text-text-secondary bg-border-light px-2 py-0.5 rounded-md">
                                共 {filteredCouponTemplates.length} 项
                            </span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-background-section border-b border-border-light">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-left whitespace-nowrap">优惠券信息</th>
                                    <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">类型</th>
                                    <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">优惠数值</th>
                                    <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">限制/总量</th>
                                    <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">当前状态</th>
                                    <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
                                                <span className="text-sm font-bold text-text-secondary">加载中...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCouponTemplates.length > 0 ? (
                                    filteredCouponTemplates.map((template) => {
                                        const templateEnabled = template?.enabled !== undefined ? template.enabled : (template?.status === 'active');
                                        const validUntil = template?.validUntil || template?.endTime || template?.expiryDate;
                                        // 更加稳健的日期判断：设置到当天 23:59:59 避免当天误判
                                        const isExpired = validUntil ? new Date(validUntil).setHours(23, 59, 59) < new Date().getTime() : false;

                                        return (
                                            <tr key={template.id || Math.random()} className="hover:bg-surface-hover transition-colors">
                                                <td className="px-6 py-5 text-left">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 bg-primary-soft text-primary rounded-xl flex items-center justify-center shrink-0">
                                                            <span className="material-symbols-outlined text-[22px]">confirmation_number</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="font-extrabold text-text-primary text-base mb-0.5">
                                                                {template?.name || template?.title || '未命名优惠券'}
                                                            </div>
                                                            <div className="text-xs font-medium text-text-tertiary">
                                                                有效期至: {validUntil ? new Date(validUntil).toLocaleDateString() : '未设置'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <TypeBadge type={template?.type} />
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm font-black text-text-primary tracking-tight">
                                                        {template?.type === 'PERCENTAGE' 
                                                            ? `${template?.discountValue || 0}%` 
                                                            : `¥${template?.discountValue || 0}`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-black text-text-primary">
                                                            {template?.totalQuantity || '不限'}
                                                        </span>
                                                        <span className="text-[10px] text-text-secondary font-bold uppercase">
                                                            满 ¥{template?.minOrderAmount || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <StatusBadge enabled={templateEnabled} isExpired={isExpired} />
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {/* 操作按钮：应用语义化颜色区分 */}
                                                        <button 
                                                            onClick={() => handleOpenIssueModal(template)} 
                                                            className="p-2 rounded-lg text-primary hover:bg-primary-soft transition-colors" 
                                                            title="手动发放"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">send</span>
                                                        </button>
                                                        <button 
                                                            className="p-2 rounded-lg text-info hover:bg-info-bg transition-colors" 
                                                            title="编辑模板"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggleTemplate(template)} 
                                                            className={`p-2 rounded-lg transition-colors ${templateEnabled ? 'text-warning hover:bg-warning-bg' : 'text-success hover:bg-success-bg'}`} 
                                                            title={templateEnabled ? '禁用' : '启用'}
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">{templateEnabled ? 'pause' : 'play_arrow'}</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteTemplate(template)} 
                                                            className="p-2 rounded-lg text-error hover:bg-error-bg transition-colors" 
                                                            title="彻底删除"
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
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-background-section p-6 rounded-full mb-2">
                                                    <span className="material-symbols-outlined text-text-disabled text-5xl">confirmation_number</span>
                                                </div>
                                                <h3 className="text-lg font-extrabold text-text-primary mb-1">暂无优惠券模板</h3>
                                                <p className="text-sm font-medium text-text-secondary">点击右上角创建您的第一个营销活动</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ================= 全局定制化 Modal 弹窗 (对齐 Users.jsx) ================= */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
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
                                {dialog.title}
                            </h3>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                                {dialog.message}
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-background-section border-t border-border-light flex justify-center gap-3">
                            {dialog.type === 'confirm' && (
                                <button
                                    onClick={closeDialog}
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

            {/* 创建优惠券模态框 (还原所有表单字段) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
                        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-background-section">
                            <h3 className="text-lg font-extrabold text-text-primary">创建优惠券模板</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateCoupon} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">优惠券名称 *</label>
                                <input type="text" className="w-full h-11 px-4 rounded-xl bg-background border border-border-light focus:border-primary focus:ring-1 focus:ring-primary/20 text-text-primary text-sm outline-none transition-all" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} required placeholder="如：新用户首单立减" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1.5">优惠类型 *</label>
                                    <select className="w-full h-11 px-4 rounded-xl bg-background border border-border-light text-text-primary text-sm font-bold outline-none" value={formData.type} onChange={(e) => handleFormChange('type', e.target.value)}>
                                        <option value="DISCOUNT">满减优惠</option>
                                        <option value="PERCENTAGE">折扣优惠</option>
                                        <option value="FREE_DELIVERY">免配送费</option>
                                        <option value="NO_THRESHOLD">无门槛券</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1.5">{formData.type === 'PERCENTAGE' ? '折扣比例 (%)' : '折扣金额 (元)'} *</label>
                                    <input type="number" className="w-full h-11 px-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none" value={formData.优惠金额} onChange={(e) => handleFormChange('优惠金额', e.target.value)} required placeholder="10.00" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1.5">最高优惠金额</label>
                                    <input type="number" className="w-full h-11 px-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none" value={formData.最大优惠金额} onChange={(e) => handleFormChange('最大优惠金额', e.target.value)} placeholder="折扣券建议设置" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1.5">最低消费 (元)</label>
                                    <input type="number" className="w-full h-11 px-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none" value={formData.最低消费金额} onChange={(e) => handleFormChange('最低消费金额', e.target.value)} placeholder="0为无门槛" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1.5">开始时间 *</label>
                                    <input type="datetime-local" className="w-full h-11 px-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none" value={formData.开始时间} onChange={(e) => handleFormChange('开始时间', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1.5">结束时间 *</label>
                                    <input type="datetime-local" className="w-full h-11 px-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none" value={formData.结束时间} onChange={(e) => handleFormChange('结束时间', e.target.value)} required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">发放总量 (空为不限)</label>
                                <input type="number" className="w-full h-11 px-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none" value={formData.发放数量} onChange={(e) => handleFormChange('发放数量', e.target.value)} placeholder="1000" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">备注描述</label>
                                <textarea className="w-full p-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none transition-all resize-none" rows="2" value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} placeholder="优惠券规则说明..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-surface border border-border-light text-sm shadow-sm transition-colors">取消</button>
                                <button type="submit" disabled={submitLoading} className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:opacity-90 shadow-primary transition-all text-sm disabled:opacity-50">{submitLoading ? '处理中...' : '确认创建'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 发放优惠券模态框 (还原完整逻辑) */}
            {showIssueModal && selectedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
                        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-background-section">
                            <h3 className="text-lg font-extrabold text-text-primary">发放优惠券</h3>
                            <button onClick={() => setShowIssueModal(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 bg-primary-soft/30 border-b border-border-light">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-[28px]">confirmation_number</span>
                                <div>
                                    <p className="text-sm font-extrabold text-text-primary">{selectedTemplate.name}</p>
                                    <p className="text-xs text-text-secondary">模板ID: {selectedTemplate.id}</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleIssueCoupon} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">发放模式</label>
                                <div className="flex gap-4">
                                    {['单个发放', '批量发放'].map(type => (
                                        <button key={type} type="button" onClick={() => handleIssueFormChange('issueType', type)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${issueFormData.issueType === type ? 'bg-primary text-white border-primary shadow-sm' : 'bg-background text-text-secondary border-border-light hover:border-primary/50'}`}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {issueFormData.issueType === '单个发放' ? (
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1.5">用户ID *</label>
                                    <input type="number" className="w-full h-11 px-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none" value={issueFormData.userId} onChange={(e) => handleIssueFormChange('userId', e.target.value)} required placeholder="请输入用户 ID" />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-text-primary mb-1.5">批量用户ID (逗号或换行分隔) *</label>
                                    <textarea className="w-full p-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none resize-none" rows="4" value={issueFormData.userIds} onChange={(e) => handleIssueFormChange('userIds', e.target.value)} required placeholder="101, 102, 103..." />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-1.5">备注说明</label>
                                <input type="text" className="w-full h-11 px-4 rounded-xl bg-background border border-border-light text-text-primary text-sm outline-none" value={issueFormData.remark} onChange={(e) => handleIssueFormChange('remark', e.target.value)} placeholder="选填，记录发放原因" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
                                <button type="button" onClick={() => setShowIssueModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-surface border border-border-light text-sm shadow-sm transition-colors">取消</button>
                                <button type="submit" disabled={issueLoading} className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:opacity-90 shadow-primary transition-all text-sm disabled:opacity-50 flex items-center gap-2">
                                    {issueLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                    {issueLoading ? '发放中...' : '确认发放'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;