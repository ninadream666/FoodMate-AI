import React, { useState, useEffect } from 'react';
import userService from '../../services/admin/userService';
import { debugApiConnection } from '../../utils/debugApiConnection';

// 状态兼容性解析函数：处理后端可能返回的各种状态格式
const getNormalizedStatus = (user) => {
    if (user.status !== undefined && user.status !== null) {
        const s = String(user.status).toUpperCase();
        if (s === '1' || s === 'NORMAL' || s === 'ACTIVE') return 'ACTIVE';
        if (s === '0' || s === 'BANNED' || s === 'DISABLED' || s === 'INACTIVE') return 'BANNED';
        if (s === '2' || s === 'SUSPENDED') return 'SUSPENDED';
        return s;
    }
    if (user.enabled !== undefined) {
        return user.enabled ? 'ACTIVE' : 'BANNED';
    }
    if (user.locked !== undefined) {
        return user.locked ? 'BANNED' : 'ACTIVE';
    }
    return 'ACTIVE'; // 兜底默认值：只要账号存在，默认当作正常
};

// 状态标签组件
const StatusBadge = ({ status }) => {
    const getStatusInfo = (status) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return { text: '正常', class: 'bg-success-bg text-success border border-success/20', icon: 'check_circle' };
            case 'BANNED':
                return { text: '已封禁', class: 'bg-error-bg text-error border border-error/20', icon: 'block' };
            case 'SUSPENDED':
                return { text: '已冻结', class: 'bg-warning-bg text-warning border border-warning/20', icon: 'pause_circle' };
            default:
                return { text: status || '未知', class: 'bg-background-section text-text-secondary border border-border-light', icon: 'help' };
        }
    };

    const statusInfo = getStatusInfo(status);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${statusInfo.class}`}>
            <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
            {statusInfo.text}
        </span>
    );
};

// 信用等级标签组件
const CreditBadge = ({ creditLevel, creditScore }) => {
    const getCreditInfo = (score) => {
        if (score >= 80) {
            return { level: 'high', text: '优秀', class: 'bg-success-bg text-success border border-success/20', icon: 'verified' };
        } else if (score >= 60) {
            return { level: 'medium', text: '良好', class: 'bg-info-bg text-info border border-info/20', icon: 'star_half' };
        } else {
            return { level: 'low', text: '较差', class: 'bg-error-bg text-error border border-error/20', icon: 'warning' };
        }
    };

    const creditInfo = getCreditInfo(creditScore || 75);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${creditInfo.class}`}>
            <span className="material-symbols-outlined text-[14px]">{creditInfo.icon}</span>
            {creditInfo.text} ({creditScore || 75})
        </span>
    );
};

