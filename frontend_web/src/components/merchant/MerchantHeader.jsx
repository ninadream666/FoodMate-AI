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
    <header className="h-16 glass-panel flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-10 sticky top-0">
      {/* Left: Store Context */}
      <div className="flex items-center gap-3">
        <button className="md:hidden p-2 -ml-2 text-text-secondary hover:bg-surface-hover rounded-lg">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="flex items-center gap-2 text-text-primary">
          <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center text-primary">
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
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-hover text-sm font-medium"
      >
        <span className="material-symbols-outlined text-lg">logout</span>
        <span>退出登录</span>
      </button>
    </header>
  );
}