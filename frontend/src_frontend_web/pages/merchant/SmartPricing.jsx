import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { aiPricingService } from '../../services/aiPricingService';
import { merchantService } from '../../services/merchantService';

/**
 * 商家 AI 定价页面
 */
export default function SmartPricing() {
  const { merchant } = useOutletContext();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [menuItemsMap, setMenuItemsMap] = useState({});
  
  // 配置状态 - 独立于 Tab 切换
  const [config, setConfig] = useState({
    enableAutoApproval: false,
    autoApprovalThreshold: 0.05
  });
  const [isTriggering, setIsTriggering] = useState(false);

  // 1. 仅在初始加载或商家 ID 变化时获取全局配置
  useEffect(() => {
    if (merchant?.id) {
      fetchMerchantConfig();
    }
  }, [merchant?.id]);

  // 2. 在商家 ID 或激活的 Tab 变化时获取提案列表
  useEffect(() => {
    if (merchant?.id) {
      fetchProposals();
    }
  }, [merchant?.id, activeTab]);

  const fetchMerchantConfig = async () => {
    try {
      const currentMerchant = await merchantService.getMyMerchant();
      setConfig({
        enableAutoApproval: currentMerchant.enableAutoApproval,
        autoApprovalThreshold: currentMerchant.autoApprovalThreshold
      });
    } catch (error) {
      console.error("加载商家配置失败:", error);
    }
  };

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const list = activeTab === 'pending' 
        ? await aiPricingService.getPendingProposals(merchant.id)
        : await aiPricingService.getProposalHistory(merchant.id);
      setProposals(list);

      // 预加载菜单信息以显示菜品图片
      if (list.length > 0) {
        const menu = await merchantService.getMenu(merchant.id);
        const map = {};
        menu.forEach(item => map[item.id] = item);
        setMenuItemsMap(map);
      }
    } catch (error) {
      console.error("加载提案数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 配置变更逻辑 (现在只更新本地状态和发送请求，不再触发列表全量重刷) ---
  const handleToggleAutoApproval = async () => {
    const newStatus = !config.enableAutoApproval;
    // 乐观 UI 更新：先改变本地状态，保证交互流畅
    setConfig(prev => ({ ...prev, enableAutoApproval: newStatus }));
    
    try {
      await aiPricingService.updateAutoApprovalStatus(merchant.id, newStatus);
    } catch (error) {
      // 失败回滚
      setConfig(prev => ({ ...prev, enableAutoApproval: !newStatus }));
      alert("更新自动审批状态失败");
    }
  };

  const handleUpdateThreshold = async (val) => {
    const numericVal = parseFloat(val);
    if (isNaN(numericVal)) return;
    
    const threshold = numericVal / 100;
    // 乐观更新
    setConfig(prev => ({ ...prev, autoApprovalThreshold: threshold }));
    
    try {
      await aiPricingService.updateThreshold(merchant.id, threshold);
    } catch (error) {
      alert("更新阈值失败");
      // 重新拉取配置以同步回正确的值
      fetchMerchantConfig();
    }
  };

  // --- 提案操作 ---
  const handleTriggerAnalysis = async () => {
    setIsTriggering(true);
    try {
      await aiPricingService.triggerAiAnalysis();
      // 触发后手动刷新列表即可，无需重置配置
      setTimeout(() => {
        fetchProposals();
        setIsTriggering(false);
      }, 1500);
    } catch (error) {
      alert("触发失败，请稍后重试");
      setIsTriggering(false);
    }
  };

  const handleAction = async (proposalId, action) => {
    try {
      if (action === 'approve') {
        await aiPricingService.approveProposal(merchant.id, proposalId);
      } else {
        await aiPricingService.rejectProposal(merchant.id, proposalId);
      }
      fetchProposals(); // 操作成功后刷新列表
    } catch (error) {
      alert("操作失败");
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="material-symbols-outlined text-orange-500" style={{ fontSize: '32px' }}>psychology</span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">AI 智能定价</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
          利用大数据与 AI 模型优化菜品价格，在保障销量的同时提升整体利润。
        </p>
      </header>

      {/* Control Panel (Card) - 包含开关和阈值 */}
      <section className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          {/* 自动审批开关 */}
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full text-orange-500">
              <span className="material-symbols-outlined">auto_mode</span>
            </div>
            <div className="flex flex-col gap-0.5 mr-auto">
              <p className="text-slate-900 dark:text-white font-bold">自动审批</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">允许系统自动更新低风险价格变动</p>
            </div>
            <button 
              onClick={handleToggleAutoApproval}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                config.enableAutoApproval ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                config.enableAutoApproval ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="hidden lg:block w-px h-12 bg-slate-100 dark:bg-slate-800 mx-4"></div>

          {/* 阈值调整和分析触发 */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-1">
            <div className="flex-1 w-full">
              <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-2 uppercase tracking-wider">
                自动审批阈值 (%)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-slate-900 dark:text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  value={Math.round(config.autoApprovalThreshold * 100)}
                  onChange={(e) => handleUpdateThreshold(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">%</div>
              </div>
            </div>
            <button 
              onClick={handleTriggerAnalysis}
              disabled={isTriggering}
              className={`h-11 px-6 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isTriggering ? 'animate-spin' : ''}`}>
                {isTriggering ? 'sync' : 'bolt'}
              </span>
              <span>{isTriggering ? '分析中...' : '立即分析'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-[#1e1e1e] p-1 rounded-xl border border-slate-100 dark:border-slate-800 w-fit">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'pending' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          待处理提案
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'history' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          历史变动记录
        </button>
      </div>

      {/* 列表内容 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500">获取提案中...</p>
        </div>
      ) : (
        <>
          {activeTab === 'pending' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.length === 0 ? (
                <EmptyState text="当前无待处理的定价建议" icon="analytics" />
              ) : (
                proposals.map(item => (
                  <ProposalCard 
                    key={item.id} 
                    item={item} 
                    menuItem={menuItemsMap[item.menuItemId]} 
                    onAction={handleAction}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">日期</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">菜品</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">旧价</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">新价</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">状态</th>
                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">分析理由</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {proposals.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url(${menuItemsMap[row.menuItemId]?.imageUrl})` }} />
                           <span className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                             {menuItemsMap[row.menuItemId]?.name || `菜品 #${row.menuItemId}`}
                           </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400 text-right">¥{row.currentPrice.toFixed(2)}</td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-900 dark:text-white text-right">¥{row.suggestedPrice.toFixed(2)}</td>
                      <td className="py-4 px-6 text-center">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 max-w-[200px] truncate" title={row.reason}>
                        {row.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- 子组件：卡片 ---
function ProposalCard({ item, menuItem, onAction }) {
  const diff = ((item.suggestedPrice - item.currentPrice) / item.currentPrice * 100).toFixed(1);
  const isUp = parseFloat(diff) > 0;

  return (
    <div className="group bg-white dark:bg-[#1e1e1e] border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className="relative h-40 bg-slate-100 dark:bg-slate-800">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${menuItem?.imageUrl || 'https://placehold.co/400x200?text=Food'})` }}
        />
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-900 dark:text-white shadow-sm">
          {menuItem?.category || 'AI 智能'}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">
        <h3 className="font-bold text-slate-900 dark:text-white truncate">{menuItem?.name || `菜品 #${item.menuItemId}`}</h3>
        
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">当前</span>
            <span className="text-sm font-medium text-slate-400 line-through">¥{item.currentPrice.toFixed(2)}</span>
          </div>
          <span className="material-symbols-outlined text-slate-300 text-sm">arrow_forward</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">建议</span>
            <span className="text-xl font-black text-orange-500">¥{item.suggestedPrice.toFixed(2)}</span>
          </div>
          <div className={`ml-auto ${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1`}>
            <span className="material-symbols-outlined text-[14px]">{isUp ? 'trending_up' : 'trending_down'}</span>
            {isUp ? '+' : ''}{diff}%
          </div>
        </div>

        <div className="flex gap-2 items-start bg-blue-50/30 dark:bg-blue-900/10 p-3 rounded-xl min-h-[60px]">
          <span className="material-symbols-outlined text-blue-500 text-[18px] shrink-0">chat_bubble</span>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
            {item.reason}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
          <button 
            onClick={() => onAction(item.id, 'reject')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
          >
            忽略
          </button>
          <button 
            onClick={() => onAction(item.id, 'approve')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 text-sm"
          >
            批准
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text, icon }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center bg-white dark:bg-[#1e1e1e] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
      <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-700 mb-4">{icon}</span>
      <p className="text-slate-400 font-medium">{text}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'APPROVED': 'bg-emerald-100 text-emerald-700',
    'AUTO_APPLIED': 'bg-blue-100 text-blue-700',
    'REJECTED': 'bg-slate-100 text-slate-500',
    'PENDING': 'bg-orange-100 text-orange-700'
  };
  const labels = {
    'APPROVED': '手动审批',
    'AUTO_APPLIED': '自动执行',
    'REJECTED': '已拒绝',
    'PENDING': '待处理'
  };
  return (
    <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold ${styles[status] || styles['REJECTED']}`}>
      {labels[status] || status}
    </span>
  );
}