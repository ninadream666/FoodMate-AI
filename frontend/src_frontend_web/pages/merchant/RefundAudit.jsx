import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { merchantOrderService } from '../../services/merchantOrderService';

/**
 * 商家端 - 退款审批页面
 */
export default function RefundAudit() {
  const { merchant } = useOutletContext();
  
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false); // 默认为 false，由 useEffect 触发变 true
  const [errorMsg, setErrorMsg] = useState(null); // 新增：用于在页面显示错误

  // 拒绝模态框状态
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    console.log("RefundAudit Effect Triggered. Merchant:", merchant);
    if (merchant && merchant.id) {
      fetchPendingRefunds();
    }
  }, [merchant]);

  const fetchPendingRefunds = async () => {
    console.log("开始调用 fetchPendingRefunds...");
    setLoading(true);
    setErrorMsg(null);
    
    try {
      if (!merchant || !merchant.id) {
        throw new Error("商户信息缺失，无法获取数据");
      }

      console.log(`正在请求接口: /api/merchants/${merchant.id}/pending-refunds`);
      const data = await merchantOrderService.getPendingRefunds(merchant.id);
      
      console.log("API返回原始数据:", data);

      // 兼容性处理：适配不同的后端返回结构
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.orders)) {
        // 修复点：适配 { count: 1, orders: [...] } 结构
        list = data.orders;
      } else if (data && Array.isArray(data.content)) {
        list = data.content; // Spring Page
      } else if (data && Array.isArray(data.data)) {
        list = data.data; // Result Wrapper
      } else {
        console.warn("数据格式未能识别，默认为空数组", data);
      }
      
      console.log("最终解析列表长度:", list.length);
      setRefunds(list);
    } catch (error) {
      console.error("加载退款列表出错:", error);
      setErrorMsg(error.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理同意退款
  const handleApprove = async (orderId) => {
    if (!confirm(`确认同意订单 #${orderId} 的退款申请吗？`)) return;
    try {
      await merchantOrderService.auditRefund(merchant.id, orderId, true, null);
      alert("已同意退款");
      fetchPendingRefunds(); 
    } catch (error) {
      alert("操作失败: " + error.message);
    }
  };

  // 打开拒绝模态框
  const openRejectModal = (orderId) => {
    setCurrentOrderId(orderId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // 提交拒绝
  const handleSubmitReject = async () => {
    if (!rejectReason.trim()) {
      alert("请填写拒绝理由");
      return;
    }
    try {
      await merchantOrderService.auditRefund(merchant.id, currentOrderId, false, rejectReason);
      alert("已拒绝退款申请");
      setShowRejectModal(false);
      fetchPendingRefunds();
    } catch (error) {
      alert("操作失败: " + error.message);
    }
  };

  // 格式化时间
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  // 格式化菜品列表显示
  const formatOrderItems = (items) => {
    if (!items || items.length === 0) return "无商品信息";
    return items.map(item => `${item.menuItemName} x${item.quantity}`).join(', ');
  };

  // --- 状态保护 ---
  if (!merchant) {
    return <div className="p-10 text-center text-gray-500">正在初始化商户信息...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#fcfaf8] animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto p-8 lg:px-12">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-8">
          
          {/* Page Heading & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-[32px] font-bold tracking-tight text-[#1c130d] dark:text-white">退款审批</h1>
              {refunds.length > 0 && (
                <div className="flex h-7 items-center justify-center rounded-full bg-red-500 px-3 shadow-sm shadow-red-200">
                  <p className="text-white text-xs font-bold leading-normal">{refunds.length} 待处理</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={fetchPendingRefunds}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8d9ce] rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                刷新列表
              </button>
            </div>
          </div>

          {/* --- 错误提示区 --- */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              <div>
                <p className="font-bold">数据加载失败</p>
                <p className="text-sm">{errorMsg}</p>
              </div>
              <button onClick={fetchPendingRefunds} className="ml-auto text-sm underline hover:text-red-800">重试</button>
            </div>
          )}

          {/* Request List */}
          <div className="flex flex-col gap-5">
            {loading ? (
              <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p>正在加载待处理退款...</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <span className="material-symbols-outlined text-4xl text-gray-400">check_circle</span>
                </div>
                <h3 className="text-lg font-bold text-gray-700">暂无待处理退款</h3>
                <p className="text-gray-500 mt-1">目前没有需要处理的申请。</p>
              </div>
            ) : (
              refunds.map((order) => (
                <div key={order.orderId} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e8d9ce] overflow-hidden group hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-[#e8d9ce] bg-[#fcfaf8]/50 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[#1c130d]">订单号: {order.orderId}</span>
                      <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                      <span className="material-symbols-outlined text-[18px]">pending</span>
                      <span className="text-sm font-bold">申请退款中</span>
                    </div>
                  </div>
                  
                  {/* Body */}
                  <div className="p-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-start gap-2">
                        {/* 优先显示 cancelReason，其次是 AI 折扣原因，最后默认文案 */}
                        <h3 className="text-lg font-bold text-[#1c130d]">
                          退款原因: {order.cancelReason || order.aiDiscountReason || "用户申请退款 (未填写原因)"}
                        </h3>
                      </div>
                      <p className="text-gray-500 text-sm">
                        商品: {formatOrderItems(order.orderItems)}
                      </p>
                      
                      {order.isPaid && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            已支付 ({order.paymentMethod || '在线支付'})
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-start sm:items-end gap-1">
                      <span className="text-sm text-gray-500">退款金额</span>
                      <span className="text-xl font-bold font-display text-[#1c130d]">
                        ¥{order.totalAmount}
                      </span>
                    </div>
                  </div>
                  
                  {/* Footer Actions */}
                  <div className="px-6 py-4 bg-gray-50/50 flex justify-end gap-3">
                    <button 
                      onClick={() => openRejectModal(order.orderId)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-colors text-sm font-bold shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      拒绝
                    </button>
                    <button 
                      onClick={() => handleApprove(order.orderId)}
                      className="flex items-center gap-1 px-5 py-2 rounded-lg bg-orange-500 text-white hover:bg-[#e06a1d] transition-colors text-sm font-bold shadow-sm shadow-orange-200"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      同意
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#e8d9ce] flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-[#1c130d]">拒绝退款</h3>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">拒绝理由 <span className="text-red-500">*</span></label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full h-32 p-3 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm resize-none" 
                placeholder="请输入拒绝理由（必填）..."
              />
              <p className="text-xs text-gray-400 mt-2 text-right">{rejectReason.length}/200 字</p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button 
                onClick={handleSubmitReject}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-bold shadow-sm"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}