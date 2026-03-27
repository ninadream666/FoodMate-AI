import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <div className="flex h-screen w-full bg-nordic-gradient text-text-primary font-sans antialiased overflow-hidden">
            {/* 侧边栏 */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                currentPath={location.pathname}
            />

            {/* 主内容区 */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-transparent relative">
                {/* 顶部导航 */}
                <Header
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    onLogout={handleLogout}
                />

                {/* 页面内容 */}
                <div className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 lg:p-8 scrollbar-hide">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;