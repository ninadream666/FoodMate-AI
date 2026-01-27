import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MerchantSidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 导航配置 - 添加 AI 定价项
  const navItems = [
    { path: '/merchant/menu', icon: 'restaurant_menu', label: '菜单管理' },
    { path: '/merchant/ai-pricing', icon: 'psychology', label: 'AI 定价' }, // 新增入口
    { path: '/merchant/orders', icon: 'currency_exchange', label: '退款审批' },
    { path: '/merchant/service', icon: 'design_services', label: '平台服务' },
    { path: '/merchant/settlement', icon: 'payments', label: '结算分成' },
    { path: '/merchant/shop-info', icon: 'storefront', label: '店铺信息' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-[#1e1e1e] border-r border-slate-100 dark:border-slate-800 shadow-sm z-20 flex-shrink-0">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-transparent">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2">
          <span className="material-symbols-outlined text-orange-500 text-3xl">restaurant_menu</span>
        </div>
        <h1 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">商家工作台</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1.5 px-4 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group ${
                isActive
                  ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-500 font-bold border border-orange-100 dark:border-orange-900/50 shadow-sm shadow-orange-500/5'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-1' : 'group-hover:text-orange-500 transition-colors'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 font-bold text-lg">
             {user.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-slate-900 dark:text-white text-sm font-bold truncate">{user.username}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs truncate">店主</p>
          </div>
        </div>
      </div>
    </aside>
  );
}