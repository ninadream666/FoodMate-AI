import React, { useState } from 'react';

// --- 子组件: 横向Tab选项卡 ---
const SettingTab = ({ id, icon, title, selected, onChange }) => (
    <button
        onClick={() => onChange(id)}
        className={`py-3 px-1 border-b-[3px] font-bold text-sm transition-colors flex items-center gap-2 ${
            selected
            ? 'border-primary text-text-primary'
            : 'border-transparent text-text-secondary hover:text-primary hover:border-primary/30'
        }`}
    >
        <span className={`material-symbols-outlined text-[18px] ${selected ? 'text-primary' : 'text-text-tertiary'}`}>
            {icon}
        </span>
        {title}
    </button>
);

const SystemSettings = () => {
    const [activeCategory, setActiveCategory] = useState('general');

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500 min-h-screen">
            <div className="max-w-[1400px] mx-auto space-y-6 p-6 md:p-8">
                
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">系统设置</h1>
                        <p className="text-text-secondary text-sm font-medium">管理平台基础配置、运营参数及系统运行状态</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 h-10 px-4 bg-surface border border-border-light rounded-xl text-text-secondary text-sm font-bold hover:bg-surface-hover hover:text-primary shadow-sm transition-all active:scale-95">
                            <span className="material-symbols-outlined text-[18px]">history</span>
                            <span>变更记录</span>
                        </button>
                        <button className="flex items-center gap-2 h-10 px-5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-primary transition-all active:scale-95">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            <span>保存设置</span>
                        </button>
                    </div>
                </div>

                {/* 选项卡导航 */}
                <div className="border-b border-border-light mb-6">
                    <nav className="flex space-x-8">
                        <SettingTab 
                            id="general" 
                            icon="business" 
                            title="平台基础信息" 
                            selected={activeCategory === 'general'} 
                            onChange={setActiveCategory} 
                        />
                        <SettingTab 
                            id="operations" 
                            icon="tune" 
                            title="核心运营参数" 
                            selected={activeCategory === 'operations'} 
                            onChange={setActiveCategory} 
                        />
                        <SettingTab 
                            id="environment" 
                            icon="monitor" 
                            title="系统运行环境" 
                            selected={activeCategory === 'environment'} 
                            onChange={setActiveCategory} 
                        />
                    </nav>
                </div>

                {/* 内容区域 */}
                <div className="w-full">
                    {activeCategory === 'general' && (
                        <section className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="px-6 py-5 border-b border-border-light bg-background-section flex items-center gap-3">
                                <div className="p-2 bg-primary-soft text-primary rounded-xl">
                                    <span className="material-symbols-outlined text-xl">business</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-text-primary tracking-tight">平台标识与品牌</h3>
                                    <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-widest">Base Identity & Branding</p>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="max-w-5xl flex flex-col md:flex-row gap-12">
                                    <div className="flex-shrink-0 flex flex-col items-center">
                                        <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-4">平台标识 (Logo)</label>
                                        <div className="relative group cursor-pointer w-32 h-32 rounded-2xl border-2 border-dashed border-border-light bg-background-section flex items-center justify-center text-text-tertiary hover:border-primary hover:bg-primary-soft transition-all overflow-hidden shadow-inner">
                                            <span className="material-symbols-outlined text-3xl">image</span>
                                            <div className="absolute inset-0 bg-primary/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-white mb-1">upload_file</span>
                                                <span className="text-white text-[10px] font-black uppercase">上传新图</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-1.5">平台名称</label>
                                            <input className="w-full h-11 px-4 rounded-xl bg-background-section border border-transparent focus:border-border-light focus:bg-surface text-sm font-bold text-text-primary outline-none transition-all" defaultValue="FooMate-AI" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-1.5">管理员邮箱</label>
                                            <input className="w-full h-11 px-4 rounded-xl bg-background-section border border-transparent focus:border-border-light focus:bg-surface text-sm font-bold text-text-primary outline-none transition-all" defaultValue="admin@foomate-ai.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-1.5">客服电话</label>
                                            <input className="w-full h-11 px-4 rounded-xl bg-background-section border border-transparent focus:border-border-light focus:bg-surface text-sm font-bold text-text-primary outline-none transition-all" defaultValue="400-000-0000" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-1.5">品牌标语</label>
                                            <input className="w-full h-11 px-4 rounded-xl bg-background-section border border-transparent focus:border-border-light focus:bg-surface text-sm font-bold text-text-primary outline-none transition-all" defaultValue="为您派送每一份幸福。" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeCategory === 'operations' && (
                        <section className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="px-6 py-5 border-b border-border-light bg-background-section flex items-center gap-3">
                                <div className="p-2 bg-info-bg text-info rounded-xl">
                                    <span className="material-symbols-outlined text-xl">tune</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-text-primary tracking-tight">运营逻辑设置</h3>
                                    <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-widest">Business Logic & Rules</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div>
                                    <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-3">默认结算币种</label>
                                    <select className="w-full md:w-1/3 h-11 px-4 rounded-xl bg-background-section border border-transparent focus:border-border-light text-sm font-bold text-text-primary outline-none cursor-pointer">
                                        <option>人民币 (¥) - CNY</option>
                                        <option>美元 ($) - USD</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-4 bg-background-section rounded-2xl border border-transparent hover:border-border-light transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-extrabold text-text-primary">订单自动派发</span>
                                            <span className="text-xs text-text-tertiary font-medium">利用 AI 调度引擎自动指派配送员</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input defaultChecked className="sr-only peer" type="checkbox" />
                                            <div className="w-11 h-6 bg-text-disabled rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-background-section rounded-2xl border border-transparent hover:border-border-light transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-extrabold text-text-primary">系统维护模式</span>
                                            <span className="text-xs text-text-tertiary font-medium">临时暂停用户端 API 访问</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input className="sr-only peer" type="checkbox" />
                                            <div className="w-11 h-6 bg-text-disabled rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-error"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeCategory === 'environment' && (
                        <section className="bg-surface rounded-2xl shadow-sm border border-border-light overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="px-6 py-5 border-b border-border-light bg-background-section flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-success-bg text-success rounded-xl">
                                        <span className="material-symbols-outlined text-xl">monitor</span>
                                    </div>
                                    <h3 className="text-base font-extrabold text-text-primary tracking-tight">系统环境指标</h3>
                                </div>
                                <button className="px-4 py-2 bg-primary-soft text-primary text-xs font-black uppercase rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">检查系统更新</button>
                            </div>
                            <div className="divide-y divide-divider">
                                <div className="px-6 py-4 flex items-center justify-between hover:bg-surface-hover">
                                    <div className="flex items-center gap-3">
                                        <div className="size-2 bg-success rounded-full animate-pulse"></div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">服务器时区</p>
                                            <p className="text-xs text-text-tertiary font-medium">UTC+8 (Asia/Shanghai)</p>
                                        </div>
                                    </div>
                                    <button className="text-primary text-xs font-black uppercase hover:underline">配置</button>
                                </div>
                                <div className="px-6 py-4 flex items-center justify-between hover:bg-surface-hover">
                                    <div className="flex items-center gap-3">
                                        <div className="size-2 bg-info rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">应用版本 (Stable)</p>
                                            <p className="text-xs text-text-tertiary font-medium">v2.4.0-Final (Build 20241230)</p>
                                        </div>
                                    </div>
                                    <button className="text-primary text-xs font-black uppercase hover:underline">查看日志</button>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;