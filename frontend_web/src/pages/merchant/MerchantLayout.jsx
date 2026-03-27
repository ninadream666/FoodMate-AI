import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { merchantService } from '../../services/merchantService';
import MerchantSidebar from '../../components/merchant/MerchantSidebar';
import MerchantHeader from '../../components/merchant/MerchantHeader';

/**
 * 商家端专用布局 (组件化重构版)
 */
export default function MerchantLayout() {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  // 从 localStorage 读取当前用户信息
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // 简单的权限检查
    const userRole = user.role ? user.role.toUpperCase() : '';
    
    if (userRole !== 'MERCHANT' && userRole !== 'ADMIN') {
      console.warn('权限不足，当前角色:', user.role);
      alert("无权访问商家后台");
      navigate('/home');
      return;
    }
    
    fetchMerchantInfo();
  }, []);

  const fetchMerchantInfo = async () => {
    try {
      const data = await merchantService.getMyMerchant();
      setMerchant(data);
      setLoading(false);
    } catch (error) {
      console.error("加载商铺信息失败:", error);
      
      // 如果后端返回特定错误码表示"没有商铺"，则跳转到入驻页
      if (error.message === 'MERCHANT_NOT_FOUND') {
        console.log("检测到未入驻商家，跳转至入驻向导...");
        navigate('/merchant-onboarding', { replace: true });
        return;
      }
      
      // 其他错误（如网络问题），也停止 Loading，以免白屏
      setLoading(false); 
      // 可以选择在这里 alert 错误，或者显示错误 UI
      alert("无法加载店铺信息，请检查网络或重新登录。");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-nordic-gradient">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-sm">加载商家工作台...</p>
        </div>
      </div>
    );
  }

  // 如果加载完了但没有 merchant 信息（且不是因为要去 onboarding），
  // 说明发生了其他错误，此时不应该渲染 Layout，以免子组件报错
  if (!merchant) {
    return (
      <div className="flex h-screen items-center justify-center bg-nordic-gradient flex-col gap-4">
        <p className="text-text-secondary">无法加载店铺信息。</p>
        <button onClick={() => window.location.reload()} className="text-primary underline">重试</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-nordic-gradient font-sans text-text-primary antialiased overflow-hidden">
      
      {/* 侧边栏组件 */}
      <MerchantSidebar user={user} />

      {/* 主内容区域 */}
      <div className="flex flex-col flex-1 h-full min-w-0 bg-transparent">
        {/* 顶部栏组件 */}
        <MerchantHeader merchant={merchant} />

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-hide">
          <Outlet context={{ merchant }} />
        </main>
      </div>
    </div>
  );
}