import React, { useState, useEffect } from 'react';
import merchantService from '../../services/admin/merchantService';
import { debugApiConnection } from '../../utils/debugApiConnection';

// 导航组件
const NavItem = ({ icon, label, active = false, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group text-left ${active
            ? 'bg-[#ee8c2b]/10 text-[#ee8c2b]'
            : 'hover:bg-[#f3ede7] dark:hover:bg-[#3a2d20] text-[#1b140d] dark:text-gray-300 hover:text-[#ee8c2b]'
            }`}
    >
        <span className="material-symbols-outlined text-lg">{icon}</span>
        <p className="text-sm font-medium">{label}</p>
    </button>
);

// 筛选按钮组件
const FilterButton = ({ label, icon, onClick, active = false }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${active
            ? 'bg-[#ee8c2b] text-white border-[#ee8c2b]'
            : 'bg-white dark:bg-[#2a2018] border-[#e7dbcf] dark:border-[#4a3a2a] text-[#1b140d] dark:text-white hover:bg-gray-50 dark:hover:bg-[#3a2d20]'
            }`}
    >
        {icon && <span className="material-symbols-outlined text-base">{icon}</span>}
        <span>{label}</span>
    </button>
);

// 状态标签组件
const StatusBadge = ({ status, statusColor }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case '已上线':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400';
            case 'pending':
            case '待审核':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400';
            case 'inactive':
            case 'offline':
            case '离线':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400';
            case 'rejected':
            case '已拒绝':
                return 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400';
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status || '未知'}
        </span>
    );
};

