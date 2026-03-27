import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { merchantOrderService } from '../../services/merchantOrderService';

/**
 * 商家端 - 退款审批页面
 * 已重构：全面注入北欧风主题、自定义弹窗
 */
export default function RefundAudit() {
  const { merchant } = useOutletContext();
  
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [errorMsg, setErrorMsg] = useState(null); 

  // 拒绝模态框状态
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 全局定制化弹窗状态
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm'
    message: '',
    onConfirm: null
  });

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

  // 弹窗辅助函数
  const showConfirm = (message, onConfirmCallback) => {
    setDialog({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
  };

  const showAlert = (message) => {
    setDialog({ isOpen: true, type: 'alert', message, onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) });
  };

  // 处理同意退款
  const handleApprove = (orderId) => {
    showConfirm(`确认同意订单 #${orderId} 的退款申请吗？退款金额将原路退回。`, async () => {
      setDialog(prev => ({ ...prev, isOpen: false }));
      try {
        await merchantOrderService.auditRefund(merchant.id, orderId, true, null);
        showAlert("已同意退款");
        fetchPendingRefunds(); 
      } catch (error) {
        showAlert("操作失败: " + error.message);
      }
    });
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
      showAlert("请填写拒绝理由");
      return;
    }
    try {
      await merchantOrderService.auditRefund(merchant.id, currentOrderId, false, rejectReason);
      showAlert("已拒绝退款申请");
      setShowRejectModal(false);
      fetchPendingRefunds();
    } catch (error) {
      showAlert("操作失败: " + error.message);
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
    return <div className="p-10 text-center text-text-tertiary">正在初始化商户信息...</div>;
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto p-8 lg:px-12">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-8">
          
          {/* Page Heading & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-[32px] font-extrabold tracking-tight text-text-primary">退款审批</h1>
              {refunds.length > 0 && (
                <div className="flex h-7 items-center justify-center rounded-full bg-error px-3 shadow-sm shadow-error/20">
                  <p className="text-white text-xs font-bold leading-normal">{refunds.length} 待处理</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={fetchPendingRefunds}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-light rounded-xl text-sm font-bold text-text-secondary shadow-sm hover:bg-surface-hover transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                刷新列表
              </button>
            </div>
          </div>

          {/* --- 错误提示区 --- */}
          {errorMsg && (
            <div className="bg-error-bg border border-error/20 text-error p-4 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              <div>
                <p className="font-bold">数据加载失败</p>
                <p className="text-sm">{errorMsg}</p>
              </div>
              <button onClick={fetchPendingRefunds} className="ml-auto text-sm font-bold underline hover:opacity-80">重试</button>
            </div>
          )}

          {/* Request List */}
          <div className="flex flex-col gap-5">
            {loading ? (
              <div className="text-center py-20 text-text-tertiary flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>正在加载待处理退款...</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-dashed border-border-light rounded-2xl">
                <div className="bg-background-section rounded-full p-6 mb-4">
                  <span className="material-symbols-outlined text-4xl text-text-disabled">check_circle</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary">暂无待处理退款</h3>
                <p className="text-text-secondary mt-1">目前没有需要处理的申请。</p>
              </div>
            ) : (
              refunds.map((order) => (
                <div key={order.orderId} className="bg-surface rounded-xl border border-border-light overflow-hidden group hover:shadow-card transition-shadow">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-border-light bg-background-section flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-text-primary">订单号: {order.orderId}</span>
                      <span className="text-sm text-text-secondary">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-warning">
                      <span className="material-symbols-outlined text-[18px]">pending</span>
                      <span className="text-sm font-bold">申请退款中</span>
                    </div>
                  </div>
                  
                  {/* Body */}
                  <div className="p-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-start gap-2">
                        <h3 className="text-lg font-bold text-text-primary">
                          退款原因: {order.cancelReason || order.aiDiscountReason || "用户申请退款 (未填写原因)"}
                        </h3>
                      </div>
                      <p className="text-text-secondary text-sm">
                        商品: {formatOrderItems(order.orderItems)}
                      </p>
                      
                      {order.isPaid && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary bg-background px-2.5 py-1 rounded-md border border-border-light">
                            已支付 ({order.paymentMethod || '在线支付'})
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-start sm:items-end gap-1">
                      <span className="text-sm text-text-secondary">退款金额</span>
                      <span className="text-2xl font-black font-display text-text-primary">
                        ¥{order.totalAmount}
                      </span>
                    </div>
                  </div>
                  
                  {/* Footer Actions */}
                  <div className="px-6 py-4 bg-background border-t border-border-light flex justify-end gap-3">
                    <button 
                      onClick={() => openRejectModal(order.orderId)}
                      className="flex items-center justify-center gap-1 px-5 py-2.5 rounded-xl border border-error/20 text-error bg-surface hover:bg-error-bg transition-colors text-sm font-bold shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      拒绝
                    </button>
                    <button 
                      onClick={() => handleApprove(order.orderId)}
                      className="flex items-center justify-center gap-1 px-5 py-2.5 rounded-xl bg-primary text-white hover:opacity-90 transition-colors text-sm font-bold shadow-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      同意退款
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 定制化 Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
            <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-background-section">
              <h3 className="text-lg font-bold text-text-primary">拒绝退款</h3>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-bold mb-2 text-text-primary">拒绝理由 <span className="text-error">*</span></label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full h-32 p-3 rounded-xl border border-border-light bg-background focus:bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none transition-all text-text-primary" 
                placeholder="请输入拒绝理由（必填）..."
              />
              <p className="text-xs text-text-tertiary mt-2 text-right">{rejectReason.length}/200 字</p>
            </div>
            
            <div className="px-6 py-4 bg-background border-t border-border-light flex justify-end gap-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 rounded-xl text-text-secondary hover:bg-surface border border-border-light shadow-sm transition-colors text-sm font-bold"
              >
                取消
              </button>
              <button 
                onClick={handleSubmitReject}
                className="flex-1 py-2.5 rounded-xl bg-error text-white hover:opacity-90 transition-colors text-sm font-bold shadow-sm"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全局基础提示 Modal */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
            <div className="p-6 text-center">
              <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${
                dialog.type === 'confirm' ? 'bg-primary-soft text-primary' : 'bg-info-bg text-info'
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