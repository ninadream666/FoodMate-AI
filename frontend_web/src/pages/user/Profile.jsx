import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // 用户状态
  const [user, setUser] = useState({
    username: '',
    nickname: '',
    phone: '',
    email: '',
    avatarUrl: ''
  });

  // 编辑模式状态
  const [editMode, setEditMode] = useState({
    phone: false,
    email: false,
    nickname: false
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const data = await userService.getUserProfile();
      if (!data.avatarUrl) {
        data.avatarUrl = "/default-avatar.png";
      }
      setUser(data);
    } catch (error) {
      console.error("获取用户信息失败:", error);
      alert("获取用户信息失败，请重新登录");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const toggleEdit = (field) => {
    setEditMode(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleDoubleClick = (field) => {
    setEditMode(prev => ({ ...prev, [field]: true }));
  };

  // --- 新增：数据校验逻辑 ---
  const validateInputs = () => {
    // 邮箱正则: 简单的 xxx@xxx.xx 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // 手机号正则: 1开头，第二位3-9，后面9位数字，共11位
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (!user.email || !emailRegex.test(user.email)) {
      alert("请输入有效的邮箱地址 (例如: name@example.com)");
      return false;
    }

    if (user.phone && !phoneRegex.test(user.phone)) {
      alert("请输入有效的 11 位手机号码");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    // 保存前先校验
    if (!validateInputs()) {
      return;
    }

    try {
      // .trim()防止用户复制粘贴带了空格
      const updateDto = {
        nickname: user.nickname ? user.nickname.trim() : '',
        phone: user.phone ? user.phone.trim() : '',
        email: user.email ? user.email.trim() : '',
        avatarUrl: user.avatarUrl
      };

      const updatedUser = await userService.updateUserProfile(updateDto);
      setUser(updatedUser);

      setEditMode({ phone: false, email: false, nickname: false });
      alert("修改保存成功！");
    } catch (error) {
      console.error(error);
      alert("保存失败，请稍后重试");
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) return <div className="p-10 text-center">加载中...</div>;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden font-sans text-[#1c130d]">
      <div className="layout-container flex h-full grow flex-col">

        {/* --- Header --- */}
        <header className="flex items-center justify-between border-b border-solid border-[#f4ece7] px-6 lg:px-10 py-4 bg-white shadow-sm">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="size-6 text-orange-500">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"></path></svg>
            </div>
            <h2 className="text-lg font-bold">美食外卖平台</h2>
          </div>
          <div className="flex flex-1 justify-end gap-4 items-center">
            <button
              onClick={() => navigate('/home')}
              className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors mr-2"
            >
              <span className="material-symbols-outlined text-lg">home</span>
              首页
            </button>

            <span className="text-sm font-medium hidden sm:inline">{user.nickname || user.username}</span>
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-gray-200"
              style={{ backgroundImage: `url("${user.avatarUrl}")` }}
            ></div>
            <button onClick={handleLogout} className="text-sm font-bold text-orange-500 px-4 py-2 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">退出</button>
          </div>
        </header>

        <div className="flex flex-1">
          {/* --- Sidebar --- */}
          <aside className="w-64 flex-shrink-0 p-6 hidden md:block bg-white border-r border-[#f4ece7]">
            <div className="flex flex-col gap-2">
              <SidebarItem icon="person" label="个人资料" active />
              <SidebarItem icon="receipt_long" label="我的订单" onClick={() => navigate('/orders')} />
              <SidebarItem icon="home_pin" label="地址管理" onClick={() => navigate('/address')} />
              <SidebarItem icon="account_balance_wallet" label="钱包与优惠券" onClick={() => navigate('/wallet')} />
            </div>
          </aside>

          {/* --- Main Content --- */}
          <main className="flex-1 p-6 lg:p-8 bg-[#f8f7f5]">
            <div className="flex flex-col gap-8 max-w-5xl mx-auto">

              <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
                <h3 className="text-xl font-bold mb-6">个人资料</h3>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* 头像区域 */}
                  <div className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-32 border-4 border-white shadow-md"
                        style={{ backgroundImage: `url("${user.avatarUrl}")` }}
                      ></div>
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm">更换头像</p>
                  </div>

                  {/* 表单区域 */}
                  <div className="flex-1 w-full">
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* 用户名 (只读) */}
                      <div className="flex flex-col">
                        <p className="text-sm font-medium pb-2 text-gray-700">用户名</p>
                        <input
                          className="form-input w-full rounded-lg border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed h-12 px-4"
                          value={user.username}
                          disabled
                        />
                      </div>

                      {/* 昵称 (新增双击编辑) */}
                      <div className="flex flex-col relative">
                        <div className="flex justify-between items-center pb-2">
                          <p className="text-sm font-medium text-gray-700">昵称</p>
                          <button type="button" onClick={() => toggleEdit('nickname')} className="text-xs text-orange-500 hover:underline">
                            {editMode.nickname ? '锁定' : '修改'}
                          </button>
                        </div>
                        <input
                          name="nickname"
                          className={`form-input w-full rounded-lg h-12 px-4 transition-colors ${editMode.nickname ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white' : 'border-gray-200 bg-gray-50 cursor-pointer'
                            }`}
                          value={user.nickname || ''}
                          onChange={handleChange}
                          readOnly={!editMode.nickname}
                          onDoubleClick={() => handleDoubleClick('nickname')} // 双击事件
                          title="双击可修改"
                          placeholder="未设置昵称"
                        />
                      </div>

                      {/* 手机号 */}
                      <div className="flex flex-col relative">
                        <div className="flex justify-between items-center pb-2">
                          <p className="text-sm font-medium text-gray-700">手机号</p>
                          <button type="button" onClick={() => toggleEdit('phone')} className="text-xs text-orange-500 hover:underline">
                            {editMode.phone ? '锁定' : '修改'}
                          </button>
                        </div>
                        <input
                          name="phone"
                          className={`form-input w-full rounded-lg h-12 px-4 transition-colors ${editMode.phone ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white' : 'border-gray-200 bg-gray-50 cursor-pointer'
                            }`}
                          value={user.phone || ''}
                          onChange={handleChange}
                          readOnly={!editMode.phone}
                          onDoubleClick={() => handleDoubleClick('phone')}
                          title="双击可修改"
                          maxLength={11} // 物理限制11位
                          placeholder="未绑定手机"
                        />
                      </div>

                      {/* 邮箱 */}
                      <div className="flex flex-col relative">
                        <div className="flex justify-between items-center pb-2">
                          <p className="text-sm font-medium text-gray-700">邮箱</p>
                          <button type="button" onClick={() => toggleEdit('email')} className="text-xs text-orange-500 hover:underline">
                            {editMode.email ? '锁定' : '修改'}
                          </button>
                        </div>
                        <input
                          name="email"
                          className={`form-input w-full rounded-lg h-12 px-4 transition-colors ${editMode.email ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white' : 'border-gray-200 bg-gray-50 cursor-pointer'
                            }`}
                          value={user.email || ''}
                          onChange={handleChange}
                          readOnly={!editMode.email}
                          onDoubleClick={() => handleDoubleClick('email')}
                          title="双击可修改"
                        />
                      </div>

                      <div className="md:col-span-2 flex justify-end mt-4">
                        <button
                          type="button"
                          onClick={handleSave}
                          className="rounded-lg h-12 px-8 bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
                        >
                          保存修改
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon="payments" label="本月消费" value="¥ 0.00" />
                <StatCard icon="shopping_bag" label="累计订单" value="0" />
                <StatCard icon="local_activity" label="可用优惠券" value="0 张" />
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active
          ? 'bg-orange-50 text-orange-500'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      <span className={`material-symbols-outlined ${active ? 'fill' : ''}`}>{icon}</span>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl bg-white shadow-sm border border-gray-100">
      <div className="flex items-center justify-center size-12 rounded-lg bg-orange-50 text-orange-500">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <div className="flex flex-col">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}