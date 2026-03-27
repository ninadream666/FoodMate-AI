import React, { useState, useEffect } from 'react';
import userService from '../../services/admin/userService';
import { debugApiConnection } from '../../utils/debugApiConnection';

// 状态标签组件
const StatusBadge = ({ status }) => {
    const getStatusInfo = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'normal':
            case '正常':
                return { text: '正常', class: 'bg-green-100 text-green-800' };
            case 'banned':
            case 'disabled':
            case '已封禁':
                return { text: '已封禁', class: 'bg-red-100 text-red-800' };
            case 'suspended':
            case '已冻结':
                return { text: '已冻结', class: 'bg-yellow-100 text-yellow-800' };
            default:
                return { text: status || '未知', class: 'bg-gray-100 text-gray-800' };
        }
    };

    const statusInfo = getStatusInfo(status);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
            <span className={`size-1.5 rounded-full ${status === 'active' || status === 'normal' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {statusInfo.text}
        </span>
    );
};

// 信用等级标签组件
const CreditBadge = ({ creditLevel, creditScore }) => {
    const getCreditInfo = (score) => {
        if (score >= 80) {
            return { level: 'high', text: '优秀', class: 'bg-emerald-100 text-emerald-800', icon: 'verified' };
        } else if (score >= 60) {
            return { level: 'medium', text: '良好', class: 'bg-amber-100 text-amber-800', icon: 'remove' };
        } else {
            return { level: 'low', text: '较差', class: 'bg-red-100 text-red-800', icon: 'warning' };
        }
    };

    const creditInfo = getCreditInfo(creditScore || 75);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${creditInfo.class}`}>
            <span className="material-symbols-outlined text-[14px]">{creditInfo.icon}</span>
            {creditInfo.text} ({creditScore || 75})
        </span>
    );
};

