import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import settlementService from '../../services/admin/settlementService';

// 状态标签组件
const StatusBadge = ({ status }) => {
    const getStatusInfo = (status) => {
        const statusMap = {
            'PENDING_CONFIRM': { text: '待确认', class: 'bg-yellow-100 text-yellow-800' },
            'CONFIRMED': { text: '已确认', class: 'bg-blue-100 text-blue-800' },
            'DISPUTED': { text: '有争议', class: 'bg-red-100 text-red-800' },
            'PAID': { text: '已打款', class: 'bg-green-100 text-green-800' },
            'CANCELLED': { text: '已取消', class: 'bg-gray-100 text-gray-800' },
            'pending_review': { text: '待审核', class: 'bg-yellow-100 text-yellow-800' },
            'pending_payment': { text: '待打款', class: 'bg-blue-100 text-blue-800' },
            'completed': { text: '已结算', class: 'bg-green-100 text-green-800' },
            'disputed': { text: '有争议', class: 'bg-red-100 text-red-800' }
        };
        return statusMap[status] || { text: status || '未知', class: 'bg-gray-100 text-gray-800' };
    };

    const statusInfo = getStatusInfo(status);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.class}`}>
            {status === 'DISPUTED' || status === 'disputed' ? (
                <span className="material-symbols-outlined text-sm">warning</span>
            ) : (
                <span className="size-1.5 rounded-full bg-current opacity-50"></span>
            )}
            {statusInfo.text}
        </span>
    );
};

// 统计卡片组件
const StatCard = ({ label, value, trend, icon, iconColor, isNegative = false }) => (
    <div className="bg-white rounded-xl border border-[#e7dbcf] p-5 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
            <span className="text-[#9a734c] text-sm font-medium">{label}</span>
            <span className={`material-symbols-outlined ${iconColor} text-xl`}>{icon}</span>
        </div>
        <span className="text-2xl font-bold text-[#1b140d]">{value}</span>
        {trend && (
            <span className={`text-xs font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                {trend}
            </span>
        )}
    </div>
);

