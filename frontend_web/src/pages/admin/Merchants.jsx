import React, { useState, useEffect } from 'react';
import merchantService from '../../services/admin/merchantService';
import { debugApiConnection } from '../../utils/debugApiConnection';

// 筛选按钮组件
const FilterButton = ({ label, icon, onClick, active = false }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-bold transition-all ${active
            ? 'bg-primary text-white shadow-md'
            : 'bg-surface border border-border-light text-text-secondary hover:text-primary hover:bg-surface-hover shadow-sm'
            }`}
    >
        {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
        <span>{label}</span>
    </button>
);

// 状态标签组件
const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case '已上线':
                return 'bg-success-bg text-success border border-success/20';
            case 'pending':
            case '待审核':
                return 'bg-warning-bg text-warning border border-warning/20';
            case 'inactive':
            case 'offline':
            case '离线':
                return 'bg-background-section text-text-secondary border border-border-light';
            case 'rejected':
            case '已拒绝':
                return 'bg-error-bg text-error border border-error/20';
            default:
                return 'bg-background-section text-text-secondary border border-border-light';
        }
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(status)}`}>
            {status || '未知'}
        </span>
    );
};

// 商家行组件 (遵守北欧排版：首列左对齐，其余居中)
const MerchantRow = ({ merchant, onEdit, onToggleStatus, onViewDetails }) => (
    <tr className="hover:bg-surface-hover transition-colors border-b border-divider last:border-b-0">
        <td className="px-6 py-4 text-left">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary-bg flex items-center justify-center text-primary font-extrabold flex-shrink-0">
                    {merchant.name?.charAt(0) || 'M'}
                </div>
                <div className="flex flex-col">
                    <p className="text-text-primary font-bold">{merchant.name || '未知商家'}</p>
                    <p className="text-text-tertiary text-xs font-mono mt-0.5">{merchant.id || merchant._id || 'ID未设置'}</p>
                </div>
            </div>
        </td>
        <td className="px-6 py-4 text-center">
            <span className="text-text-secondary text-sm font-medium">{merchant.category || '未分类'}</span>
        </td>
        <td className="px-6 py-4 text-center">
            <span className="text-text-secondary text-sm font-medium font-mono">
                {merchant.joinDate || merchant.createdAt ?
                    new Date(merchant.joinDate || merchant.createdAt).toLocaleDateString('zh-CN') :
                    '未知日期'
                }
            </span>
        </td>
        <td className="px-6 py-4 text-center">
            <StatusBadge status={merchant.status} />
        </td>
        <td className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={() => onViewDetails(merchant)}
                    className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary-soft transition-colors"
                    title="查看详情"
                >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                <button
                    onClick={() => onEdit(merchant)}
                    className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary-soft transition-colors"
                    title="编辑"
                >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button
                    onClick={() => onToggleStatus(merchant)}
                    className={`p-2 rounded-lg transition-colors ${merchant.status === 'active' ? 'text-text-tertiary hover:text-error hover:bg-error-bg' : 'text-text-tertiary hover:text-success hover:bg-success-bg'}`}
                    title={merchant.status === 'active' ? '停用' : '启用'}
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {merchant.status === 'active' ? 'block' : 'check_circle'}
                    </span>
                </button>
            </div>
        </td>
    </tr>
);

