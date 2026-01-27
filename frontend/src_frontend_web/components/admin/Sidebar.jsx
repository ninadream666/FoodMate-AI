import React from 'react';
import { Link } from 'react-router-dom';

// 导航项组件
const NavItem = ({ to, icon, label, active = false, iconFill = false, onClose }) => (
    <Link
        to={to}
        onClick={onClose}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${active
            ? "bg-[#ee8c2b]/10 text-[#ee8c2b]"
            : "text-[#1b140d] hover:bg-[#f3ede7]/50"
            }`}
    >
        <span className={`material-symbols-outlined ${active || iconFill ? 'font-variation-settings-fill-1' : 'text-[#9a734c] group-hover:text-[#1b140d]'}`}>
            {icon}
        </span>
        <span className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </Link>
);

function Sidebar({ isOpen, onClose, currentPath }) {
    const menuItems = [
        {
            path: '/admin/dashboard',
            name: '平台数据概览',
            icon: 'dashboard'
        },
        {
            path: '/admin/merchants',
            name: '商家管理',
            icon: 'storefront'
        },
        {
            path: '/admin/orders',
            name: '订单管理',
            icon: 'receipt_long'
        },
        {
            path: '/admin/users',
            name: '用户管理',
            icon: 'group'
        },
        {
            path: '/admin/marketing',
            name: '营销中心',
            icon: 'campaign'
        },
        {
            path: '/admin/settlements',
            name: '财务管理',
            icon: 'attach_money'
        },
        {
            path: '/admin/services',
            name: '服务管理',
            icon: 'build'
        },
        {
            path: '/admin/commissions',
            name: '分成管理',
            icon: 'payments'
        },
        {
            path: '/admin/system-monitor',
            name: '系统设置',
            icon: 'settings'
        },
        {
            path: '/admin/stats-test',
            name: '统计测试',
            icon: 'bug_report'
        }
    ];

    return (
        <>
            {/* 移动端遮罩 */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* 侧边栏 */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-30
                w-64 bg-[#fcfaf8] border-r border-[#f3ede7] transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col h-full
            `}>
                {/* Logo */}
                <div className="p-6 flex items-center gap-3">
                    <div className="size-10 bg-[#ee8c2b]/10 rounded-full flex items-center justify-center text-[#ee8c2b]">
                        <span className="material-symbols-outlined font-variation-settings-fill-1">lunch_dining</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[#1b140d] text-base font-bold leading-normal">智惠外卖</h1>
                        <p className="text-[#9a734c] text-xs font-normal">平台数据管理</p>
                    </div>
                </div>

                {/* 导航菜单 */}
                <nav className="flex-1 overflow-y-auto px-4 space-y-1">
                    {menuItems.map((item, index) => {
                        const isActive = currentPath === item.path;
                        const isDivider = index === 6; // 在财务管理后添加分割线

                        return (
                            <React.Fragment key={item.path}>
                                {isDivider && (
                                    <div className="pt-4 pb-2">
                                        <div className="h-px bg-[#f3ede7] mx-3"></div>
                                    </div>
                                )}
                                <NavItem
                                    to={item.path}
                                    icon={item.icon}
                                    label={item.name}
                                    active={isActive}
                                    iconFill={isActive}
                                    onClose={onClose}
                                />
                            </React.Fragment>
                        );
                    })}
                </nav>

                {/* 底部状态 */}
                <div className="p-4">
                    <div className="bg-white rounded-xl p-4 border border-[#f3ede7] shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>security</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#1b140d]">系统状态</p>
                                <p className="text-[10px] text-green-600 font-medium">所有服务运行正常</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 全局样式 - 使用标准 style 标签 */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    .font-variation-settings-fill-1 {
                        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    }
                `
            }} />
        </>
    );
}

export default Sidebar;