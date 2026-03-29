import React, { useState, useEffect } from 'react';
import settlementService from '../../services/admin/settlementService';

// 结算状态标签组件 (北欧语义化重构)
const SettlementStatusBadge = ({ status }) => {
    const statusConfig = {
        PENDING_CONFIRM: {
            text: '待确认',
            class: 'bg-warning-bg text-warning border border-warning/20',
            icon: 'schedule'
        },
        CONFIRMED: {
            text: '已确认',
            class: 'bg-info-bg text-info border border-info/20',
            icon: 'check_circle'
        },
        PAID: {
            text: '已打款',
            class: 'bg-success-bg text-success border border-success/20',
            icon: 'paid'
        },
        CANCELLED: {
            text: '已取消',
            class: 'bg-error-bg text-error border border-error/20',
            icon: 'cancel'
        }
    };

    const config = statusConfig[status] || statusConfig.PENDING_CONFIRM;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${config.class}`}>
            <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
            {config.text}
        </span>
    );
};

// 结算详情模态框组件 (毛玻璃高级拟态重构)
const SettlementDetailModal = ({ isOpen, onClose, settlementId, showAlert, showConfirm }) => {
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
            showAlert('获取结算详情失败: ' + error.message);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border-light animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-border-light bg-background-section shrink-0">
                    <h3 className="text-lg font-extrabold text-text-primary tracking-tight">结算单详情</h3>
                    <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-24 gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                        <p className="text-sm font-bold text-text-secondary">正在加载数据...</p>
                    </div>
                ) : settlement ? (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Tab 导航 */}
                        <div className="border-b border-border-light px-6 shrink-0 bg-surface">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    className={`py-3 px-1 border-b-[3px] font-bold text-sm transition-colors ${activeTab === 'basic'
                                        ? 'border-primary text-text-primary'
                                        : 'border-transparent text-text-secondary hover:text-primary hover:border-primary/30'
                                        }`}
                                    onClick={() => setActiveTab('basic')}
                                >
                                    基本信息
                                </button>
                                <button
                                    className={`py-3 px-1 border-b-[3px] font-bold text-sm transition-colors ${activeTab === 'commissions'
                                        ? 'border-primary text-text-primary'
                                        : 'border-transparent text-text-secondary hover:text-primary hover:border-primary/30'
                                        }`}
                                    onClick={() => setActiveTab('commissions')}
                                >
                                    分成明细 ({commissions.length})
                                </button>
                            </nav>
                        </div>

                        {/* Tab 内容区 */}
                        <div className="p-6 overflow-y-auto bg-background flex-1">
                            {activeTab === 'basic' && (
                                <div className="space-y-6">
                                    {/* 结算单基本信息 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-4 bg-surface p-5 rounded-xl border border-border-light shadow-sm">
                                            <div>
                                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">结算单号</label>
                                                <p className="text-sm font-mono font-bold text-text-primary mt-1">{settlement.settlementNo}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">商家名称</label>
                                                <p className="text-sm font-bold text-text-primary mt-1">{settlement.merchantName}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest">结算周期</label>
                                                <p className="text-sm font-medium text-text-primary mt-1 bg-background-section inline-block px-2 py-0.5 rounded">{settlement.periodDisplay}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1.5">结算状态</label>
                                                <SettlementStatusBadge status={settlement.status} />
                                            </div>
                                        </div>

                                        <div className="space-y-4 bg-surface p-5 rounded-xl border border-border-light shadow-sm">
                                            <div className="flex justify-between items-center border-b border-border-light pb-2">
                                                <label className="text-sm font-bold text-text-secondary">订单总数</label>
                                                <p className="text-base font-extrabold">{settlement.totalOrderCount?.toLocaleString()} 单</p>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-border-light pb-2">
                                                <label className="text-sm font-bold text-text-secondary">订单总金额</label>
                                                <p className="text-base font-extrabold text-primary font-display">¥{settlement.totalOrderAmount?.toLocaleString()}</p>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-border-light pb-2">
                                                <label className="text-sm font-bold text-text-secondary">平台分成</label>
                                                <p className="text-base font-extrabold text-error font-display">-¥{settlement.totalCommission?.toLocaleString()}</p>
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <label className="text-base font-extrabold text-text-primary">实际收入</label>
                                                <p className="text-2xl font-black text-success font-display tracking-tight">¥{settlement.netIncome?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 调整信息 */}
                                    {settlement.adjustmentAmount !== 0 && (
                                        <div className="bg-warning-bg p-5 rounded-xl border border-warning/20 shadow-sm animate-in fade-in">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="material-symbols-outlined text-warning text-[20px]">info</span>
                                                <h4 className="font-extrabold text-warning tracking-wide">财务调整信息</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-warning/70 uppercase tracking-widest">调整金额</label>
                                                    <p className={`text-base font-black mt-1 font-display ${settlement.adjustmentAmount > 0 ? 'text-success' : 'text-error'}`}>
                                                        {settlement.adjustmentAmount > 0 ? '+' : ''}¥{settlement.adjustmentAmount?.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-warning/70 uppercase tracking-widest">调整原因</label>
                                                    <p className="text-sm font-bold text-warning mt-1">{settlement.adjustmentReason || '无'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 时间信息 */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border-light">
                                        <div className="bg-surface p-4 rounded-xl border border-border-light text-center shadow-sm">
                                            <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">创建时间</label>
                                            <p className="text-xs font-bold font-mono text-text-primary">{new Date(settlement.createdAt).toLocaleString()}</p>
                                        </div>
                                        {settlement.confirmedAt ? (
                                            <div className="bg-surface p-4 rounded-xl border border-border-light text-center shadow-sm">
                                                <label className="text-xs font-bold text-text-tertiary uppercase tracking-widest block mb-1">确认时间</label>
                                                <p className="text-xs font-bold font-mono text-text-primary">{new Date(settlement.confirmedAt).toLocaleString()}</p>
                                            </div>
                                        ) : <div className="p-4"></div>}
                                        {settlement.paidAt ? (
                                            <div className="bg-surface p-4 rounded-xl border border-success/20 bg-success-bg text-center shadow-sm">
                                                <label className="text-xs font-bold text-success/70 uppercase tracking-widest block mb-1">打款时间</label>
                                                <p className="text-xs font-bold font-mono text-success">{new Date(settlement.paidAt).toLocaleString()}</p>
                                            </div>
                                        ) : <div className="p-4"></div>}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'commissions' && (
                                <div className="space-y-4 animate-in fade-in">
                                    {commissions.length > 0 ? (
                                        <div className="overflow-x-auto bg-surface rounded-xl border border-border-light shadow-sm">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-background-section border-b border-border-light">
                                                    <tr>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest whitespace-nowrap">订单号</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest whitespace-nowrap">服务</th>
                                                        <th className="text-center px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest whitespace-nowrap">订单金额</th>
                                                        <th className="text-center px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest whitespace-nowrap">分成比例</th>
                                                        <th className="text-center px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest whitespace-nowrap">分成金额</th>
                                                        <th className="text-left px-6 py-4 text-xs font-bold text-text-primary uppercase tracking-widest whitespace-nowrap">计算时间</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-light">
                                                    {commissions.map((commission) => (
                                                        <tr key={commission.id} className="hover:bg-surface-hover transition-colors">
                                                            <td className="px-6 py-4 font-mono text-sm font-bold text-text-primary">{commission.orderNumber}</td>
                                                            <td className="px-6 py-4 text-sm font-bold text-text-secondary">
                                                                <span className="bg-background-section px-2 py-1 rounded-md border border-border-light">{commission.serviceName}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center text-sm font-extrabold font-display">¥{commission.orderAmount?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-center text-sm font-bold text-primary bg-primary-soft/30">{(commission.commissionRate * 100).toFixed(1)}%</td>
                                                            <td className="px-6 py-4 text-center text-sm font-extrabold text-error font-display">
                                                                -¥{commission.commissionAmount?.toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-bold text-text-tertiary">
                                                                {new Date(commission.calculatedAt).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 bg-surface rounded-xl border border-dashed border-border-light">
                                            <span className="material-symbols-outlined text-4xl text-text-disabled mb-3">receipt_long</span>
                                            <p className="text-text-tertiary font-bold text-sm">暂无分成记录明细</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center text-text-tertiary font-bold">
                        未找到结算单信息
                    </div>
                )}
            </div>
        </div>
    );
};

// 结算管理主页面 (重构版)
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

    // 全局定制化弹窗状态
    const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
    const showConfirm = (message, onConfirmCallback) => setDialog({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
    const showAlert = (message) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });

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
            showAlert('获取列表失败，请检查网络连接');
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

    // 批量打款 (替换原生 Confirm/Alert)
    const handleBatchPay = async () => {
        if (selectedSettlements.length === 0) {
            showAlert('请先勾选需要打款的结算单');
            return;
        }

        showConfirm(`确定要将选中的 ${selectedSettlements.length} 个结算单标记为已打款吗？`, async () => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            try {
                await settlementService.batchMarkAsPaid(selectedSettlements);
                setSelectedSettlements([]);
                fetchSettlements();
                showAlert('批量打款状态更新成功');
            } catch (error) {
                console.error('批量打款失败:', error);
                showAlert('批量打款失败: ' + error.message);
            }
        });
    };

    // 确认结算单 (替换原生 Confirm)
    const handleConfirmSettlement = (settlementId) => {
        showConfirm('确定要确认这份结算单吗？一旦确认将可进入打款流程。', async () => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            try {
                await settlementService.confirmSettlement(settlementId);
                fetchSettlements();
                showAlert('结算单确认成功');
            } catch (error) {
                console.error('确认结算单失败:', error);
                showAlert('确认失败: ' + error.message);
            }
        });
    };

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500 min-h-screen">
            <div className="space-y-6 p-6 md:p-8 max-w-[1400px] mx-auto">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">财务管理</h1>
                        <p className="text-text-secondary text-sm font-medium">管理商家结算单和分成记录</p>
                    </div>
                    <div className="flex gap-3">
                        {selectedSettlements.length > 0 && (
                            <button
                                onClick={handleBatchPay}
                                className="flex items-center gap-2 h-10 px-5 bg-success text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm active:scale-95 animate-in zoom-in"
                            >
                                <span className="material-symbols-outlined text-[18px]">payments</span>
                                <span>批量打款 ({selectedSettlements.length})</span>
                            </button>
                        )}
                        <button 
                            onClick={() => showAlert('此功能正在对接真实后台接口...')}
                            className="flex items-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-primary active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">calculate</span>
                            <span>生成结算单</span>
                        </button>
                    </div>
                </div>

                {/* 筛选条件条 (北欧风控件) */}
                <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-4 lg:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">商家ID</label>
                            <input
                                type="number"
                                className="w-full h-11 px-4 border border-border-light rounded-xl bg-background-section focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm font-bold text-text-primary outline-none transition-all placeholder:text-text-tertiary placeholder:font-medium"
                                value={filters.merchantId}
                                onChange={(e) => handleFilterChange('merchantId', e.target.value)}
                                placeholder="输入商家ID..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">结算状态</label>
                            <select
                                className="w-full h-11 px-4 border border-border-light rounded-xl bg-background-section focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm font-bold text-text-primary outline-none transition-all cursor-pointer"
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
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">结算类型</label>
                            <select
                                className="w-full h-11 px-4 border border-border-light rounded-xl bg-background-section focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm font-bold text-text-primary outline-none transition-all cursor-pointer"
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
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">开始日期</label>
                            <input
                                type="date"
                                className="w-full h-11 px-4 border border-border-light rounded-xl bg-background-section focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm font-bold text-text-primary outline-none transition-all"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5">结束日期</label>
                            <input
                                type="date"
                                className="w-full h-11 px-4 border border-border-light rounded-xl bg-background-section focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm font-bold text-text-primary outline-none transition-all"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2 border-t border-border-light">
                        <button
                            onClick={applyFilters}
                            className="h-10 px-6 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-primary transition-all active:scale-95"
                        >
                            应用筛选
                        </button>
                        <button
                            onClick={resetFilters}
                            className="h-10 px-6 bg-surface border border-border-light text-text-secondary rounded-xl text-sm font-bold hover:bg-surface-hover hover:text-primary transition-colors shadow-sm"
                        >
                            重置条件
                        </button>
                    </div>
                </div>

                {/* 结算列表表格 (严格规范排版：首列左对齐，其余绝对居中) */}
                <div className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-24">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                                <span className="text-sm font-bold text-text-tertiary">正在加载结算数据...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-background-section border-b border-border-light">
                                    <tr>
                                        <th className="px-6 py-4 text-center w-12 shrink-0">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/50 cursor-pointer"
                                                checked={selectedSettlements.length === settlements.length && settlements.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedSettlements(settlements.map(s => s.id));
                                                    else setSelectedSettlements([]);
                                                }}
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-left whitespace-nowrap">结算信息</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">商家信息</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">订单统计</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">金额信息</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">状态</th>
                                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {settlements.map((settlement) => (
                                        <tr key={settlement.id} className={`hover:bg-surface-hover transition-colors ${selectedSettlements.includes(settlement.id) ? 'bg-primary-soft/30' : ''}`}>
                                            <td className="px-6 py-5 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/50 cursor-pointer"
                                                    checked={selectedSettlements.includes(settlement.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedSettlements([...selectedSettlements, settlement.id]);
                                                        else setSelectedSettlements(selectedSettlements.filter(id => id !== settlement.id));
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-5 text-left">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-sm font-extrabold text-text-primary mb-0.5">
                                                        {settlement.settlementNo}
                                                    </span>
                                                    <span className="text-xs font-bold text-text-tertiary bg-background-section self-start px-2 py-0.5 rounded border border-border-light">
                                                        {settlement.periodDisplay}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-extrabold text-text-primary">{settlement.merchantName}</span>
                                                    <span className="text-xs font-bold text-text-tertiary mt-0.5">ID: {settlement.merchantId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-extrabold text-text-primary bg-background-section px-2 py-0.5 rounded mb-0.5">{settlement.totalOrderCount?.toLocaleString()} 单</span>
                                                    <span className="text-xs font-bold text-text-secondary font-display">¥{settlement.totalOrderAmount?.toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex flex-col items-center text-sm font-display">
                                                    <div className="flex items-center gap-1 text-xs font-bold text-error">
                                                        <span className="text-text-tertiary">分成</span> -¥{settlement.totalCommission?.toLocaleString()}
                                                    </div>
                                                    <div className="font-black text-success mt-0.5 text-base">
                                                        ¥{settlement.netIncome?.toLocaleString()}
                                                    </div>
                                                    {settlement.adjustmentAmount !== 0 && (
                                                        <div className={`text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded ${settlement.adjustmentAmount > 0 ? 'bg-success-bg text-success border border-success/20' : 'bg-error-bg text-error border border-error/20'}`}>
                                                            调: {settlement.adjustmentAmount > 0 ? '+' : ''}¥{settlement.adjustmentAmount?.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <SettlementStatusBadge status={settlement.status} />
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSettlementId(settlement.id);
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary-soft transition-colors"
                                                        title="查看详情"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </button>
                                                    {settlement.status === 'PENDING_CONFIRM' && (
                                                        <button
                                                            onClick={() => handleConfirmSettlement(settlement.id)}
                                                            className="p-2 rounded-lg text-text-tertiary hover:text-success hover:bg-success-bg transition-colors"
                                                            title="确认结算单"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {settlements.length === 0 && (
                                <div className="text-center py-24 bg-surface">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="bg-background-section p-6 rounded-full mb-2">
                                            <span className="material-symbols-outlined text-text-disabled text-5xl">receipt_long</span>
                                        </div>
                                        <p className="text-text-tertiary font-bold text-sm">暂无符合条件的结算数据</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 分页组件 (精美北欧样式) */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-surface px-6 py-4 rounded-2xl border border-border-light shadow-sm">
                        <p className="text-sm font-medium text-text-secondary">
                            显示第 <span className="font-bold text-text-primary">{pagination.page * pagination.size + 1}</span> - <span className="font-bold text-text-primary">{Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}</span> 条，
                            共 <span className="font-bold text-text-primary">{pagination.totalElements}</span> 条记录
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 0}
                                className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-light text-text-secondary hover:bg-surface-hover hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>
                            <span className="text-sm font-bold text-text-secondary px-2">
                                {pagination.page + 1} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages - 1}
                                className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-light text-text-secondary hover:bg-surface-hover hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
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
                showAlert={showAlert}
                showConfirm={showConfirm}
            />

            {/* 全局基础定制化 Modal 弹窗 */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
                        <div className="p-6 text-center">
                            <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${dialog.type === 'confirm' ? 'bg-primary-soft text-primary' : 'bg-info-bg text-info'
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

export default Settlements;