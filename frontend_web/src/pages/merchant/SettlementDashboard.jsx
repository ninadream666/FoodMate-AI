import React, { useState, useEffect } from 'react';
import { settlementService } from '../../services/settlementService';

/**
 * 结算分成看板
 * 功能：展示收入统计、结算单列表、结算单详情处理
 */
export default function SettlementDashboard() {
  const [stats, setStats] = useState({
    netIncome: 0,
    pendingCommission: 0, 
    totalOrderAmount: 0,
    totalCommission: 0
  });
  
  // 列表状态
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  
  // 筛选状态
  const [activeTab, setActiveTab] = useState('ALL');
  
  // 分页状态
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 详情模态框状态
  const [selectedSettlementId, setSelectedSettlementId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchSettlementList();
  }, [activeTab, page]);

  const fetchDashboardData = async () => {
    try {
      const [monthData, count] = await Promise.all([
        settlementService.getThisMonthSummary(),
        settlementService.getPendingCount()
      ]);
      setStats(monthData);
      setPendingCount(count);
    } catch (error) {
      console.error("加载统计数据失败", error);
    }
  };

  const fetchSettlementList = async () => {
    setLoading(true);
    try {
      let statusParam = null;
      if (activeTab === 'PENDING_CONFIRM') statusParam = 'PENDING_CONFIRM';
      if (activeTab === 'PAID') statusParam = 'PAID';

      const data = await settlementService.getSettlements(page, 10, statusParam);
      
      setSettlements(data.content || []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error("加载结算单失败", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const openDetailModal = (id) => {
    setSelectedSettlementId(id);
    setShowDetailModal(true);
  };

  const closeDetailModal = (shouldRefresh = false) => {
    setShowDetailModal(false);
    setSelectedSettlementId(null);
    if (shouldRefresh) {
      fetchSettlementList();
      fetchDashboardData(); // 刷新待确认数量
    }
  };

  // 格式化金额
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount || 0);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12">
          
          {/* Page Heading */}
          <div className="flex flex-col gap-2">
            <h1 className="text-text-primary text-3xl font-black leading-tight tracking-tight">结算分成</h1>
            <p className="text-text-secondary text-base font-normal">追踪您的收入流水和结算记录</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              icon="savings" 
              label="本月预估净收入" 
              value={formatCurrency(stats.netIncome)} 
              highlight 
            />
            <StatsCard 
              icon="hourglass_top" 
              label="待结算金额（预估）" 
              value={formatCurrency(stats.pendingCommission)} 
            />
            <StatsCard 
              icon="shopping_bag" 
              label="本月订单总额" 
              value={formatCurrency(stats.totalOrderAmount)} 
            />
            <StatsCard 
              icon="medical_services" 
              label="平台技术服务费" 
              value={formatCurrency(stats.totalCommission)} 
            />
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col bg-surface border border-border-light rounded-2xl shadow-sm overflow-hidden">
            
            {/* Tabs & Filter Header */}
            <div className="flex items-center justify-between px-6 border-b border-border-light bg-background-section">
              <div className="flex gap-8">
                {['ALL', 'PENDING_CONFIRM', 'PAID'].map((tab) => {
                  const label = tab === 'ALL' ? '全部记录' : (tab === 'PENDING_CONFIRM' ? '待确认' : '已打款');
                  const isActive = activeTab === tab;
                  return (
                    <button 
                      key={tab}
                      onClick={() => { setActiveTab(tab); setPage(0); }}
                      className={`relative py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 ${
                        isActive 
                          ? 'border-primary text-text-primary' 
                          : 'border-transparent text-text-secondary hover:text-primary hover:border-primary/30'
                      }`}
                    >
                      {label}
                      {tab === 'PENDING_CONFIRM' && pendingCount > 0 && (
                        <span className="bg-error text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 py-3">
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-text-secondary bg-surface border border-border-light rounded-lg hover:bg-surface-hover transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                  筛选
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-section border-b border-border-light">
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-left">结算周期</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-left">结算单号</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-left">订单数</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-left">订单总额</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-left">平台抽成</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-left">实际入账</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-center">状态</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {loading ? (
                    <tr><td colSpan="8" className="p-10 text-center text-text-tertiary">加载中...</td></tr>
                  ) : settlements.length === 0 ? (
                    <tr><td colSpan="8" className="p-10 text-center text-text-tertiary">暂无结算记录</td></tr>
                  ) : (
                    settlements.map((item) => (
                      <tr key={item.id} className="group hover:bg-surface-hover transition-colors">
                        <td className="py-4 px-6 text-sm font-bold text-text-primary text-left">
                          {item.periodDisplay} <span className="text-xs font-normal text-text-secondary ml-1">({item.periodStart} ~ {item.periodEnd})</span>
                        </td>
                        <td className="py-4 px-6 text-sm text-text-tertiary font-mono text-left">
                          {item.settlementNo}
                        </td>
                        <td className="py-4 px-6 text-sm text-text-primary font-medium text-left">
                          {item.totalOrderCount}
                        </td>
                        <td className="py-4 px-6 text-sm text-text-primary font-medium text-left">
                          {formatCurrency(item.totalOrderAmount)}
                        </td>
                        <td className="py-4 px-6 text-sm text-text-secondary text-left">
                          - {formatCurrency(item.totalCommission)}
                        </td>
                        <td className="py-4 px-6 text-sm text-text-primary font-bold text-lg text-left">
                          {formatCurrency(item.netIncome)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <StatusBadge status={item.status} label={item.statusName} />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => openDetailModal(item.id)}
                              className="text-sm font-bold text-primary hover:opacity-80 transition-colors"
                            >
                              查看详情
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border-light bg-surface">
              <p className="text-sm text-text-secondary">
                显示 {settlements.length > 0 ? page * 10 + 1 : 0} 到 {Math.min((page + 1) * 10, totalElements)} 条，共 {totalElements} 条记录
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-light text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-sm font-bold text-text-secondary px-2">
                  {page + 1} / {Math.max(1, totalPages)}
                </span>
                <button 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-light text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 详情模态框 */}
      {showDetailModal && (
        <SettlementDetailModal 
          settlementId={selectedSettlementId} 
          onClose={closeDetailModal} 
        />
      )}
    </div>
  );
}

// --- 子组件 ---

function StatsCard({ icon, label, value, highlight }) {
  return (
    <div className={`flex flex-col justify-between p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-card ${highlight ? 'bg-surface border-primary/20' : 'bg-surface border-border-light'}`}>
      <div className={`absolute right-0 top-0 p-4 opacity-${highlight ? '10' : '5'}`}>
        <span className={`material-symbols-outlined text-6xl ${highlight ? 'text-primary' : 'text-text-primary'}`}>{icon}</span>
      </div>
      <div className="flex items-center gap-2 mb-3 z-10">
        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${highlight ? 'bg-primary-bg text-primary' : 'bg-background-section text-text-secondary'}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <p className={`text-sm font-bold ${highlight ? 'text-text-secondary' : 'text-text-secondary'}`}>{label}</p>
      </div>
      <p className={`text-2xl font-black tracking-tight z-10 ${highlight ? 'text-primary drop-shadow-sm' : 'text-text-primary'}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status, label }) {
  const styles = {
    'PENDING_CONFIRM': 'bg-warning-bg text-warning border-warning/20',
    'CONFIRMED': 'bg-info-bg text-info border-info/20',
    'PAID': 'bg-success-bg text-success border-success/20',
    'DISPUTED': 'bg-error-bg text-error border-error/20',
    'CANCELLED': 'bg-background-section text-text-secondary border-border-light'
  };
  const colorClass = styles[status] || styles['CANCELLED'];
  const dotColor = status === 'PENDING_CONFIRM' ? 'bg-warning' : (status === 'CONFIRMED' ? 'bg-info' : (status === 'PAID' ? 'bg-success' : 'bg-text-tertiary'));

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {label}
    </span>
  );
}

function SettlementDetailModal({ settlementId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeInput, setShowDisputeInput] = useState(false);

  // 内部的定制化弹窗状态
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'alert',
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
    if (settlementId) loadData();
  }, [settlementId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([
        settlementService.getSettlementDetail(settlementId),
        settlementService.getSettlementCommissions(settlementId)
      ]);
      setDetail(d);
      setCommissions(c.content || []);
    } catch (e) {
      showAlert("加载详情失败: " + e.message);
      // 延迟关闭防止看不到弹窗
      setTimeout(() => onClose(), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    showConfirm("确认结算单无误？确认后将进入打款流程。", async () => {
      setDialog(prev => ({ ...prev, isOpen: false }));
      try {
        await settlementService.confirmSettlement(settlementId);
        showAlert("确认成功！");
        setTimeout(() => onClose(true), 1500); 
      } catch (e) {
        showAlert("操作失败：" + e.message);
      }
    });
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      showAlert("请输入异议理由");
      return;
    }
    try {
      await settlementService.disputeSettlement(settlementId, disputeReason);
      showAlert("异议已提交，客服将介入处理");
      setTimeout(() => onClose(true), 1500);
    } catch (e) {
      showAlert("操作失败：" + e.message);
    }
  };

  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 border border-border-light">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-background-section">
          <div>
            <h3 className="text-lg font-bold text-text-primary">结算单详情</h3>
            <p className="text-xs text-text-secondary font-mono mt-1">{detail.settlementNo}</p>
          </div>
          <button onClick={() => onClose(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {loading ? <div className="text-center py-10 text-text-tertiary flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>加载中...
          </div> : (
            <div className="flex flex-col gap-6 animate-in fade-in">
              {/* Info Grid */}
              <div className="bg-surface p-4 rounded-xl border border-border-light shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-xs font-bold text-text-secondary mb-1 uppercase tracking-widest">结算周期</p><p className="font-bold text-sm text-text-primary">{detail.periodDisplay}</p></div>
                <div><p className="text-xs font-bold text-text-secondary mb-1 uppercase tracking-widest">订单总额</p><p className="font-bold text-sm text-text-primary">¥{detail.totalOrderAmount}</p></div>
                <div><p className="text-xs font-bold text-text-secondary mb-1 uppercase tracking-widest">平台抽成</p><p className="font-bold text-sm text-error">-¥{detail.totalCommission}</p></div>
                <div><p className="text-xs font-bold text-text-secondary mb-1 uppercase tracking-widest">实际入账</p><p className="font-black text-lg text-success">¥{detail.netIncome}</p></div>
              </div>

              {/* Commission Table */}
              <h4 className="font-bold text-text-primary mt-2">包含的分成记录</h4>
              <div className="bg-surface rounded-xl border border-border-light overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background-section border-b border-border-light">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-widest">服务名称</th>
                      <th className="px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-widest text-right">订单金额</th>
                      <th className="px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-widest text-right">分成金额</th>
                      <th className="px-4 py-3 text-xs font-bold text-text-primary uppercase tracking-widest text-center">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {commissions.map(c => (
                      <tr key={c.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-text-primary">{c.serviceName}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{c.feeDisplay}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-text-primary font-medium">¥{c.orderAmount}</td>
                        <td className="px-4 py-3 text-right text-error font-medium">-¥{c.commissionAmount}</td>
                        <td className="px-4 py-3 text-center text-xs text-text-secondary font-bold">{c.statusName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {detail.status === 'PENDING_CONFIRM' && (
          <div className="px-6 py-4 border-t border-border-light bg-surface flex flex-col gap-3">
            {showDisputeInput ? (
              <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                <input 
                  className="flex-1 rounded-xl border border-border-light bg-background focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary text-sm px-4 outline-none transition-all text-text-primary" 
                  placeholder="请输入异议理由..."
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                />
                <button onClick={() => setShowDisputeInput(false)} className="px-4 py-2.5 text-text-secondary hover:bg-background-section rounded-xl text-sm font-bold transition-colors">取消</button>
                <button onClick={handleDispute} className="px-5 py-2.5 bg-error text-white rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-colors">提交异议</button>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowDisputeInput(true)}
                  className="px-6 py-2.5 rounded-xl font-bold text-error border border-error/20 hover:bg-error-bg transition-colors shadow-sm text-sm"
                >
                  有异议
                </button>
                <button 
                  onClick={handleConfirm}
                  className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:opacity-90 transition-colors shadow-primary text-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  确认结算单
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 内部定制化 Modal 弹窗 */}
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
}