import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCoupons } from '../../hooks/useCoupons';
import * as couponUtils from '../../utils/couponUtils';

// 默认菜品图片
const defaultDishImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAsKKNZeioee-JViVf_SBcbT3rBBvZu4DRFaNV6zHlXtXEjC2CNTIsAmJI7F9lgIkkqvLI7GQ6aPH6dVIVSJYKiHlfzeJz8XvF7xFAKjKqhEaRfTu-NLionE8GH6f18T0nyhqQZK-DJTCPCdctLKhSoQdXHd52-CSkDC81U5LPnZtqdpW9a81FBB9suOIFC2VSfFJpnsmbj7pDYXC2LSYX9H8h_XhM49_8PrKxP1JwsEgNlm_YYWEv_4lAJqN8e8_e-8meysrlbEIft',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuArCT0tj8J-e9yyH422cU_NzNiA-NddrGRXaqEsw_wDvT0Mfni_KyoPn4p67_giN4rSkQZtFbs7Ux4aXNhyex6eHWl7unFR6hnY5UYTRL6o6FFWvBW7RkN1sv8RV1lbha5nw4TSyXCL-Pq_-T8AU-3FeEXG4pE28kcIbaFgax8AgNH6IvNz5qXRAWZCsxsRhTBgAb9j_K-geaS9JOC_fJ_SE_CQjuC853-wPcMyXNIxccqxOLQ12OnzRLOtnJCaWHd5N_zxUN8Mv6Jc',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC-BKra1jio1aUw9R5dmyc0V4Ny1apgnVujdbt_nNSmbdJaZUBWxKzFp_OGnGw90MLbZw2wxx0skAeq7Z-6VbabGyvWdWzb_yHNsgwmkwob0afIR3sQO3zejmltoSrAFfcNrq5VFLeiyu_RP3tRlmdmaKA77kLxCKaqFvNasw3zj7vhnhzZ5R5rNDdHfzZTpUskVw3h0MeEbOS-yUobNMUcOYirtscya3Nf918Vg8yPwBMiXkr7dlqMh2gXLKtEslaKf7D4RTRYhQoU',
];

