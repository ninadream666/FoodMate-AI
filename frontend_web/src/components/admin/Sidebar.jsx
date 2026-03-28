import React from 'react';
import { Link } from 'react-router-dom';

// 导航项组件
const NavItem = ({ to, icon, label, active = false, iconFill = false, onClose }) => (
    <Link
        to={to}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
            active
                ? "bg-primary-bg text-primary font-bold border border-primary-light/50 shadow-sm"
                : "text-text-secondary hover:bg-surface-hover"
        }`}
    >
        <span className={`material-symbols-outlined text-[22px] ${active || iconFill ? 'font-variation-settings-fill-1 text-primary' : 'text-text-tertiary group-hover:text-primary transition-colors'}`}>
            {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
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
                    className="fixed inset-0 bg-overlay backdrop-blur-sm z-20 lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* 侧边栏 */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-30
                w-64 bg-surface-frosted backdrop-blur-md border-r border-border-light transform transition-transform duration-300 ease-in-out shadow-sm flex-shrink-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col h-full
            `}>
                {/* Logo */}
                <div className="p-6 flex items-center gap-3 border-b border-transparent">
                    <div className="size-10 bg-primary-bg rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined font-variation-settings-fill-1">lunch_dining</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-text-primary text-lg font-bold tracking-tight leading-tight">FooMate-AI</h1>
                        <p className="text-text-tertiary text-xs font-normal">平台管理</p>
                    </div>
                </div>

                {/* 导航菜单 */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-hide">
                    {menuItems.map((item, index) => {
                        const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
                        const isDivider = index === 6; // 在财务管理后添加分割线

                        return (
                            <React.Fragment key={item.path}>
                                {isDivider && (
                                    <div className="pt-3 pb-1">
                                        <div className="h-px bg-border-light mx-2"></div>
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
                <div className="p-4 mt-auto border-t border-border-light">
                    <div className="bg-surface rounded-xl p-3 border border-border-light shadow-sm hover:shadow-card transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-success-bg flex items-center justify-center text-success">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>security</span>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs font-bold text-text-primary">系统状态</p>
                                <p className="text-[10px] text-success font-bold mt-0.5">所有服务运行正常</p>
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