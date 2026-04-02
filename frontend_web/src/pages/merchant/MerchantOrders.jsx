import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { merchantOrderService } from '../../services/merchantOrderService';

const TABS = [
  { key: 'pending', label: '待接单', statuses: ['PAID'] },
  { key: 'cooking', label: '制作中', statuses: ['CONFIRMED', 'PREPARING'] },
  { key: 'ready', label: '待配送', statuses: ['READY'] },
  { key: 'all', label: '全部', statuses: ['PAID', 'CONFIRMED', 'PREPARING', 'READY'] },
];

const STATUS_CONFIG = {
  PAID: { label: '待接单', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  CONFIRMED: { label: '已接单', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  PREPARING: { label: '制作中', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  READY: { label: '待配送', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  DELIVERED: { label: '已配送', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
};

export default function MerchantOrders() {
  const { merchant } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!merchant?.id) return;
    try {
      const res = await merchantOrderService.getPendingOrders(merchant.id);
      const list = res?.orders || res?.data?.orders || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('获取订单失败', e);
    } finally {
      setLoading(false);
    }
  }, [merchant?.id]);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 30000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  const getStatus = (order) => {
    const s = order.status;
    return typeof s === 'object' ? (s.code || s) : s;
  };

  const filteredOrders = orders.filter(o => {
    const tab = TABS.find(t => t.key === activeTab);
    return tab?.statuses.includes(getStatus(o));
  });

  const handleAccept = async (orderId) => {
    setActionLoading(orderId);
    try {
      await merchantOrderService.acceptOrder(merchant.id, orderId);
      fetchOrders();
    } catch (e) {
      alert('接单失败: ' + (e.message || '请重试'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId) => {
    if (!confirm('拒单后订单将全额退款给用户，确定要拒单吗？')) return;
    setActionLoading(orderId);
    try {
      await merchantOrderService.rejectOrder(merchant.id, orderId, '商家拒绝接单');
      fetchOrders();
    } catch (e) {
      alert('拒单失败: ' + (e.message || '请重试'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleProgress = async (orderId, status) => {
    setActionLoading(orderId);
    try {
      await merchantOrderService.updateProgress(merchant.id, orderId, status);
      fetchOrders();
    } catch (e) {
      alert('操作失败: ' + (e.message || '请重试'));
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    return new Date(t).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderActions = (order) => {
    const status = getStatus(order);
    const isLoading = actionLoading === order.orderId;

    if (isLoading) {
      return <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>;
    }

    switch (status) {
      case 'PAID':
        return (
          <div className="flex gap-2">
            <button onClick={() => handleReject(order.orderId)}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              拒单
            </button>
            <button onClick={() => handleAccept(order.orderId)}
              className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
              接单
            </button>
          </div>
        );
      case 'CONFIRMED':
        return (
          <button onClick={() => handleProgress(order.orderId, 'PREPARING')}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
            开始制作
          </button>
        );
      case 'PREPARING':
        return (
          <button onClick={() => handleProgress(order.orderId, 'READY')}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
            备餐完成
          </button>
        );
      case 'READY':
        return (
          <button onClick={() => handleProgress(order.orderId, 'DELIVERED')}
            className="px-4 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
            已出餐
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-3 text-text-secondary">加载订单中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">订单管理</h1>

      {/* Tab 栏 */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = orders.filter(o => tab.statuses.includes(getStatus(o))).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-gray-50'
              }`}
            >
              {tab.label}{count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* 刷新按钮 */}
      <div className="flex justify-end mb-4">
        <button onClick={fetchOrders} className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">refresh</span>
          刷新
        </button>
      </div>

      {/* 订单列表 */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
          <span className="material-symbols-outlined text-5xl mb-3">inbox</span>
          <p>暂无{TABS.find(t => t.key === activeTab)?.label}订单</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map(order => {
            const status = getStatus(order);
            const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' };
            return (
              <div key={order.orderId} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                {/* 头部 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-text-primary">订单 #{order.orderId}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary">{formatTime(order.createdAt)}</span>
                </div>

                {/* 菜品列表 */}
                {order.orderItems && order.orderItems.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 mb-3">
                    {order.orderItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-sm">
                        <span className="text-text-primary truncate flex-1">{item.menuItemName || `菜品#${item.menuItemId}`}</span>
                        <span className="text-text-tertiary mx-4">x{item.quantity}</span>
                        <span className="text-text-primary font-medium">¥{item.subtotal?.toFixed(2) || (item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 底部：合计 + 操作 */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="text-sm text-text-secondary">
                    合计 <span className="text-lg font-bold text-primary ml-1">¥{order.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  {renderActions(order)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
