import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

function Header({ onMenuClick, onLogout }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const location = useLocation();

    const getPageTitle = (pathname) => {
        if (pathname.includes('/dashboard')) return '平台数据概览';
        if (pathname.includes('/merchants')) return '商家管理';
        if (pathname.includes('/orders')) return '订单管理';
        if (pathname.includes('/users')) return '用户管理';
        if (pathname.includes('/marketing')) return '营销中心';
        if (pathname.includes('/settlements')) return '财务管理';
        if (pathname.includes('/services')) return '服务管理';
        if (pathname.includes('/reports')) return '数据报表';
        if (pathname.includes('/commissions')) return '分成管理';
        if (pathname.includes('/system-monitor')) return '系统设置';
        if (pathname.includes('/user-credit')) return '用户信用';
        if (pathname.includes('/stats-test')) return '统计测试';
        return '平台数据概览';
    };

    const pageTitle = getPageTitle(location.pathname);

    return (
        <header className="glass-panel h-16 flex-none flex items-center justify-between px-6 lg:px-8 z-10 sticky top-0 border-b border-border-light">
            {/* 左侧 - 菜单按钮和面包屑 */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-text-secondary hover:bg-surface-hover hover:text-primary rounded-lg transition-colors"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                {/* 面包屑导航 */}
                <nav className="hidden md:flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    </div>
                    <span className="text-text-primary text-base font-bold tracking-tight">{pageTitle}</span>
                </nav>
            </div>

            {/* 右侧 - 操作按钮和用户菜单 */}
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-1 mr-2">
                    <button className="relative p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-[22px]">notifications</span>
                        <span className="absolute top-2.5 right-2.5 size-2 bg-error rounded-full border border-surface shadow-sm"></span>
                    </button>
                    <button className="p-2 text-text-secondary hover:text-primary hover:bg-surface-hover rounded-xl transition-colors">
                        <span className="material-symbols-outlined text-[22px]">help</span>
                    </button>
                </div>
                
                <div className="hidden sm:block h-6 w-px bg-border-light mx-1"></div>

                {/* 用户下拉菜单 */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 cursor-pointer hover:bg-surface-hover p-1.5 sm:pr-3 rounded-full sm:rounded-xl transition-colors border border-transparent hover:border-border-light"
                    >
                        <div className="size-8 rounded-full bg-background-section border border-border-light flex items-center justify-center overflow-hidden flex-shrink-0">
                            <span className="text-sm font-bold text-text-secondary">
                                {adminUser.username?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                        <div className="hidden lg:flex flex-col items-start text-left">
                            <span className="text-sm font-bold text-text-primary leading-none mb-1">
                                {adminUser.username || '管理员'}
                            </span>
                            <span className="text-[10px] text-text-tertiary leading-none uppercase tracking-wider font-bold">
                                {adminUser.role || 'Admin'}
                            </span>
                        </div>
                        <span className="material-symbols-outlined text-text-tertiary text-[18px] hidden lg:block ml-1">expand_more</span>
                    </button>

                    {/* 下拉菜单 */}
                    {showDropdown && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                            <div className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl shadow-xl py-2 z-50 border border-border-light animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-5 py-3 border-b border-border-light bg-background-section/50">
                                    <p className="text-sm font-extrabold text-text-primary truncate">{adminUser.username || '管理员'}</p>
                                    <p className="text-xs font-bold text-text-tertiary mt-0.5 truncate uppercase">{adminUser.role || 'Admin'}</p>
                                </div>

                                <div className="p-2 flex flex-col gap-1">
                                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-bg rounded-xl transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                        个人资料
                                    </a>
                                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-bg rounded-xl transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">settings</span>
                                        偏好设置
                                    </a>
                                </div>
                                
                                <div className="px-2 pt-2 border-t border-border-light mt-1">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            onLogout();
                                        }}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold text-error hover:bg-error-bg rounded-xl transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">logout</span>
                                        退出登录
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;