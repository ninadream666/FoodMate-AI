// 管理端页面快速更新脚本
// 此脚本用于批量为管理端页面添加后端服务连接

export const pageConfigurations = [
    {
        file: 'Marketing.jsx',
        service: 'marketingService',
        title: '营销管理',
        description: '管理营销活动和优惠券',
        apis: [
            { name: 'getCampaigns', endpoint: '/campaigns' },
            { name: 'getCoupons', endpoint: '/coupons' },
            { name: 'getMarketingStats', endpoint: '/stats' }
        ]
    },
    {
        file: 'Services.jsx',
        service: 'platformService',
        title: '平台服务管理',
        description: '管理平台增值服务',
        apis: [
            { name: 'getAllServices', endpoint: '/platform-services' },
            { name: 'getSubscriptions', endpoint: '/subscriptions' }
        ]
    },
    {
        file: 'Settlements.jsx',
        service: 'settlementService',
        title: '结算管理',
        description: '处理商家结算和财务管理',
        apis: [
            { name: 'getSettlements', endpoint: '/settlements' },
            { name: 'getSettlementStats', endpoint: '/stats' }
        ]
    },
    {
        file: 'Commissions.jsx',
        service: 'settlementService',
        title: '佣金管理',
        description: '管理平台佣金规则',
        apis: [
            { name: 'getCommissions', endpoint: '/commissions' },
            { name: 'getCommissionRules', endpoint: '/commission-rules' }
        ]
    }
];

// 生成页面的通用结构
export const generatePageTemplate = (config) => {
    return `import React, { useState, useEffect } from 'react';
import ${config.service} from '../../services/admin/${config.service}';

const ${config.file.replace('.jsx', '')} = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchData();
    }, [currentPage, searchTerm]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await ${config.service}.${config.apis[0].name}({
                page: currentPage,
                limit: 10,
                search: searchTerm
            });
            
            if (response.success) {
                setData(response.data || []);
            }
        } catch (error) {
            console.error('获取数据失败:', error);
            // 降级处理 - 使用模拟数据
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f7f6] dark:bg-[#221910] text-[#1b140d] dark:text-white font-['Inter']">
            <div className="space-y-8 p-6">
                {/* 页面标题 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <nav className="flex gap-2 text-sm text-[#9a734c] dark:text-[#cc9f70] mb-1">
                            <a className="hover:text-[#ee8c2b] transition-colors" href="/admin/dashboard">首页</a>
                            <span>/</span>
                            <span className="text-[#1b140d] dark:text-white font-medium">${config.title}</span>
                        </nav>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b140d] dark:text-white">
                            ${config.title}
                        </h1>
                        <p className="text-[#9a734c] dark:text-[#cc9f70] text-base">
                            ${config.description}
                        </p>
                    </div>
                </div>

                {/* 搜索框 */}
                <div className="bg-white dark:bg-[#1a120b] p-4 rounded-xl border border-[#e7dbcf] dark:border-[#3a2d20] shadow-sm">
                    <div className="w-full lg:max-w-md relative group">
                        <input
                            className="w-full h-11 pl-11 pr-4 rounded-lg bg-[#fcfaf8] dark:bg-[#2a2018] border border-[#e7dbcf] dark:border-[#4a3a2a] text-[#1b140d] dark:text-white text-sm focus:ring-2 focus:ring-[#ee8c2b]/50 focus:border-[#ee8c2b] transition-all"
                            placeholder="搜索..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9a734c] dark:text-[#8a6a4b]">search</span>
                    </div>
                </div>

                {/* 内容区域 */}
                <div className="bg-white dark:bg-[#1a120b] rounded-xl border border-[#e7dbcf] dark:border-[#3a2d20] shadow-sm p-6">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="flex items-center justify-center gap-2 text-[#9a734c] dark:text-[#cc9f70]">
                                <div className="w-4 h-4 border-2 border-[#ee8c2b] border-t-transparent rounded-full animate-spin"></div>
                                加载中...
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[#9a734c] dark:text-[#cc9f70]">
                            <span className="material-symbols-outlined text-4xl mb-4 block">construction</span>
                            <p>页面正在开发中，敬请期待！</p>
                            <p className="text-sm mt-2">此页面已连接到后端服务：${config.service}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ${config.file.replace('.jsx', '')};`;
};

// 使用说明
console.log('管理端页面更新配置已生成');
console.log('可用的配置:', pageConfigurations.map(c => c.file).join(', '));

export default { pageConfigurations, generatePageTemplate };