// 用户行组件
const UserRow = ({ user, onEditUser, onViewCredit, onToggleStatus, currentTab }) => (
    <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <div className="size-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                    <div className="font-medium text-[#1b140d]">{user.username || user.name}</div>
                    <div className="text-sm text-[#9a734c]">{user.phone}</div>
                </div>
            </div>
        </td>
        {currentTab === 'users' ? (
            <>
                <td className="px-6 py-4 text-sm text-[#9a734c]">{user.email}</td>
                <td className="px-6 py-4 text-sm text-[#9a734c]">
                    {(() => {
                        const registrationTime = user.registerDate || user.registeredAt || user.createdAt || user.created_at || user.joinDate || user.registration_time;
                        if (registrationTime) {
                            const date = new Date(registrationTime);
                            return isNaN(date.getTime()) ? '未知' : date.toLocaleDateString('zh-CN');
                        }
                        return '未知';
                    })()}
                </td>
                <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                    <button
                        onClick={() => onEditUser(user)}
                        className="text-[#ee8c2b] hover:text-[#d97b1e] text-sm font-medium transition-colors"
                    >
                        编辑
                    </button>
                    <button
                        onClick={() => onViewCredit(user)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                    >
                        信用
                    </button>
                    <button
                        onClick={() => onToggleStatus(user)}
                        className={`text-sm font-medium transition-colors ${user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                    >
                        {user.status === 'active' ? '禁用' : '启用'}
                    </button>
                </td>
            </>
        ) : (
            <>
                <td className="px-6 py-4">
                    <CreditBadge creditScore={user.creditScore} />
                </td>
                <td className="px-6 py-4 text-sm text-[#9a734c]">{user.creditScore || 75}</td>
                <td className="px-6 py-4 text-sm text-[#9a734c]">{user.lastUpdate || '2024-12-30'}</td>
                <td className="px-6 py-4 text-right space-x-3">
                    <button
                        onClick={() => onEditUser(user)}
                        className="text-[#ee8c2b] hover:text-[#d97b1e] text-sm font-medium transition-colors"
                    >
                        调整
                    </button>
                    <button
                        onClick={() => onViewCredit(user)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                    >
                        历史
                    </button>
                </td>
            </>
        )}
    </tr>
);

function Users() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedCreditLevel, setSelectedCreditLevel] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        excellentUsers: 0,
        normalUsers: 0,
        poorUsers: 0
    });

    const [pagination, setPagination] = useState({
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0
    });

    useEffect(() => {
        loadUsers();
    }, [pagination.page, pagination.size, searchTerm, selectedStatus, selectedCreditLevel]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                size: pagination.size
            };

            if (selectedStatus) params.status = selectedStatus;
            if (searchTerm) params.search = searchTerm;

            console.log('🔍 请求用户列表，参数:', params);
            const response = await userService.getAllUsers(params);
            console.log('📦 用户API原始响应:', response);

            // 处理分页响应
            if (response.content) {
                console.log('✅ 使用response.content，用户数量:', response.content.length);
                setUsers(response.content);
                setPagination(prev => ({
                    ...prev,
                    totalElements: response.totalElements || 0,
                    totalPages: response.totalPages || 0
                }));
            } else if (Array.isArray(response)) {
                console.log('✅ 响应是数组，用户数量:', response.length);
                setUsers(response);
            } else {
                console.warn('⚠️ 响应格式不匹配，设置为空数组');
                setUsers([]);
            }
        } catch (error) {
            console.error('加载用户数据失败:', error);

            // 检查是否是认证问题
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.error('🔒 认证失败，可能需要重新登录');
            }

            // 运行调试诊断
            console.log('🚀 运行API连接诊断...');
            debugApiConnection().then(report => {
                console.log('📊 诊断报告:', report);
                if (report.summary.overallHealth === 'critical') {
                    console.error('💀 关键问题:', report.summary.issues);
                    console.log('💡 建议修复:', report.summary.recommendations);
                }
            });

            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await userService.getUserStats();
            console.log('✅ 用户统计原始数据:', statsData);
            setStats({
                totalUsers: statsData.totalCount || 0,
                activeUsers: statsData.activeCount || 0,
                bannedUsers: statsData.bannedCount || 0,
                excellentUsers: statsData.excellentCount || 0,
                normalUsers: statsData.normalCount || statsData.totalCount || 0,
                poorUsers: statsData.poorCount || 0
            });
        } catch (error) {
            console.error('加载统计数据失败:', error);
            // 使用默认值
            setStats({
                totalUsers: 0,
                activeUsers: 0,
                bannedUsers: 0,
                excellentUsers: 0,
                normalUsers: 0,
                poorUsers: 0
            });
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowEditModal(true);
    };

    const handleViewCredit = (user) => {
        alert(`查看 ${user.username} 的信用详情和历史记录`);
    };

    const handleToggleStatus = async (user) => {
        try {
            await userService.toggleUserStatus(user.id);

            // 刷新用户列表
            await loadUsers();
            await loadStats();

            const newStatus = user.status === 'active' ? 'banned' : 'active';
            alert(`用户 ${user.username} 已${newStatus === 'active' ? '启用' : '禁用'}`);
        } catch (error) {
            console.error('切换用户状态失败:', error);
            alert('操作失败：' + (error.response?.data?.message || error.message));
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.includes(searchTerm) ||
            user.phone.includes(searchTerm) ||
            user.email.includes(searchTerm);
        const matchesStatus = !selectedStatus || user.status === selectedStatus;
        const matchesCreditLevel = !selectedCreditLevel || user.creditLevel === selectedCreditLevel;

        return matchesSearch && matchesStatus && matchesCreditLevel;
    });

    if (loading) {
        return (
            <div className="max-w-[1200px] mx-auto p-6 md:p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#ee8c2b] border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-[#9a734c]">加载中...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7f6] text-[#1b140d] font-['Inter']">
            <div className="space-y-8 p-6 md:p-8">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b140d]">
                            用户管理
                        </h1>
                        <p className="text-[#9a734c] text-base">
                            管理平台用户账户与权限
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadUsers}
                            className="flex items-center gap-2 h-10 px-4 bg-white border border-[#e7dbcf] rounded-lg text-[#1b140d] text-sm font-bold hover:bg-gray-50 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            <span>刷新数据</span>
                        </button>
                        <button className="flex items-center gap-2 h-10 px-4 bg-[#ee8c2b] text-white rounded-lg text-sm font-bold hover:bg-[#d97b1e] shadow-sm">
                            <span className="material-symbols-outlined text-lg">person_add</span>
                            <span>添加用户</span>
                        </button>
                    </div>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-[#e7dbcf] shadow-sm flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[#9a734c] text-sm font-medium">总用户数</span>
                            <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-1 rounded-md">group</span>
                        </div>
                        <div className="text-2xl font-bold text-[#1b140d] mt-2">{stats.totalUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-[#e7dbcf] shadow-sm flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[#9a734c] text-sm font-medium">活跃用户</span>
                            <span className="material-symbols-outlined text-green-600 bg-green-50 p-1 rounded-md">check_circle</span>
                        </div>
                        <div className="text-2xl font-bold text-[#1b140d] mt-2">{stats.activeUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-[#e7dbcf] shadow-sm flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[#9a734c] text-sm font-medium">封禁用户</span>
                            <span className="material-symbols-outlined text-red-600 bg-red-50 p-1 rounded-md">block</span>
                        </div>
                        <div className="text-2xl font-bold text-[#1b140d] mt-2">{stats.bannedUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-[#e7dbcf] shadow-sm flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[#9a734c] text-sm font-medium">优秀信用</span>
                            <span className="material-symbols-outlined text-emerald-600 bg-emerald-50 p-1 rounded-md">verified</span>
                        </div>
                        <div className="text-2xl font-bold text-[#1b140d] mt-2">{stats.excellentUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-[#e7dbcf] shadow-sm flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[#9a734c] text-sm font-medium">良好信用</span>
                            <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-1 rounded-md">star_half</span>
                        </div>
                        <div className="text-2xl font-bold text-[#1b140d] mt-2">{stats.normalUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-[#e7dbcf] shadow-sm flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[#9a734c] text-sm font-medium">较差信用</span>
                            <span className="material-symbols-outlined text-red-600 bg-red-50 p-1 rounded-md">warning</span>
                        </div>
                        <div className="text-2xl font-bold text-[#1b140d] mt-2">{stats.poorUsers.toLocaleString()}</div>
                    </div>
                </div>

                {/* 选项卡和筛选 */}
                <div className="bg-white rounded-xl shadow-sm border border-[#e7dbcf] overflow-hidden mb-6">
                    {/* 选项卡导航 */}
                    <div className="border-b border-[#e7dbcf]">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users'
                                    ? 'border-[#ee8c2b] text-[#ee8c2b] bg-[#ee8c2b]/5'
                                    : 'border-transparent text-[#9a734c] hover:text-[#1b140d] hover:border-[#e7dbcf]'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">group</span>
                                    用户管理
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('credit')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'credit'
                                    ? 'border-[#ee8c2b] text-[#ee8c2b] bg-[#ee8c2b]/5'
                                    : 'border-transparent text-[#9a734c] hover:text-[#1b140d] hover:border-[#e7dbcf]'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">credit_score</span>
                                    信用管理
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* 筛选和搜索 */}
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#9a734c] text-[20px]">search</span>
                                <input
                                    type="text"
                                    placeholder="搜索用户名、手机号或邮箱..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full rounded-lg border-[#e7dbcf] text-sm focus:border-[#ee8c2b] focus:ring-[#ee8c2b]"
                                />
                            </div>
                            {activeTab === 'users' ? (
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="px-3 py-2 border border-[#e7dbcf] rounded-lg text-sm focus:border-[#ee8c2b] focus:ring-[#ee8c2b]"
                                >
                                    <option value="">全部状态</option>
                                    <option value="active">正常</option>
                                    <option value="banned">已封禁</option>
                                    <option value="suspended">已冻结</option>
                                </select>
                            ) : (
                                <select
                                    value={selectedCreditLevel}
                                    onChange={(e) => setSelectedCreditLevel(e.target.value)}
                                    className="px-3 py-2 border border-[#e7dbcf] rounded-lg text-sm focus:border-[#ee8c2b] focus:ring-[#ee8c2b]"
                                >
                                    <option value="">全部等级</option>
                                    <option value="EXCELLENT">优秀</option>
                                    <option value="GOOD">良好</option>
                                    <option value="NORMAL">一般</option>
                                    <option value="POOR">较差</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* 用户表格 */}
                <div className="bg-white rounded-xl shadow-sm border border-[#e7dbcf] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#e7dbcf] bg-gray-50/50">
                        <h3 className="text-base font-bold text-[#1b140d]">
                            {activeTab === 'users' ? '用户列表' : '用户信用'}
                            <span className="ml-2 text-sm font-normal text-[#9a734c]">
                                ({filteredUsers.length} 条记录)
                            </span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-[#9a734c] uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">用户信息</th>
                                    {activeTab === 'users' ? (
                                        <>
                                            <th className="px-6 py-3">邮箱</th>
                                            <th className="px-6 py-3">注册时间</th>
                                            <th className="px-6 py-3">状态</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-3">信用等级</th>
                                            <th className="px-6 py-3">信用分数</th>
                                            <th className="px-6 py-3">最后更新</th>
                                        </>
                                    )}
                                    <th className="px-6 py-3 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f3ede7]">
                                {filteredUsers.map((user) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        currentTab={activeTab}
                                        onEditUser={handleEditUser}
                                        onViewCredit={handleViewCredit}
                                        onToggleStatus={handleToggleStatus}
                                    />
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="material-symbols-outlined text-4xl text-[#9a734c]">search_off</span>
                                                <div className="text-[#9a734c]">
                                                    <p className="font-medium">暂无数据</p>
                                                    <p className="text-sm">请尝试调整筛选条件</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Users;