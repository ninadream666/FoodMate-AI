import React, { useState } from 'react';
import { checkStatsApis } from '../../utils/statsApiChecker.js';
import dashboardService from '../../services/admin/dashboardService.js';
import orderService from '../../services/admin/orderService.js';
import userService from '../../services/admin/userService.js';
import merchantService from '../../services/admin/merchantService.js';

const StatsTestPage = () => {
    const [testResults, setTestResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [directTestResults, setDirectTestResults] = useState({});
    
    // 弹窗状态
    const [showGuide, setShowGuide] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showManualResult, setShowManualResult] = useState({ isOpen: false, data: null, title: '' });
    const [hintDialog, setHintDialog] = useState(false);

    // 运行完整检查
    const runFullCheck = async () => {
        setLoading(true);
        try {
            const results = await checkStatsApis();
            setTestResults(results);
            setShowReport(true); // 扫描完直接弹报告
        } catch (error) {
            setTestResults({ error: error.message, timestamp: new Date().toISOString() });
            setShowReport(true);
        } finally {
            setLoading(false);
        }
    };

    // 执行手动测试
    const testSingleApi = async (apiType, apiName) => {
        setDirectTestResults(prev => ({ ...prev, [apiType]: { loading: true } }));
        try {
            let result;
            if (apiType === 'dashboard') result = await dashboardService.getDashboardOverview();
            else if (apiType === 'orders') result = await orderService.getOrderStats();
            else if (apiType === 'users') result = await userService.getUserStats();
            else if (apiType === 'merchants') result = await merchantService.getAllMerchants({ page: 0, size: 1 });

            const successData = { success: true, data: result, timestamp: new Date().toLocaleString() };
            setDirectTestResults(prev => ({ ...prev, [apiType]: successData }));
            // 直接弹窗显示结果，不撑开卡片
            setShowManualResult({ isOpen: true, data: result, title: apiName });
        } catch (error) {
            const errorData = { success: false, error: error.message, timestamp: new Date().toLocaleString() };
            setDirectTestResults(prev => ({ ...prev, [apiType]: errorData }));
            setShowManualResult({ isOpen: true, data: error.message, title: `${apiName} - 测试失败`, isError: true });
        }
    };

    return (
        <div className="bg-transparent text-text-primary font-sans animate-in fade-in duration-500 min-h-screen">
            <div className="max-w-[1400px] mx-auto space-y-6 p-6 md:p-8">
                
                {/* 页面标题 - 统一风格 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">统计测试</h1>
                        <p className="text-text-secondary text-sm font-medium">诊断微服务统计接口可用性与数据协议完整性</p>
                    </div>
                    <div className="px-5 py-2 bg-surface border border-border-light rounded-full flex items-center gap-3 shadow-sm shrink-0">
                        <div className="size-2 bg-success rounded-full animate-ping"></div>
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Runtime: Dev-Docker v2.4</span>
                    </div>
                </div>

                {/* 选项卡导航 - 统一左对齐风格 */}
                <div className="border-b border-border-light mb-8">
                    <nav className="flex space-x-8">
                        <button className="py-3 px-1 border-b-[3px] border-primary text-text-primary font-bold text-sm transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-primary">hub</span>
                            API 深度诊断
                        </button>
                    </nav>
                </div>

                {/* --- 全链路扫描：横向控制台 --- */}
                <div className="bg-surface border border-border-light rounded-2xl p-6 shadow-sm overflow-hidden relative group">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex-1 space-y-3">
                            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-primary-soft text-primary rounded-md border border-primary/10">
                                <span className="material-symbols-outlined text-[14px]">rocket_launch</span>
                                <span className="text-[10px] font-black uppercase tracking-wider">Automated Suite</span>
                            </div>
                            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">全链路微服务健康监测</h2>
                            <p className="text-text-secondary text-sm font-medium max-w-2xl leading-relaxed">一次性对平台核心微服务进行协议握手，AI 诊断引擎将自动分析并生成修复建议。</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <button onClick={() => setShowGuide(true)} className="size-11 rounded-xl border border-border-light bg-surface text-text-tertiary hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center" title="排查指南">
                                <span className="material-symbols-outlined text-[24px]">help_outline</span>
                            </button>
                            <button onClick={() => testResults ? setShowReport(true) : setHintDialog(true)} className={`size-11 rounded-xl border border-border-light bg-surface flex items-center justify-center transition-all ${testResults ? 'text-primary border-primary/20' : 'text-text-tertiary'}`} title="查看最近报告">
                                <span className="material-symbols-outlined text-[24px]">summarize</span>
                            </button>
                            <button onClick={runFullCheck} disabled={loading} className="h-12 px-8 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-primary flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                                {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">sensors</span>}
                                {loading ? '扫描中...' : '启动健康检查'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- 手动测试：四宫格 --- */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black text-text-tertiary uppercase tracking-widest">组件化原子测试 (Manual)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { key: 'dashboard', name: '数据中枢 (8088)', icon: 'grid_view' },
                            { key: 'orders', name: '交易中心 (8084)', icon: 'shopping_bag' },
                            { key: 'users', name: '账户审计 (8083)', icon: 'admin_panel_settings' },
                            { key: 'merchants', name: '商户资源 (8081)', icon: 'add_business' }
                        ].map(api => (
                            <div key={api.key} className="bg-surface border border-border-light rounded-2xl p-6 hover:shadow-card hover:border-primary/20 transition-all group">
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="size-12 bg-background-section text-text-tertiary rounded-xl flex items-center justify-center group-hover:bg-primary-soft group-hover:text-primary transition-all">
                                        <span className="material-symbols-outlined text-[28px]">{api.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-base font-extrabold text-text-primary tracking-tight">{api.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-2 w-full pt-2">
                                        <button
                                            onClick={() => testSingleApi(api.key, api.name)}
                                            disabled={directTestResults[api.key]?.loading}
                                            className="flex-1 h-9 bg-background-section text-text-primary border border-border-light rounded-lg text-[11px] font-black uppercase hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {directTestResults[api.key]?.loading ? '握手中' : '执行测试'}
                                        </button>
                                        {directTestResults[api.key]?.success && (
                                            <button 
                                                onClick={() => setShowManualResult({ isOpen: true, data: directTestResults[api.key].data, title: api.name })}
                                                className="size-9 bg-success-bg text-success border border-success/20 rounded-lg flex items-center justify-center hover:bg-success hover:text-white transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- 结果弹窗：手动测试详情 --- */}
            {showManualResult.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border-light animate-in zoom-in-95">
                        <div className="p-6 border-b border-divider flex justify-between items-center bg-background-section">
                            <div className="flex items-center gap-3">
                                <span className={`material-symbols-outlined ${showManualResult.isError ? 'text-error' : 'text-success'} text-2xl`}>
                                    {showManualResult.isError ? 'warning' : 'verified'}
                                </span>
                                <h3 className="text-lg font-extrabold text-text-primary">{showManualResult.title} - 响应详情</h3>
                            </div>
                            <button onClick={() => setShowManualResult({ ...showManualResult, isOpen: false })} className="size-8 rounded-full hover:bg-white flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 bg-background">
                            <div className="bg-surface rounded-xl border border-border-light p-4 shadow-inner">
                                <pre className="text-[12px] font-mono text-text-secondary overflow-auto max-h-[50vh] leading-relaxed custom-scrollbar">
                                    {JSON.stringify(showManualResult.data, null, 2)}
                                </pre>
                            </div>
                        </div>
                        <div className="p-4 bg-background-section border-t border-divider flex justify-end">
                            <button onClick={() => setShowManualResult({ ...showManualResult, isOpen: false })} className="px-6 py-2 bg-text-primary text-white rounded-xl text-xs font-black uppercase">确定</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 弹窗1：排障手册 --- */}
            {showGuide && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-overlay backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-surface rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-border-light animate-in zoom-in-95">
                        <div className="p-8 border-b border-divider flex justify-between items-center bg-background-section">
                            <div className="flex items-center gap-4">
                                <div className="size-12 bg-primary-soft rounded-2xl flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-primary text-3xl">menu_book</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-text-primary tracking-tight">系统工程师排障指南</h3>
                                    <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.2em] mt-0.5">Microservice Diagnostic Manual</p>
                                </div>
                            </div>
                            <button onClick={() => setShowGuide(false)} className="size-10 rounded-full hover:bg-white flex items-center justify-center transition-all hover:rotate-90">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 bg-background">
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { 
                                        step: '01', 
                                        title: '检查 API 网关与路由映射', 
                                        desc: '确认 Vite Proxy 或 Nginx 配置是否正确转发 /api 路径。若返回 HTML 或 404，通常是代理拦截失效。',
                                        icon: 'router',
                                        color: 'text-info',
                                        bg: 'bg-info-bg'
                                    },
                                    { 
                                        step: '02', 
                                        title: '认证有效性与 JWT 审计', 
                                        desc: '验证 Authorization 令牌。若请求被 403 Forbidden 拦截，请确认 Token 格式及用户角色的管理员权限。',
                                        icon: 'security',
                                        color: 'text-warning',
                                        bg: 'bg-warning-bg'
                                    },
                                    { 
                                        step: '03', 
                                        title: '微服务容器健康状态 (Docker)', 
                                        desc: '执行控制台指令确认营销、订单等容器是否正常 Up。检查 Docker 内部网络联通性。',
                                        icon: 'terminal',
                                        color: 'text-primary',
                                        bg: 'bg-primary-soft',
                                        cmd: 'docker ps'
                                    },
                                    { 
                                        step: '04', 
                                        title: '数据契约与协议兼容性', 
                                        desc: '对比后端 PageResponse 模型。若返回成功但显示为空，请确认 JSON 字段名（如 content/data）与前端映射逻辑一致。',
                                        icon: 'schema',
                                        color: 'text-success',
                                        bg: 'bg-success-bg'
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-5 p-5 rounded-2xl bg-surface border border-border-light hover:border-primary/20 transition-all group">
                                        <div className={`size-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                                            <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                        </div>
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-black text-text-primary tracking-tight">{item.title}</h4>
                                                <span className="text-[10px] font-black text-text-tertiary opacity-40">STP-{item.step}</span>
                                            </div>
                                            <p className="text-xs text-text-secondary leading-relaxed font-medium opacity-80">
                                                {item.desc}
                                            </p>
                                            {item.cmd && (
                                                <div className="flex mt-2.5">
                                                    <code className="px-2.5 py-1 bg-background-section rounded-md text-[10px] font-mono text-primary border border-primary/10 select-all">
                                                        $ {item.cmd}
                                                    </code>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="px-8 py-5 bg-background-section border-t border-divider flex justify-end">
                            <button 
                                onClick={() => setShowGuide(false)}
                                className="px-8 py-3 bg-text-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-95 shadow-lg active:scale-[0.98] transition-all"
                            >
                                了解并继续
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 扫描报告逻辑保持 --- */}
            {showReport && testResults && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-overlay backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-surface rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden border border-border-light animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                        <div className="p-8 border-b border-divider flex justify-between items-center bg-surface">
                            <div className="flex items-center gap-4">
                                <div className="size-14 bg-success-bg text-success rounded-2xl flex items-center justify-center"><span className="material-symbols-outlined text-3xl">verified</span></div>
                                <h3 className="text-2xl font-black text-text-primary">全链路审计报告</h3>
                            </div>
                            <button onClick={() => setShowReport(false)} className="size-10 rounded-full hover:bg-background-section flex items-center justify-center border border-border-light"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-background-section p-5 rounded-2xl border border-border-light text-center">
                                    <p className="text-[10px] font-black text-text-tertiary uppercase mb-1">测试项</p>
                                    <p className="text-3xl font-black text-text-primary">{testResults.summary?.total || 0}</p>
                                </div>
                                <div className="bg-success-bg p-5 rounded-2xl border border-success/10 text-center">
                                    <p className="text-[10px] font-black text-success uppercase mb-1">通过</p>
                                    <p className="text-3xl font-black text-success">{testResults.summary?.success || 0}</p>
                                </div>
                                <div className="bg-error-bg p-5 rounded-2xl border border-error/10 text-center">
                                    <p className="text-[10px] font-black text-error uppercase mb-1">异常</p>
                                    <p className="text-3xl font-black text-error">{testResults.summary?.failed || 0}</p>
                                </div>
                            </div>
                            {testResults.details && Object.entries(testResults.details).map(([service, details]) => (
                                <div key={service} className="bg-background-section border border-border-light rounded-2xl overflow-hidden">
                                    <div className="px-5 py-3 flex items-center justify-between border-b border-border-light/50 bg-white/40">
                                        <span className="text-sm font-black text-text-primary capitalize">{service} Backend</span>
                                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase ${details.status === 'success' ? 'bg-success text-white' : 'bg-error text-white'}`}>{details.status}</span>
                                    </div>
                                    <pre className="p-5 text-[11px] font-mono text-text-secondary overflow-auto max-h-40 leading-relaxed">{JSON.stringify(details.data || details.error, null, 2)}</pre>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {hintDialog && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-overlay/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center border border-border-light animate-in zoom-in-95">
                        <div className="size-16 bg-info-bg text-info rounded-full flex items-center justify-center mx-auto mb-4"><span className="material-symbols-outlined text-4xl">history_toggle_off</span></div>
                        <h3 className="text-xl font-black text-text-primary mb-2">暂无报告</h3>
                        <p className="text-text-secondary text-xs font-medium mb-6">请先点击执行上方的全链路健康扫描。</p>
                        <button onClick={() => setHintDialog(false)} className="w-full py-3 bg-primary text-white rounded-xl text-sm font-black uppercase shadow-primary">确认</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsTestPage;