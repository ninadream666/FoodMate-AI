import React, { useState, useEffect } from 'react';
import settlementService from '../../services/admin/settlementService';

// 结算状态标签组件
const SettlementStatusBadge = ({ status }) => {
    const statusConfig = {
        PENDING_CONFIRM: {
            text: '待确认',
            class: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
            icon: 'schedule'
        },
        CONFIRMED: {
            text: '已确认',
            class: 'bg-orange-100 text-[#ee8c2b]',
            icon: 'check_circle'
        },
        PAID: {
            text: '已打款',
            class: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
            icon: 'paid'
        },
        CANCELLED: {
            text: '已取消',
            class: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
            icon: 'cancel'
        }
    };

    const config = statusConfig[status] || statusConfig.PENDING_CONFIRM;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
            <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
            {config.text}
        </span>
    );
};

// 结算详情模态框组件
const SettlementDetailModal = ({ isOpen, onClose, settlementId }) => {
    const [settlement, setSettlement] = useState(null);
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    const fetchSettlementDetail = async () => {
        if (!settlementId) return;

        try {
            setLoading(true);
            const [settlementRes, commissionsRes] = await Promise.all([
                settlementService.getSettlementById(settlementId),
                settlementService.getSettlementCommissions(settlementId)
            ]);

            setSettlement(settlementRes);
            setCommissions(commissionsRes?.content || []);
        } catch (error) {
            console.error('获取结算详情失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && settlementId) {
            fetchSettlementDetail();
        }
    }, [isOpen, settlementId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="fixed inset-0 bg-black opacity-25" onClick={onClose}></div>
                <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-lg font-semibold">结算单详情</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : settlement ? (
                        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                            {/* Tab 导航 */}
                            <div className="border-b px-6">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'basic'
                                            ? 'border-[#ee8c2b] text-[#ee8c2b]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        onClick={() => setActiveTab('basic')}
                                    >
                                        基本信息
                                    </button>
                                    <button
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'commissions'
                                            ? 'border-[#ee8c2b] text-[#ee8c2b]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        onClick={() => setActiveTab('commissions')}
                                    >
                                        分成明细 ({commissions.length})
                                    </button>
                                </nav>
                            </div>

                            {/* Tab 内容 */}
                            <div className="p-6">
                                {activeTab === 'basic' && (
                                    <div className="space-y-6">
                                        {/* 结算单基本信息 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">结算单号</label>
                                                    <p className="text-sm font-mono">{settlement.settlementNo}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">商家名称</label>
                                                    <p className="text-sm">{settlement.merchantName}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">结算周期</label>
                                                    <p className="text-sm">{settlement.periodDisplay}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">结算状态</label>
                                                    <div className="mt-1">
                                                        <SettlementStatusBadge status={settlement.status} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">订单总数</label>
                                                    <p className="text-sm font-semibold">{settlement.totalOrderCount?.toLocaleString()} 单</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">订单总金额</label>
                                                    <p className="text-sm font-semibold text-[#ee8c2b]">¥{settlement.totalOrderAmount?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">平台分成</label>
                                                    <p className="text-sm font-semibold text-orange-600">¥{settlement.totalCommission?.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">实际收入</label>
                                                    <p className="text-lg font-bold text-green-600">¥{settlement.netIncome?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 调整信息 */}
                                        {settlement.adjustmentAmount !== 0 && (
                                            <div className="bg-yellow-50 p-4 rounded-md">
                                                <h4 className="font-medium text-yellow-800 mb-2">调整信息</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-yellow-700">调整金额</label>
                                                        <p className={`text-sm font-semibold ${settlement.adjustmentAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {settlement.adjustmentAmount > 0 ? '+' : ''}¥{settlement.adjustmentAmount?.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-yellow-700">调整原因</label>
                                                        <p className="text-sm">{settlement.adjustmentReason || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 时间信息 */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">创建时间</label>
                                                <p className="text-sm">{new Date(settlement.createdAt).toLocaleString()}</p>
                                            </div>
                                            {settlement.confirmedAt && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">确认时间</label>
                                                    <p className="text-sm">{new Date(settlement.confirmedAt).toLocaleString()}</p>
                                                </div>
                                            )}
                                            {settlement.paidAt && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">打款时间</label>
                                                    <p className="text-sm">{new Date(settlement.paidAt).toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'commissions' && (
                                    <div className="space-y-4">
                                        {commissions.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full border border-[#e7dbcf] rounded-lg">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="text-left p-3 font-medium text-gray-900">订单号</th>
                                                            <th className="text-left p-3 font-medium text-gray-900">服务</th>
                                                            <th className="text-left p-3 font-medium text-gray-900">订单金额</th>
                                                            <th className="text-left p-3 font-medium text-gray-900">分成比例</th>
                                                            <th className="text-left p-3 font-medium text-gray-900">分成金额</th>
                                                            <th className="text-left p-3 font-medium text-gray-900">计算时间</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {commissions.map((commission) => (
                                                            <tr key={commission.id} className="border-t hover:bg-gray-50">
                                                                <td className="p-3 font-mono text-sm">{commission.orderNumber}</td>
                                                                <td className="p-3 text-sm">{commission.serviceName}</td>
                                                                <td className="p-3 text-sm">¥{commission.orderAmount?.toLocaleString()}</td>
                                                                <td className="p-3 text-sm">{(commission.commissionRate * 100).toFixed(2)}%</td>
                                                                <td className="p-3 text-sm font-semibold text-orange-600">
                                                                    ¥{commission.commissionAmount?.toLocaleString()}
                                                                </td>
                                                                <td className="p-3 text-sm">
                                                                    {new Date(commission.calculatedAt).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                暂无分成记录
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            未找到结算单信息
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 结算管理主页面
const Settlements = () => {
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0
    });

    // 筛选条件
    const [filters, setFilters] = useState({
        merchantId: '',
        status: '',
        settlementType: '',
        startDate: '',
        endDate: ''
    });

    const [selectedSettlements, setSelectedSettlements] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSettlementId, setSelectedSettlementId] = useState(null);

    // 加载结算列表
    const fetchSettlements = async (params = {}) => {
        try {
            setLoading(true);
            const response = await settlementService.getSettlements({
                page: pagination.page,
                size: pagination.size,
                ...filters,
                ...params
            });

            if (response?.content) {
                setSettlements(response.content);
                setPagination(prev => ({
                    ...prev,
                    totalElements: response.totalElements,
                    totalPages: response.totalPages,
                    page: response.number
                }));
            }
        } catch (error) {
            console.error('获取结算列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettlements();
    }, []);

    // 处理筛选变化
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // 应用筛选
    const applyFilters = () => {
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchSettlements({ page: 0 });
    };

    // 重置筛选
    const resetFilters = () => {
        setFilters({
            merchantId: '',
            status: '',
            settlementType: '',
            startDate: '',
            endDate: ''
        });
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchSettlements({
            page: 0,
            merchantId: '',
            status: '',
            settlementType: '',
            startDate: '',
            endDate: ''
        });
    };

    // 分页处理
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        fetchSettlements({ page: newPage });
    };

    // 批量打款
    const handleBatchPay = async () => {
        if (selectedSettlements.length === 0) {
            alert('请选择要打款的结算单');
            return;
        }

        if (!window.confirm(`确定要标记 ${selectedSettlements.length} 个结算单为已打款吗？`)) return;

        try {
            await settlementService.batchMarkAsPaid(selectedSettlements);
            setSelectedSettlements([]);
            fetchSettlements();
        } catch (error) {
            console.error('批量打款失败:', error);
            alert('批量打款失败: ' + error.message);
        }
    };

    // 确认结算单
    const handleConfirmSettlement = async (settlementId) => {
        try {
            await settlementService.confirmSettlement(settlementId);
            fetchSettlements();
        } catch (error) {
            console.error('确认结算单失败:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f7f6] text-[#1b140d] font-['Inter']">
            <div className="space-y-8 p-6 md:p-8">
            {/* 页面标题 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b140d]">财务管理</h1>
                    <p className="text-[#9a734c] text-base">管理商家结算单和分成记录</p>
                </div>
                <div className="flex gap-3">
                    {selectedSettlements.length > 0 && (
                        <button
                            onClick={handleBatchPay}
                            className="flex items-center gap-2 h-10 px-4 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">payments</span>
                            <span>批量打款 ({selectedSettlements.length})</span>
                        </button>
                    )}
                    <button className="flex items-center gap-2 h-10 px-4 bg-[#ee8c2b] text-white rounded-lg text-sm font-bold hover:bg-[#d97b1e] shadow-sm">
                        <span className="material-symbols-outlined text-lg">calculate</span>
                        <span>生成结算单</span>
                    </button>
                </div>
            </div>

            {/* 筛选条件 */}
            <div className="bg-white rounded-xl border border-[#e7dbcf] shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">商家ID</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-[#e7dbcf] rounded-md"
                            value={filters.merchantId}
                            onChange={(e) => handleFilterChange('merchantId', e.target.value)}
                            placeholder="输入商家ID"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">结算状态</label>
                        <select
                            className="w-full p-2 border border-[#e7dbcf] rounded-md"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">全部状态</option>
                            <option value="PENDING_CONFIRM">待确认</option>
                            <option value="CONFIRMED">已确认</option>
                            <option value="PAID">已打款</option>
                            <option value="CANCELLED">已取消</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">结算类型</label>
                        <select
                            className="w-full p-2 border border-[#e7dbcf] rounded-md"
                            value={filters.settlementType}
                            onChange={(e) => handleFilterChange('settlementType', e.target.value)}
                        >
                            <option value="">全部类型</option>
                            <option value="DAILY">日结</option>
                            <option value="WEEKLY">周结</option>
                            <option value="MONTHLY">月结</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-[#e7dbcf] rounded-md"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-[#e7dbcf] rounded-md"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={applyFilters}
                        className="h-10 px-4 bg-[#ee8c2b] text-white rounded-lg text-sm font-bold hover:bg-[#d97b1e] shadow-sm"
                    >
                        应用筛选
                    </button>
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                        重置
                    </button>
                </div>
            </div>

            {/* 结算列表 */}
            <div className="bg-white rounded-lg shadow-sm border">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left p-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300"
                                            checked={selectedSettlements.length === settlements.length && settlements.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedSettlements(settlements.map(s => s.id));
                                                } else {
                                                    setSelectedSettlements([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="text-left p-4 font-medium text-gray-900">结算信息</th>
                                    <th className="text-left p-4 font-medium text-gray-900">商家信息</th>
                                    <th className="text-left p-4 font-medium text-gray-900">订单统计</th>
                                    <th className="text-left p-4 font-medium text-gray-900">金额信息</th>
                                    <th className="text-left p-4 font-medium text-gray-900">状态</th>
                                    <th className="text-left p-4 font-medium text-gray-900">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {settlements.map((settlement) => (
                                    <tr key={settlement.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300"
                                                checked={selectedSettlements.includes(settlement.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSettlements([...selectedSettlements, settlement.id]);
                                                    } else {
                                                        setSelectedSettlements(selectedSettlements.filter(id => id !== settlement.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <div className="font-mono text-sm font-medium">
                                                    {settlement.settlementNo}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {settlement.periodDisplay}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <div className="font-medium">{settlement.merchantName}</div>
                                                <div className="text-sm text-gray-500">ID: {settlement.merchantId}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">
                                                <div>{settlement.totalOrderCount?.toLocaleString()} 单</div>
                                                <div className="text-gray-500">
                                                    ¥{settlement.totalOrderAmount?.toLocaleString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">
                                                <div className="text-orange-600">
                                                    分成: ¥{settlement.totalCommission?.toLocaleString()}
                                                </div>
                                                <div className="font-semibold text-green-600">
                                                    实收: ¥{settlement.netIncome?.toLocaleString()}
                                                </div>
                                                {settlement.adjustmentAmount !== 0 && (
                                                    <div className={settlement.adjustmentAmount > 0 ? 'text-green-600' : 'text-red-600'}>
                                                        调整: {settlement.adjustmentAmount > 0 ? '+' : ''}¥{settlement.adjustmentAmount?.toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <SettlementStatusBadge status={settlement.status} />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSettlementId(settlement.id);
                                                        setShowDetailModal(true);
                                                    }}
                                                    className="p-1.5 bg-[#ee8c2b] text-white rounded hover:bg-[#d97b1e]"
                                                    title="查看详情"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                </button>
                                                {settlement.status === 'PENDING_CONFIRM' && (
                                                    <button
                                                        onClick={() => handleConfirmSettlement(settlement.id)}
                                                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                                                        title="确认结算"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {settlements.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-3">
                                    <span className="material-symbols-outlined text-[48px]">receipt_long</span>
                                </div>
                                <p className="text-gray-500">暂无结算数据</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 分页 */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <div className="text-sm text-gray-500">
                            显示第 {pagination.page * pagination.size + 1} - {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} 条，
                            共 {pagination.totalElements} 条记录
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 0}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                上一页
                            </button>
                            <span className="px-3 py-1 text-sm">
                                第 {pagination.page + 1} 页，共 {pagination.totalPages} 页
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages - 1}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                下一页
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 结算详情模态框 */}
            <SettlementDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedSettlementId(null);
                }}
                settlementId={selectedSettlementId}
            />
        </div>
        </div>
    );
};

export default Settlements;