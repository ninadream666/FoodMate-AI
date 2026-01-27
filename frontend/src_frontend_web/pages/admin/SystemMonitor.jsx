import React, { useState } from 'react';

// --- 子组件: 左侧设置分类切换 ---
const SettingCategory = ({ id, icon, title, desc, selected, onChange }) => (
    <label className="cursor-pointer group block">
        <input
            checked={selected}
            className="peer sr-only"
            name="settings_nav"
            type="radio"
            onChange={() => onChange(id)}
        />
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#e7dbcf] bg-white transition-all peer-checked:border-[#ee8c2b] peer-checked:shadow-md peer-checked:shadow-orange-100 peer-checked:ring-1 peer-checked:ring-[#ee8c2b]">
            <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${selected ? 'bg-[#ee8c2b] text-white' : 'bg-gray-100 text-gray-500'}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-[#1b140d]">{title}</p>
                <p className="text-xs text-[#9a734c]">{desc}</p>
            </div>
            <div className={`size-2 rounded-full bg-[#ee8c2b] transition-opacity ${selected ? 'opacity-100' : 'opacity-0'}`}></div>
        </div>
    </label>
);

const SystemSettings = () => {
    const [activeCategory, setActiveCategory] = useState('general');

    return (
        <div className="min-h-screen bg-[#f8f7f6] text-[#1b140d] font-['Inter']">
            <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-8">
                {/* 页面标题 */}
                <div className="bg-white rounded-xl shadow-sm border border-[#e7dbcf] p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1b140d] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#ee8c2b] text-3xl">settings</span>
                                系统设置
                            </h1>
                            <p className="text-[#9a734c] text-sm">管理平台配置和系统参数</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 h-10 px-4 bg-white border border-[#e7dbcf] rounded-lg text-[#1b140d] text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
                                <span className="material-symbols-outlined text-lg">history</span>
                                <span>变更记录</span>
                            </button>
                            <button className="flex items-center gap-2 h-10 px-4 bg-[#ee8c2b] text-white rounded-lg text-sm font-medium hover:bg-[#d97b1e] shadow-sm transition-colors">
                                <span className="material-symbols-outlined text-lg">save</span>
                                <span>保存设置</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 设置内容 */}
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* 平台基础信息 */}
                    <section className="bg-white rounded-xl shadow-sm border border-[#e7dbcf] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#e7dbcf] bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#ee8c2b] rounded-lg">
                                    <span className="material-symbols-outlined text-white text-xl">business</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#1b140d]">平台信息</h3>
                                    <p className="text-sm text-[#9a734c]">基础信息和品牌设置</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid gap-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-shrink-0">
                                        <label className="block text-sm font-medium text-[#1b140d] mb-2">平台 Logo</label>
                                        <div className="relative group cursor-pointer w-24 h-24 rounded-xl border-2 border-dashed border-[#e7dbcf] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-[#9a734c] hover:border-[#ee8c2b] transition-colors">
                                            <span className="material-symbols-outlined text-3xl">image</span>
                                            <div className="absolute inset-0 bg-[#ee8c2b]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                <span className="text-white text-xs font-medium">更换</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[#9a734c] mt-2">最大 2MB<br />支持 PNG/SVG</p>
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-[#1b140d] mb-2">平台名称</label>
                                            <input className="w-full px-4 py-3 rounded-lg border border-[#e7dbcf] bg-gray-50 text-sm focus:border-[#ee8c2b] focus:ring-2 focus:ring-[#ee8c2b]/20 focus:bg-white transition-all" defaultValue="智惠外卖配送" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[#1b140d] mb-2">管理员邮箱</label>
                                            <input className="w-full px-4 py-3 rounded-lg border border-[#e7dbcf] bg-gray-50 text-sm focus:border-[#ee8c2b] focus:ring-2 focus:ring-[#ee8c2b]/20 focus:bg-white transition-all" defaultValue="admin@zh-eats.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[#1b140d] mb-2">客服电话</label>
                                            <input className="w-full px-4 py-3 rounded-lg border border-[#e7dbcf] bg-gray-50 text-sm focus:border-[#ee8c2b] focus:ring-2 focus:ring-[#ee8c2b]/20 focus:bg-white transition-all" defaultValue="400-000-0000" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-[#1b140d] mb-2">品牌标语</label>
                                            <input className="w-full px-4 py-3 rounded-lg border border-[#e7dbcf] bg-gray-50 text-sm focus:border-[#ee8c2b] focus:ring-2 focus:ring-[#ee8c2b]/20 focus:bg-white transition-all" defaultValue="为您派送每一份幸福。" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 运营参数 */}
                    <section className="bg-white rounded-xl shadow-sm border border-[#e7dbcf] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#e7dbcf] bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <span className="material-symbols-outlined text-white text-xl">tune</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#1b140d]">运营参数</h3>
                                    <p className="text-sm text-[#9a734c]">系统运行配置和业务规则</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#1b140d] mb-2">默认币种</label>
                                    <select className="w-full px-4 py-3 rounded-lg border border-[#e7dbcf] bg-gray-50 text-sm focus:border-[#ee8c2b] focus:ring-2 focus:ring-[#ee8c2b]/20 focus:bg-white transition-all">
                                        <option>人民币 (¥)</option>
                                        <option>美元 ($)</option>
                                        <option>欧元 (€)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-md font-semibold text-[#1b140d] mb-4">系统开关</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-[#1b140d]">订单自动派发</span>
                                            <span className="text-xs text-[#9a734c]">根据距离自动指派最近的配送员</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input defaultChecked className="sr-only peer" type="checkbox" />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ee8c2b]"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-[#1b140d]">维护模式</span>
                                            <span className="text-xs text-[#9a734c]">暂时禁止用户端访问应用</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input className="sr-only peer" type="checkbox" />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 系统环境 */}
                    <section className="bg-white rounded-xl shadow-sm border border-[#e7dbcf] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#e7dbcf] bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                        <span className="material-symbols-outlined text-white text-xl">monitor</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#1b140d]">系统环境</h3>
                                        <p className="text-sm text-[#9a734c]">运行环境和版本信息</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-[#ee8c2b] text-white text-sm font-medium rounded-lg hover:bg-[#d97b1e] transition-colors">
                                    检查更新
                                </button>
                            </div>
                        </div>
                        <div className="overflow-hidden">
                            <div className="divide-y divide-gray-100">
                                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-[#1b140d]">服务器时区</p>
                                            <p className="text-sm text-[#9a734c]">UTC+8 (北京时间)</p>
                                        </div>
                                    </div>
                                    <button className="text-[#ee8c2b] text-sm font-medium hover:underline">编辑</button>
                                </div>
                                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-[#1b140d]">应用版本</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">v2.4.0</span>
                                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">稳定版</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-[#ee8c2b] text-sm font-medium hover:underline">查看日志</button>
                                </div>
                                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-[#1b140d]">API 访问限制</p>
                                            <p className="text-sm text-[#9a734c]">1000 次/分钟</p>
                                        </div>
                                    </div>
                                    <button className="text-[#ee8c2b] text-sm font-medium hover:underline">配置</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;