// 商家行组件
const MerchantRow = ({ merchant, onEdit, onToggleStatus, onViewDetails }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-[#2a2018] transition-colors">
        <td className="p-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ee8c2b] to-[#d97706] flex items-center justify-center text-white font-bold">
                    {merchant.name?.charAt(0) || 'M'}
                </div>
                <div className="flex flex-col">
                    <p className="text-[#1b140d] dark:text-white font-medium">{merchant.name || '未知商家'}</p>
                    <p className="text-[#9a734c] dark:text-[#cc9f70] text-sm">{merchant.id || merchant._id || 'ID未设置'}</p>
                </div>
            </div>
        </td>
        <td className="p-4">
            <span className="text-[#1b140d] dark:text-white text-sm">{merchant.category || '未分类'}</span>
        </td>
        <td className="p-4">
            <span className="text-[#9a734c] dark:text-[#cc9f70] text-sm">
                {merchant.joinDate || merchant.createdAt ?
                    new Date(merchant.joinDate || merchant.createdAt).toLocaleDateString('zh-CN') :
                    '未知日期'
                }
            </span>
        </td>
        <td className="p-4">
            <StatusBadge status={merchant.status} />
        </td>
        <td className="p-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onViewDetails(merchant)}
                    className="p-1.5 rounded-lg text-[#9a734c] hover:text-[#ee8c2b] hover:bg-[#ee8c2b]/10 transition-colors"
                    title="查看详情"
                >
                    <span className="material-symbols-outlined text-base">visibility</span>
                </button>
                <button
                    onClick={() => onEdit(merchant)}
                    className="p-1.5 rounded-lg text-[#9a734c] hover:text-[#ee8c2b] hover:bg-[#ee8c2b]/10 transition-colors"
                    title="编辑"
                >
                    <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button
                    onClick={() => onToggleStatus(merchant)}
                    className="p-1.5 rounded-lg text-[#9a734c] hover:text-[#ee8c2b] hover:bg-[#ee8c2b]/10 transition-colors"
                    title={merchant.status === 'active' ? '禁用' : '启用'}
                >
                    <span className="material-symbols-outlined text-base">
                        {merchant.status === 'active' ? 'toggle_on' : 'toggle_off'}
                    </span>
                </button>
            </div>
        </td>
    </tr>
);

const MerchantManagement = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 获取商家数据
    useEffect(() => {
        fetchMerchants();
    }, [currentPage, selectedStatus, selectedCategory, searchTerm]);

    const fetchMerchants = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage - 1, // 后端页码从0开始
                size: 10
            };

            if (searchTerm) params.name = searchTerm;
            if (selectedStatus !== 'all') params.status = selectedStatus;
            if (selectedCategory !== 'all') params.category = selectedCategory;

            console.log('🔍 请求商家列表，参数:', params);
            const response = await merchantService.getAllMerchants(params);
            console.log('📦 商家API原始响应:', response);

            if (response.content) {
                console.log('✅ 使用response.content，商家数量:', response.content.length);
                setMerchants(response.content);
                setTotalPages(response.totalPages || 1);
            } else if (Array.isArray(response)) {
                console.log('✅ 响应是数组，商家数量:', response.length);
                setMerchants(response);
            } else {
                console.warn('⚠️ 响应格式不匹配，设置为空数组');
                setMerchants([]);
            }
        } catch (error) {
            console.error('获取商家数据失败:', error);

            // 检查是否是认证问题
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.error('🔒 认证失败，可能需要重新登录');
                // 可以在这里添加重定向到登录页的逻辑
            }

            // 运行调试诊断
            console.log('🚀 运行API连接诊断...');
            debugApiConnection().then(report => {
                console.log('📊 诊断报告:', report);
                if (report.summary.overallHealth === 'critical') {
                    console.error('💀 关键问题:', report.summary.issues);
                    console.log('💡 建议修复:', report.summary.recommendations);
                }
            });

            setMerchants([]);
        } finally {
            setLoading(false);
        }
    };

    // 处理商家状态切换
    const handleToggleStatus = async (merchant) => {
        try {
            await merchantService.approveMerchant(merchant.id, {
                approved: merchant.status !== 'active',
                reason: merchant.status !== 'active' ? '审核通过' : '停用商家'
            });

            // 重新加载商家列表
            await fetchMerchants();

            const newStatus = merchant.status === 'active' ? 'inactive' : 'active';
            alert(`商家状态已更新为：${newStatus === 'active' ? '激活' : '停用'}`);
        } catch (error) {
            console.error('切换商家状态失败:', error);
            alert('操作失败：' + (error.response?.data?.message || error.message));
        }
    };

    // 处理编辑商家
    const handleEdit = (merchant) => {
        console.log('编辑商家:', merchant);
        // TODO: 打开编辑对话框
    };

    // 处理查看详情
    const handleViewDetails = (merchant) => {
        console.log('查看商家详情:', merchant);
        // TODO: 跳转到详情页面
    };

    // 处理搜索
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // 重置页码
    };

    return (
        <div className={`min-h-screen font-sans ${isDarkMode ? 'dark bg-[#221910] text-gray-100' : 'bg-[#f8f7f6] text-[#1b140d]'}`}>
            <div className="space-y-8 p-6 md:p-8">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b140d] dark:text-white">
                            商家管理
                        </h1>
                        <p className="text-[#9a734c] dark:text-[#cc9f70] text-base">
                            查看并管理系统中所有注册的餐厅与商店
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-[#3a2d20] border border-[#e7dbcf] dark:border-[#5a4632] rounded-lg text-[#1b140d] dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#4a3a2a] shadow-sm">
                            <span className="material-symbols-outlined text-lg">download</span>
                            <span>导出数据</span>
                        </button>
                        <button className="flex items-center gap-2 h-10 px-4 bg-[#ee8c2b] text-white rounded-lg text-sm font-bold hover:bg-opacity-90 shadow-sm">
                            <span className="material-symbols-outlined text-lg">add</span>
                            <span>新增商家</span>
                        </button>
                    </div>
                </div>

                {/* 搜索与筛选 */}
                <div className="bg-white dark:bg-[#1a120b] p-4 rounded-xl border border-[#e7dbcf] dark:border-[#3a2d20] shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="w-full lg:max-w-md relative group">
                        <input
                            className="w-full h-11 pl-11 pr-4 rounded-lg bg-[#fcfaf8] dark:bg-[#2a2018] border border-[#e7dbcf] dark:border-[#4a3a2a] text-[#1b140d] dark:text-white text-sm focus:ring-2 focus:ring-[#ee8c2b]/50 focus:border-[#ee8c2b] transition-all placeholder:text-[#9a734c] dark:placeholder:text-[#8a6a4b]"
                            placeholder="搜索商家名称或 ID..."
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9a734c] dark:text-[#8a6a4b] group-focus-within:text-[#ee8c2b]">search</span>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <FilterButton
                            label={`状态: ${selectedStatus === 'all' ? '全部' : selectedStatus}`}
                            active={selectedStatus !== 'all'}
                            onClick={() => {/* TODO: 状态筛选逻辑 */ }}
                        />
                        <FilterButton
                            label={`类别: ${selectedCategory === 'all' ? '全部' : selectedCategory}`}
                            active={selectedCategory !== 'all'}
                            onClick={() => {/* TODO: 类别筛选逻辑 */ }}
                        />
                        <FilterButton
                            label="入驻日期: 不限"
                            icon="calendar_today"
                            onClick={() => {/* TODO: 日期筛选逻辑 */ }}
                        />
                        <button
                            className="text-[#ee8c2b] font-medium text-sm hover:underline ml-2"
                            onClick={() => {
                                setSelectedStatus('all');
                                setSelectedCategory('all');
                                setSearchTerm('');
                            }}
                        >
                            重置
                        </button>
                    </div>
                </div>

                {/* 商家表格 */}
                <div className="bg-white dark:bg-[#1a120b] rounded-xl border border-[#e7dbcf] dark:border-[#3a2d20] shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="flex items-center justify-center gap-2 text-[#9a734c] dark:text-[#cc9f70]">
                                <div className="w-4 h-4 border-2 border-[#ee8c2b] border-t-transparent rounded-full animate-spin"></div>
                                加载中...
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#fcfaf8] dark:bg-[#2a2018] border-b border-[#e7dbcf] dark:border-[#3a2d20]">
                                        <th className="p-4 text-xs font-bold text-[#9a734c] dark:text-[#cc9f70] uppercase tracking-wider">商家信息</th>
                                        <th className="p-4 text-xs font-bold text-[#9a734c] dark:text-[#cc9f70] uppercase tracking-wider">类别</th>
                                        <th className="p-4 text-xs font-bold text-[#9a734c] dark:text-[#cc9f70] uppercase tracking-wider">入驻日期</th>
                                        <th className="p-4 text-xs font-bold text-[#9a734c] dark:text-[#cc9f70] uppercase tracking-wider">状态</th>
                                        <th className="p-4 text-xs font-bold text-[#9a734c] dark:text-[#cc9f70] uppercase tracking-wider">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e7dbcf] dark:divide-[#3a2d20]">
                                    {merchants.length > 0 ? (
                                        merchants.map((merchant) => (
                                            <MerchantRow
                                                key={merchant.id || merchant._id}
                                                merchant={merchant}
                                                onEdit={handleEdit}
                                                onToggleStatus={handleToggleStatus}
                                                onViewDetails={handleViewDetails}
                                            />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-[#9a734c] dark:text-[#cc9f70]">
                                                暂无商家数据
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-[#9a734c] dark:text-[#cc9f70]">
                            显示第 {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, merchants.length)} 条，
                            共 {merchants.length} 条
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded bg-white dark:bg-[#2a2018] border border-[#e7dbcf] dark:border-[#4a3a2a] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                上一页
                            </button>
                            <span className="text-sm text-[#9a734c] dark:text-[#cc9f70]">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded bg-white dark:bg-[#2a2018] border border-[#e7dbcf] dark:border-[#4a3a2a] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                下一页
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MerchantManagement;