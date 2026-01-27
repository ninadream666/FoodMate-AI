import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function MerchantHeader({ merchant }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-[#1e1e1e] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-10 sticky top-0">
      {/* Left: Store Context */}
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
            <span className="material-symbols-outlined text-lg">store</span>
          </div>
          <h2 className="text-base font-bold tracking-tight">
            {merchant ? merchant.name : '加载店铺中...'}
          </h2>
        </div>
      </div>

      {/* Right: Logout */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
      >
        <span className="material-symbols-outlined text-lg">logout</span>
        <span>退出登录</span>
      </button>
    </header>
  );
}