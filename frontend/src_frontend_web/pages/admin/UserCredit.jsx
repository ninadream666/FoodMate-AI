import React, { useState, useEffect } from 'react';
import userService from '../../services/admin/userService';

function UserCredit() {
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

    useEffect(() => {
        loadUsers();
        loadStats();
    }, [searchTerm, selectedCreditLevel]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedCreditLevel) params.creditLevel = selectedCreditLevel;

            const response = await userService.getUsers(params);
            const userList = response.data || response.content || response || [];

            // 为每个用户获取信用信息
            const usersWithCredit = await Promise.all(
                userList.map(async (user) => {
                    try {
                        const creditInfo = await userService.getUserCredit(user.id);
                        return {
                            ...user,
                            creditLevel: creditInfo.creditLevel || 3, // 默认3级
                            recentCancellations: creditInfo.recentCancellations || 0,
                            lastLevelChangeAt: creditInfo.lastLevelChangeAt
                        };
                    } catch (err) {
                        // 如果获取信用信息失败，使用默认值
                        return {
                            ...user,
                            creditLevel: 3,
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
            const totalUsers = data.totalUsers || data.total || 0;

            // 根据用户列表计算各等级数量
            const excellentCount = users.filter(u => u.creditLevel >= 5).length;
            const goodCount = users.filter(u => u.creditLevel === 4).length;
            const normalCount = users.filter(u => u.creditLevel === 3).length;
            const poorCount = users.filter(u => u.creditLevel <= 2).length;

            setStats({
                totalUsers: totalUsers,
                excellentUsers: excellentCount || Math.floor(totalUsers * 0.1),
                normalUsers: normalCount + goodCount || Math.floor(totalUsers * 0.7),
                poorUsers: poorCount || Math.floor(totalUsers * 0.2)
            });
        } catch (error) {
            console.error('加载统计数据失败:', error);
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
            alert('用户信用调整成功');
            setShowAdjustModal(false);
            setAdjustingUser(null);
            setAdjustmentData({ creditLevel: 3, reason: '' });
            await loadUsers();
            await loadStats();
        } catch (error) {
            alert('调整用户信用失败: ' + (error.message || '未知错误'));
        }
    };

    const getCreditLevelDisplay = (level) => {
        // 后端使用 1-5 级数字，5级最高
        const levels = {
            5: { label: '优秀', color: 'text-green-600 bg-green-100' },
            4: { label: '良好', color: 'text-blue-600 bg-blue-100' },
            3: { label: '一般', color: 'text-gray-600 bg-gray-100' },
            2: { label: '较差', color: 'text-orange-600 bg-orange-100' },
            1: { label: '很差', color: 'text-red-600 bg-red-100' },
            // 兼容旧的字符串格式
            EXCELLENT: { label: '优秀', color: 'text-green-600 bg-green-100' },
            GOOD: { label: '良好', color: 'text-blue-600 bg-blue-100' },
            NORMAL: { label: '一般', color: 'text-gray-600 bg-gray-100' },
            POOR: { label: '较差', color: 'text-red-600 bg-red-100' }
        };
        const config = levels[level] || levels[3];
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const openAdjustModal = (user) => {
        setAdjustingUser(user);
        setAdjustmentData({
            creditLevel: user.creditLevel || 3, // 使用数字 1-5
            reason: ''
        });
        setShowAdjustModal(true);
    };

    const StatCard = ({ title, value, icon, color = 'blue' }) => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
                <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600 mr-4`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">加载中...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f7f6] text-[#1b140d] font-['Inter']">
            <div className="space-y-6 p-6 md:p-8">
                {/* 页面标题 */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">用户信用管理</h1>
                    <p className="text-gray-600">管理用户信用等级、信用分数和信用记录</p>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title="总用户数"
                        value={stats.totalUsers}
                        icon={<span>👥</span>}
                        color="blue"
                    />
                    <StatCard
                        title="优秀信用"
                        value={stats.excellentUsers}
                        icon={<span>⭐</span>}
                        color="green"
                    />
                    <StatCard
                        title="一般信用"
                        value={stats.normalUsers}
                        icon={<span>➖</span>}
                        color="gray"
                    />
                    <StatCard
                        title="较差信用"
                        value={stats.poorUsers}
                        icon={<span>⚠️</span>}
                        color="red"
                    />
                </div>

                {/* 搜索和筛选 */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="搜索用户名、手机号、邮箱..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <select
                                value={selectedCreditLevel}
                                onChange={(e) => setSelectedCreditLevel(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">所有信用等级</option>
                                <option value="5">优秀 (5级)</option>
                                <option value="4">良好 (4级)</option>
                                <option value="3">一般 (3级)</option>
                                <option value="2">较差 (2级)</option>
                                <option value="1">很差 (1级)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 用户信用列表 */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        用户信息
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        信用分数
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        信用等级
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        联系方式
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        注册时间
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length > 0 ? users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-medium">
                                                        {user.username?.charAt(0).toUpperCase() || user.id.toString().charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="ml-3">
                                                    <div className="font-medium text-gray-900">{user.username || '未命名'}</div>
                                                    <div className="text-sm text-gray-500">ID: {user.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <span className="text-2xl font-bold text-gray-700">
                                                    {user.creditLevel || 3}
                                                </span>
                                                <span className="text-sm text-gray-500 ml-2">级</span>
                                            </div>
                                            {user.recentCancellations > 0 && (
                                                <div className="text-xs text-red-500 mt-1">
                                                    近期取消: {user.recentCancellations}次
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getCreditLevelDisplay(user.creditLevel)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm text-gray-900">
                                                    {user.phoneNumber || '未绑定手机'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.email || '未绑定邮箱'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => openAdjustModal(user)}
                                                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                                >
                                                    调整信用
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // TODO: 查看信用记录
                                                        alert('查看信用记录功能待完善');
                                                    }}
                                                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                                                >
                                                    查看记录
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            暂无用户信用数据
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 调整信用模态框 */}
                {showAdjustModal && adjustingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">调整用户信用</h2>
                            <form onSubmit={handleAdjustCredit}>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">
                                        用户：{adjustingUser.username || '未命名'}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-4">
                                        当前信用等级：{adjustingUser.creditLevel || 3} 级
                                        {adjustingUser.recentCancellations > 0 && (
                                            <span className="text-red-500 ml-2">
                                                (近期取消 {adjustingUser.recentCancellations} 次)
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        新信用等级 (1-5级，5级最高)
                                    </label>
                                    <select
                                        value={adjustmentData.creditLevel}
                                        onChange={(e) => setAdjustmentData({
                                            ...adjustmentData,
                                            creditLevel: parseInt(e.target.value)
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={5}>5级 - 优秀</option>
                                        <option value={4}>4级 - 良好</option>
                                        <option value={3}>3级 - 一般</option>
                                        <option value={2}>2级 - 较差</option>
                                        <option value={1}>1级 - 很差</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        调整原因
                                    </label>
                                    <textarea
                                        value={adjustmentData.reason}
                                        onChange={(e) => setAdjustmentData({
                                            ...adjustmentData,
                                            reason: e.target.value
                                        })}
                                        required
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="请输入调整原因"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAdjustModal(false);
                                            setAdjustingUser(null);
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        确认调整
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserCredit;