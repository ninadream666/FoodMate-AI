import React, { useState, useEffect } from 'react';
import { platformService } from '../../services/platformService';

/**
 * 平台服务市场页面
 * 包含：服务分类筛选、当前订阅、历史订阅查询
 */
export default function ServiceMarketplace() {
  // 一级 Tab: 'market' | 'my_subscriptions'
  const [mainTab, setMainTab] = useState('market');
  
  // 二级 Tab (我的订阅下): 'active' | 'history'
  const [subTab, setSubTab] = useState('active');
  
  // 分类筛选状态 (服务市场下)
  const [selectedCategory, setSelectedCategory] = useState('ALL'); 
  
  const [services, setServices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 预定义的分类映射 (根据后端 ServiceCategory 枚举)
  const categories = [
    { key: 'ALL', label: '全部服务' },
    { key: 'TRAFFIC', label: '流量推广' },
    { key: 'OPERATION', label: '运营支持' },
    { key: 'DELIVERY', label: '配送服务' },
    { key: 'BASIC', label: '基础服务' },
  ];

  // 当一级或二级 Tab 变化时触发数据加载
  useEffect(() => {
    fetchData();
  }, [mainTab, subTab]);

  const fetchData = async () => {
    setLoading(true);
    setSubscriptions([]); // 切换 Tab 时先清空列表，避免闪烁
    try {
      if (mainTab === 'market') {
        const data = await platformService.getAvailableServices();
        setServices(Array.isArray(data) ? data : []);
      } else if (mainTab === 'my_subscriptions') {
        if (subTab === 'active') {
          // 获取当前生效的订阅 (修正方法名为 getActiveSubscriptions 以匹配 service 文件)
          const data = await platformService.getActiveSubscriptions();
          setSubscriptions(Array.isArray(data) ? data : []);
        } else {
          // 获取全部历史记录
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

  const handleSubscribe = async (serviceId) => {
    if (!confirm("确认订阅该服务吗？费用将按服务说明扣除。")) return;
    try {
      await platformService.subscribe(serviceId);
      alert("订阅成功！");
      fetchData(); // 刷新列表
    } catch (error) {
      alert("订阅失败：" + error.message);
    }
  };

  const handleCancel = async (subId) => {
    if (!confirm("确定要取消订阅吗？")) return;
    try {
      await platformService.cancelSubscription(subId);
      alert("已取消订阅");
      fetchData();
    } catch (error) {
      alert("取消失败：" + error.message);
    }
  };

  // 辅助函数：根据服务名生成样式
  const getServiceStyle = (name = "") => {
    if (name.includes("流量") || name.includes("曝光")) return { icon: "campaign", color: "text-primary", bg: "bg-orange-50" };
    if (name.includes("VIP") || name.includes("徽章")) return { icon: "verified", color: "text-yellow-600", bg: "bg-yellow-50" };
    if (name.includes("报表") || name.includes("数据")) return { icon: "monitoring", color: "text-green-600", bg: "bg-green-50" };
    if (name.includes("运营") || name.includes("支持")) return { icon: "support_agent", color: "text-purple-600", bg: "bg-purple-50" };
    if (name.includes("配送")) return { icon: "local_shipping", color: "text-blue-600", bg: "bg-blue-50" };
    return { icon: "store", color: "text-slate-600", bg: "bg-slate-100" }; // 默认
  };

  // 根据选中的分类过滤服务
  const filteredServices = services.filter(service => {
    if (selectedCategory === 'ALL') return !service.isMandatory;
    return service.category === selectedCategory;
  });

  // 强制服务始终提取出来单独展示 (仅在 'ALL' 或 'BASIC' 时)
  const mandatoryServices = services.filter(s => s.isMandatory);
  const showMandatorySection = selectedCategory === 'ALL' || selectedCategory === 'BASIC';

  return (
    <div className="w-full max-w-[1280px] mx-auto p-4 md:p-6 animate-in fade-in duration-300">
      {/* 标题区 */}
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">平台服务</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-normal">订阅增值服务，获取更多流量与特权</p>
      </div>

      {/* 一级 Tab 切换区 (服务市场 / 我的订阅) */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-8">
          <button
            onClick={() => setMainTab('market')}
            className={`pb-3 px-2 text-sm font-bold tracking-wide border-b-[3px] transition-colors ${
              mainTab === 'market' 
                ? 'border-orange-500 text-slate-900 dark:text-white' 
                : 'border-transparent text-slate-500 hover:text-orange-500 hover:border-orange-500/30'
            }`}
          >
            服务市场
          </button>
          <button
            onClick={() => setMainTab('my_subscriptions')}
            className={`pb-3 px-2 text-sm font-bold tracking-wide border-b-[3px] transition-colors ${
              mainTab === 'my_subscriptions' 
                ? 'border-orange-500 text-slate-900 dark:text-white' 
                : 'border-transparent text-slate-500 hover:text-orange-500 hover:border-orange-500/30'
            }`}
          >
            我的订阅
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
           <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
           <p>正在加载服务数据...</p>
        </div>
      ) : (
        <>
          {/* --- 内容区域：服务市场 --- */}
          {mainTab === 'market' && (
            <div className="flex flex-col gap-8 animate-in fade-in zoom-in duration-300">
              
              {/* 分类筛选器 (Pills) */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                      selectedCategory === cat.key
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-orange-500 hover:text-orange-500'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 1. 基础服务 (Mandatory) */}
              {showMandatorySection && mandatoryServices.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">基础服务 (默认开通)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {mandatoryServices.map(service => {
                      const style = getServiceStyle(service.serviceName);
                      return (
                        <div key={service.id} className="flex items-center justify-between p-5 rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-5">
                            <span className="material-symbols-outlined text-6xl">lock</span>
                          </div>
                          <div className="flex items-center gap-4 z-10">
                            <div className={`size-12 rounded-full flex items-center justify-center ${style.bg} ${style.color}`}>
                              <span className="material-symbols-outlined text-2xl">{style.icon}</span>
                            </div>
                            <div className="flex flex-col">
                              <p className="text-slate-900 dark:text-white font-bold text-lg">{service.serviceName}</p>
                              <p className="text-slate-500 text-xs">{service.categoryName} · {service.feeDisplay}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-500/20 z-10">
                            已激活
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. 可选服务列表 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-end gap-2">
                  <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">
                    {selectedCategory === 'ALL' ? '增值服务' : categories.find(c => c.key === selectedCategory)?.label}
                  </h2>
                  <span className="text-slate-500 text-sm pb-0.5">自选订阅，随时取消</span>
                </div>
                
                {filteredServices.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    该分类下暂无可订阅服务
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map(service => {
                      const style = getServiceStyle(service.serviceName);
                      const isSubscribed = service.isSubscribed; 

                      return (
                        <div key={service.id} className={`flex flex-col rounded-xl bg-white dark:bg-[#1e1e1e] border shadow-sm transition-shadow duration-300 overflow-hidden ${isSubscribed ? 'border-green-500/30 dark:border-green-900 shadow-md' : 'border-slate-100 dark:border-slate-800 hover:shadow-lg hover:shadow-orange-500/5'}`}>
                          <div className="p-6 flex flex-col gap-4 flex-1">
                            <div className="flex justify-between items-start">
                              <div className={`size-12 rounded-xl flex items-center justify-center ${style.bg} ${style.color}`}>
                                <span className="material-symbols-outlined text-[28px]">{style.icon}</span>
                              </div>
                              
                              <div className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                 <span className="text-slate-500 text-xs font-bold">{service.categoryName}</span>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-1">{service.serviceName}</h3>
                              <div className="flex items-baseline gap-1">
                                 <span className="text-orange-500 text-xl font-extrabold">{service.feeDisplay}</span>
                              </div>
                            </div>
                            
                            <p className="text-slate-500 text-sm leading-relaxed flex-1 min-h-[40px]">
                              {service.description || "暂无详细描述"}
                            </p>

                            {isSubscribed ? (
                              <div className="mt-4 flex gap-2">
                                <button disabled className="flex-1 bg-green-50 text-green-700 border border-green-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-80">
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  生效中
                                </button>
                                {service.subscriptionId && (
                                    <button 
                                      onClick={() => handleCancel(service.subscriptionId)}
                                      className="px-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100"
                                      title="取消订阅"
                                    >
                                      <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleSubscribe(service.id)}
                                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transform"
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
            <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
              
              {/* 二级 Tab 切换 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubTab('active')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    subTab === 'active'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  当前订阅
                </button>
                <button
                  onClick={() => setSubTab('history')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    subTab === 'history'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  订阅历史
                </button>
              </div>

              {/* 订阅列表表格 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e1e1e] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">服务名称</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">费用</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">生效时间</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">结束时间</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {subscriptions.length === 0 ? (
                        <tr><td colSpan="6" className="p-10 text-center text-slate-400">暂无记录</td></tr>
                      ) : (
                        subscriptions.map(sub => {
                          const style = getServiceStyle(sub.serviceName);
                          // 状态样式映射
                          let statusBadge = <span className="text-gray-500">{sub.statusName || sub.status}</span>;
                          
                          if (sub.status === 'ACTIVE') {
                            statusBadge = (
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                                生效中
                              </span>
                            );
                          } else if (sub.status === 'CANCELLED') {
                            statusBadge = (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500 ring-1 ring-inset ring-gray-500/20">
                                已取消
                              </span>
                            );
                          } else if (sub.status === 'EXPIRED') {
                            statusBadge = (
                              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
                                已过期
                              </span>
                            );
                          }

                          const endTime = sub.cancelledAt || sub.expiresAt;
                          
                          return (
                            <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                                  <span className="material-symbols-outlined text-lg">{style.icon}</span>
                                </div>
                                {sub.serviceName}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">{sub.feeDisplay}</td>
                              <td className="px-6 py-4">{statusBadge}</td>
                              <td className="px-6 py-4 text-sm text-slate-900 dark:text-gray-300 font-mono">
                                {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                {endTime ? new Date(endTime).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {sub.status === 'ACTIVE' && !sub.isMandatory && (
                                  <button 
                                    onClick={() => handleCancel(sub.id)}
                                    className="text-red-500 hover:text-red-700 text-sm font-bold transition-colors border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
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
        </>
      )}
    </div>
  );
}