const MerchantManagement = () => {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 全局定制化弹窗状态
    const [dialog, setDialog] = useState({
        isOpen: false,
        type: 'alert', // 'alert' | 'confirm'
        message: '',
        onConfirm: null
    });

    const showConfirm = (message, onConfirmCallback) => {
        setDialog({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
    };

    const showAlert = (message) => {
        setDialog({ isOpen: true, type: 'alert', message, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
    };

    useEffect(() => {
        fetchMerchants();
    }, [currentPage, selectedStatus, selectedCategory, searchTerm]);

    const fetchMerchants = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage - 1, 
                size: 10
            };

            if (searchTerm) params.name = searchTerm;
            if (selectedStatus !== 'all') params.status = selectedStatus;
            if (selectedCategory !== 'all') params.category = selectedCategory;

            const response = await merchantService.getAllMerchants(params);

            if (response.content) {
                setMerchants(response.content);
                setTotalPages(response.totalPages || 1);
            } else if (Array.isArray(response)) {
                setMerchants(response);
            } else {
                setMerchants([]);
            }
        } catch (error) {
            console.error('获取商家数据失败:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.error('🔒 认证失败');
            }

            debugApiConnection().then(report => {
                if (report.summary.overallHealth === 'critical') {
                    console.error('💀 关键问题:', report.summary.issues);
                }
            });
            setMerchants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = (merchant) => {
        const newStatusStr = merchant.status === 'active' ? '停用' : '激活';
        showConfirm(`确定要 ${newStatusStr} 商家 "${merchant.name}" 吗？`, async () => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            try {
                await merchantService.approveMerchant(merchant.id, {
                    approved: merchant.status !== 'active',
                    reason: merchant.status !== 'active' ? '审核通过' : '停用商家'
                });
                await fetchMerchants();
                showAlert(`商家状态已更新为：${newStatusStr}`);
            } catch (error) {
                showAlert('操作失败：' + (error.response?.data?.message || error.message));
            }
        });
    };

    const handleEdit = (merchant) => {
        console.log('编辑商家:', merchant);
    };

    const handleViewDetails = (merchant) => {
        console.log('查看商家详情:', merchant);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); 
    };

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500">
            <div className="space-y-6 p-6 md:p-8 max-w-[1400px] mx-auto">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
                            商家管理
                        </h1>
                        <p className="text-text-secondary text-sm font-medium">
                            查看并管理系统中所有入驻的餐厅与商店
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 h-10 px-4 bg-surface border border-border-light rounded-xl text-text-secondary text-sm font-bold hover:bg-surface-hover hover:text-primary transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            <span>导出数据</span>
                        </button>
                        <button className="flex items-center gap-2 h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-primary transition-all">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>新增商家</span>
                        </button>
                    </div>
                </div>

                {/* 搜索与筛选 */}
                <div className="bg-surface p-4 rounded-2xl border border-border-light shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="w-full lg:max-w-md relative group">
                        <input
                            className="w-full h-11 pl-11 pr-4 rounded-xl bg-background-section border border-transparent focus:border-border-light text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all outline-none"
                            placeholder="搜索商家名称或 ID..."
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors text-[20px]">search</span>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <FilterButton
                            label={`状态: ${selectedStatus === 'all' ? '全部' : selectedStatus}`}
                            active={selectedStatus !== 'all'}
                            onClick={() => {}}
                        />
                        <FilterButton
                            label={`类别: ${selectedCategory === 'all' ? '全部' : selectedCategory}`}
                            active={selectedCategory !== 'all'}
                            onClick={() => {}}
                        />
                        <FilterButton
                            label="入驻日期: 不限"
                            icon="calendar_month"
                            onClick={() => {}}
                        />
                        <button
                            className="text-primary font-bold text-sm hover:opacity-80 transition-opacity ml-2"
                            onClick={() => {
                                setSelectedStatus('all');
                                setSelectedCategory('all');
                                setSearchTerm('');
                            }}
                        >
                            重置筛选
                        </button>
                    </div>
                </div>

                {/* 商家表格 */}
                <div className="bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="flex flex-col items-center justify-center gap-3 text-text-tertiary">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <span className="font-bold text-sm">加载数据中...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-background-section border-b border-border-light">
                                    <tr>
                                        {/* 首列左对齐，其余居中 */}
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-left">商家信息</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">类别</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">入驻日期</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">状态</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
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
                                            <td colSpan="5" className="px-6 py-20 text-center text-text-tertiary font-bold text-base">
                                                暂无符合条件的商家数据
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
                    <div className="flex items-center justify-between bg-surface px-6 py-4 rounded-2xl border border-border-light shadow-sm">
                        <p className="text-sm font-medium text-text-secondary">
                            显示第 <span className="font-bold text-text-primary">{((currentPage - 1) * 10) + 1}</span> - <span className="font-bold text-text-primary">{Math.min(currentPage * 10, merchants.length)}</span> 条，
                            共 <span className="font-bold text-text-primary">{merchants.length}</span> 条
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-light text-text-secondary hover:bg-surface-hover hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>
                            <span className="text-sm font-bold text-text-secondary px-2">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-light text-text-secondary hover:bg-surface-hover hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 定制化弹窗 Modal */}
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

export default MerchantManagement;