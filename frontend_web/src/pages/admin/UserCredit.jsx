import React, { useState, useEffect } from 'react';
import userService from '../../services/admin/userService';

// ==========================================
// 补充您遗漏的顶部组件定义，确保文件能够正常运行
// ==========================================

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

// 信用等级标签组件 (已严格按要求去除分数，仅显示文字与图标)
const CreditBadge = ({ creditLevel, creditScore }) => {
    const getCreditInfo = (score, level) => {
        let levelNum = 3;
        if (level !== undefined && level !== null) {
            levelNum = parseInt(level);
        } else {
            if (score >= 80) levelNum = 5;
            else if (score >= 60) levelNum = 4;
            else if (score >= 40) levelNum = 3;
            else if (score >= 20) levelNum = 2;
            else levelNum = 1;
        }

        if (levelNum >= 5) {
            return { text: '优秀', class: 'bg-emerald-100 text-emerald-800', icon: 'verified' };
        } else if (levelNum === 4) {
            return { text: '良好', class: 'bg-amber-100 text-amber-800', icon: 'star_half' };
        } else if (levelNum === 3) {
            return { text: '一般', class: 'bg-blue-100 text-blue-800', icon: 'remove' };
        } else if (levelNum === 2) {
            return { text: '较差', class: 'bg-orange-100 text-orange-800', icon: 'warning' };
        } else {
            return { text: '很差', class: 'bg-red-100 text-red-800', icon: 'error' };
        }
    };

    const creditInfo = getCreditInfo(creditScore || 75, creditLevel);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${creditInfo.class}`}>
            <span className="material-symbols-outlined text-[14px]">{creditInfo.icon}</span>
            {creditInfo.text}
        </span>
    );
};

// 用户行组件 (完整保留您原先所有的 UI 设计)
const UserRow = ({ user, onEditUser, onViewCredit, onToggleStatus, currentTab }) => (
    <tr className="hover:bg-gray-50/50 transition-colors">
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <div className="size-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                    <div className="font-medium text-[#1b140d]">{user.username || user.name || '未命名'}</div>
                    <div className="text-sm text-[#9a734c]">{user.phoneNumber || user.phone || '无手机号'}</div>
                </div>
            </div>
        </td>
        {currentTab === 'users' ? (
            <>
                <td className="px-6 py-4 text-sm text-[#9a734c]">{user.email || '-'}</td>
                <td className="px-6 py-4 text-sm text-[#9a734c]">
                    {(() => {
                        const registrationTime = user.registerDate || user.registeredAt || user.createdAt || user.created_at || user.joinDate || user.registration_time || user.createTime;
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
                    <CreditBadge creditLevel={user.creditLevel} creditScore={user.creditScore} />
                </td>
                <td className="px-6 py-4 text-sm text-[#9a734c]">{user.creditScore || 75}</td>
                <td className="px-6 py-4 text-sm text-[#9a734c]">
                    {user.lastUpdate || user.lastLevelChangeAt || user.createdAt || user.createTime ? new Date(user.lastUpdate || user.lastLevelChangeAt || user.createdAt || user.createTime).toLocaleDateString('zh-CN') : '2024-12-30'}
                </td>
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

// ==========================================
// 以下为原汁原味的主组件逻辑
// ==========================================

function UserCredit() {
    // 补充您发来的片段中遗漏的核心状态
    const [activeTab, setActiveTab] = useState('users');
    const [selectedStatus, setSelectedStatus] = useState('');

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCreditLevel, setSelectedCreditLevel] = useState('');
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustingUser, setAdjustingUser] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({
        creditLevel: 3, // 1-5级，默认3
        reason: ''
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        excellentUsers: 0,
        normalUsers: 0,
        poorUsers: 0
    });

    // 全局定制化弹窗状态
    const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
    const showConfirm = (message, onConfirmCallback) => setDialog({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
    const showAlert = (message) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });

    // 去掉了 selectedCreditLevel 的依赖，避免给不支持此参数的后端发起错误请求
    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    useEffect(() => {
        if (!loading) {
            loadStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users]); // 当 users 更新后，重新计算本页的过滤统计

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            // 仅发送后端支持的参数
            if (searchTerm) params.search = searchTerm;

            const response = await userService.getUsers(params);
            const userList = response.data || response.content || response || [];

            // 为每个用户获取信用信息
            const usersWithCredit = await Promise.all(
                userList.map(async (user) => {
                    try {
                        const creditInfo = await userService.getUserCredit(user.id);
                        
                        // 核心修复点：如果后端没有返回准确的 creditLevel，我们根据 creditScore 推导
                        // 确保“信用管理”页面与“用户管理”页面的评级逻辑完全一致
                        let score = creditInfo.creditScore || user.creditScore || 75;
                        let derivedLevel = creditInfo.creditLevel;
                        
                        if (!derivedLevel) {
                            if (score >= 80) derivedLevel = 5;       // 优秀
                            else if (score >= 60) derivedLevel = 4;  // 良好
                            else if (score >= 40) derivedLevel = 3;  // 一般
                            else if (score >= 20) derivedLevel = 2;  // 较差
                            else derivedLevel = 1;                   // 很差
                        }

                        return {
                            ...user,
                            creditScore: score,
                            creditLevel: derivedLevel,
                            recentCancellations: creditInfo.recentCancellations || 0,
                            lastLevelChangeAt: creditInfo.lastLevelChangeAt
                        };
                    } catch (err) {
                        // 如果获取信用信息失败，使用默认值或基于用户的已有分数推导
                        let score = user.creditScore || 75;
                        let derivedLevel = 3;
                        if (score >= 80) derivedLevel = 5;
                        else if (score >= 60) derivedLevel = 4;
                        else if (score >= 40) derivedLevel = 3;
                        else if (score >= 20) derivedLevel = 2;
                        else derivedLevel = 1;

                        return {
                            ...user,
                            creditScore: score,
                            creditLevel: derivedLevel,
                            recentCancellations: 0,
                            lastLevelChangeAt: null
                        };
                    }
                })
            );
            setUsers(usersWithCredit);
        } catch (error) {
            console.error('加载用户信用数据失败:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await userService.getUserStats();
            const data = response.data || response || {};
            const totalUsers = data.totalUsers || data.total || users.length || 0;

            // 根据用户列表计算各等级数量 (兼容数字和字符串格式)
            const excellentCount = users.filter(u => String(u.creditLevel) === '5' || String(u.creditLevel).toUpperCase() === 'EXCELLENT').length;
            const goodCount = users.filter(u => String(u.creditLevel) === '4' || String(u.creditLevel).toUpperCase() === 'GOOD').length;
            const normalCount = users.filter(u => String(u.creditLevel) === '3' || String(u.creditLevel).toUpperCase() === 'NORMAL').length;
            const poorCount = users.filter(u => String(u.creditLevel) === '2' || String(u.creditLevel) === '1' || String(u.creditLevel).toUpperCase() === 'POOR').length;

            setStats({
                totalUsers: totalUsers,
                excellentUsers: excellentCount || 0,
                normalUsers: normalCount + goodCount || 0,
                poorUsers: poorCount || 0
            });
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    };

    // 补充您片段中遗漏的点击处理函数
    const handleEditUser = (user) => {
        setAdjustingUser(user);
        
        let mappedLevel = 3;
        const uLevel = String(user.creditLevel).toUpperCase();
        if (uLevel === '5' || uLevel === 'EXCELLENT') mappedLevel = 5;
        else if (uLevel === '4' || uLevel === 'GOOD') mappedLevel = 4;
        else if (uLevel === '3' || uLevel === 'NORMAL') mappedLevel = 3;
        else if (uLevel === '2' || uLevel === 'POOR') mappedLevel = 2;
        else if (uLevel === '1') mappedLevel = 1;

        setAdjustmentData({
            creditLevel: mappedLevel,
            reason: ''
        });
        setShowAdjustModal(true);
    };

    const handleViewCredit = (user) => {
        showAlert(`查看 ${user.username || user.name} 的历史记录功能开发中`);
    };

    const handleToggleStatus = async (user) => {
        try {
            await userService.updateUserStatus(user.id, user.status === 'active' ? 'banned' : 'active', '管理员修改');
            loadUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAdjustCredit = async (e) => {
        e.preventDefault();
        if (!adjustingUser) return;

        try {
            // 调用调整信用的API (PATCH /admin/users/{id}/credit)
            await userService.adjustUserCredit(adjustingUser.id, {
                creditLevel: adjustmentData.creditLevel,
                reason: adjustmentData.reason
            });
            showAlert('用户信用调整成功！');
            setShowAdjustModal(false);
            setAdjustingUser(null);
            setAdjustmentData({ creditLevel: 3, reason: '' });
            await loadUsers();
        } catch (error) {
            showAlert('调整用户信用失败: ' + (error.message || '未知错误'));
        }
    };

    // 前端过滤逻辑：已彻底修复数字与文本互相过滤失败的 Bug
    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.username || '').includes(searchTerm) ||
            (user.phone || user.phoneNumber || '').includes(searchTerm) ||
            (user.email || '').includes(searchTerm);
        
        const matchesStatus = !selectedStatus || user.status === selectedStatus;
        
        let matchesCreditLevel = true;
        if (selectedCreditLevel) {
            const uLevel = String(user.creditLevel).toUpperCase();
            const sLevel = String(selectedCreditLevel).toUpperCase();
            
            if (uLevel === sLevel) {
                matchesCreditLevel = true;
            } else {
                // 兼容性映射：全面双向处理所有文本与数字的情况（无论下来框是数字还是文本）
                const isExcellent = (l) => l === '5' || l === 'EXCELLENT';
                const isGood = (l) => l === '4' || l === 'GOOD';
                const isNormal = (l) => l === '3' || l === 'NORMAL';
                const isPoor = (l) => l === '2' || l === '1' || l === 'POOR' || l === 'VERY_POOR';

                matchesCreditLevel = (isExcellent(uLevel) && isExcellent(sLevel)) ||
                                     (isGood(uLevel) && isGood(sLevel)) ||
                                     (isNormal(uLevel) && isNormal(sLevel)) ||
                                     (isPoor(uLevel) && isPoor(sLevel));
            }
        }
        
        return matchesSearch && matchesStatus && matchesCreditLevel;
    });

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500 min-h-screen">
            <div className="space-y-6 p-6 md:p-8 max-w-[1400px] mx-auto">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b140d]">
                            用户管理
                        </h1>
                        <p className="text-[#9a734c] text-sm font-medium">
                            管理用户账户、信用等级与权限记录
                        </p>
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
                                    className="pl-10 w-full rounded-lg border-[#e7dbcf] text-sm focus:border-[#ee8c2b] focus:ring-[#ee8c2b] py-2"
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
                                    <option value="5">优秀 (5级)</option>
                                    <option value="4">良好 (4级)</option>
                                    <option value="3">一般 (3级)</option>
                                    <option value="2">较差 (2级)</option>
                                    <option value="1">很差 (1级)</option>
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* 用户表格 */}
                <div className="bg-white rounded-xl shadow-sm border border-[#e7dbcf] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#e7dbcf] bg-gray-50/50">
                        <h3 className="text-base font-bold text-[#1b140d]">
                            {activeTab === 'users' ? '平台用户列表' : '用户信用档案'}
                            <span className="ml-2 text-sm font-normal text-[#9a734c]">
                                共 {filteredUsers.length} 项
                            </span>
                        </h3>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center py-24">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#ee8c2b] border-t-transparent"></div>
                                <span className="text-sm font-bold text-[#9a734c]">正在加载数据...</span>
                            </div>
                        </div>
                    ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-[#1b140d] font-bold uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 tracking-wider">用户信息</th>
                                    {activeTab === 'users' ? (
                                        <>
                                            <th className="px-6 py-4 tracking-wider">邮箱</th>
                                            <th className="px-6 py-4 tracking-wider">注册时间</th>
                                            <th className="px-6 py-4 tracking-wider">状态</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-4 tracking-wider text-center">信用等级</th>
                                            <th className="px-6 py-4 tracking-wider text-center">信用分数</th>
                                            <th className="px-6 py-4 tracking-wider text-center">最后更新</th>
                                        </>
                                    )}
                                    <th className="px-6 py-4 text-right tracking-wider">操作</th>
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
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-gray-50 p-6 rounded-full mb-2">
                                                    <span className="material-symbols-outlined text-[#9a734c] text-5xl">search_off</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-[#1b140d] mb-1">暂无符合条件的用户</h3>
                                                <p className="text-sm text-[#9a734c] mb-5">请尝试清除搜索词或更换筛选条件</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    )}
                </div>

                {/* 调整信用模态框 */}
                {showAdjustModal && adjustingUser && (
                    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[#e7dbcf]">
                            <div className="px-6 py-4 border-b border-[#e7dbcf] flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-bold text-[#1b140d]">调整用户信用</h3>
                                <button onClick={() => setShowAdjustModal(false)} className="text-[#9a734c] hover:text-[#1b140d] transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleAdjustCredit} className="p-6">
                                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-[#e7dbcf]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                            {adjustingUser.username?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#1b140d]">{adjustingUser.username || '未命名'}</p>
                                            <p className="text-xs text-[#9a734c] mt-0.5">正在对其进行信用评定</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#e7dbcf]">
                                        <span className="text-xs text-[#9a734c]">当前等级:</span>
                                        <span className="text-sm font-bold text-[#1b140d]">{adjustingUser.creditLevel || 3} 级</span>
                                        {adjustingUser.recentCancellations > 0 && (
                                            <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-bold ml-auto">
                                                近期取消 {adjustingUser.recentCancellations} 次
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-[#1b140d] mb-2">
                                        新信用等级 <span className="text-[#9a734c] font-normal">(1-5级，5级最高)</span>
                                    </label>
                                    <select
                                        value={adjustmentData.creditLevel}
                                        onChange={(e) => setAdjustmentData({
                                            ...adjustmentData,
                                            creditLevel: parseInt(e.target.value)
                                        })}
                                        className="w-full h-11 px-4 border border-[#e7dbcf] rounded-lg text-sm focus:outline-none focus:border-[#ee8c2b] focus:ring-1 focus:ring-[#ee8c2b]"
                                    >
                                        <option value={5}>5级 - 优秀</option>
                                        <option value={4}>4级 - 良好</option>
                                        <option value={3}>3级 - 一般</option>
                                        <option value={2}>2级 - 较差</option>
                                        <option value={1}>1级 - 很差</option>
                                    </select>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-[#1b140d] mb-2">
                                        调整原因 <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={adjustmentData.reason}
                                        onChange={(e) => setAdjustmentData({
                                            ...adjustmentData,
                                            reason: e.target.value
                                        })}
                                        required
                                        rows={3}
                                        className="w-full p-4 border border-[#e7dbcf] rounded-lg text-sm focus:outline-none focus:border-[#ee8c2b] focus:ring-1 focus:ring-[#ee8c2b] resize-none"
                                        placeholder="请输入管理员调整信用的详细原因..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-[#e7dbcf]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAdjustModal(false);
                                            setAdjustingUser(null);
                                        }}
                                        className="px-6 py-2.5 rounded-lg text-[#1b140d] bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 rounded-lg bg-[#ee8c2b] text-white hover:bg-[#d97b1e] transition-colors text-sm font-medium"
                                    >
                                        确认调整
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* 全局基础提示 Modal */}
            {dialog.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${
                                dialog.type === 'confirm' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                            }`}>
                                <span className="material-symbols-outlined text-[28px]">
                                    {dialog.type === 'confirm' ? 'help' : 'info'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-[#1b140d] mb-2">
                                {dialog.type === 'confirm' ? '确认操作' : '提示'}
                            </h3>
                            <p className="text-sm text-[#9a734c] leading-relaxed">
                                {dialog.message}
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-center gap-3">
                            {dialog.type === 'confirm' && (
                                <button
                                    onClick={() => setDialog({ ...dialog, isOpen: false })}
                                    className="flex-1 py-2.5 rounded-lg text-[#1b140d] bg-white border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    取消
                                </button>
                            )}
                            <button
                                onClick={dialog.onConfirm}
                                className="flex-1 py-2.5 rounded-lg bg-[#ee8c2b] text-white hover:bg-[#d97b1e] transition-colors text-sm font-medium"
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

export default UserCredit;