// 购物车商品项组件
const CartItem = ({ item, index, onUpdateQuantity, onRemove }) => {
    return (
        <div className={`flex items-center gap-4 ${index < 2 ? 'border-b border-b-[#f3ede7] dark:border-b-[#3a3024] pb-4' : ''}`}>
            <div
                className="w-20 h-20 rounded-lg bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url('${item.image || defaultDishImages[index % defaultDishImages.length]}')` }}
            />
            <div className="flex-1">
                <h3 className="font-semibold text-[#1b140d] dark:text-white">{item.name}</h3>
                <p className="text-sm text-[#9a734c] dark:text-gray-400">¥{item.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="flex items-center justify-center w-8 h-8 rounded-full border border-[#f3ede7] dark:border-[#3a3024] text-[#1b140d] dark:text-white hover:bg-primary/10"
                >
                    -
                </button>
                <span className="font-bold w-6 text-center text-[#1b140d] dark:text-white">{item.quantity}</span>
                <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="flex items-center justify-center w-8 h-8 rounded-full border border-[#f3ede7] dark:border-[#3a3024] text-[#1b140d] dark:text-white hover:bg-primary/10"
                >
                    +
                </button>
            </div>
            <p className="font-bold w-16 text-right text-[#1b140d] dark:text-gray-200">
                ¥{(item.price * item.quantity).toFixed(2)}
            </p>
            <button
                onClick={() => onRemove(item.id)}
                className="text-[#9a734c] dark:text-gray-400 hover:text-red-500"
            >
                <span className="material-symbols-outlined">delete</span>
            </button>
        </div>
    );
};

export default function Cart() {
    const navigate = useNavigate();
    const location = useLocation();

    // 从路由状态获取购物车数据和餐厅信息
    const cartFromState = location.state?.cartItems || [];
    const restaurantFromState = location.state?.restaurant || null;

    const [cartItems, setCartItems] = useState(cartFromState.length > 0 ? cartFromState : [
        { id: 1, name: '经典牛肉汉堡', price: 12.99, quantity: 1, image: defaultDishImages[0] },
        { id: 2, name: '香辣鸡肉三明治', price: 11.50, quantity: 1, image: defaultDishImages[1] },
        { id: 6, name: '经典奶昔', price: 5.99, quantity: 1, image: defaultDishImages[2] },
    ]);

    const [restaurant, setRestaurant] = useState(restaurantFromState || {
        id: 1,
        name: 'Gourmet Burger Kitchen',
    });

    // 获取用户信息
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id;

    // 计算小计
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 使用优惠券Hook
    const {
        availableCoupons,
        selectedCoupons,
        selectedCouponIds,
        bestCombination,
        selectedDiscount,
        loading: couponsLoading,
        error: couponsError,
        toggleCouponSelection,
        clearSelection,
        applyBestCombination,
        calculateBestCombination,
        refreshAvailableCoupons,
    } = useCoupons(userId, subtotal, restaurant?.id);

    const [couponApplied, setCouponApplied] = useState(true);
    const deliveryAddress = useState({
        type: '家',
        address: '123 Flavor Town Ave',
    })[0];

    // 计算价格 - 使用Hook计算的优惠金额
    const deliveryFee = 3.99;
    const discount = selectedDiscount > 0 ? selectedDiscount : 0;
    const total = subtotal + deliveryFee - discount;

    // 自动计算最优优惠券组合
    useEffect(() => {
        if (userId && subtotal > 0 && availableCoupons.length > 0 && !couponsError) {
            calculateBestCombination();
        }
    }, [userId, subtotal, availableCoupons.length, calculateBestCombination, couponsError]);

    // 自动应用最佳组合（仅在没有手动选择时）
    useEffect(() => {
        if (bestCombination && bestCombination.success && selectedCouponIds.length === 0 && bestCombination.totalDiscount > 0) {
            // 自动应用推荐的优惠券组合
            applyBestCombination();
        }
    }, [bestCombination, selectedCouponIds.length, applyBestCombination]);

    // 更新商品数量
    const handleUpdateQuantity = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveItem(itemId);
            return;
        }
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    // 删除商品
    const handleRemoveItem = (itemId) => {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    };

    // 移除优惠券
    const handleRemoveCoupon = () => {
        clearSelection();
        setCouponApplied(false);
    };

    // 返回餐厅详情页
    const handleBackToRestaurant = () => {
        if (restaurant?.id) {
            navigate(`/restaurant/${restaurant.id}`, { state: { restaurant, cartItems } });
        } else {
            navigate(-1);
        }
    };

    // 跳转到订单确认页
    const handleGoToCheckout = () => {
        navigate('/order-confirm', {
            state: {
                cartItems,
                restaurant,
                subtotal,
                deliveryFee,
                discount: Math.max(selectedDiscount, 0), // 确保优惠金额不为负数
                // 优惠券相关信息
                selectedCouponIds,
                selectedCoupons,
                availableCoupons: availableCoupons.filter(c => selectedCouponIds.includes(c.id)),
            }
        });
    };

    // 获取购物车商品总数
    const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
                <div className="layout-container flex h-full grow flex-col">
                    {/* TopNavBar */}
                    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f3ede7] dark:border-b-[#2a2218] px-10 py-3 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
                        <div className="flex items-center gap-8">
                            <div
                                className="flex items-center gap-4 text-[#1b140d] dark:text-white cursor-pointer"
                                onClick={() => navigate('/home')}
                            >
                                <div className="size-6 text-primary">
                                    <span className="material-symbols-outlined !text-4xl">fastfood</span>
                                </div>
                                <h2 className="text-[#1b140d] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                                    Food Delivery
                                </h2>
                            </div>
                        </div>
                        <div className="flex flex-1 justify-end gap-8">
                            <div className="flex items-center gap-9">
                                <a
                                    className="text-[#1b140d] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary cursor-pointer"
                                    onClick={() => navigate('/home')}
                                >
                                    Home
                                </a>
                                <a className="text-[#1b140d] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary cursor-pointer">
                                    Restaurants
                                </a>
                                <a className="text-[#1b140d] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary cursor-pointer">
                                    Deals
                                </a>
                                <a className="text-[#1b140d] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary cursor-pointer">
                                    My Orders
                                </a>
                            </div>
                            <div className="flex gap-4 items-center">
                                <button className="relative flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-primary/20 text-primary dark:bg-[#2a2218] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
                                    <span className="material-symbols-outlined">shopping_cart</span>
                                    {totalItemCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                                            {totalItemCount}
                                        </span>
                                    )}
                                </button>
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer"
                                    style={{
                                        backgroundImage:
                                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBKGELqdfs5yuetg_flyAXgdEBpQelUVT3G-w_sxZ7ijvXjzxdCBlmC1R1m4wmteYXFl6edVfo6DUwINK3vGfSdZa4jQjsu7ajF71arU3HiC_avC9rPqg_HwXfirnFntRUdaw3hR2w34zzbg6SlOhiVxXM5uOfUB3PjqnkH57OTSOhQZ81rIq56wsPV5l6xIq5MVDQHtji2wKKfQaLL1T_n4SVcEq0RiC6nd5DjdrWRfybzP7KHW-wXLH7ZsvjgkeAQ1EtO1bUTcyra")',
                                    }}
                                    onClick={() => navigate('/profile')}
                                />
                            </div>
                        </div>
                    </header>

                    <main className="px-10 flex flex-1 justify-center py-5">
                        <div className="layout-content-container flex flex-col w-full max-w-[1280px] flex-1">
                            {/* 页面标题和返回链接 */}
                            <div className="flex flex-col items-start gap-4 p-4 md:flex-row md:items-center md:justify-between">
                                <h1 className="text-3xl font-bold text-[#1b140d] dark:text-white">您的购物车</h1>
                                <button
                                    onClick={handleBackToRestaurant}
                                    className="text-sm font-medium text-[#9a734c] dark:text-gray-400 hover:text-primary dark:hover:text-primary flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined !text-lg">arrow_back</span>
                                    返回餐厅
                                </button>
                            </div>

                            {/* 购物车内容区域 */}
                            <div className="flex flex-col lg:flex-row gap-8 mt-4">
                                {/* 左侧 - 购物车商品列表 */}
                                <div className="flex-1">
                                    {cartItems.length > 0 ? (
                                        <div className="bg-white dark:bg-[#2a2218] rounded-xl p-6">
                                            <h2 className="text-xl font-bold text-[#1b140d] dark:text-white mb-4">
                                                来自 {restaurant.name} 的订单
                                            </h2>
                                            <div className="space-y-4">
                                                {cartItems.map((item, index) => (
                                                    <CartItem
                                                        key={item.id}
                                                        item={item}
                                                        index={index}
                                                        onUpdateQuantity={handleUpdateQuantity}
                                                        onRemove={handleRemoveItem}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-[#2a2218] rounded-xl p-6 text-center">
                                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">
                                                shopping_cart
                                            </span>
                                            <p className="text-slate-500 dark:text-slate-400 mt-4">购物车是空的</p>
                                            <button
                                                onClick={handleBackToRestaurant}
                                                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                                            >
                                                去点餐
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 右侧 - 订单摘要 */}
                                <div className="w-full lg:w-96">
                                    <div className="bg-white dark:bg-[#2a2218] rounded-xl p-6 sticky top-24">
                                        <h2 className="text-xl font-bold text-[#1b140d] dark:text-white mb-4">订单摘要</h2>
                                        <div className="space-y-3 text-sm text-[#1b140d] dark:text-gray-300">
                                            <div className="flex justify-between">
                                                <span>小计</span>
                                                <span>¥{subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>配送费</span>
                                                <span>¥{deliveryFee.toFixed(2)}</span>
                                            </div>
                                            {selectedDiscount > 0 && (
                                                <div className="flex justify-between text-green-600 dark:text-green-400">
                                                    <span>优惠</span>
                                                    <span>-¥{discount.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-dashed border-t-[#e0d9d1] dark:border-t-[#44382c] my-4"></div>

                                        <div className="flex justify-between font-bold text-lg text-[#1b140d] dark:text-white">
                                            <span>总计</span>
                                            <span>¥{total.toFixed(2)}</span>
                                        </div>

                                        <div className="border-t border-t-[#f3ede7] dark:border-t-[#3a3024] my-4"></div>

                                        <div className="space-y-4">
                                            {/* 配送地址 */}
                                            <div>
                                                <h3 className="font-semibold mb-2 text-[#1b140d] dark:text-white">配送地址</h3>
                                                <button className="w-full flex items-center justify-between text-left p-3 rounded-lg border border-[#f3ede7] dark:border-[#3a3024] hover:border-primary dark:hover:border-primary">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-primary">home</span>
                                                        <div>
                                                            <p className="font-medium text-[#1b140d] dark:text-gray-200">{deliveryAddress.type}</p>
                                                            <p className="text-xs text-[#9a734c] dark:text-gray-400">{deliveryAddress.address}</p>
                                                        </div>
                                                    </div>
                                                    <span className="material-symbols-outlined text-[#9a734c] dark:text-gray-400">chevron_right</span>
                                                </button>
                                            </div>

                                            {/* 优惠券 */}
                                            <div>
                                                <h3 className="font-semibold mb-2 text-[#1b140d] dark:text-white">
                                                    优惠券
                                                    {couponsLoading && (
                                                        <span className="material-symbols-outlined animate-spin text-sm ml-2">refresh</span>
                                                    )}
                                                    {availableCoupons.length > 0 && !couponsLoading && `(${availableCoupons.length}张可用)`}
                                                </h3>
                                                {couponsLoading ? (
                                                    <div className="w-full flex items-center justify-center p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                            <span className="material-symbols-outlined animate-spin">refresh</span>
                                                            <span className="text-sm">加载优惠券...</span>
                                                        </div>
                                                    </div>
                                                ) : couponsError ? (
                                                    <div className="w-full p-4 rounded-lg border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                                                <span className="material-symbols-outlined">error</span>
                                                                <span className="text-sm">优惠券服务暂时不可用</span>
                                                            </div>
                                                            <button
                                                                onClick={refreshAvailableCoupons}
                                                                className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-800 dark:hover:bg-orange-700 text-orange-700 dark:text-orange-200 rounded-md transition-colors"
                                                            >
                                                                重试
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : selectedCoupons.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {selectedCoupons.map(coupon => (
                                                            <div
                                                                key={coupon.id}
                                                                className="flex items-center justify-between text-left p-3 rounded-lg bg-green-100/50 dark:bg-green-900/20 border border-green-500/20 dark:border-green-500/30"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">local_offer</span>
                                                                    <div>
                                                                        <p className="font-medium text-green-700 dark:text-green-300 text-sm">
                                                                            {coupon.couponTemplate?.name || '优惠券'}
                                                                        </p>
                                                                        <p className="text-xs text-green-600 dark:text-green-400">
                                                                            -{couponUtils.formatCouponValue(coupon.couponTemplate)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleCouponSelection(coupon.id)}
                                                                    className="material-symbols-outlined text-green-600 dark:text-green-400 hover:text-red-500"
                                                                >
                                                                    cancel
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {/* 智能推荐 */}
                                                        {bestCombination && bestCombination.success && bestCombination.totalDiscount > selectedDiscount && (
                                                            <button
                                                                onClick={applyBestCombination}
                                                                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                            >
                                                                <span className="material-symbols-outlined">auto_awesome</span>
                                                                <span className="text-sm">使用AI推荐组合 (可省¥{(bestCombination.totalDiscount - selectedDiscount).toFixed(2)})</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : availableCoupons.length > 0 ? (
                                                    <div className="space-y-2">
                                                        <button
                                                            onClick={() => {
                                                                if (bestCombination && bestCombination.success) {
                                                                    applyBestCombination();
                                                                } else if (availableCoupons.length > 0) {
                                                                    // 选择第一个可用的优惠券
                                                                    toggleCouponSelection(availableCoupons[0].id);
                                                                }
                                                            }}
                                                            className="w-full flex items-center justify-between text-left p-3 rounded-lg border border-[#f3ede7] dark:border-[#3a3024] hover:border-primary dark:hover:border-primary"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="material-symbols-outlined text-primary">local_offer</span>
                                                                <div>
                                                                    <p className="text-sm font-medium text-[#1b140d] dark:text-gray-200">
                                                                        {bestCombination && bestCombination.success ?
                                                                            `AI推荐: 可省¥${bestCombination.totalDiscount.toFixed(2)}` :
                                                                            '选择优惠券'
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-[#9a734c] dark:text-gray-400">
                                                                        {availableCoupons.length}张优惠券可用
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="material-symbols-outlined text-[#9a734c] dark:text-gray-400">chevron_right</span>
                                                        </button>
                                                        {/* 显示前3个可用优惠券 */}
                                                        <div className="space-y-1 ml-4">
                                                            {availableCoupons.slice(0, 3).map(coupon => (
                                                                <button
                                                                    key={coupon.id}
                                                                    onClick={() => toggleCouponSelection(coupon.id)}
                                                                    className="w-full flex items-center justify-between text-left p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-sm text-orange-500">confirmation_number</span>
                                                                        <div>
                                                                            <p className="text-xs font-medium text-[#1b140d] dark:text-gray-200">
                                                                                {coupon.couponTemplate?.name || '优惠券'}
                                                                            </p>
                                                                            <p className="text-xs text-[#9a734c] dark:text-gray-400">
                                                                                {couponUtils.formatCouponDescription(coupon.couponTemplate)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                                                        {couponUtils.formatCouponValue(coupon.couponTemplate)}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button className="w-full flex items-center justify-between text-left p-3 rounded-lg border border-[#f3ede7] dark:border-[#3a3024] opacity-50 cursor-not-allowed">
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-[#9a734c] dark:text-gray-400">local_offer</span>
                                                            <p className="text-sm text-[#9a734c] dark:text-gray-400">暂无可用优惠券</p>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* 支付按钮 */}
                                        <button
                                            onClick={handleGoToCheckout}
                                            className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-primary h-12 px-6 text-base font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={cartItems.length === 0}
                                        >
                                            <span className="material-symbols-outlined">lock</span>
                                            安全支付
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
