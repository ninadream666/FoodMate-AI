import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { walletService } from '../../services/walletService';

export default function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('AVAILABLE'); // 'AVAILABLE' or 'EXPIRED'

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const balanceData = await walletService.getBalance();
      setBalance(balanceData.balance);

      // 获取优惠券数据
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.id) {
          const couponsData = await walletService.getAllCoupons(user.id);
          // 标准化优惠券数据格式
          const normalizedCoupons = couponsData.map(c => ({
            id: c.id,
            title: c.name || c.title,
            amount: c.discountValue || c.amount,
            minSpend: c.minOrderAmount || c.minSpend,
            expireDate: c.validUntil ? new Date(c.validUntil).toLocaleDateString() : c.expireDate,
            status: walletService.isCouponExpired(c) ? 'EXPIRED' : (c.status || 'AVAILABLE'),
            type: c.type,
          }));
          setCoupons(normalizedCoupons);
        } else {
          // 没有用户ID，使用模拟数据
          const couponsData = await walletService.getCoupons();
          setCoupons(couponsData.map(c => ({
            id: c.id,
            title: c.name || c.title,
            amount: c.discountValue || c.amount,
            minSpend: c.minOrderAmount || c.minSpend,
            expireDate: c.validUntil ? new Date(c.validUntil).toLocaleDateString() : c.expireDate,
            status: c.status || 'AVAILABLE',
            type: c.type,
          })));
        }
      } else {
        const couponsData = await walletService.getCoupons();
        setCoupons(couponsData.map(c => ({
          id: c.id,
          title: c.name || c.title,
          amount: c.discountValue || c.amount,
          minSpend: c.minOrderAmount || c.minSpend,
          expireDate: c.validUntil ? new Date(c.validUntil).toLocaleDateString() : c.expireDate,
          status: c.status || 'AVAILABLE',
          type: c.type,
        })));
      }
    } catch (error) {
      console.error("加载钱包数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // 过滤优惠券
  const displayedCoupons = coupons.filter(c =>
    activeTab === 'AVAILABLE' ? c.status === 'AVAILABLE' : c.status !== 'AVAILABLE'
  );

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#f8f7f5] overflow-x-hidden font-sans text-[#1c130d]">
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
            <button onClick={() => navigate('/home')} className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors mr-2">
              <span className="material-symbols-outlined text-lg">home</span>
              首页
            </button>
            <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-gray-200" style={{ backgroundImage: 'url("/default-avatar.png")' }}></div>
            <button onClick={handleLogout} className="text-sm font-bold text-orange-500 px-4 py-2 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">退出</button>
          </div>
        </header>

        <div className="flex flex-1">
          {/* --- Sidebar --- */}
          <aside className="w-64 flex-shrink-0 p-6 hidden md:block bg-white border-r border-[#f4ece7]">
            <div className="flex flex-col gap-2">
              <SidebarItem icon="person" label="个人资料" onClick={() => navigate('/profile')} />
              <SidebarItem icon="receipt_long" label="我的订单" onClick={() => navigate('/orders')} />
              <SidebarItem icon="home_pin" label="地址管理" onClick={() => navigate('/address')} />
              <SidebarItem icon="account_balance_wallet" label="钱包与优惠券" active />
            </div>
          </aside>

          {/* --- Main Content --- */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="flex flex-col gap-8 max-w-5xl mx-auto">

              {/* 钱包卡片 */}
              <div className="flex flex-col gap-4 p-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 text-white shadow-lg relative overflow-hidden">
                {/* 装饰性背景圆圈 */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>

                <div className="flex items-center justify-between z-10">
                  <p className="text-base font-medium opacity-90">当前余额</p>
                  <button
                    onClick={() => alert("充值功能开发中...")}
                    className="flex items-center justify-center rounded-lg h-9 px-5 bg-white text-orange-600 text-sm font-bold shadow-sm hover:bg-orange-50 transition-colors"
                  >
                    充值
                  </button>
                </div>
                <p className="text-5xl font-bold tracking-tight z-10">
                  ¥ {loading ? '...' : balance.toFixed(2)}
                </p>
              </div>

              {/* 优惠券区域 */}
              <div className="flex flex-col gap-6">

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('AVAILABLE')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'AVAILABLE'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    可用优惠券 ({coupons.filter(c => c.status === 'AVAILABLE').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('EXPIRED')}
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'EXPIRED'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    已失效 ({coupons.filter(c => c.status !== 'AVAILABLE').length})
                  </button>
                </div>

                {/* 优惠券列表 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {loading ? (
                    <p className="text-gray-500 col-span-full text-center py-10">加载中...</p>
                  ) : displayedCoupons.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-400">
                      暂无相关优惠券
                    </div>
                  ) : (
                    displayedCoupons.map((coupon) => (
                      <div key={coupon.id} className={`coupon bg-white flex shadow-sm rounded-xl overflow-hidden relative border border-gray-100 ${coupon.status !== 'AVAILABLE' ? 'opacity-60 grayscale' : ''}`}>

                        {/* 左侧金额 */}
                        <div className="flex w-[30%] flex-col items-center justify-center p-4 bg-orange-50 border-r border-dashed border-orange-200 relative">
                          {/* 左右的半圆缺口效果由 CSS 伪元素实现，或者简化为 CSS border */}
                          <p className="text-3xl font-bold text-orange-600">¥{coupon.amount}</p>
                        </div>

                        {/* 右侧详情 */}
                        <div className="flex flex-1 items-center justify-between p-5">
                          <div className="flex flex-col gap-1.5">
                            <p className="text-base font-bold text-gray-900">{coupon.title}</p>
                            <p className="text-xs text-gray-500">满{coupon.minSpend}可用</p>
                            <p className="text-xs text-gray-400">有效期至: {coupon.expireDate}</p>
                          </div>

                          {coupon.status === 'AVAILABLE' ? (
                            <button
                              onClick={() => navigate('/home')}
                              className="rounded-full h-8 px-4 bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
                            >
                              去使用
                            </button>
                          ) : (
                            <button disabled className="rounded-full h-8 px-4 bg-gray-100 text-gray-400 text-xs font-bold cursor-not-allowed">
                              已失效
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-orange-50 text-orange-500' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
      <span className={`material-symbols-outlined ${active ? 'fill' : ''}`}>{icon}</span>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}