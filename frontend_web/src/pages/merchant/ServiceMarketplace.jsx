import React, { useState, useEffect } from 'react';
import { platformService } from '../../services/platformService';

/**
 * 平台服务市场页面
 * 包含：服务分类筛选、当前订阅、历史订阅查询
 */
export default function ServiceMarketplace() {
  const [mainTab, setMainTab] = useState('market');
  const [subTab, setSubTab] = useState('active');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); 
  
  const [services, setServices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 定制化UI弹窗状态 ---
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm'
    message: '',
    onConfirm: null
  });

  const categories = [
    { key: 'ALL', label: '全部服务' },
    { key: 'TRAFFIC', label: '流量推广' },
    { key: 'OPERATION', label: '运营支持' },
    { key: 'DELIVERY', label: '配送服务' },
    { key: 'BASIC', label: '基础服务' },
  ];

  useEffect(() => {
    fetchData();
  }, [mainTab, subTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mainTab === 'market') {
        const data = await platformService.getAvailableServices();
        setServices(Array.isArray(data) ? data : []);
      } else if (mainTab === 'my_subscriptions') {
        if (subTab === 'active') {
          const data = await platformService.getActiveSubscriptions();
          setSubscriptions(Array.isArray(data) ? data : []);
        } else {
          const data = await platformService.getAllSubscriptions();
          setSubscriptions(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error("加载数据失败", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 弹窗辅助函数 ---
  const showConfirm = (message, onConfirmCallback) => {
    setDialog({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
  };

  const showAlert = (message) => {
    setDialog({ 
      isOpen: true, 
      type: 'alert', 
      message, 
      onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) 
    });
  };

  // --- 交互操作 ---
  const handleSubscribe = (serviceId) => {
    showConfirm("确认订阅该服务吗？费用将按服务说明扣除。", async () => {
      setDialog(prev => ({ ...prev, isOpen: false }));
      try {
        await platformService.subscribe(serviceId);
        showAlert("订阅成功！");
        // 延迟 500ms 刷新，给后端数据库落库留出时间，防止并发导致取到旧的 ID
        setTimeout(() => fetchData(), 500); 
      } catch (error) {
        showAlert("订阅失败：" + error.message);
      }
    });
  };

  const handleCancel = (subId) => {
    showConfirm("确定要取消订阅吗？", async () => {
      setDialog(prev => ({ ...prev, isOpen: false }));
      try {
        await platformService.cancelSubscription(subId);
        showAlert("已取消订阅");
        setTimeout(() => fetchData(), 500);
      } catch (error) {
        showAlert("取消失败：" + error.message);
      }
    });
  };

  // 北欧风色彩辅助函数
  const getServiceStyle = (name = "") => {
    if (name.includes("流量") || name.includes("曝光")) return { icon: "campaign", color: "text-primary", bg: "bg-primary-bg" };
    if (name.includes("VIP") || name.includes("徽章")) return { icon: "verified", color: "text-warning", bg: "bg-warning-bg" };
    if (name.includes("报表") || name.includes("数据")) return { icon: "monitoring", color: "text-success", bg: "bg-success-bg" };
    if (name.includes("运营") || name.includes("支持")) return { icon: "support_agent", color: "text-info", bg: "bg-info-bg" };
    if (name.includes("配送")) return { icon: "local_shipping", color: "text-accent", bg: "bg-info-bg" };
    return { icon: "store", color: "text-text-secondary", bg: "bg-background-section" }; 
  };

  const filteredServices = services.filter(service => {
    if (selectedCategory === 'ALL') return !service.isMandatory;
    return service.category === selectedCategory;
  });

  const mandatoryServices = services.filter(s => s.isMandatory);
  const showMandatorySection = selectedCategory === 'ALL' || selectedCategory === 'BASIC';

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-6 animate-in fade-in duration-500 relative">
      {/* 标题区 */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-text-primary text-2xl font-extrabold tracking-tight">平台服务</h1>
        <p className="text-text-secondary text-sm">订阅增值服务，获取更多流量与特权</p>
      </div>

      {/* 一级Tab切换区 */}
      <div className="border-b border-border-light">
        <div className="flex gap-8">
          <button
            onClick={() => setMainTab('market')}
            className={`pb-3 px-2 text-sm font-bold tracking-wide border-b-[3px] transition-colors ${
              mainTab === 'market' 
                ? 'border-primary text-text-primary' 
                : 'border-transparent text-text-secondary hover:text-primary'
            }`}
          >
            服务市场
          </button>
          <button
            onClick={() => setMainTab('my_subscriptions')}
            className={`pb-3 px-2 text-sm font-bold tracking-wide border-b-[3px] transition-colors ${
              mainTab === 'my_subscriptions' 
                ? 'border-primary text-text-primary' 
                : 'border-transparent text-text-secondary hover:text-primary'
            }`}
          >
            我的订阅
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-text-tertiary gap-4 animate-in fade-in">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           <p>正在加载服务数据...</p>
        </div>
      ) : (
        <div key={mainTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* --- 内容区域：服务市场 --- */}
          {mainTab === 'market' && (
            <div className="flex flex-col gap-8">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                      selectedCategory === cat.key
                        ? 'bg-text-primary text-white border-text-primary shadow-sm'
                        : 'bg-surface text-text-secondary border-border hover:border-primary hover:text-primary'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {showMandatorySection && mandatoryServices.length > 0 && (
                <div className="flex flex-col gap-4 animate-in fade-in">
                  <h2 className="text-text-primary text-lg font-bold">基础服务 (默认开通)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {mandatoryServices.map(service => {
                      const style = getServiceStyle(service.serviceName);
                      return (
                        <div key={service.id} className="flex items-center justify-between p-5 rounded-xl bg-surface border border-border-light hover:shadow-card transition-shadow relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-5">
                            <span className="material-symbols-outlined text-6xl">lock</span>
                          </div>
                          <div className="flex items-center gap-4 z-10">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${style.bg} ${style.color}`}>
                              <span className="material-symbols-outlined text-2xl">{style.icon}</span>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-text-primary font-bold">{service.serviceName}</p>
                              <p className="text-text-secondary text-xs">{service.categoryName} · {service.feeDisplay}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-background-section px-2.5 py-1 text-xs font-bold text-text-secondary ring-1 ring-inset ring-border z-10">
                            已激活
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex items-end gap-2">
                  <h2 className="text-text-primary text-lg font-bold">
                    {selectedCategory === 'ALL' ? '增值服务' : categories.find(c => c.key === selectedCategory)?.label}
                  </h2>
                  <span className="text-text-secondary text-xs pb-0.5">自选订阅，随时取消</span>
                </div>
                
                {filteredServices.length === 0 ? (
                  <div className="py-10 text-center text-text-tertiary bg-background-section rounded-xl border border-dashed border-border-light">
                    该分类下暂无可订阅服务
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map(service => {
                      const style = getServiceStyle(service.serviceName);
                      const isSubscribed = service.isSubscribed; 

                      return (
                        <div key={service.id} className={`flex flex-col rounded-2xl bg-surface border shadow-sm transition-all duration-300 overflow-hidden ${isSubscribed ? 'border-success/30 shadow-md' : 'border-border-light hover:shadow-card hover:border-primary/20'}`}>
                          <div className="p-6 flex flex-col gap-4 flex-1">
                            <div className="flex justify-between items-start">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} ${style.color}`}>
                                <span className="material-symbols-outlined text-[28px]">{style.icon}</span>
                              </div>
                              <div className="bg-background-section px-2 py-1 rounded-lg">
                                 <span className="text-text-secondary text-[10px] font-bold">{service.categoryName}</span>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-text-primary text-lg font-bold mb-1">{service.serviceName}</h3>
                              <div className="flex items-baseline gap-1">
                                 <span className="text-primary text-xl font-extrabold">{service.feeDisplay}</span>
                              </div>
                            </div>
                            
                            <p className="text-text-secondary text-sm leading-relaxed flex-1 min-h-[40px]">
                              {service.description || "暂无详细描述"}
                            </p>

                            {isSubscribed ? (
                              <div className="mt-4 flex gap-2">
                                <button disabled className="flex-1 bg-success-bg text-success border border-success/20 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-90 text-sm">
                                  <span className="material-symbols-outlined text-base">check_circle</span>
                                  生效中
                                </button>
                                {service.subscriptionId && (
                                    <button 
                                      onClick={() => handleCancel(service.subscriptionId)}
                                      className="px-3 bg-error-bg text-error rounded-xl hover:opacity-80 transition-colors border border-error/10"
                                      title="取消订阅"
                                    >
                                      <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleSubscribe(service.id)}
                                className="w-full mt-4 bg-primary text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-primary active:scale-95 text-sm hover:opacity-90"
                              >
                                立即订阅
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- 内容区域：我的订阅 --- */}
          {mainTab === 'my_subscriptions' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubTab('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    subTab === 'active'
                      ? 'bg-primary-bg text-primary'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  当前订阅
                </button>
                <button
                  onClick={() => setSubTab('history')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    subTab === 'history'
                      ? 'bg-primary-bg text-primary'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  订阅历史
                </button>
              </div>

              <div key={subTab} className="rounded-2xl border border-border-light bg-surface overflow-hidden shadow-sm animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-background-section border-b border-border-light">
                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">服务名称</th>
                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">费用</th>
                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">状态</th>
                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">生效时间</th>
                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">结束时间</th>
                        {/* 修正：操作列表头改为居中对齐 */}
                        <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {subscriptions.length === 0 ? (
                        <tr><td colSpan="6" className="p-10 text-center text-text-tertiary">暂无记录</td></tr>
                      ) : (
                        subscriptions.map(sub => {
                          const style = getServiceStyle(sub.serviceName);
                          let statusBadge = <span className="text-text-tertiary">{sub.statusName || sub.status}</span>;
                          
                          if (sub.status === 'ACTIVE') {
                            statusBadge = (
                              <span className="inline-flex items-center rounded-md bg-success-bg px-2 py-1 text-[10px] font-bold text-success">
                                生效中
                              </span>
                            );
                          } else if (sub.status === 'CANCELLED') {
                            statusBadge = (
                              <span className="inline-flex items-center rounded-md bg-background-section px-2 py-1 text-[10px] font-bold text-text-secondary ring-1 ring-border">
                                已取消
                              </span>
                            );
                          } else if (sub.status === 'EXPIRED') {
                            statusBadge = (
                              <span className="inline-flex items-center rounded-md bg-error-bg px-2 py-1 text-[10px] font-bold text-error">
                                已过期
                              </span>
                            );
                          }

                          const endTime = sub.cancelledAt || sub.expiresAt;
                          
                          return (
                            <tr key={sub.id} className="hover:bg-surface-hover transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-text-primary flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                                  <span className="material-symbols-outlined text-lg">{style.icon}</span>
                                </div>
                                {sub.serviceName}
                              </td>
                              <td className="px-6 py-4 text-sm text-text-secondary text-left">{sub.feeDisplay}</td>
                              <td className="px-6 py-4 text-left">{statusBadge}</td>
                              <td className="px-6 py-4 text-sm text-text-secondary font-mono text-left">
                                {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-text-tertiary font-mono text-left">
                                {endTime ? new Date(endTime).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {sub.status === 'ACTIVE' && !sub.isMandatory && (
                                  <button 
                                    onClick={() => handleCancel(sub.id)}
                                    className="text-error hover:opacity-80 text-xs font-bold transition-colors border border-error/20 px-3 py-1.5 rounded-lg hover:bg-error-bg inline-flex"
                                  >
                                    取消
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- 全局定制化Modal弹窗 --- */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
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