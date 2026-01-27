import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

function Header({ onMenuClick, onLogout }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const location = useLocation();

    // 根据路径获取页面标题
    const getPageTitle = (pathname) => {
        const pageMap = {
            '/admin': '平台数据概览',
            '/admin/dashboard': '平台数据概览',
            '/admin/merchants': '商家管理',
            '/admin/orders': '订单管理',
            '/admin/users': '用户管理',
            '/admin/marketing': '营销中心',
            '/admin/settlements': '财务管理',
            '/admin/services': '服务管理',
            '/admin/reports': '数据报表',
            '/admin/commissions': '分成管理',
            '/admin/system-monitor': '系统设置',
            '/admin/user-credit': '用户信用',
        };
        return pageMap[pathname] || '管理后台';
    };

    const pageTitle = getPageTitle(location.pathname);

    return (
        <header className="h-16 flex-none border-b border-[#f3ede7] flex items-center justify-between px-6 bg-white z-10">
            {/* 左侧 - 菜单按钮和面包屑 */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-[#1b140d]"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>

                {/* 面包屑导航 */}
                <nav className="hidden md:flex items-center text-sm">
                    <span className="text-[#1b140d] font-medium">{pageTitle}</span>
                </nav>
            </div>

            {/* 右侧 - 操作按钮和用户菜单 */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-[#1b140d] hover:bg-[#fcfaf8] rounded-full transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <button className="p-2 text-[#1b140d] hover:bg-[#fcfaf8] rounded-full transition-colors">
                    <span className="material-symbols-outlined">help</span>
                </button>
                <div className="h-8 w-px bg-[#f3ede7] mx-1"></div>

                {/* 用户下拉菜单 */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 cursor-pointer hover:bg-[#fcfaf8] p-1 pr-3 rounded-full transition-colors"
                    >
                        <div className="size-8 rounded-full border border-[#f3ede7] bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                                {adminUser.username?.charAt(0).toUpperCase() || 'A'}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-[#1b140d] hidden lg:block">
                            {adminUser.username || '管理员'}
                        </span>
                        <span className="material-symbols-outlined text-[#9a734c] text-sm hidden lg:block">expand_more</span>
                    </button>

                    {/* 下拉菜单 */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50 border border-[#f3ede7]">
                            <div className="px-4 py-3 border-b border-[#f3ede7]">
                                <p className="text-sm font-bold text-[#1b140d]">{adminUser.username || '管理员'}</p>
                                <p className="text-xs text-[#9a734c]">{adminUser.role || 'admin'}</p>
                            </div>

                            <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1b140d] hover:bg-[#fcfaf8] transition-colors">
                                <span className="material-symbols-outlined text-[18px] text-[#9a734c]">person</span>
                                个人资料
                            </a>
                            <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1b140d] hover:bg-[#fcfaf8] transition-colors">
                                <span className="material-symbols-outlined text-[18px] text-[#9a734c]">settings</span>
                                设置
                            </a>
                            <div className="border-t border-[#f3ede7] mt-1 pt-1">
                                <button
                                    onClick={() => {
                                        setShowDropdown(false);
                                        onLogout();
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                    退出登录
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;