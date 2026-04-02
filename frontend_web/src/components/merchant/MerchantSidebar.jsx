import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MerchantSidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 导航配置 - 添加 AI 定价项
  const navItems = [
    { path: '/merchant/order-manage', icon: 'receipt_long', label: '订单管理' },
    { path: '/merchant/menu', icon: 'restaurant_menu', label: '菜单管理' },
    { path: '/merchant/ai-pricing', icon: 'psychology', label: 'AI 定价' }, // 新增入口
    { path: '/merchant/orders', icon: 'currency_exchange', label: '退款审批' },
    { path: '/merchant/service', icon: 'design_services', label: '平台服务' },
    { path: '/merchant/settlement', icon: 'payments', label: '结算分成' },
    { path: '/merchant/shop-info', icon: 'storefront', label: '店铺信息' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-surface-frosted backdrop-blur-md border-r border-border-light shadow-sm z-20 flex-shrink-0">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-transparent">
        <div className="bg-primary-bg rounded-xl p-2">
          <span className="material-symbols-outlined text-primary text-3xl">restaurant_menu</span>
        </div>
        <h1 className="text-text-primary text-lg font-bold tracking-tight">商家工作台</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1.5 px-4 py-6 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group ${
                isActive
                  ? 'bg-primary-bg text-primary font-bold border border-primary-light/50 shadow-sm'
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-1' : 'group-hover:text-primary transition-colors'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 mt-auto border-t border-border-light">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-background-section overflow-hidden flex-shrink-0 border border-border flex items-center justify-center text-text-secondary font-bold text-lg">
             {user.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-text-primary text-sm font-bold truncate">{user.username}</p>
            <p className="text-text-tertiary text-xs truncate">店主</p>
          </div>
        </div>
      </div>
    </aside>
  );
}