import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
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
    const [showCreateModal, setShowCreateModal] = useState(false);

    // 数据获取函数
    const fetchServicesData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 获取服务列表
            const servicesData = await platformService.getServices();

            // 处理返回数据（可能是数组或分页对象）
            if (Array.isArray(servicesData)) {
                setServices(servicesData);
            } else if (servicesData?.content) {
                setServices(servicesData.content);
            } else {
                setServices([]);
            }

            // 尝试获取统计数据
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
                // 统计API可能不存在，使用服务列表计算
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

    // 筛选和搜索逻辑
    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || service.type === typeFilter;
        return matchesSearch && matchesType;
    });

    // 类型翻译
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

    // 状态信息
    const getStatusInfo = (status) => {
        const statusMap = {
            active: { text: '启用中', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/20' },
            inactive: { text: '已停用', color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/20' },
            pending: { text: '待审核', color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/20' }
        };
        return statusMap[status] || statusMap.pending;
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

    // 服务卡片组件
    const ServiceCard = ({ service }) => {
        const statusInfo = getStatusInfo(service.status);

        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-xl">
                                {service.icon}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{service.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{getTypeText(service.type)}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                    </span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{service.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {service.price === 0 ? '免费' : `¥${service.price}`}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {service.price > 0 ? `/${service.period === 'month' ? '月' : '年'}` : ''}
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(service.subscribers)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">订阅数</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">目标客群</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{service.target}</div>
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">服务特性:</h4>
                    <div className="flex flex-wrap gap-1">
                        {service.features.map((feature, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 rounded">
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
                        查看详情
                    </button>
                    <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                        编辑
                    </button>
                    <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${service.status === 'active'
                        ? 'bg-red-100 hover:bg-red-200 text-red-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}>
                        {service.status === 'active' ? '停用' : '启用'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* 页面头部 */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">平台服务</h1>
                        <p className="text-gray-600 dark:text-gray-400">管理平台提供的各项增值服务</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all"
                    >
                        <span className="material-symbols-outlined">add</span>
                        新建服务
                    </button>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="mb-6 bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-400 p-4 rounded-lg">
                        <div className="flex">
                            <span className="material-symbols-outlined text-yellow-400 mr-3">warning</span>
                            <p className="text-yellow-700 dark:text-yellow-300">{error}</p>
                        </div>
                    </div>
                )}

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">总服务数</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {loading ? '...' : statistics.totalServices}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">miscellaneous_services</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">启用中</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {loading ? '...' : statistics.activeServices}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">总订阅数</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                    {loading ? '...' : formatNumber(statistics.totalSubscribers)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">group</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">总营收</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                    {loading ? '...' : `¥${statistics.totalRevenue.toLocaleString()}`}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">paid</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 搜索和筛选 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="搜索服务名称..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <span className="material-symbols-outlined">refresh</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 服务列表 */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-lg text-gray-500 dark:text-gray-400">加载中...</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                                <ServiceCard key={service.id} service={service} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">miscellaneous_services</span>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">没有找到服务</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">尝试调整搜索条件或创建新的服务</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    创建第一个服务
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Services;

