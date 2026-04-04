import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { aiPricingService } from '../../services/aiPricingService';
import { merchantService } from '../../services/merchantService';

/**
 * 商家AI定价页面
 */
export default function SmartPricing() {
  const { merchant } = useOutletContext();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [menuItemsMap, setMenuItemsMap] = useState({});
  
  // 配置状态
  const [config, setConfig] = useState({
    enableAutoApproval: false,
    autoApprovalThreshold: 0.05
  });
  const [isTriggering, setIsTriggering] = useState(false);

  useEffect(() => {
    if (merchant?.id) {
      fetchMerchantConfig();
    }
  }, [merchant?.id]);

  useEffect(() => {
    if (merchant?.id) {
      fetchProposals();
    }
  }, [merchant?.id, activeTab]);

  const fetchMerchantConfig = async () => {
    try {
      const currentMerchant = await merchantService.getMyMerchant();
      if (currentMerchant) {
        setConfig({
          enableAutoApproval: !!currentMerchant.enableAutoApproval,
          autoApprovalThreshold: currentMerchant.autoApprovalThreshold || 0.05
        });
      }
    } catch (error) {
      console.error("加载商家配置失败:", error);
    }
  };

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const response = activeTab === 'pending' 
        ? await aiPricingService.getPendingProposals(merchant.id)
        : await aiPricingService.getProposalHistory(merchant.id);
      
      const list = Array.isArray(response) ? response : (response?.data || []);
      setProposals(list);

      if (list.length > 0) {
        const menuResponse = await merchantService.getMenu(merchant.id);
        const menuList = Array.isArray(menuResponse) ? menuResponse : (menuResponse?.data || []);
        const map = {};
        menuList.forEach(item => map[item.id] = item);
        setMenuItemsMap(map);
      }
    } catch (error) {
      console.error("加载提案数据失败:", error);
      setProposals([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoApproval = async () => {
    const newStatus = !config.enableAutoApproval;
    setConfig(prev => ({ ...prev, enableAutoApproval: newStatus }));
    
    try {
      await aiPricingService.updateAutoApprovalStatus(merchant.id, newStatus);
    } catch (error) {
      setConfig(prev => ({ ...prev, enableAutoApproval: !newStatus }));
      console.error("更新状态失败:", error);
      alert("配置同步到服务器失败，请稍后重试。");
    }
  };

  const handleUpdateThreshold = async (val) => {
    const numericVal = parseFloat(val);
    if (isNaN(numericVal)) return;
    
    const threshold = numericVal / 100;
    setConfig(prev => ({ ...prev, autoApprovalThreshold: threshold }));
    
    try {
      await aiPricingService.updateThreshold(merchant.id, threshold);
    } catch (error) {
      console.error("更新阈值失败:", error);
      fetchMerchantConfig();
    }
  };

  const handleTriggerAnalysis = async () => {
    setIsTriggering(true);
    try {
      await aiPricingService.triggerAiAnalysis();
      setTimeout(() => {
        fetchProposals();
        setIsTriggering(false);
      }, 1500);
    } catch (error) {
      console.error("触发分析失败:", error);
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
      fetchProposals(); 
    } catch (error) {
      console.error("操作失败:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface rounded-lg border border-border-light shadow-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>psychology</span>
          </div>
          <h1 className="text-text-primary text-3xl font-extrabold tracking-tight">AI 智能定价</h1>
        </div>
        <p className="text-text-secondary text-base max-w-2xl">
          利用大数据与AI模型优化菜品价格，在保障销量的同时提升整体利润。
        </p>
      </header>

      {/* Control Panel */}
      <section className="bg-surface rounded-2xl border border-border-light shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-primary-bg rounded-full text-primary">
              <span className="material-symbols-outlined">auto_mode</span>
            </div>
            <div className="flex flex-col gap-0.5 mr-auto">
              <p className="text-text-primary font-bold">自动审批</p>
              <p className="text-text-tertiary text-xs">允许系统自动更新低风险价格变动</p>
            </div>
            <button 
              onClick={handleToggleAutoApproval}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                config.enableAutoApproval ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                config.enableAutoApproval ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="hidden lg:block w-px h-12 bg-border-light mx-4"></div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-1">
            <div className="flex-1 w-full">
              <label className="block text-text-secondary text-xs font-bold mb-2 uppercase tracking-wider">
                自动审批阈值 (%)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full h-11 rounded-xl border-border-light bg-background-section px-4 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={Math.round((config?.autoApprovalThreshold || 0) * 100)}
                  onChange={(e) => handleUpdateThreshold(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary text-sm font-bold">%</div>
              </div>
            </div>
            <button 
              onClick={handleTriggerAnalysis}
              disabled={isTriggering}
              className={`h-11 px-6 bg-text-primary hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50`}
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
      <div className="flex gap-1 bg-surface p-1 rounded-xl border border-border-light w-fit">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'pending' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover'
          }`}
        >
          待处理提案
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'history' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-surface-hover'
          }`}
        >
          历史变动记录
        </button>
      </div>

      {/* 列表内容 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">获取数据中...</p>
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
            <div className="bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background-section border-b border-border-light">
                    {/* 表头：全部左对齐，颜色加深为 text-primary，字号放大为 text-sm */}
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-center">日期</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-center">菜品</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-center">旧价</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-center">新价</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-center">状态</th>
                    <th className="py-4 px-6 text-sm font-bold text-text-primary uppercase tracking-widest text-center">分析理由</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {proposals.map(row => {
                    const imgUrl = menuItemsMap[row.menuItemId]?.imageUrl;
                    const safeImgUrl = (imgUrl && imgUrl !== 'null') ? imgUrl : 'https://placehold.co/100x100?text=Food';
                    
                    return (
                      <tr key={row.id} className="hover:bg-surface-hover transition-colors">
                        {/* 数据列：全部左对齐 */}
                        <td className="py-4 px-6 text-sm font-medium text-text-secondary text-left">{new Date(row.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-left">
                          <div className="flex items-center gap-3">
                            <img 
                              src={safeImgUrl} 
                              onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Food'; }}
                              className="w-10 h-10 rounded-lg object-cover bg-background-section border border-border-light" 
                              alt="food"
                            />
                            <span className="font-bold text-text-primary text-base line-clamp-1">
                              {menuItemsMap[row.menuItemId]?.name || `菜品 #${row.menuItemId}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-text-secondary text-left">¥{(row.currentPrice || 0).toFixed(2)}</td>
                        <td className="py-4 px-6 text-base font-bold text-text-primary text-left">¥{(row.suggestedPrice || 0).toFixed(2)}</td>
                        <td className="py-4 px-6 text-center">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="py-4 px-6 text-sm text-text-secondary max-w-[280px] truncate text-left" title={row.reason}>
                          {row.reason}
                        </td>
                      </tr>
                    )
                  })}
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
  const currentPrice = item.currentPrice || 1; 
  const suggestedPrice = item.suggestedPrice || 0;
  const diff = (((suggestedPrice - currentPrice) / currentPrice) * 100).toFixed(1);
  const isUp = parseFloat(diff) > 0;
  
  const imgUrl = menuItem?.imageUrl;
  const safeImgUrl = (imgUrl && imgUrl !== 'null') ? imgUrl : 'https://placehold.co/400x200?text=No+Image';

  return (
    <div className="group bg-surface border border-border-light rounded-2xl overflow-hidden hover:shadow-card transition-all flex flex-col">
      <div className="relative h-40 bg-background-section overflow-hidden">
        <img 
          src={safeImgUrl}
          onError={(e) => { e.target.src = 'https://placehold.co/400x200?text=No+Image'; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          alt="food cover"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-text-primary shadow-sm">
          {menuItem?.category || 'AI 智能'}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">
        <h3 className="font-bold text-text-primary text-lg truncate">{menuItem?.name || `菜品 #${item.menuItemId}`}</h3>
        
        <div className="flex items-center gap-3 bg-background-section p-3 rounded-xl border border-border-light">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">当前</span>
            <span className="text-sm font-medium text-text-tertiary line-through">¥{(item.currentPrice || 0).toFixed(2)}</span>
          </div>
          <span className="material-symbols-outlined text-text-disabled text-sm">arrow_forward</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">建议</span>
            <span className="text-xl font-black text-primary">¥{suggestedPrice.toFixed(2)}</span>
          </div>
          <div className={`ml-auto ${isUp ? 'bg-success-bg text-success' : 'bg-error-bg text-error'} text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1`}>
            <span className="material-symbols-outlined text-[14px]">{isUp ? 'trending_up' : 'trending_down'}</span>
            {isUp ? '+' : ''}{diff}%
          </div>
        </div>

        <div className="flex gap-2 items-start bg-info-bg p-3 rounded-xl min-h-[60px]">
          <span className="material-symbols-outlined text-info text-[18px] shrink-0">chat_bubble</span>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
            {item.reason}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
          <button 
            onClick={() => onAction(item.id, 'reject')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-text-secondary font-bold hover:bg-surface-hover transition-all text-sm"
          >
            忽略
          </button>
          <button 
            onClick={() => onAction(item.id, 'approve')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-all shadow-primary text-sm"
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
    <div className="col-span-full py-20 flex flex-col items-center bg-surface rounded-2xl border border-dashed border-border-light">
      <span className="material-symbols-outlined text-6xl text-text-disabled mb-4">{icon}</span>
      <p className="text-text-tertiary font-medium text-lg">{text}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'APPROVED': 'bg-success-bg text-success',
    'AUTO_APPLIED': 'bg-info-bg text-info',
    'REJECTED': 'bg-border text-text-secondary',
    'PENDING': 'bg-primary-bg text-primary'
  };
  const labels = {
    'APPROVED': '手动审批',
    'AUTO_APPLIED': '自动执行',
    'REJECTED': '已拒绝',
    'PENDING': '待处理'
  };
  return (
    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${styles[status] || styles['REJECTED']}`}>
      {labels[status] || status}
    </span>
  );
}