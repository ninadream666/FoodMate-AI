import React from 'react';
import { useOutletContext } from 'react-router-dom';

/**
 * 商家端 - 店铺详情页面
 * 对应接口: GET /merchants/my (MerchantDto)
 */
export default function MerchantShopInfo() {
  const { merchant } = useOutletContext();

  if (!merchant) {
    return <div className="p-10 text-center text-text-tertiary">正在加载店铺信息...</div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto flex flex-col gap-8 pb-10 animate-in fade-in duration-300">
      
      {/* Hero Section */}
      <div className="relative w-full flex flex-col">
        {/* Cover Image (使用随机默认图，因为 DTO 里没有封面字段) */}
        <div 
          className="w-full h-64 rounded-2xl bg-center bg-cover bg-no-repeat relative overflow-hidden shadow-sm border border-border-light" 
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCEyZOFLvpSJQmhrieg5ITzRMw1rnbitSpU5r68a0fs9z66UkrV90dSuupbL5QJvPUAcXb_XvlfW9FqgKVa-zZ1hbFrpLcscc0HU1ETrKRLZLoe5bOTGLbwiPcrXi47iuHlCe4i4sXv7v3dr-17-i5pa4z0Eyu7tIGVhqyrgEe0T1jLiBWdStjNiWMJa_U4sOdSXPCwCPstFSIwb5qG1a0O_Amb0XCi022o_fabkotm0SawyY1drxMW9-_KsJ7-f-dRO4m4-dCUCvna")' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        
        {/* Shop Identity Overlay */}
        <div className="px-6 -mt-12 relative flex flex-col sm:flex-row items-start sm:items-end gap-5">
          <div className="w-32 h-32 rounded-full border-4 border-background bg-surface shadow-md flex items-center justify-center overflow-hidden">
             {/* Logo (DTO 无 Logo，使用图标代替) */}
             <span className="material-symbols-outlined text-6xl text-primary">storefront</span>
          </div>
          
          <div className="flex flex-col gap-1 pb-2 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-text-primary drop-shadow-sm sm:text-white sm:drop-shadow-md">
                {merchant.name || "未命名店铺"}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-bg text-success border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5"></span>
                营业中
              </span>
            </div>
            {/* 地址显示在 Header 区域 */}
            <div className="flex items-center gap-2 text-sm text-text-secondary sm:text-gray-200">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span>{merchant.address || "暂无地址信息"}</span>
            </div>
          </div>
          
          <button className="bg-primary hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-primary transition-all flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            编辑资料
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Basic Info */}
        <div className="bg-surface rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-card transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-text-primary">基本信息</h3>
          </div>
          <div className="flex flex-col gap-5">
            
            <InfoItem 
              icon="store" 
              label="店铺名称" 
              value={merchant.name} 
            />
            
            <InfoItem 
              icon="location_on" 
              label="店铺地址" 
              value={merchant.address} 
            />

            {/* DTO 包含 enableDynamicPricing */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-background-section flex items-center justify-center flex-shrink-0 text-text-secondary">
                <span className="material-symbols-outlined">price_change</span>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">动态定价</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-text-primary">
                    {merchant.enableDynamicPricing ? '已启用' : '未启用'}
                  </p>
                  {merchant.enableDynamicPricing && (
                    <span className="text-xs bg-success-bg text-success px-2 py-0.5 rounded font-bold">AI 托管中</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Card 2: Business Info */}
        <div className="bg-surface rounded-2xl p-6 border border-border-light shadow-sm hover:shadow-card transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-text-primary">经营信息</h3>
          </div>
          <div className="flex flex-col gap-5">
            
            <InfoItem 
              icon="fingerprint" 
              label="商户ID" 
              value={merchant.id} 
              mono 
            />
            
            <InfoItem 
              icon="badge" 
              label="店主ID" 
              value={merchant.ownerUserId} 
              mono 
            />

            <InfoItem 
              icon="verified_user" 
              label="认证状态" 
              value="已认证" 
              extra={<span className="material-symbols-outlined text-success text-sm ml-1">check_circle</span>}
            />

          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value, mono, extra }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-background-section flex items-center justify-center flex-shrink-0 text-text-secondary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-sm text-text-secondary mb-1">{label}</p>
        <div className="flex items-center">
          <p className={`text-base font-semibold text-text-primary ${mono ? 'font-mono text-sm' : ''}`}>
            {value || '未设置'}
          </p>
          {extra}
        </div>
      </div>
    </div>
  );
}