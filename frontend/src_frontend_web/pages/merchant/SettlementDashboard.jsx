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
    <div className="flex flex-col h-full bg-[#fcfaf8] animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12">
          
          {/* Page Heading */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[#1c130d] dark:text-white text-3xl font-black leading-tight tracking-tight">结算分成</h1>
            <p className="text-[#9c6c49] text-base font-normal">追踪您的收入流水和结算记录</p>
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
              label="待结算金额 (预估)" 
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
          <div className="flex flex-col bg-white dark:bg-[#1e1e1e] border border-[#e8d9ce] dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            
            {/* Tabs & Filter Header */}
            <div className="flex items-center justify-between px-6 border-b border-[#e8d9ce] dark:border-slate-800 bg-[#fcfaf8]/50 dark:bg-[#1e1e1e]">
              <div className="flex gap-8">
                {['ALL', 'PENDING_CONFIRM', 'PAID'].map((tab) => {
                  const label = tab === 'ALL' ? '全部' : (tab === 'PENDING_CONFIRM' ? '待确认' : '已打款');
                  const isActive = activeTab === tab;
                  return (
                    <button 
                      key={tab}
                      onClick={() => { setActiveTab(tab); setPage(0); }}
                      className={`relative py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 ${
                        isActive 
                          ? 'border-orange-500 text-[#1c130d] dark:text-white' 
                          : 'border-transparent text-[#9c6c49] hover:text-[#1c130d] dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      {label}
                      {tab === 'PENDING_CONFIRM' && pendingCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 py-3">
                {/* 移除了硬编码的“导出”按钮 */}
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#5c4a3d] dark:text-gray-300 bg-white dark:bg-slate-800 border border-[#e8d9ce] dark:border-slate-700 rounded-lg hover:bg-[#f4ece7] dark:hover:bg-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                  筛选
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f7f5] dark:bg-slate-800/50 border-b border-[#e8d9ce] dark:border-slate-800">
                    <th className="py-4 px-6 text-xs font-bold text-[#9c6c49] dark:text-gray-400 uppercase tracking-wider">结算周期</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#9c6c49] dark:text-gray-400 uppercase tracking-wider">结算单号</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#9c6c49] dark:text-gray-400 uppercase tracking-wider text-right">订单数</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#9c6c49] dark:text-gray-400 uppercase tracking-wider text-right">订单总额</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#9c6c49] dark:text-gray-400 uppercase tracking-wider text-right">平台抽成</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#9c6c49] dark:text-gray-400 uppercase tracking-wider text-right">实际入账</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#9c6c49] dark:text-gray-400 uppercase tracking-wider text-center">状态</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#9c6c49] dark:text-gray-400 uppercase tracking-wider text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4ece7] dark:divide-slate-800">
                  {loading ? (
                    <tr><td colSpan="8" className="p-10 text-center text-gray-400">加载中...</td></tr>
                  ) : settlements.length === 0 ? (
                    <tr><td colSpan="8" className="p-10 text-center text-gray-400">暂无结算记录</td></tr>
                  ) : (
                    settlements.map((item) => (
                      <tr key={item.id} className="group hover:bg-[#fcfaf8] dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-[#1c130d] dark:text-white">
                          {item.periodDisplay} ({item.periodStart} ~ {item.periodEnd})
                        </td>
                        <td className="py-4 px-6 text-sm text-[#5c4a3d] dark:text-gray-400 font-mono">
                          {item.settlementNo}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#1c130d] dark:text-white text-right font-medium">
                          {item.totalOrderCount}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#1c130d] dark:text-white text-right font-medium">
                          {formatCurrency(item.totalOrderAmount)}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#9c6c49] text-right">
                          - {formatCurrency(item.totalCommission)}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#1c130d] dark:text-white text-right font-bold text-lg">
                          {formatCurrency(item.netIncome)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <StatusBadge status={item.status} label={item.statusName} />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => openDetailModal(item.id)}
                            className="text-sm font-bold text-orange-500 hover:text-[#d6600e] transition-colors"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e8d9ce] dark:border-slate-800 bg-white dark:bg-[#1e1e1e]">
              <p className="text-sm text-[#9c6c49]">
                显示 {settlements.length > 0 ? page * 10 + 1 : 0} 到 {Math.min((page + 1) * 10, totalElements)} 条，共 {totalElements} 条记录
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="flex items-center justify-center size-8 rounded-lg border border-[#e8d9ce] text-[#5c4a3d] hover:bg-[#f4ece7] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-sm font-bold text-[#5c4a3d] px-2">
                  {page + 1} / {Math.max(1, totalPages)}
                </span>
                <button 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="flex items-center justify-center size-8 rounded-lg border border-[#e8d9ce] text-[#5c4a3d] hover:bg-[#f4ece7] disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className={`flex flex-col justify-between p-6 rounded-xl border shadow-sm relative overflow-hidden ${highlight ? 'bg-white border-orange-500/20' : 'bg-white border-[#e8d9ce]'}`}>
      <div className={`absolute right-0 top-0 p-4 opacity-${highlight ? '10' : '5'}`}>
        <span className={`material-symbols-outlined text-6xl ${highlight ? 'text-orange-500' : 'text-[#1c130d]'}`}>{icon}</span>
      </div>
      <div className="flex items-center gap-2 mb-3 z-10">
        <div className={`p-1.5 rounded-lg ${highlight ? 'bg-orange-500/10 text-orange-500' : 'bg-[#f4ece7] text-[#5c4a3d]'}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <p className={`${highlight ? 'text-[#5c4a3d]' : 'text-[#5c4a3d]'} text-sm font-bold`}>{label}</p>
      </div>
      <p className={`${highlight ? 'text-orange-500' : 'text-[#1c130d]'} text-2xl font-extrabold tracking-tight z-10`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status, label }) {
  const styles = {
    'PENDING_CONFIRM': 'bg-amber-50 text-amber-700 border-amber-100',
    'CONFIRMED': 'bg-blue-50 text-blue-700 border-blue-100',
    'PAID': 'bg-green-100 text-green-700 border-green-200',
    'DISPUTED': 'bg-red-50 text-red-700 border-red-100',
    'CANCELLED': 'bg-gray-100 text-gray-600 border-gray-200'
  };
  const colorClass = styles[status] || styles['CANCELLED'];
  const dotColor = status === 'PENDING_CONFIRM' ? 'bg-amber-500' : (status === 'CONFIRMED' ? 'bg-blue-600' : (status === 'PAID' ? 'bg-green-600' : 'bg-gray-400'));

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
      <span className={`size-1.5 rounded-full ${dotColor}`}></span>
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
      alert("加载详情失败");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm("确认结算单无误？确认后将进入打款流程。")) return;
    try {
      await settlementService.confirmSettlement(settlementId);
      alert("确认成功！");
      onClose(true); // 刷新父列表
    } catch (e) {
      alert("操作失败：" + e.message);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      alert("请输入异议理由");
      return;
    }
    try {
      await settlementService.disputeSettlement(settlementId, disputeReason);
      alert("异议已提交，客服将介入处理");
      onClose(true);
    } catch (e) {
      alert("操作失败：" + e.message);
    }
  };

  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-800">结算单详情</h3>
            <p className="text-xs text-gray-500 font-mono mt-1">{detail.settlementNo}</p>
          </div>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fcfaf8]">
          {loading ? <div className="text-center py-10">加载中...</div> : (
            <div className="flex flex-col gap-6">
              {/* Info Grid */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-xs text-gray-500">结算周期</p><p className="font-bold text-sm">{detail.periodDisplay}</p></div>
                <div><p className="text-xs text-gray-500">订单总额</p><p className="font-bold text-sm">¥{detail.totalOrderAmount}</p></div>
                <div><p className="text-xs text-gray-500">平台抽成</p><p className="font-bold text-sm text-red-500">-¥{detail.totalCommission}</p></div>
                <div><p className="text-xs text-gray-500">实际入账</p><p className="font-bold text-lg text-green-600">¥{detail.netIncome}</p></div>
              </div>

              {/* Commission Table */}
              <h4 className="font-bold text-gray-700">包含的分成记录</h4>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-xs font-bold text-gray-500">服务名称</th>
                      <th className="px-4 py-2 text-xs font-bold text-gray-500 text-right">订单金额</th>
                      <th className="px-4 py-2 text-xs font-bold text-gray-500 text-right">分成金额</th>
                      <th className="px-4 py-2 text-xs font-bold text-gray-500 text-center">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commissions.map(c => (
                      <tr key={c.id}>
                        <td className="px-4 py-2">
                          <p className="font-medium">{c.serviceName}</p>
                          <p className="text-xs text-gray-400">{c.feeDisplay}</p>
                        </td>
                        <td className="px-4 py-2 text-right">¥{c.orderAmount}</td>
                        <td className="px-4 py-2 text-right text-red-500">-¥{c.commissionAmount}</td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500">{c.statusName}</td>
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
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col gap-3">
            {showDisputeInput ? (
              <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                <input 
                  className="flex-1 rounded-lg border-gray-300 text-sm" 
                  placeholder="请输入异议理由..."
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                />
                <button onClick={() => setShowDisputeInput(false)} className="px-3 py-2 text-gray-500 text-sm">取消</button>
                <button onClick={handleDispute} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">提交异议</button>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowDisputeInput(true)}
                  className="px-6 py-2.5 rounded-lg font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  有异议
                </button>
                <button 
                  onClick={handleConfirm}
                  className="px-6 py-2.5 rounded-lg font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
                >
                  确认结算单
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}