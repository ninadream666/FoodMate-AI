import React, { useState, useEffect } from 'react';
import marketingService from '../../services/admin/marketingService';
import { runMarketingTests } from '../../utils/testMarketingFeatures';
import { testMarketingApiDirectly, checkBackendApiImplementation } from '../../utils/debugMarketingApi';
import { debugCouponIssue } from '../../utils/couponIssueDebug';

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
                    // 确保数值类型转换正确
                    const mappedStats = {
                        totalCampaigns: Math.max(0, parseInt(statsData.totalTemplates) || 0),
                        activeCampaigns: Math.max(0, parseInt(statsData.activeTemplates) || 0),
                        totalReach: Math.max(0, parseInt(statsData.totalIssued) || 0),
                        averageConversion: Math.max(0, parseFloat(statsData.usageRate || statsData.conversionRate) || 0),
                        totalBudget: Math.max(0, parseFloat(statsData.totalSavings || statsData.totalUsed) || 0)
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
                alert('请输入优惠券名称');
                return;
            }
            if (!formData.优惠金额 || formData.优惠金额 <= 0) {
                alert('请输入有效的折扣金额');
                return;
            }
            if (new Date(formData.结束时间) <= new Date(formData.开始时间)) {
                alert('结束时间必须大于开始时间');
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
                validFrom: new Date(formData.开始时间).toISOString(),
                validUntil: new Date(formData.结束时间).toISOString(),
                exclusiveIds: "[]",
                applicableMerchantIds: "[]"
            };

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

            alert('优惠券模板创建成功！');
        } catch (error) {
            console.error('创建优惠券失败:', error);
            alert('创建失败：' + (error.message || '未知错误'));
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
                    alert('请输入用户ID');
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
                alert('优惠券发放成功！');
            } else {
                // 批量发放
                if (!issueFormData.userIds.trim()) {
                    alert('请输入用户ID列表');
                    return;
                }

                // 解析用户ID列表（支持逗号、换行分隔）
                const userIds = issueFormData.userIds
                    .split(/[,\n\r\s]+/)
                    .map(id => id.trim())
                    .filter(id => id && !isNaN(id))
                    .map(id => parseInt(id));

                if (userIds.length === 0) {
                    alert('请输入有效的用户ID');
                    return;
                }

                const issueData = {
                    couponTemplateId: selectedTemplate.id,
                    userIds: userIds,
                    remark: issueFormData.remark.trim() || '管理员批量发放'
                };

                await marketingService.adminIssueCouponBatch(issueData);
                alert(`成功向${userIds.length}个用户发放优惠券！`);
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
                // 服务器返回错误响应
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
            alert(errorMsg);
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
        try {
            const action = template.enabled ? '禁用' : '启用';
            if (!confirm(`确定要${action}优惠券模板「${template.name}」吗？`)) {
                return;
            }

            console.log(`🔄 ${action}优惠券模板:`, template.name, template.id);
            const result = await marketingService.toggleCouponTemplate(template.id);
            console.log(`✅ ${action}成功:`, result);

            // 刷新数据
            await fetchMarketingData();

            // 显示成功提示
            alert(`${action}成功！优惠券模板「${template.name}」已${action}。`);
        } catch (error) {
            console.error('切换模板状态失败:', error);
            const action = template.enabled ? '禁用' : '启用';

            // 提供更简洁的错误信息
            let errorMessage = `${action}失败`;
            if (error.response?.status === 401) {
                errorMessage += '：认证失败，请重新登录';
            } else if (error.response?.status === 404) {
                errorMessage += '：优惠券模板不存在';
            } else if (error.response?.status >= 500) {
                errorMessage += '：服务器错误，请稍后重试';
            } else {
                errorMessage += `：${error.response?.data?.message || error.message || '未知错误'}`;
            }

            alert(errorMessage);
        }
    };

    // 删除优惠券模板
    const handleDeleteTemplate = async (template) => {
        try {
            // 检查是否已发放
            const isIssued = template.issuedQuantity > 0;

            if (isIssued) {
                alert(`无法删除优惠券模板「${template.name}」\n\n原因：已有 ${template.issuedQuantity} 张优惠券被发放\n建议：请使用"禁用"功能代替删除`);
                return;
            }

            // 二次确认
            const confirmMessage = `⚠️ 确定要删除优惠券模板「${template.name}」吗？\n\n此操作不可撤销，模板删除后将无法恢复。`;
            if (!confirm(confirmMessage)) {
                return;
            }

            console.log('🗑️ 删除优惠券模板:', template.name, template.id);
            const result = await marketingService.deleteCouponTemplate(template.id);
            console.log('✅ 删除成功:', result);

            // 刷新数据
            await fetchMarketingData();

            // 显示成功提示
            alert(`删除成功！优惠券模板「${template.name}」已删除。`);
        } catch (error) {
            console.error('删除模板失败:', error);

            // 提供更详细的错误信息
            let errorMsg = '删除失败：';
            if (error.response) {
                const { status, data } = error.response;
                if (status === 400 && data.message) {
                    errorMsg += data.message;
                } else {
                    errorMsg += `服务器错误 ${status}`;
                }
            } else if (error.message) {
                errorMsg += error.message;
            } else {
                errorMsg += '请检查网络连接';
            }
            alert(errorMsg);
        }
    };

    useEffect(() => {
        fetchMarketingData();
    }, []);

    // 筛选和搜索逻辑
    const filteredCouponTemplates = couponTemplates.filter(template => {
        // 调试：打印每个模板的结构
        if (couponTemplates.length > 0 && template === couponTemplates[0]) {
            console.log('🔍 优惠券模板数据结构:', template);
            console.log('🔍 模板属性:', Object.keys(template));
        }

        // 安全地访问属性，提供默认值
        const templateName = template?.name || template?.title || template?.templateName || '';
        const templateEnabled = template?.enabled !== undefined ? template.enabled : template?.status === 'active';

        const matchesSearch = !searchTerm || templateName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && templateEnabled) ||
            (statusFilter === 'paused' && !templateEnabled);
        return matchesSearch && matchesStatus;
    });

    // 添加调试信息
    if (couponTemplates.length > 0) {
        console.log(`📊 原始模板数量: ${couponTemplates.length}, 过滤后: ${filteredCouponTemplates.length}`);
        console.log(`🔍 搜索词: "${searchTerm}", 状态筛选: "${statusFilter}"`);
    }

    // 状态翻译
    const getStatusInfo = (status) => {
        const statusMap = {
            active: { text: '进行中', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/20' },
            paused: { text: '已暂停', color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/20' },
            scheduled: { text: '待开始', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/20' },
            completed: { text: '已结束', color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-500/20' }
        };
        return statusMap[status] || statusMap.scheduled;
    };

    // 优惠券类型翻译
    const getCouponTypeText = (type) => {
        const typeMap = {
            DISCOUNT: '满减优惠',
            PERCENTAGE: '折扣优惠',
            FREE_DELIVERY: '免配送费'
        };
        return typeMap[type] || type;
    };

    // 格式化数字
    const formatNumber = (num) => {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + 'w';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    };

    // 优惠券模板行组件
    const CouponTemplateRow = ({ template }) => {
        // 安全地解析模板数据
        const templateName = template?.name || template?.title || template?.templateName || '未命名优惠券';
        const templateType = template?.type || template?.couponType || 'DISCOUNT';
        const templateEnabled = template?.enabled !== undefined ? template.enabled : (template?.status === 'active');
        const discountValue = template?.discountValue || template?.discountAmount || template?.amount || 0;
        const minOrderAmount = template?.minOrderAmount || template?.minimumAmount || 0;
        const totalQuantity = template?.totalQuantity || template?.quantity || template?.maxCount;
        const validUntil = template?.validUntil || template?.endTime || template?.expiryDate;
        const description = template?.description || template?.remark || '';

        // 确保description是字符串
        const safeDescription = typeof description === 'string' ? description :
            typeof description === 'object' && description?.text ? description.text :
                typeof description === 'object' && description?.message ? description.message : '';

        console.log('🎫 渲染优惠券模板:', { templateName, templateType, templateEnabled, discountValue });

        const isExpired = validUntil ? new Date(validUntil) < new Date() : false;

        const statusInfo = isExpired
            ? { text: '已过期', color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-500/20' }
            : templateEnabled
                ? { text: '启用中', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/20' }
                : { text: '已禁用', color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/20' };

        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-[#e7dbcf] dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">
                                confirmation_number
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{templateName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{getCouponTypeText(templateType)}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                    </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {templateType === 'PERCENTAGE' ? `${discountValue}%` : `¥${discountValue}`}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">优惠金额</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ¥{minOrderAmount}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">最低消费</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {totalQuantity || '不限'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">发放总量</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">有效期至</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {validUntil ? new Date(validUntil).toLocaleDateString() : '未设置'}
                        </div>
                    </div>
                </div>

                {safeDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{safeDescription}</p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={() => handleOpenIssueModal(template)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        发放优惠券
                    </button>
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                        编辑模板
                    </button>
                    <button
                        onClick={() => handleToggleTemplate(template)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${templateEnabled
                            ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400'
                            : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-500/20 dark:hover:bg-green-500/30 dark:text-green-400'
                            }`}
                    >
                        {templateEnabled ? '禁用' : '启用'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8f7f6] text-[#1b140d] font-['Inter']">
            <div className="space-y-8 p-6 md:p-8">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b140d]">优惠券管理</h1>
                        <p className="text-[#9a734c] text-base">管理平台优惠券模板和发放策略</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 h-10 px-4 bg-white border border-[#e7dbcf] rounded-lg text-[#1b140d] text-sm font-bold hover:bg-gray-50 shadow-sm">
                            <span className="material-symbols-outlined text-lg">analytics</span>
                            营销报表
                        </button>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#ee8c2b] text-white rounded-lg text-sm font-bold hover:bg-[#d97b1e] transition-colors shadow-sm shadow-orange-200"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            创建优惠券
                        </button>
                    </div>
                </div>

                {/* 错误提示和重试 */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div className="flex">
                                <span className="material-symbols-outlined text-red-400 mr-3">error</span>
                                <div>
                                    <p className="text-red-700 font-medium">数据获取失败</p>
                                    <p className="text-red-600 text-sm mt-1">
                                        {typeof error === 'string' ? error :
                                            typeof error === 'object' && error?.message ? error.message :
                                                JSON.stringify(error)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setError(null);
                                    fetchMarketingData();
                                }}
                                className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                                重试
                            </button>
                        </div>
                    </div>
                )}

                {/* 模板列表为空时的提示 */}
                {!loading && !error && couponTemplates.length === 0 && (
                    <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                        <div className="flex">
                            <span className="material-symbols-outlined text-blue-400 mr-3">info</span>
                            <div>
                                <p className="text-blue-700 font-medium">暂无优惠券模板</p>
                                <p className="text-blue-600 text-sm mt-1">
                                    请点击"创建优惠券"按钮创建第一个优惠券模板，或点击"找API"按钮检查API连接状态。
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-[#e7dbcf] dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">总模板数</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {loading ? '...' : (Number(statistics.totalCampaigns) || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">confirmation_number</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-[#e7dbcf] dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">启用中</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {loading ? '...' : (Number(statistics.activeCampaigns) || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-[#e7dbcf] dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">总发放量</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                    {loading ? '...' : (Number(statistics.totalReach) || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">send</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-[#e7dbcf] dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">平均转化</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {loading ? '...' : `${Number(statistics.averageConversion) || 0}%`}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">trending_up</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-[#e7dbcf] dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">总预算</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                    {loading ? '...' : `¥${(Number(statistics.totalBudget) || 0).toLocaleString()}`}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600 dark:text-red-400">account_balance_wallet</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API测试按钮 */}
                <div className="mb-6">
                    <button
                        onClick={async () => {
                            try {
                                console.log('🧪 测试优惠券统计API...');
                                const timestamp = Date.now();
                                const directResponse = await fetch(`/api/admin/coupons/stats?t=${timestamp}`);
                                const data = await directResponse.json();
                                console.log('✅ 直接API调用结果:', data);
                                alert(`API调用成功！数据: ${JSON.stringify(data, null, 2)}`);
                            } catch (error) {
                                console.error('❌ API调用失败:', error);
                                alert(`API调用失败: ${error.message}`);
                            }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        🧪 测试优惠券统计API
                    </button>
                </div>

                {/* 搜索和筛选 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-[#e7dbcf] dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="搜索活动名称..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-[#e7dbcf] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-[#e7dbcf] dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="all">全部状态</option>
                                <option value="active">进行中</option>
                                <option value="paused">已暂停</option>
                                <option value="scheduled">待开始</option>
                                <option value="completed">已结束</option>
                            </select>
                            <button
                                onClick={fetchMarketingData}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <span className="material-symbols-outlined">refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 优惠券模板列表 */}
                {
                    loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-lg text-gray-500 dark:text-gray-400">加载中...</div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredCouponTemplates.length > 0 ? (
                                filteredCouponTemplates.map(template => (
                                    <CouponTemplateRow key={template.id || template._id || template.templateId || Math.random()} template={template} />
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">confirmation_number</span>
                                    <h3 className="text-lg font-medium text-[#1b140d] mb-2">没有找到优惠券模板</h3>
                                    <p className="text-[#9a734c] mb-4">尝试调整搜索条件或创建新的优惠券模板</p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-6 py-3 bg-[#ee8c2b] hover:bg-[#d97b1e] text-white rounded-lg font-medium transition-colors"
                                    >
                                        创建第一个优惠券
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                }
            </div>

            {/* 创建优惠券模态框 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleCreateCoupon} className="p-6 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">创建优惠券模板</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* 优惠券名称 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    优惠券名称 *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleFormChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="如：新用户专享券"
                                    required
                                />
                            </div>

                            {/* 优惠券类型 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    优惠类型 *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleFormChange('type', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="DISCOUNT">满减优惠</option>
                                    <option value="PERCENTAGE">折扣优惠</option>
                                    <option value="FREE_DELIVERY">免配送费</option>
                                </select>
                            </div>

                            {/* 折扣金额/百分比 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {formData.type === 'PERCENTAGE' ? '折扣比例 (%)' : '折扣金额 (元)'} *
                                </label>
                                <input
                                    type="number"
                                    step={formData.type === 'PERCENTAGE' ? "1" : "0.01"}
                                    min="0"
                                    max={formData.type === 'PERCENTAGE' ? "100" : undefined}
                                    value={formData.优惠金额}
                                    onChange={(e) => handleFormChange('优惠金额', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                    placeholder={formData.type === 'PERCENTAGE' ? "85" : "10.00"}
                                    required
                                />
                            </div>

                            {/* 最大优惠金额 */}
                            {formData.type === 'PERCENTAGE' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        最大优惠金额 (元)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.最大优惠金额}
                                        onChange={(e) => handleFormChange('最大优惠金额', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="100.00"
                                    />
                                </div>
                            )}

                            {/* 最低消费金额 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    最低消费金额 (元)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.最低消费金额}
                                    onChange={(e) => handleFormChange('最低消费金额', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="30.00"
                                />
                            </div>

                            {/* 有效期 */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        开始时间 *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.开始时间}
                                        onChange={(e) => handleFormChange('开始时间', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        结束时间 *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.结束时间}
                                        onChange={(e) => handleFormChange('结束时间', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 发放数量 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    发放数量
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.发放数量}
                                    onChange={(e) => handleFormChange('发放数量', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="不限制请留空"
                                />
                            </div>

                            {/* 描述 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    描述
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleFormChange('description', e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white resize-none"
                                    placeholder="优惠券使用说明..."
                                />
                            </div>

                            {/* 按钮区域 */}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="px-4 py-2 bg-[#ee8c2b] hover:bg-[#d97b1e] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-wait flex items-center gap-2"
                                >
                                    {submitLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                    {submitLoading ? '创建中...' : '创建优惠券'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 发放优惠券模态框 */}
            {showIssueModal && selectedTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleIssueCoupon} className="p-6 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">发放优惠券</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowIssueModal(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            {/* 优惠券信息 */}
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg mb-4">
                                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                                    {selectedTemplate.name}
                                </h3>
                                <p className="text-sm text-orange-600 dark:text-orange-300">
                                    {getCouponTypeText(selectedTemplate.type)} •
                                    {selectedTemplate.type === 'PERCENTAGE' ? `${selectedTemplate.discountValue}%` : `¥${selectedTemplate.discountValue}`} •
                                    满¥{selectedTemplate.minOrderAmount || 0}可用
                                </p>
                            </div>

                            {/* 发放类型选择 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    发放类型
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="单个发放"
                                            checked={issueFormData.issueType === '单个发放'}
                                            onChange={(e) => handleIssueFormChange('issueType', e.target.value)}
                                            className="mr-2"
                                        />
                                        单个发放
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="批量发放"
                                            checked={issueFormData.issueType === '批量发放'}
                                            onChange={(e) => handleIssueFormChange('issueType', e.target.value)}
                                            className="mr-2"
                                        />
                                        批量发放
                                    </label>
                                </div>
                            </div>

                            {/* 用户ID输入 */}
                            {issueFormData.issueType === '单个发放' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        用户ID *
                                    </label>
                                    <input
                                        type="number"
                                        value={issueFormData.userId}
                                        onChange={(e) => handleIssueFormChange('userId', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="请输入用户ID"
                                        required
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        用户ID列表 *
                                    </label>
                                    <textarea
                                        value={issueFormData.userIds}
                                        onChange={(e) => handleIssueFormChange('userIds', e.target.value)}
                                        rows="4"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white resize-none"
                                        placeholder="请输入用户ID，用逗号或换行分隔&#10;例如：1,2,3&#10;或：&#10;1&#10;2&#10;3"
                                        required
                                    />
                                </div>
                            )}

                            {/* 备注 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    发放备注
                                </label>
                                <input
                                    type="text"
                                    value={issueFormData.remark}
                                    onChange={(e) => handleIssueFormChange('remark', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="选填，如：节日活动发放"
                                />
                            </div>

                            {/* 按钮区域 */}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => setShowIssueModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={issueLoading}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {issueLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                    {issueLoading ? '发放中...' : (issueFormData.issueType === '单个发放' ? '发放优惠券' : '批量发放')}
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