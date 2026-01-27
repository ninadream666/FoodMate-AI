import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

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
        <div className="flex h-screen w-full bg-[#fcfaf8] text-[#1b140d] font-['Inter'] antialiased overflow-hidden">
            {/* 侧边栏 */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                currentPath={location.pathname}
            />

            {/* 主内容区 */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
                {/* 顶部导航 */}
                <Header
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    onLogout={handleLogout}
                />

                {/* 页面内容 */}
                <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;