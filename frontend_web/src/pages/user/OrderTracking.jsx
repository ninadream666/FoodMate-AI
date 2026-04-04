import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Logo SVG组件
const LogoIcon = () => (
    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
        <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
    </svg>
);

// 订单状态步骤组件
const OrderStep = ({ icon, title, time, isActive, isCompleted, isLast }) => {
    return (
        <>
            {/* 步骤指示器 */}
            <div className="flex flex-col items-center gap-1">
                {!isLast && <div className={`w-[2px] h-2 ${isCompleted || isActive ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}></div>}
                <div className={`rounded-full p-1.5 ${isActive || isCompleted ? 'text-primary bg-primary/20' : 'text-slate-400 dark:text-slate-600 bg-slate-200 dark:bg-slate-800'}`}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                </div>
                {!isLast && <div className={`w-[2px] h-full ${isCompleted ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}></div>}
            </div>
            {/* 步骤内容 */}
            <div className={`flex flex-1 flex-col ${!isLast ? 'pb-8' : ''}`}>
                <p className={`text-base font-medium leading-normal ${isActive || isCompleted ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400'}`}>
                    {title}
                </p>
                {time && <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">{time}</p>}
            </div>
        </>
    );
};

export default function OrderTracking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 从路由状态获取订单数据
    const orderFromState = location.state?.order || null;

    const [order, setOrder] = useState(orderFromState || {
        id: id || '123456789',
        restaurantName: '大碗面',
        estimatedTime: '18:30',
        currentStatus: 2, // 0: 已接单, 1: 备餐中, 2: 配送中, 3: 已送达
        statusHistory: [
            { status: '已接单', time: '18:05' },
            { status: '正在备餐', time: '18:10' },
            { status: '配送中', time: '18:15' },
            { status: '已送达', time: null },
        ],
        rider: {
            name: '骑手小王',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrawV460GKuSwxG2erT5rdBh9ksqmQjzOTvnwYNU94TAR8--4IoSIyOfS2xC0-s3GbtIMMvUkusGoRljcvgdBFUwmD-nkloIV6LQSXdQUcr27tzgJpxyuKyVik-B_9eTdirHZhMVgfkEVfDKo6yDeJv7tOMeUbHB-BW6vGuWrj0-245nme0zrYfM0SN5ZaxIK5AyaCUa1vvb2fIri1634y5Hjop3rpflHAC9zZXdPSEWLiQh7mhvSgy4_gKUuFYXuuBjkJrNms9v23',
            phone: '138****1234',
        },
    });

    // 模拟订单状态更新
    useEffect(() => {
        // 实际项目中应该通过WebSocket或轮询获取订单状态
        const timer = setInterval(() => {
            // 模拟状态更新逻辑
        }, 30000);

        return () => clearInterval(timer);
    }, []);

    // 联系骑手
    const handleContactRider = () => {
        // 实际项目中应该调用电话API或打开聊天窗口
        alert(`正在联系骑手: ${order.rider.phone}`);
    };

    // 查看订单详情
    const handleViewOrderDetail = () => {
        // 可以跳转到订单详情页面
        console.log('查看订单详情');
    };

    // 需要帮助
    const handleNeedHelp = () => {
        // 可以打开帮助中心或客服聊天
        console.log('需要帮助');
    };

    const statusIcons = ['receipt_long', 'restaurant', 'moped', 'door_front'];
    const statusTitles = ['已接单', '正在备餐', '配送中', '已送达'];

    return (
        <div className="bg-background-light dark:bg-background-dark font-display">
            <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden">
                <div className="layout-container flex h-full grow flex-col">
                    <div className="px-4 sm:px-8 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
                        <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
                            {/* Header */}
                            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 dark:border-primary/10 px-4 sm:px-10 py-3">
                                <div
                                    className="flex items-center gap-4 text-slate-900 dark:text-slate-100 cursor-pointer"
                                    onClick={() => navigate('/home')}
                                >
                                    <div className="size-6 text-primary">
                                        <LogoIcon />
                                    </div>
                                    <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">
                                        智能外卖
                                    </h2>
                                </div>
                                <div className="flex flex-1 justify-end items-center gap-4 sm:gap-8">
                                    <div className="hidden sm:flex items-center gap-9">
                                        <a
                                            className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-normal cursor-pointer hover:text-primary"
                                            onClick={() => navigate('/home')}
                                        >
                                            首页
                                        </a>
                                        <a className="text-slate-900 dark:text-slate-100 text-sm font-bold leading-normal border-b-2 border-primary cursor-pointer">
                                            我的订单
                                        </a>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-primary/10 text-slate-800 dark:bg-primary/20 dark:text-slate-200 text-sm font-bold leading-normal tracking-[0.015em]">
                                            <span className="material-symbols-outlined text-xl">notifications</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/cart')}
                                            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-primary/10 text-slate-800 dark:bg-primary/20 dark:text-slate-200 text-sm font-bold leading-normal tracking-[0.015em]"
                                        >
                                            <span className="material-symbols-outlined text-xl">shopping_cart</span>
                                        </button>
                                    </div>
                                    <div
                                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer"
                                        style={{
                                            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAs9ZIL0D42BS64dtMW_nPoYGLO_KAKucDCHZJFVKqHqKgz0wbw-HF-a2jaOnwNC4hU_55m8FeaG7daX2zyyPCB3lOEuhdXR7ybHXVYt61ilwRVpdYFCNxmU1AhHm3X0_A4mFzx0p33RNDS918cdc-qmo1k4NsH66q6zxg4-Kp6qWcZspGan-Lfpnu6dgDaxqDpsjBD7Jc4g8IyHjyoZsxzOpSsZI37v8sgtAy3rbfoAmF9GcIzC70xkQUkrSFrT_uhNNoj8ueW3RAo")',
                                        }}
                                        onClick={() => navigate('/profile')}
                                    />
                                </div>
                            </header>

                            {/* Main Content */}
                            <main className="flex-1 pt-8 sm:pt-12 pb-8">
                                {/* 标题区域 */}
                                <div className="flex flex-wrap justify-between gap-4 px-4">
                                    <div className="flex min-w-72 flex-col gap-2">
                                        <p className="text-slate-900 dark:text-slate-50 text-4xl font-black leading-tight tracking-[-0.033em]">
                                            您的订单正在路上！
                                        </p>
                                        <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal">
                                            订单号: #{order.id} · {order.restaurantName}
                                        </p>
                                    </div>
                                </div>

                                {/* 地图和状态区域 */}
                                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
                                    {/* 地图区域 */}
                                    <div className="lg:col-span-2">
                                        <div className="p-4 @container bg-white/50 dark:bg-background-dark/50 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
                                            <div className="flex flex-col items-stretch justify-start rounded-lg @xl:flex-row @xl:items-center">
                                                <div
                                                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center"
                                                    style={{ backgroundImage: 'url("https://placeholder.pics/svg/600x300")' }}
                                                >
                                                    <div className="text-slate-400 dark:text-slate-600 flex flex-col items-center">
                                                        <span className="material-symbols-outlined text-5xl">map</span>
                                                        <span className="text-sm mt-2">配送路线地图</span>
                                                    </div>
                                                </div>
                                                <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-2 py-4 @xl:pl-6">
                                                    <p className="text-slate-900 dark:text-slate-50 text-2xl font-bold leading-tight tracking-[-0.015em]">
                                                        预计 {order.estimatedTime} 送达
                                                    </p>
                                                    <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal">
                                                        配送员正在火速赶来
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 订单状态区域 */}
                                    <div className="lg:col-span-1 bg-white/50 dark:bg-background-dark/50 p-6 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">订单状态</h3>
                                            <div className="grid grid-cols-[auto_1fr] gap-x-4">
                                                {/* 已接单 */}
                                                <div className="flex flex-col items-center gap-1 pt-1.5">
                                                    <div className="text-primary rounded-full bg-primary/20 p-1.5">
                                                        <span className="material-symbols-outlined text-xl">receipt_long</span>
                                                    </div>
                                                    <div className="w-[2px] bg-primary h-full"></div>
                                                </div>
                                                <div className="flex flex-1 flex-col pb-8">
                                                    <p className="text-slate-900 dark:text-slate-50 text-base font-medium leading-normal">已接单</p>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">
                                                        {order.statusHistory[0]?.time}
                                                    </p>
                                                </div>

                                                {/* 正在备餐 */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-[2px] bg-primary h-2"></div>
                                                    <div className="text-primary rounded-full bg-primary/20 p-1.5">
                                                        <span className="material-symbols-outlined text-xl">restaurant</span>
                                                    </div>
                                                    <div className="w-[2px] bg-primary h-full"></div>
                                                </div>
                                                <div className="flex flex-1 flex-col pb-8">
                                                    <p className="text-slate-900 dark:text-slate-50 text-base font-medium leading-normal">正在备餐</p>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">
                                                        {order.statusHistory[1]?.time}
                                                    </p>
                                                </div>

                                                {/* 配送中 */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="w-[2px] bg-primary h-2"></div>
                                                    <div className={`rounded-full p-1.5 ${order.currentStatus >= 2 ? 'text-primary bg-primary/20' : 'text-slate-400 dark:text-slate-600 bg-slate-200 dark:bg-slate-800'}`}>
                                                        <span className="material-symbols-outlined text-xl">moped</span>
                                                    </div>
                                                    <div className={`w-[2px] h-full ${order.currentStatus >= 3 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                                </div>
                                                <div className="flex flex-1 flex-col pb-8">
                                                    <p className={`text-base font-medium leading-normal ${order.currentStatus >= 2 ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        配送中
                                                    </p>
                                                    {order.statusHistory[2]?.time && (
                                                        <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">
                                                            {order.statusHistory[2].time}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* 已送达 */}
                                                <div className="flex flex-col items-center gap-1 pb-1.5">
                                                    <div className="w-[2px] bg-slate-200 dark:bg-slate-700 h-2"></div>
                                                    <div className={`rounded-full p-1.5 ${order.currentStatus >= 3 ? 'text-primary bg-primary/20' : 'text-slate-400 dark:text-slate-600 bg-slate-200 dark:bg-slate-800'}`}>
                                                        <span className="material-symbols-outlined text-xl">door_front</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-1 flex-col">
                                                    <p className={`text-base font-medium leading-normal ${order.currentStatus >= 3 ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        已送达
                                                    </p>
                                                    {order.statusHistory[3]?.time && (
                                                        <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">
                                                            {order.statusHistory[3].time}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 骑手信息 */}
                                        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12"
                                                    style={{ backgroundImage: `url("${order.rider.avatar}")` }}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-slate-900 dark:text-slate-100 text-base font-medium leading-normal truncate">
                                                        {order.rider.name}
                                                    </p>
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm">正在为您配送</p>
                                                </div>
                                                <div className="shrink-0">
                                                    <button
                                                        onClick={handleContactRider}
                                                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-medium leading-normal w-fit gap-2 hover:opacity-90"
                                                    >
                                                        <span className="material-symbols-outlined text-base">call</span>
                                                        <span className="truncate">联系骑手</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 底部按钮 */}
                                <div className="mt-8 px-4 flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={handleViewOrderDetail}
                                        className="flex-1 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-light text-base font-bold leading-normal hover:bg-primary/30"
                                    >
                                        <span className="truncate">查看订单详情</span>
                                    </button>
                                    <button
                                        onClick={handleNeedHelp}
                                        className="flex-1 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-base font-bold leading-normal hover:bg-slate-300/60 dark:hover:bg-slate-700/60"
                                    >
                                        <span className="truncate">需要帮助？</span>
                                    </button>
                                </div>
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