// 用户行组件
const UserRow = ({ user, onEditUser, onViewCredit, onToggleStatus, currentTab }) => {
    const currentStatus = getNormalizedStatus(user);
    
    return (
        <tr className="hover:bg-surface-hover transition-colors">
            <td className="px-6 py-5 text-left">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary-soft text-primary rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col">
                        <div className="font-extrabold text-text-primary text-base mb-0.5">{user.username || user.name}</div>
                        <div className="text-xs font-medium text-text-secondary">{user.phone || '无手机号'}</div>
                    </div>
                </div>
            </td>
            {currentTab === 'users' ? (
                <>
                    <td className="px-6 py-5 text-center text-sm font-bold text-text-secondary">{user.email || '-'}</td>
                    <td className="px-6 py-5 text-center text-sm font-mono text-text-tertiary">
                        {(() => {
                            const registrationTime = user.registerDate || user.registeredAt || user.createdAt || user.created_at || user.joinDate || user.registration_time;
                            if (registrationTime) {
                                const date = new Date(registrationTime);
                                return isNaN(date.getTime()) ? '未知' : date.toLocaleDateString('zh-CN');
                            }
                            return '未知';
                        })()}
                    </td>
                    <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center">
                            <StatusBadge status={currentStatus} />
                        </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => onEditUser(user)}
                                className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary-soft transition-colors"
                                title="编辑用户"
                            >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                                onClick={() => onViewCredit(user)}
                                className="p-2 rounded-lg text-text-tertiary hover:text-info hover:bg-info-bg transition-colors"
                                title="信用详情"
                            >
                                <span className="material-symbols-outlined text-[20px]">credit_score</span>
                            </button>
                            <button
                                onClick={() => onToggleStatus(user)}
                                className={`p-2 rounded-lg transition-colors ${
                                    currentStatus === 'ACTIVE'
                                    ? 'text-text-tertiary hover:text-error hover:bg-error-bg'
                                    : 'text-text-tertiary hover:text-success hover:bg-success-bg'
                                }`}
                                title={currentStatus === 'ACTIVE' ? '禁用用户' : '启用用户'}
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {currentStatus === 'ACTIVE' ? 'block' : 'check_circle'}
                                </span>
                            </button>
                        </div>
                    </td>
                </>
            ) : (
                <>
                    <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center">
                            <CreditBadge creditScore={user.creditScore} />
                        </div>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-black text-text-primary">{user.creditScore || 75}</td>
                    <td className="px-6 py-5 text-center text-sm font-mono text-text-tertiary">{user.lastUpdate || '2024-12-30'}</td>
                    <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => onEditUser(user)}
                                className="p-2 rounded-lg text-text-tertiary hover:text-warning hover:bg-warning-bg transition-colors"
                                title="调整信用"
                            >
                                <span className="material-symbols-outlined text-[20px]">tune</span>
                            </button>
                            <button
                                onClick={() => onViewCredit(user)}
                                className="p-2 rounded-lg text-text-tertiary hover:text-info hover:bg-info-bg transition-colors"
                                title="历史记录"
                            >
                                <span className="material-symbols-outlined text-[20px]">history</span>
                            </button>
                        </div>
                    </td>
                </>
            )}
        </tr>
    );
};

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

    // 全局定制化弹窗状态
    const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
    const showConfirm = (message, onConfirmCallback) => setDialog({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
    const showAlert = (message) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });

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
        showAlert(`查看 ${user.username || user.name} 的信用详情和历史记录功能开发中`);
    };

    const handleToggleStatus = async (user) => {
        const currentStatus = getNormalizedStatus(user);
        const isBanning = currentStatus === 'ACTIVE';
        const actionStr = isBanning ? '禁用' : '启用';

        showConfirm(`确定要${actionStr}用户 "${user.username || user.name}" 吗？`, async () => {
            setDialog(prev => ({ ...prev, isOpen: false }));
            try {
                await userService.updateUserStatus(user.id, isBanning ? 'BANNED' : 'ACTIVE', isBanning ? '管理员禁用' : '管理员解禁');

                // 刷新用户列表
                await loadUsers();
                await loadStats();

                showAlert(`用户 ${user.username || user.name} 已${actionStr}`);
            } catch (error) {
                console.error('切换用户状态失败:', error);
                showAlert('操作失败：' + (error.response?.data?.message || error.message));
            }
        });
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.username || '').includes(searchTerm) ||
            (user.phone || '').includes(searchTerm) ||
            (user.email || '').includes(searchTerm);
        
        const userStatus = getNormalizedStatus(user);
        const matchesStatus = !selectedStatus || userStatus === selectedStatus;
        
        const matchesCreditLevel = !selectedCreditLevel || String(user.creditLevel) === String(selectedCreditLevel);

        return matchesSearch && matchesStatus && matchesCreditLevel;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-text-secondary font-bold">加载数据中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500 min-h-screen">
            <div className="space-y-6 p-6 md:p-8 max-w-[1400px] mx-auto">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
                            用户管理
                        </h1>
                        <p className="text-text-secondary text-sm font-medium">
                            管理平台用户账户与权限
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadUsers}
                            className="flex items-center gap-2 h-10 px-4 bg-surface border border-border-light rounded-xl text-text-secondary text-sm font-bold hover:bg-surface-hover hover:text-primary transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            <span>刷新数据</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-primary transition-all active:scale-95">
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            <span>添加用户</span>
                        </button>
                    </div>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                    <div className="bg-surface p-5 rounded-2xl border border-border-light shadow-sm hover:shadow-card transition-shadow flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">总用户数</span>
                            <span className="material-symbols-outlined text-info bg-info-bg p-1.5 rounded-xl text-[18px]">group</span>
                        </div>
                        <div className="text-2xl font-extrabold text-text-primary mt-2 tracking-tight">{stats.totalUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-surface p-5 rounded-2xl border border-border-light shadow-sm hover:shadow-card transition-shadow flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">活跃用户</span>
                            <span className="material-symbols-outlined text-success bg-success-bg p-1.5 rounded-xl text-[18px]">check_circle</span>
                        </div>
                        <div className="text-2xl font-extrabold text-text-primary mt-2 tracking-tight">{stats.activeUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-surface p-5 rounded-2xl border border-border-light shadow-sm hover:shadow-card transition-shadow flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">封禁用户</span>
                            <span className="material-symbols-outlined text-error bg-error-bg p-1.5 rounded-xl text-[18px]">block</span>
                        </div>
                        <div className="text-2xl font-extrabold text-text-primary mt-2 tracking-tight">{stats.bannedUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-surface p-5 rounded-2xl border border-border-light shadow-sm hover:shadow-card transition-shadow flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">优秀信用</span>
                            <span className="material-symbols-outlined text-success bg-success-bg p-1.5 rounded-xl text-[18px]">verified</span>
                        </div>
                        <div className="text-2xl font-extrabold text-text-primary mt-2 tracking-tight">{stats.excellentUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-surface p-5 rounded-2xl border border-border-light shadow-sm hover:shadow-card transition-shadow flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">良好信用</span>
                            <span className="material-symbols-outlined text-info bg-info-bg p-1.5 rounded-xl text-[18px]">star_half</span>
                        </div>
                        <div className="text-2xl font-extrabold text-text-primary mt-2 tracking-tight">{stats.normalUsers.toLocaleString()}</div>
                    </div>
                    <div className="bg-surface p-5 rounded-2xl border border-border-light shadow-sm hover:shadow-card transition-shadow flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">较差信用</span>
                            <span className="material-symbols-outlined text-error bg-error-bg p-1.5 rounded-xl text-[18px]">warning</span>
                        </div>
                        <div className="text-2xl font-extrabold text-text-primary mt-2 tracking-tight">{stats.poorUsers.toLocaleString()}</div>
                    </div>
                </div>

                {/* 选项卡和筛选 */}
                <div className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden mb-6 flex flex-col">
                    {/* 选项卡导航 */}
                    <div className="border-b border-border-light bg-background-section">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-6 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 ${activeTab === 'users'
                                    ? 'border-primary text-text-primary bg-surface'
                                    : 'border-transparent text-text-secondary hover:text-primary hover:border-primary/30'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">group</span>
                                用户管理
                            </button>
                            <button
                                onClick={() => setActiveTab('credit')}
                                className={`px-6 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 ${activeTab === 'credit'
                                    ? 'border-primary text-text-primary bg-surface'
                                    : 'border-transparent text-text-secondary hover:text-primary hover:border-primary/30'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">credit_score</span>
                                信用管理
                            </button>
                        </div>
                    </div>

                    {/* 筛选和搜索 */}
                    <div className="p-4 lg:p-5">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-tertiary group-focus-within:text-primary transition-colors text-[20px]">search</span>
                                <input
                                    type="text"
                                    placeholder="搜索用户名、手机号或邮箱..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-background-section border border-transparent focus:border-border-light text-text-primary text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all outline-none"
                                />
                            </div>
                            {activeTab === 'users' ? (
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="h-11 px-4 border border-border-light rounded-xl bg-surface text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    <option value="">全部状态</option>
                                    <option value="ACTIVE">正常</option>
                                    <option value="BANNED">已封禁</option>
                                    <option value="SUSPENDED">已冻结</option>
                                </select>
                            ) : (
                                <select
                                    value={selectedCreditLevel}
                                    onChange={(e) => setSelectedCreditLevel(e.target.value)}
                                    className="h-11 px-4 border border-border-light rounded-xl bg-surface text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
                <div className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden">
                    <div className="px-6 py-5 border-b border-border-light bg-background-section flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-text-primary tracking-tight">
                            {activeTab === 'users' ? '平台用户列表' : '用户信用档案'}
                            <span className="ml-2 text-sm font-medium text-text-secondary bg-border-light px-2 py-0.5 rounded-md">
                                共 {filteredUsers.length} 项
                            </span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-background-section border-b border-border-light">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-left whitespace-nowrap">用户信息</th>
                                    {activeTab === 'users' ? (
                                        <>
                                            <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">邮箱</th>
                                            <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">注册时间</th>
                                            <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">状态</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">信用等级</th>
                                            <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">信用分数</th>
                                            <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">最后更新</th>
                                        </>
                                    )}
                                    <th className="px-6 py-4 text-sm font-bold text-text-primary uppercase tracking-widest text-center whitespace-nowrap">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
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
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-background-section p-6 rounded-full mb-2">
                                                    <span className="material-symbols-outlined text-text-disabled text-5xl">search_off</span>
                                                </div>
                                                <h3 className="text-lg font-extrabold text-text-primary mb-1">暂无符合条件的用户</h3>
                                                <p className="text-sm font-medium text-text-secondary mb-5">请尝试清除搜索词或更换筛选条件</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* 分页组件 */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light bg-surface">
                            <p className="text-sm text-text-secondary font-medium">
                                显示第 <span className="font-bold text-text-primary">{pagination.page * pagination.size + 1}</span> - <span className="font-bold text-text-primary">{Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}</span> 条，共 <span className="font-bold text-text-primary">{pagination.totalElements}</span> 条
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 0}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-light text-text-secondary hover:bg-surface-hover hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                                <span className="text-sm font-bold text-text-secondary px-2">
                                    {pagination.page + 1} / {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages - 1}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-border-light text-text-secondary hover:bg-surface-hover hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 全局定制化Modal弹窗 */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
                        <div className="p-6 text-center">
                            <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${dialog.type === 'confirm' ? 'bg-primary-soft text-primary' : 'bg-info-bg text-info'
                                }`}>
                                <span className="material-symbols-outlined text-[28px]">
                                    {dialog.type === 'confirm' ? 'help' : 'info'}
                                </span>
                            </div>
                            <h3 className="text-lg font-extrabold text-text-primary mb-2">
                                {dialog.type === 'confirm' ? '确认操作' : '提示'}
                            </h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                {dialog.message}
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-background-section border-t border-border-light flex justify-center gap-3">
                            {dialog.type === 'confirm' && (
                                <button
                                    onClick={() => setDialog({ ...dialog, isOpen: false })}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-surface transition-colors border border-border-light shadow-sm text-sm"
                                >
                                    取消
                                </button>
                            )}
                            <button
                                onClick={dialog.onConfirm}
                                className="flex-1 py-2.5 rounded-xl font-bold bg-primary text-white hover:opacity-90 transition-colors shadow-primary text-sm"
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;