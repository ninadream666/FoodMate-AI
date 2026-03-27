import React, { useState } from 'react';
import { checkStatsApis } from '../../utils/statsApiChecker.js';
import dashboardService from '../../services/admin/dashboardService.js';
import orderService from '../../services/admin/orderService.js';
import userService from '../../services/admin/userService.js';
import merchantService from '../../services/admin/merchantService.js';

const StatsTestPage = () => {
    const [testResults, setTestResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedApi, setSelectedApi] = useState('all');
    const [directTestResults, setDirectTestResults] = useState({});

    // 运行完整的API检查
    const runFullCheck = async () => {
        setLoading(true);
        try {
            console.log('🚀 开始运行完整的统计API检查...');
            const results = await checkStatsApis();
            setTestResults(results);
            console.log('✅ API检查完成:', results);
        } catch (error) {
            console.error('❌ API检查失败:', error);
            setTestResults({
                error: '检查失败: ' + error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    // 直接测试单个API
    const testSingleApi = async (apiType) => {
        setDirectTestResults(prev => ({
            ...prev,
            [apiType]: { loading: true }
        }));

        try {
            let result;
            switch (apiType) {
                case 'dashboard':
                    result = await dashboardService.getDashboardOverview();
                    break;
                case 'orders':
                    result = await orderService.getOrderStats();
                    break;
                case 'users':
                    result = await userService.getUserStats();
                    break;
                case 'merchants':
                    result = await merchantService.getAllMerchants({ page: 0, size: 1 });
                    break;
                default:
                    throw new Error('未知的API类型');
            }

            setDirectTestResults(prev => ({
                ...prev,
                [apiType]: {
                    loading: false,
                    success: true,
                    data: result,
                    timestamp: new Date().toISOString()
                }
            }));
        } catch (error) {
            setDirectTestResults(prev => ({
                ...prev,
                [apiType]: {
                    loading: false,
                    success: false,
                    error: error.message,
                    httpStatus: error.response?.status,
                    timestamp: new Date().toISOString()
                }
            }));
        }
    };

    // 渲染测试结果
    const renderTestResult = (result) => {
        if (!result) return null;

        if (result.error) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 font-medium">错误</div>
                    <div className="text-red-600 text-sm mt-1">{result.error}</div>
                </div>
            );
        }

        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">测试结果</span>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>

                {result.summary && (
                    <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">总览</div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-2 rounded">
                                <div className="text-xs text-gray-500">总数</div>
                                <div className="font-bold">{result.summary.total}</div>
                            </div>
                            <div className="bg-green-50 p-2 rounded">
                                <div className="text-xs text-green-600">成功</div>
                                <div className="font-bold text-green-700">{result.summary.success}</div>
                            </div>
                            <div className="bg-red-50 p-2 rounded">
                                <div className="text-xs text-red-600">失败</div>
                                <div className="font-bold text-red-700">{result.summary.failed}</div>
                            </div>
                        </div>
                    </div>
                )}

                {result.details && (
                    <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700">详细结果</div>
                        {Object.entries(result.details).map(([service, details]) => (
                            <div key={service} className="border border-gray-100 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium capitalize">{service}</span>
                                    <span className={`px-2 py-1 rounded text-xs ${details.status === 'success'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {details.status}
                                    </span>
                                </div>

                                {details.data && (
                                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
                                        <pre>{JSON.stringify(details.data, null, 2)}</pre>
                                    </div>
                                )}

                                {details.error && (
                                    <div className="text-xs text-red-600 mt-1">{details.error}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {result.recommendations && result.recommendations.length > 0 && (
                    <div className="mt-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">建议</div>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {result.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    // 渲染单个API测试结果
    const renderSingleTestResult = (apiType, result) => {
        if (!result) return null;

        if (result.loading) {
            return <div className="text-blue-600">测试中...</div>;
        }

        if (result.success) {
            return (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="text-green-800 font-medium mb-2">✅ 成功</div>
                    <div className="text-xs text-gray-600 bg-white p-2 rounded overflow-auto max-h-32">
                        <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{result.timestamp}</div>
                </div>
            );
        }

        return (
            <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="text-red-800 font-medium mb-2">❌ 失败</div>
                <div className="text-red-600 text-sm">{result.error}</div>
                {result.httpStatus && (
                    <div className="text-red-500 text-xs mt-1">HTTP状态: {result.httpStatus}</div>
                )}
                <div className="text-xs text-gray-500 mt-2">{result.timestamp}</div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">统计数据API测试工具</h1>
                <p className="text-gray-600">用于检查平台各页面统计数据接口的可用性和响应</p>
            </div>

            {/* 快速完整检查 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium mb-4">完整API健康检查</h2>
                <button
                    onClick={runFullCheck}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '检查中...' : '运行完整检查'}
                </button>

                {testResults && (
                    <div className="mt-4">
                        {renderTestResult(testResults)}
                    </div>
                )}
            </div>

            {/* 单独API测试 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-medium mb-4">单独API测试</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { key: 'dashboard', name: 'Dashboard统计', desc: '平台概览数据' },
                        { key: 'orders', name: 'Orders统计', desc: '订单相关统计' },
                        { key: 'users', name: 'Users统计', desc: '用户数据统计' },
                        { key: 'merchants', name: 'Merchants数据', desc: '商家数据（列表）' }
                    ].map(api => (
                        <div key={api.key} className="border border-gray-100 rounded-lg p-4">
                            <h3 className="font-medium mb-1">{api.name}</h3>
                            <p className="text-sm text-gray-600 mb-3">{api.desc}</p>

                            <button
                                onClick={() => testSingleApi(api.key)}
                                disabled={directTestResults[api.key]?.loading}
                                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {directTestResults[api.key]?.loading ? '测试中...' : '测试'}
                            </button>

                            <div className="mt-3">
                                {renderSingleTestResult(api.key, directTestResults[api.key])}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 说明信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h3 className="font-medium text-blue-800 mb-2">使用说明</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>完整检查</strong>：一次性测试所有统计API，并生成综合报告</li>
                    <li>• <strong>单独测试</strong>：针对特定API进行测试，查看详细响应数据</li>
                    <li>• <strong>错误排查</strong>：根据测试结果中的建议进行问题排查</li>
                    <li>• <strong>数据验证</strong>：检查返回的数据结构和字段是否符合预期</li>
                </ul>
            </div>
        </div>
    );
};

export default StatsTestPage;