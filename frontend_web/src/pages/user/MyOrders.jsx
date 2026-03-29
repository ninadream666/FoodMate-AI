import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, getOrderStatusText, getOrderStatusColor } from '../../services/orderService';
import { authService } from '../../services/authService';

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // 获取用户信息用于 Header 显示
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // 加载订单数据
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error("加载订单失败:", error);
      // 这里的空数据仅用于演示，实际会显示空列表
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // 取消订单
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('确定要取消这个订单吗？')) return;

    setCancellingOrderId(orderId);
    try {
      await orderService.cancelOrder(orderId, '用户主动取消');
      // 刷新订单列表
      await fetchOrders();
      alert('订单取消成功');
    } catch (error) {
      console.error('取消订单失败:', error);
      alert(error.message || '取消订单失败');
    } finally {
      setCancellingOrderId(null);
    }
  };

  // 查看订单详情
  const handleViewDetail = async (orderId) => {
    try {
      const detail = await orderService.getOrderDetail(orderId);
      // 可以跳转到订单详情页，或者弹出详情
      console.log('订单详情:', detail);
      navigate(`/order-tracking`, { state: { order: detail } });
    } catch (error) {
      console.error('获取订单详情失败:', error);
    }
  };

  // 临时：商家ID转名称 (因为订单表只存了ID)
  const getMerchantName = (order) => {
    // 优先使用订单中的商家名称
    if (order.merchantName) return order.merchantName;
    const names = { 1: '张记面馆', 2: '李氏烤肉', 3: '王牌披萨' };
    return names[order.merchantId] || `商家 #${order.merchantId}`;
  };

  // 判断订单是否可取消
  const canCancelOrder = (status) => {
    // 支持新的对象结构
    const statusCode = typeof status === 'object' && status !== null ? status.code : status;
    return ['PENDING', 'PAID'].includes(statusCode);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden font-sans text-[#1c130d]">
      <div className="layout-container flex h-full grow flex-col">

        {/* --- Header --- */}
        <header className="flex items-center justify-between border-b border-solid border-[#f4ece7] px-6 lg:px-10 py-4 bg-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-6 text-orange-500">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"></path></svg>
            </div>
            <h2 className="text-lg font-bold">美食外卖平台</h2>
          </div>
          <div className="flex flex-1 justify-end gap-4 items-center">
            <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-gray-200" style={{ backgroundImage: 'url("/default-avatar.png")' }}></div>
            <button onClick={handleLogout} className="text-sm font-bold text-orange-500 px-4 py-2 bg-orange-50 rounded-lg hover:bg-orange-100">退出登录</button>
          </div>
        </header>

        <div className="flex flex-1">
          {/* --- Sidebar --- */}
          <aside className="w-64 flex-shrink-0 p-6 hidden md:block bg-white border-r border-[#f4ece7]">
            <div className="flex flex-col gap-2">
              <SidebarItem icon="person" label="个人资料" onClick={() => navigate('/profile')} />
              <SidebarItem icon="receipt_long" label="我的订单" active />
              <SidebarItem icon="home_pin" label="地址管理" onClick={() => navigate('/address')} />
              <SidebarItem icon="account_balance_wallet" label="钱包与优惠券" />
            </div>
          </aside>

          {/* --- Main Content --- */}
          <main className="flex-1 p-6 lg:p-8 bg-[#f8f7f5]">
            <div className="flex flex-col gap-8 max-w-5xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
                <h3 className="text-xl font-bold mb-6">我的订单</h3>

                <div className="flex flex-col gap-6">
                  {loading ? (
                    <p className="text-center text-gray-500 py-10">加载中...</p>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-10">
                      <span className="material-symbols-outlined text-6xl text-gray-300">receipt</span>
                      <p className="text-gray-500 mt-2">暂无订单，快去点餐吧！</p>
                      <button onClick={() => navigate('/home')} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full">去点餐</button>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="flex flex-col gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow bg-white">
                        {/* 订单头部：商家与状态 */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 rounded-md size-10 flex items-center justify-center text-orange-500">
                              <span className="material-symbols-outlined">storefront</span>
                            </div>
                            <p className="font-semibold">{getMerchantName(order)}</p>
                            <span className="material-symbols-outlined text-gray-400 text-base">chevron_right</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <p>下单时间: {new Date(order.createdAt).toLocaleString()}</p>
                            <p className={`font-medium ${getOrderStatusColor(order.status)}`}>
                              {getOrderStatusText(order.status)}
                            </p>
                          </div>
                        </div>

                        {/* 订单内容与操作 */}
                        <div className="flex items-end justify-between gap-4 border-t border-gray-50 pt-4">
                          <p className="text-sm text-gray-600">
                            {/* 展示订单项数量 */}
                            {order.items ? `${order.items.length}件商品` : '共消费'}
                          </p>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <p className="text-lg font-bold">¥{order.totalAmount}</p>
                            <button
                              onClick={() => handleViewDetail(order.id)}
                              className="px-4 py-2 bg-orange-50 text-orange-600 text-sm font-bold rounded-lg hover:bg-orange-100 transition-colors"
                            >
                              查看详情
                            </button>
                            {canCancelOrder(order.status) && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancellingOrderId === order.id}
                                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                {cancellingOrderId === order.id ? '取消中...' : '取消订单'}
                              </button>
                            )}
                            {order.status === 'COMPLETED' && (
                              <button className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors">
                                评价
                              </button>
                            )}
                          </div>
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

// 侧边栏子组件
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