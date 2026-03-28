import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Logo SVG 组件
const LogoIcon = () => (
    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
        <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
    </svg>
);

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const location = useLocation();

    // 从路由状态获取订单数据
    const orderFromState = location.state?.order || null;

    const order = orderFromState || {
        id: 'SN202405201830',
        estimatedTime: '18:45',
        restaurantName: '川味观',
        items: [],
        total: 0,
    };

    // 查看订单详情（跳转到订单追踪页）
    const handleViewOrderDetail = () => {
        navigate(`/order-tracking/${order.id}`, {
            state: { order }
        });
    };

    // 返回首页
    const handleBackToHome = () => {
        navigate('/home');
    };

    return (
        <div className="font-display bg-background-light dark:bg-background-dark">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
                <div className="layout-container flex h-full grow flex-col">
                    <div className="flex flex-1 justify-center py-5">
                        <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
                            {/* Header */}
                            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e7dbcf] dark:border-[#3a2d21] px-10 py-3">
                                <div
                                    className="flex items-center gap-4 text-[#1b140d] dark:text-[#f8f7f6] cursor-pointer"
                                    onClick={() => navigate('/home')}
                                >
                                    <div className="size-6 text-primary">
                                        <LogoIcon />
                                    </div>
                                    <h2 className="text-[#1b140d] dark:text-[#f8f7f6] text-lg font-bold leading-tight tracking-[-0.015em]">
                                        智能外卖
                                    </h2>
                                </div>
                                <div className="flex flex-1 justify-end items-center gap-4">
                                    <button
                                        onClick={handleBackToHome}
                                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-[#1b140d] text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90"
                                    >
                                        <span className="truncate">返回首页</span>
                                    </button>
                                    <div
                                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer"
                                        style={{
                                            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC09OBeKDK1_KEJ1Anpj2EM0JojHbmIFFPXB67W5mgX9SM6BAJsd7bYQHdtrYWGn5lFpMzOHqZgUYhp1j138MG7RWG-PEK1gfmowSObWULmbJFWL2v6dnNj_zyZBuD4zvBVAmrTr86wGQfx4g3d8Lsl_OAG8menNixa7oPweELZFdk7NK0XCiYJi2esgtiCf-fIY6ayBx_4lRw9zdqfWY2zkXcmiRjekyARPMSayXO4lQ_Ss-IkEyFSADPwyPamWCpWUDG_vDCkslQt")',
                                        }}
                                        onClick={() => navigate('/profile')}
                                    />
                                </div>
                            </header>

                            {/* Main Content */}
                            <main className="flex flex-col items-center justify-center flex-grow p-4 md:p-10">
                                <div className="w-full max-w-lg bg-white dark:bg-background-dark border border-[#e7dbcf] dark:border-[#3a2d21] rounded-xl shadow-sm p-8 text-center flex flex-col items-center">
                                    {/* 成功图标 */}
                                    <div className="mb-6 flex items-center justify-center size-20 rounded-full bg-green-100 dark:bg-green-900/50 text-green-500 dark:text-green-400">
                                        <span className="material-symbols-outlined !text-5xl">check_circle</span>
                                    </div>

                                    {/* 标题和描述 */}
                                    <h1 className="text-[#1b140d] dark:text-[#f8f7f6] tracking-light text-[32px] font-bold leading-tight pb-3 pt-6">
                                        支付成功
                                    </h1>
                                    <p className="text-[#1b140d] dark:text-[#f8f7f6] text-base font-normal leading-normal pb-8">
                                        下单成功，美味即将送达！
                                    </p>

                                    {/* 订单信息 */}
                                    <div className="w-full text-left p-4 mb-8">
                                        <div className="grid grid-cols-[auto_1fr] gap-x-6">
                                            <div className="col-span-2 grid grid-cols-subgrid border-t border-[#e7dbcf] dark:border-[#3a2d21] py-5">
                                                <p className="text-[#9a734c] dark:text-[#a18a73] text-sm font-normal leading-normal">订单号：</p>
                                                <p className="text-[#1b140d] dark:text-[#f8f7f6] text-sm font-semibold leading-normal">
                                                    {order.id}
                                                </p>
                                            </div>
                                            <div className="col-span-2 grid grid-cols-subgrid border-t border-[#e7dbcf] dark:border-[#3a2d21] py-5">
                                                <p className="text-[#9a734c] dark:text-[#a18a73] text-sm font-normal leading-normal">预计送达：</p>
                                                <p className="text-[#1b140d] dark:text-[#f8f7f6] text-sm font-semibold leading-normal">
                                                    {order.estimatedTime}
                                                </p>
                                            </div>
                                            {order.restaurantName && (
                                                <div className="col-span-2 grid grid-cols-subgrid border-t border-[#e7dbcf] dark:border-[#3a2d21] py-5">
                                                    <p className="text-[#9a734c] dark:text-[#a18a73] text-sm font-normal leading-normal">餐厅：</p>
                                                    <p className="text-[#1b140d] dark:text-[#f8f7f6] text-sm font-semibold leading-normal">
                                                        {order.restaurantName}
                                                    </p>
                                                </div>
                                            )}
                                            {order.total > 0 && (
                                                <div className="col-span-2 grid grid-cols-subgrid border-t border-[#e7dbcf] dark:border-[#3a2d21] py-5">
                                                    <p className="text-[#9a734c] dark:text-[#a18a73] text-sm font-normal leading-normal">支付金额：</p>
                                                    <p className="text-primary text-sm font-semibold leading-normal">
                                                        ¥{order.total.toFixed(2)}
                                                    </p>
                                                </div>
                                            )}
                                            {/* 优惠券使用情况 */}
                                            {order.couponDiscount > 0 && order.usedCoupons && order.usedCoupons.length > 0 && (
                                                <div className="col-span-2 border-t border-[#e7dbcf] dark:border-[#3a2d21] py-5">
                                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm">auto_awesome</span>
                                                            <p className="text-green-800 dark:text-green-200 text-sm font-semibold">AI智能优化已生效</p>
                                                        </div>

                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex justify-between">
                                                                <span className="text-green-700 dark:text-green-300">原价：</span>
                                                                <span className="text-gray-600 dark:text-gray-400 line-through">¥{order.subtotal?.toFixed(2) || (order.total + order.couponDiscount).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-700 dark:text-green-300">优惠：</span>
                                                                <span className="text-red-600 dark:text-red-400 font-medium">-¥{order.couponDiscount.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between pt-1 border-t border-green-200 dark:border-green-700">
                                                                <span className="text-green-800 dark:text-green-200 font-semibold">实付：</span>
                                                                <span className="text-green-800 dark:text-green-200 font-bold">¥{order.total.toFixed(2)}</span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 flex items-center justify-center">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs rounded-full">
                                                                <span className="material-symbols-outlined text-xs">savings</span>
                                                                节省 {order.subtotal ? ((order.couponDiscount / order.subtotal) * 100).toFixed(1) : ((order.couponDiscount / (order.total + order.couponDiscount)) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>

                                                        {/* 使用的优惠券列表 */}
                                                        <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                                                            <p className="text-green-700 dark:text-green-300 text-xs mb-1">使用的优惠券：</p>
                                                            {order.usedCoupons.map((coupon, index) => (
                                                                <div key={coupon.id || index} className="text-xs text-green-600 dark:text-green-400">
                                                                    • {coupon.name} ({coupon.type === 'PERCENTAGE' ? `${coupon.discountValue}%折扣` : `减¥${coupon.discountValue}`})
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {/* 显示支付时间 */}
                                            {order.paidAt && (
                                                <div className="col-span-2 grid grid-cols-subgrid border-t border-[#e7dbcf] dark:border-[#3a2d21] py-5">
                                                    <p className="text-[#9a734c] dark:text-[#a18a73] text-sm font-normal leading-normal">支付时间：</p>
                                                    <p className="text-[#1b140d] dark:text-[#f8f7f6] text-sm font-semibold leading-normal">
                                                        {new Date(order.paidAt).toLocaleString('zh-CN')}
                                                    </p>
                                                </div>
                                            )}
                                            {/* 显示交易号 */}
                                            {order.paymentTransactionId && (
                                                <div className="col-span-2 grid grid-cols-subgrid border-t border-[#e7dbcf] dark:border-[#3a2d21] py-5">
                                                    <p className="text-[#9a734c] dark:text-[#a18a73] text-sm font-normal leading-normal">交易号：</p>
                                                    <p className="text-[#1b140d] dark:text-[#f8f7f6] text-sm font-semibold leading-normal font-mono">
                                                        {order.paymentTransactionId}
                                                    </p>
                                                </div>
                                            )}
                                            {/* 显示订单状态 */}
                                            {order.status && (
                                                <div className="col-span-2 grid grid-cols-subgrid border-t border-[#e7dbcf] dark:border-[#3a2d21] py-5">
                                                    <p className="text-[#9a734c] dark:text-[#a18a73] text-sm font-normal leading-normal">订单状态：</p>
                                                    <p className="text-green-600 dark:text-green-400 text-sm font-semibold leading-normal">
                                                        {typeof order.status === 'object'
                                                            ? order.status.description || order.status.code || '未知状态'
                                                            : order.status === 'PAID' ? '已支付' : order.status
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {/* 显示支付方式 */}
                                            {order.paymentMethod && (
                                                <div className="col-span-2 grid grid-cols-subgrid border-t border-[#e7dbcf] dark:border-[#3a2d21] py-5">
                                                    <p className="text-[#9a734c] dark:text-[#a18a73] text-sm font-normal leading-normal">支付方式：</p>
                                                    <p className="text-[#1b140d] dark:text-[#f8f7f6] text-sm font-semibold leading-normal">
                                                        {typeof order.paymentMethod === 'object'
                                                            ? order.paymentMethod.description || order.paymentMethod.code || '未知支付方式'
                                                            : order.paymentMethod || '未知支付方式'
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                                        <button
                                            onClick={handleViewOrderDetail}
                                            className="w-full sm:w-auto flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-[#1b140d] text-base font-bold leading-normal hover:opacity-90"
                                        >
                                            <span className="truncate">查看订单详情</span>
                                        </button>
                                        <button
                                            onClick={handleBackToHome}
                                            className="w-full sm:w-auto flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-transparent text-primary dark:text-primary border border-primary hover:bg-primary/10 dark:hover:bg-primary/20 text-base font-bold leading-normal"
                                        >
                                            <span className="truncate">返回首页</span>
                                        </button>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
