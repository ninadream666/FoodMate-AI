import React, { useState } from 'react';
import { runApiTests, testOrderService, testPlatformService, validateEndpoints, diagnoseNetwork } from '../../services/admin/apiTester';

/**
 * API测试面板
 */
const ApiTestPanel = () => {
    const [testResults, setTestResults] = useState(null);
    const [isTestRunning, setIsTestRunning] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // 运行完整API测试
    const handleRunFullTests = async () => {
        setIsTestRunning(true);
        try {
            const results = await runApiTests();
            setTestResults(results);
        } catch (error) {
            console.error('API测试失败:', error);
            setTestResults({ error: error.message });
        } finally {
            setIsTestRunning(false);
        }
    };

    // 运行订单服务测试
    const handleTestOrderService = async () => {
        setIsTestRunning(true);
        try {
            const results = await testOrderService();
            setTestResults({ orderService: results });
        } catch (error) {
            console.error('订单服务测试失败:', error);
            setTestResults({ error: error.message });
        } finally {
            setIsTestRunning(false);
        }
    };

    // 运行平台服务测试
    const handleTestPlatformService = async () => {
        setIsTestRunning(true);
        try {
            const results = await testPlatformService();
            setTestResults({ platformService: results });
        } catch (error) {
            console.error('平台服务测试失败:', error);
            setTestResults({ error: error.message });
        } finally {
            setIsTestRunning(false);
        }
    };

    // 验证API端点
    const handleValidateEndpoints = () => {
        const validation = validateEndpoints();
        setTestResults({ validation });
    };

    // 网络诊断
    const handleDiagnoseNetwork = async () => {
        setIsTestRunning(true);
        try {
            const diagnostics = await diagnoseNetwork();
            setTestResults({ diagnostics });
        } catch (error) {
            console.error('网络诊断失败:', error);
            setTestResults({ error: error.message });
        } finally {
            setIsTestRunning(false);
        }
    };

    const renderTestResults = () => {
        if (!testResults) return null;

        return (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-gray-800">测试结果</h4>
                <pre className="bg-white p-3 rounded border text-sm overflow-auto max-h-96">
                    {JSON.stringify(testResults, null, 2)}
                </pre>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">API 测试控制台</h3>
                    <p className="text-gray-600 mt-1">基于 api-tests.http 文件的接口测试工具</p>
                </div>
                {isTestRunning && (
                    <div className="flex items-center text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm">测试进行中...</span>
                    </div>
                )}
            </div>

            {/* 标签页导航 */}
            <div className="flex border-b border-gray-200 mb-6">
                {[
                    { key: 'overview', label: '概览', icon: '📊' },
                    { key: 'order', label: '订单服务', icon: '📦' },
                    { key: 'platform', label: '平台服务', icon: '🏢' },
                    { key: 'network', label: '网络诊断', icon: '🌐' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium ${activeTab === tab.key
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <span className="mr-1">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 概览标签页 */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h5 className="font-semibold text-blue-800 mb-2">🚀 完整API测试</h5>
                            <p className="text-blue-600 text-sm mb-3">测试所有订单和平台服务接口</p>
                            <button
                                onClick={handleRunFullTests}
                                disabled={isTestRunning}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                运行完整测试
                            </button>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <h5 className="font-semibold text-green-800 mb-2">🔍 端点验证</h5>
                            <p className="text-green-600 text-sm mb-3">验证API端点配置</p>
                            <button
                                onClick={handleValidateEndpoints}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                验证端点
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                        <h5 className="font-semibold text-yellow-800 mb-2">📋 API 端点总览</h5>
                        <div className="text-sm text-yellow-700 space-y-2">
                            <div><strong>订单服务 (8084):</strong> /api/admin/orders/* - 订单管理、统计、状态更新</div>
                            <div><strong>平台服务 (8088):</strong> /api/internal/commissions/* - 分成管理、结算数据</div>
                            <div><strong>营销服务 (8082):</strong> /api/coupons/* - 优惠券创建、发放、计算</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 订单服务标签页 */}
            {activeTab === 'order' && (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-semibold mb-2">📦 订单服务接口测试 (端口: 8084)</h5>
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div>• GET /api/admin/orders/stats - 订单统计数据</div>
                            <div>• GET /api/admin/orders/total-sales - 总销售额</div>
                            <div>• GET /api/admin/orders/today-count - 今日订单数</div>
                            <div>• GET /api/admin/orders/trends - 订单趋势(7天)</div>
                            <div>• GET /api/admin/orders/all - 获取所有订单(分页)</div>
                        </div>
                        <button
                            onClick={handleTestOrderService}
                            disabled={isTestRunning}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            测试订单服务
                        </button>
                    </div>
                </div>
            )}

            {/* 平台服务标签页 */}
            {activeTab === 'platform' && (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-semibold mb-2">🏢 平台服务接口测试 (端口: 8088)</h5>
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div>• GET /api/internal/commissions/order/{`{orderId}`} - 订单分成详情</div>
                            <div>• GET /api/merchant/commissions/summary/this-month - 本月分成汇总</div>
                            <div>• GET /api/merchant/commissions/summary - 指定时间范围分成汇总</div>
                        </div>
                        <button
                            onClick={handleTestPlatformService}
                            disabled={isTestRunning}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            测试平台服务
                        </button>
                    </div>
                </div>
            )}

            {/* 网络诊断标签页 */}
            {activeTab === 'network' && (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-semibold mb-2">🌐 网络连接诊断</h5>
                        <p className="text-gray-600 text-sm mb-4">
                            检查各个微服务的网络连接状态
                        </p>
                        <button
                            onClick={handleDiagnoseNetwork}
                            disabled={isTestRunning}
                            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                            开始网络诊断
                        </button>
                    </div>
                </div>
            )}

            {/* 测试结果显示 */}
            {renderTestResults()}
        </div>
    );
};

export default ApiTestPanel;