// 分页按钮组件
const PaginationBtn = ({ label, active, disabled, onClick }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-3 py-1 rounded border border-[#e7dbcf] text-sm font-medium transition-colors ${active
            ? "bg-[#ee8c2b] text-white border-[#ee8c2b]"
            : "text-[#9a734c] hover:bg-gray-50 disabled:opacity-50"
            }`}
    >
        {label}
    </button>
);

// 主页面组件
const Settlements = () => {
    const navigate = useNavigate();
    const [settlements, setSettlements] = useState([]);
    const [stats, setStats] = useState({
        pendingAmount: 0,
        completedAmount: 0,
        disputedAmount: 0,
        pendingCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0
    });
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        loadSettlements();
        loadStats();
    }, [pagination.page, statusFilter]);

    // 加载结算单列表
    const loadSettlements = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await settlementService.getSettlements({
                page: pagination.page,
                size: pagination.size,
                status: statusFilter || undefined,
                startDate: dateRange.start || undefined,
                endDate: dateRange.end || undefined
            });

            if (response && response.content) {
                setSettlements(response.content);
                setPagination(prev => ({
                    ...prev,
                    totalElements: response.totalElements || 0,
                    totalPages: response.totalPages || 0
                }));
            } else if (Array.isArray(response)) {
                setSettlements(response);
            } else {
                setSettlements([]);
            }
        } catch (err) {
            console.error('加载结算单失败:', err);
            setError('获取结算数据失败，请稍后重试');
            setSettlements([]);
        } finally {
            setLoading(false);
        }
    };

    // 加载统计数据
    const loadStats = async () => {
        try {
            const response = await settlementService.getSettlementStats();
            if (response) {
                setStats({
                    pendingAmount: response.pendingAmount || 0,
                    completedAmount: response.completedAmount || response.paidAmount || 0,
                    disputedAmount: response.disputedAmount || 0,
                    pendingCount: response.pendingCount || 0
                });
            } else {
                setStats({ pendingAmount: 0, completedAmount: 0, disputedAmount: 0, pendingCount: 0 });
            }
        } catch (err) {
            console.error('加载统计数据失败:', err);
            setStats({ pendingAmount: 0, completedAmount: 0, disputedAmount: 0, pendingCount: 0 });
        }
    };

    // 格式化金额
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        }).format(value || 0);
    };

    // 处理搜索
    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 0 }));
        loadSettlements();
    };

    // 处理重置
    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('');
        setDateRange({ start: '', end: '' });
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    // 查看详情
    const handleViewDetail = async (settlement) => {
        try {
            const detail = await settlementService.getSettlementById(settlement.id);
            console.log('结算单详情:', detail);
            alert(`结算单详情:\n结算单号: ${settlement.settlementNo}\n商家: ${settlement.merchantName}\n金额: ${formatCurrency(settlement.netIncome)}`);
        } catch (err) {
            console.error('获取详情失败:', err);
        }
    };

    // 审核结算单
    const handleConfirm = async (settlement) => {
        try {
            await settlementService.confirmSettlement(settlement.id);
            loadSettlements();
            loadStats();
        } catch (err) {
            console.error('确认结算单失败:', err);
            alert('操作失败，请重试');
        }
    };

    // 批量打款
    const handleBatchPay = async () => {
        if (selectedIds.length === 0) {
            alert('请先选择要打款的结算单');
            return;
        }
        try {
            await settlementService.batchMarkAsPaid(selectedIds);
            setSelectedIds([]);
            loadSettlements();
            loadStats();
        } catch (err) {
            console.error('批量打款失败:', err);
            alert('操作失败，请重试');
        }
    };

    // 导出报表
    const handleExport = async () => {
        try {
            const blob = await settlementService.exportSettlements({
                status: statusFilter || undefined,
                startDate: dateRange.start || undefined,
                endDate: dateRange.end || undefined
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `settlements_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('导出失败:', err);
            alert('导出功能开发中...');
        }
    };

    // 选择/取消选择
    const handleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    // 全选/取消全选
    const handleSelectAll = () => {
        if (selectedIds.length === settlements.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(settlements.map(s => s.id));
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f7f6] text-[#1b140d] font-['Inter']">
            <div className="p-6 md:p-8 space-y-6">
                {/* 错误提示 */}
                {error && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                        <span className="material-symbols-outlined text-yellow-600">warning</span>
                        <span className="text-yellow-800 text-sm">{error}</span>
                        <button
                            onClick={() => { loadSettlements(); loadStats(); }}
                            className="ml-auto text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                            重试连接
                        </button>
                    </div>
                )}

                {/* 页面头部 */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black leading-tight tracking-tight">结算管理</h1>
                        <p className="text-[#9a734c] text-sm md:text-base max-w-2xl">
                            管理商家结算流程，包括结算单的生成、审核、打款操作以及争议处理。
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white border border-[#e7dbcf] text-[#1b140d] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        <span>导出报表</span>
                    </button>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="待结算金额"
                        value={formatCurrency(stats.pendingAmount)}
                        trend="+12% 环比"
                        icon="pending_actions"
                        iconColor="text-[#ee8c2b]"
                    />
                    <StatCard
                        label="本月已结算"
                        value={formatCurrency(stats.completedAmount)}
                        trend="+5% 环比"
                        icon="account_balance_wallet"
                        iconColor="text-green-600"
                    />
                    <StatCard
                        label="争议金额"
                        value={formatCurrency(stats.disputedAmount)}
                        trend="+2% 新增"
                        icon="report_problem"
                        iconColor="text-red-500"
                        isNegative={true}
                    />
                    <StatCard
                        label="待审核单数"
                        value={stats.pendingCount}
                        icon="assignment_late"
                        iconColor="text-orange-500"
                    />
                </div>

                {/* 筛选区域 */}
                <div className="flex flex-col bg-white rounded-xl border border-[#e7dbcf] shadow-sm">
                    <div className="p-4 border-b border-[#e7dbcf]">
                        <h2 className="text-base font-bold">筛选查询</h2>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">商家名称</span>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">search</span>
                                <input
                                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#e7dbcf] bg-[#f8f7f6] text-sm focus:ring-1 focus:ring-[#ee8c2b] focus:border-[#ee8c2b] outline-none"
                                    placeholder="输入商家名称"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">结算周期</span>
                            <input
                                type="month"
                                className="w-full h-10 px-3 rounded-lg border border-[#e7dbcf] bg-[#f8f7f6] text-sm focus:ring-1 focus:ring-[#ee8c2b] focus:border-[#ee8c2b] outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">结算状态</span>
                            <select
                                className="w-full h-10 px-3 rounded-lg border border-[#e7dbcf] bg-[#f8f7f6] text-sm cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">全部状态</option>
                                <option value="PENDING_CONFIRM">待确认</option>
                                <option value="CONFIRMED">已确认</option>
                                <option value="PAID">已打款</option>
                                <option value="DISPUTED">有争议</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSearch}
                                className="flex-1 h-10 bg-[#ee8c2b] hover:bg-[#d97b1f] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">search</span>查询
                            </button>
                            <button
                                onClick={handleReset}
                                className="h-10 px-4 bg-white border border-[#e7dbcf] text-[#9a734c] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                重置
                            </button>
                        </div>
                    </div>
                </div>

                {/* 列表表格 */}
                <div className="bg-white rounded-xl border border-[#e7dbcf] shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-[#e7dbcf]">
                        <div className="flex gap-2 items-center">
                            <h2 className="text-base font-bold">结算单列表</h2>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                共 {pagination.totalElements} 条
                            </span>
                        </div>
                        <button
                            onClick={handleBatchPay}
                            disabled={selectedIds.length === 0}
                            className="text-[#ee8c2b] hover:text-[#d97b1f] text-sm font-bold flex items-center gap-1 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">payments</span>
                            批量打款 {selectedIds.length > 0 && `(${selectedIds.length})`}
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ee8c2b]"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#f8f7f6] text-[#9a734c] font-medium border-b border-[#e7dbcf]">
                                    <tr>
                                        <th className="px-6 py-3">结算单号 / 商家</th>
                                        <th className="px-6 py-3">结算周期</th>
                                        <th className="px-6 py-3 text-right">订单总额</th>
                                        <th className="px-6 py-3 text-right">平台佣金</th>
                                        <th className="px-6 py-3 text-right">应结金额</th>
                                        <th className="px-6 py-3">状态</th>
                                        <th className="px-6 py-3 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e7dbcf]">
                                    {settlements.map((settlement) => (
                                        <tr
                                            key={settlement.id}
                                            className={`group hover:bg-gray-50 transition-colors ${settlement.status === 'DISPUTED' ? 'bg-red-50/50' : ''
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-[#1b140d]">{settlement.settlementNo}</span>
                                                    <span className="text-[#9a734c] text-xs">{settlement.merchantName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[#1b140d] whitespace-nowrap">{settlement.periodLabel}</td>
                                            <td className="px-6 py-4 text-right tabular-nums text-[#9a734c]">
                                                {formatCurrency(settlement.totalOrderAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums text-[#9a734c]">
                                                -{formatCurrency(settlement.totalCommission)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-[#ee8c2b] font-bold tabular-nums text-base">
                                                    {formatCurrency(settlement.netIncome)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={settlement.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {settlement.status === 'PENDING_CONFIRM' && (
                                                        <button
                                                            onClick={() => handleConfirm(settlement)}
                                                            className="bg-[#ee8c2b] hover:bg-[#d97b1f] text-white text-xs px-3 py-1.5 rounded font-medium"
                                                        >
                                                            确认
                                                        </button>
                                                    )}
                                                    {settlement.status === 'CONFIRMED' && (
                                                        <button className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">payments</span>
                                                            打款
                                                        </button>
                                                    )}
                                                    {settlement.status === 'DISPUTED' && (
                                                        <button className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs px-3 py-1.5 rounded font-medium">
                                                            处理争议
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewDetail(settlement)}
                                                        className="text-[#9a734c] hover:text-[#1b140d] p-1 rounded hover:bg-gray-100"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">visibility</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 分页 */}
                    <div className="flex items-center justify-between p-4 border-t border-[#e7dbcf]">
                        <span className="text-sm text-[#9a734c]">
                            显示 {pagination.page * pagination.size + 1} 至 {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} 条，共 {pagination.totalElements} 条
                        </span>
                        <div className="flex gap-1">
                            <PaginationBtn
                                label="上一页"
                                disabled={pagination.page === 0}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            />
                            {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => (
                                <PaginationBtn
                                    key={i}
                                    label={String(i + 1)}
                                    active={pagination.page === i}
                                    onClick={() => setPagination(prev => ({ ...prev, page: i }))}
                                />
                            ))}
                            {pagination.totalPages > 5 && <span className="px-2 py-1 text-[#9a734c]">...</span>}
                            <PaginationBtn
                                label="下一页"
                                disabled={pagination.page >= pagination.totalPages - 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settlements;
