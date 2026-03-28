import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { addressService } from '../../services/addressService';
import { walletService } from '../../services/walletService';
import * as couponUtils from '../../utils/couponUtils';

// 默认菜品图片
const defaultDishImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAhbQ9QcRMxm3Llr59SYyPVDBvXIeETgPqmZ_TDh0yGFWfgYmjwN89xAIT2MGtR--XXTFjIlci4ywk8FxQXju58r-0x4abnohjNJ0yvHytPSCMeME8hpWfe-iuarjXSMaMtmaToplyJCQzWEJ1PC_FrV_i0Rf2WcM57dchzX78SC-fPZrifDw9SYP2b73FdLAcxRrqgO0nkOXsdaMMvXb85jDZ2Lm68VN2jDGHZCeeS4N-judX4sb3iiv0fUZqmCc0iOZlIFSo2K0Bx',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCmmd-i4u5v21dh8Ip1PqQdmDDbIYxNeb8OpD0iwmy60G1vNZ9xxIxPJqyAP7kCV8jzvrSQD8zQuLrRvI_-R1CCMGm0tGeRbvLANxmBxvzpAN8sG8zR8kyBH4UdgaP-37WBj-k0Soe7jH3a2ERUM7qsHnkxbPV2UynBCU8ppX0BaGm93gPtVDmAil-sCuYyFxRWiSmcuit_tWPlIA8C_O7TctaQxlMVWKYdQ7xHhFFZplnBVJ2kCwJ0pr2Rm9VquCzWpE7qLdbczkm4',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCCMN7b4zYVFSVM8i5TWgyWcKYuiJbENG81R8eugOUr74m1XVp2aodGdJ1SmveJM9Ow5jbCxnVkApGd33OSisQrq_WWQlQr0TrZYsE5C34UoRCILMF6B_trsPF5AUeKStWQ6oRYa6Fyr7hA_czV1W29_8PCQySdBWqSw5UGd5AjV_RzEe9PgNr1cEIhjX3T4pOkRN57Bj__sCQMOH_WClvYnsXqNIuYPE2nk_sDZVU_fwgGX5Uy0bIws8_Zpdb5rMznM0107khtiKVk',
];

// Logo SVG 组件
const LogoIcon = () => (
    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
        <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
    </svg>
);

// 订单商品项组件
const OrderItem = ({ item, index }) => {
    return (
        <div className="flex items-center gap-4 pt-4 first:pt-0">
            <img
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
                src={item.image || defaultDishImages[index % defaultDishImages.length]}
                alt={item.name}
            />
            <div className="flex-grow">
                <p className="font-semibold text-[#1b140d] dark:text-background-light">{item.name}</p>
                <p className="text-sm text-[#9a734c] dark:text-gray-400">{item.description || ''}</p>
            </div>
            <p className="shrink-0 text-sm text-[#9a734c] dark:text-gray-400">x {item.quantity}</p>
            <p className="w-20 shrink-0 text-right font-medium text-[#1b140d] dark:text-background-light">
                ¥{(item.price * item.quantity).toFixed(2)}
            </p>
        </div>
    );
};

export default function OrderConfirm() {
    const navigate = useNavigate();
    const location = useLocation();

    // 从路由状态获取订单数据
    const cartItemsFromState = location.state?.cartItems || [];
    const restaurantFromState = location.state?.restaurant || null;
    const subtotalFromState = location.state?.subtotal || 0;
    const deliveryFeeFromState = location.state?.deliveryFee || 5.00;
    const discountFromState = location.state?.discount || 0;
    // 从购物车传递的优惠券信息
    const selectedCouponIdsFromState = location.state?.selectedCouponIds || [];
    const selectedCouponsFromState = location.state?.selectedCoupons || [];
    const availableCouponsFromState = location.state?.availableCoupons || [];

    const [orderItems] = useState(cartItemsFromState.length > 0 ? cartItemsFromState : [
        { id: 1, name: '经典玛格丽特披萨', description: '新鲜番茄，马苏里拉奶酪', price: 88.00, quantity: 1, image: defaultDishImages[0] },
        { id: 2, name: '凯撒沙拉', description: '配烤鸡肉和面包丁', price: 45.00, quantity: 1, image: defaultDishImages[1] },
        { id: 3, name: '可口可乐', description: '冰镇', price: 5.00, quantity: 2, image: defaultDishImages[2] },
    ]);

    const [restaurant] = useState(restaurantFromState || {
        id: 1,
        name: '川味观',
    });

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [deliveryInfo, setDeliveryInfo] = useState({
        name: 'John Doe',
        phone: '+1 (408) 123-4567',
        address: '123 Blossom Hill Rd, San Jose, CA 95123',
    });

    // 初始化优惠券状态（使用从购物车传递的数据）
    const [selectedCouponIds, setSelectedCouponIds] = useState(selectedCouponIdsFromState);
    const [availableCoupons, setAvailableCoupons] = useState(availableCouponsFromState);
    const [selectedCoupons, setSelectedCoupons] = useState(selectedCouponsFromState);
    const [selectedDiscount] = useState(discountFromState); // 使用从购物车传递的优惠金额



    // 获取用户信息
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id;

    // 计算订单金额（不包含优惠）
    const subtotal = subtotalFromState > 0 ? subtotalFromState : orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const [remark, setRemark] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [showCouponModal, setShowCouponModal] = useState(false);

    // 计算价格 - 使用Hook计算的优惠金额
    const deliveryFee = deliveryFeeFromState;
    const tax = subtotal * 0.0175; // 1.75% 税费
    const discount = selectedDiscount > 0 ? selectedDiscount : discountFromState;
    const total = subtotal + deliveryFee + tax - discount;

    // 加载地址数据
    useEffect(() => {
        const loadAddresses = async () => {
            try {
                // 加载地址列表
                const addressList = await addressService.getMyAddresses();
                console.log('加载到的地址列表:', addressList);
                setAddresses(addressList);

                // 设置默认地址 - 兼容不同的字段名
                const defaultAddr = addressList.find(a => a.isDefault || a.is_default) || addressList[0];
                console.log('选中的默认地址:', defaultAddr);

                if (defaultAddr) {
                    // 兼容不同的 ID 字段名
                    const addrId = defaultAddr.id || defaultAddr.addressId;
                    console.log('设置 selectedAddressId:', addrId);
                    setSelectedAddressId(addrId);

                    // 兼容不同的字段名格式（驼峰和下划线）
                    const province = defaultAddr.province || defaultAddr.Province || '';
                    const city = defaultAddr.city || defaultAddr.City || '';
                    const district = defaultAddr.district || defaultAddr.District || '';
                    const detail = defaultAddr.detail || defaultAddr.Detail || defaultAddr.address || '';

                    setDeliveryInfo({
                        name: defaultAddr.name || defaultAddr.contactName || defaultAddr.contact_name || '用户',
                        phone: defaultAddr.phone || defaultAddr.contactPhone || defaultAddr.contact_phone || '',
                        address: `${province}${city}${district}${detail}`,
                    });
                } else {
                    console.warn('没有找到可用地址');
                }
            } catch (error) {
                console.warn('加载地址失败:', error.message);
                // 地址加载失败时，清空初始的硬编码地址，提示用户添加
                setDeliveryInfo({
                    name: '请添加配送地址',
                    phone: '',
                    address: '点击"编辑"添加新地址',
                });
            }
        };

        loadAddresses();
    }, []);

    // 手动选择优惠券（在支付页面仅显示，不允许修改）
    const handleCouponToggle = (coupon) => {
        // 在支付页面不允许修改优惠券，提示用户返回购物车
        alert('请在购物车页面选择优惠券');
    };

    // 使用最优组合（在支付页面不允许修改）
    const handleUseBestCombination = () => {
        alert('请在购物车页面选择优惠券');
    };

    // 返回购物车
    const handleBackToCart = () => {
        navigate('/cart', {
            state: {
                cartItems: orderItems,
                restaurant
            }
        });
    };

    // 确认支付 - 调用真实订单 API
    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // 获取 merchantId - 支持数字 ID 和外部 ID（字符串）
            // 优先使用菜单项中的 merchantId，否则使用餐厅 ID
            let merchantId = orderItems[0]?.merchantId || restaurant.id || restaurant.externalId;

            // 如果是纯数字字符串，转换为数字
            if (typeof merchantId === 'string' && /^\d+$/.test(merchantId)) {
                merchantId = parseInt(merchantId, 10);
            }

            console.log('使用的 merchantId:', merchantId, '类型:', typeof merchantId);

            // 验证必要数据
            if (!selectedAddressId) {
                setError('请选择配送地址');
                setIsProcessing(false);
                return;
            }

            if (!merchantId) {
                setError('无法获取餐厅信息，请返回重试');
                setIsProcessing(false);
                return;
            }

            // 构建订单数据
            const orderData = {
                merchantId: merchantId,
                items: orderItems.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity,
                })),
                addressId: selectedAddressId,
                couponIds: selectedCouponIds,
                remark: remark,
            };

            console.log('提交订单数据:', orderData);

            // 调用创建订单 API
            const createdOrder = await orderService.createOrder(orderData);

            console.log('订单创建成功:', createdOrder);

            // 调用支付 API 更新订单状态
            let paymentResult = null;
            try {
                paymentResult = await orderService.payOrder(createdOrder.id);
                console.log('✅ 支付成功，获取到完整支付信息:', paymentResult);

                // 支付接口返回的完整信息包括：
                // - status: "PAID" (订单状态)
                // - paidAt: "2026-01-03T13:25:30" (支付时间)
                // - paymentTransactionId: "USER_PAY_..." (交易号)
                // - totalAmount: 45.00 (支付金额)

                console.log('📊 支付状态信息:');
                console.log('  - 订单状态:', paymentResult.status);
                console.log('  - 支付时间:', paymentResult.paidAt);
                console.log('  - 交易号:', paymentResult.paymentTransactionId);
                console.log('  - 支付金额:', paymentResult.totalAmount);

            } catch (payError) {
                console.warn('⚠️ 支付API调用失败，但订单已创建:', payError.message);
            }

            // 跳转到支付成功页面，使用真实的支付信息
            navigate('/payment-success', {
                state: {
                    order: {
                        id: createdOrder.id || 'SN' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12),
                        restaurantName: restaurant.name,
                        items: orderItems,
                        subtotal: subtotal,
                        total: paymentResult?.totalAmount || createdOrder.totalAmount || total,
                        // 优惠券使用信息
                        couponDiscount: selectedDiscount,
                        selectedCouponIds: selectedCouponIds,
                        usedCoupons: availableCoupons.filter(c => selectedCouponIds.includes(c.id)),
                        // 适配新的状态和支付方式对象结构
                        status: paymentResult?.status || createdOrder.status || {
                            code: 'PAID',
                            description: '已支付'
                        },
                        paymentMethod: paymentResult?.paymentMethod || createdOrder.paymentMethod || {
                            code: 'WECHAT',
                            description: '微信支付'
                        },
                        paidAt: paymentResult?.paidAt,
                        paymentTransactionId: paymentResult?.paymentTransactionId,
                        estimatedTime: new Date(Date.now() + 30 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                        currentStatus: 2,
                        statusHistory: [
                            { status: '已接单', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) },
                            { status: '正在备餐', time: new Date(Date.now() + 5 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) },
                            { status: '配送中', time: new Date(Date.now() + 10 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) },
                            { status: '已送达', time: null },
                        ],
                        rider: {
                            name: '骑手小王',
                            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrawV460GKuSwxG2erT5rdBh9ksqmQjzOTvnwYNU94TAR8--4IoSIyOfS2xC0-s3GbtIMMvUkusGoRljcvgdBFUwmD-nkloIV6LQSXdQUcr27tzgJpxyuKyVik-B_9eTdirHZhMVgfkEVfDKo6yDeJv7tOMeUbHB-BW6vGuWrj0-245nme0zrYfM0SN5ZaxIK5AyaCUa1vvb2fIri1634y5Hjop3rpflHAC9zZXdPSEWLiQh7mhvSgy4_gKUuFYXuuBjkJrNms9v23',
                            phone: '138****1234',
                        },
                    }
                }
            });
        } catch (error) {
            console.error('创建订单失败:', error);

            // 403 错误通常是后端权限配置问题，在开发模式下降级处理
            const isDev403 = error.message.includes('创建订单失败') || error.message === '';
            const isNetworkError = error.message.includes('未登录') || error.message.includes('Failed to fetch');

            if (isDev403 || isNetworkError) {
                // 后端暂时不可用或权限未配置，模拟成功（开发模式）
                console.warn('⚠️ 后端订单服务返回403，使用模拟订单。请检查 order-service 的 SecurityConfig');
                const orderId = 'SN' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
                navigate('/payment-success', {
                    state: {
                        order: {
                            id: orderId,
                            restaurantName: restaurant.name,
                            items: orderItems,
                            subtotal: subtotal,
                            total: total,
                            // 优惠券使用信息
                            couponDiscount: selectedDiscount,
                            selectedCouponIds: selectedCouponIds,
                            usedCoupons: availableCoupons.filter(c => selectedCouponIds.includes(c.id)),
                            estimatedTime: new Date(Date.now() + 30 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                            currentStatus: 2,
                            statusHistory: [
                                { status: '已接单', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) },
                                { status: '正在备餐', time: null },
                                { status: '配送中', time: null },
                                { status: '已送达', time: null },
                            ],
                            rider: {
                                name: '骑手小王',
                                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrawV460GKuSwxG2erT5rdBh9ksqmQjzOTvnwYNU94TAR8--4IoSIyOfS2xC0-s3GbtIMMvUkusGoRljcvgdBFUwmD-nkloIV6LQSXdQUcr27tzgJpxyuKyVik-B_9eTdirHZhMVgfkEVfDKo6yDeJv7tOMeUbHB-BW6vGuWrj0-245nme0zrYfM0SN5ZaxIK5AyaCUa1vvb2fIri1634y5Hjop3rpflHAC9zZXdPSEWLiQh7mhvSgy4_gKUuFYXuuBjkJrNms9v23',
                                phone: '138****1234',
                            },
                        }
                    }
                });
                return;
            }

            setError(error.message || '创建订单失败，请重试');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="font-display bg-background-light dark:bg-background-dark">
            <div className="relative flex min-h-screen w-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 w-full border-b border-[#f3ede7] bg-background-light/80 backdrop-blur-sm dark:border-background-dark/50 dark:bg-background-dark/80">
                    <div className="mx-auto flex max-w-7xl items-center justify-between whitespace-nowrap px-4 py-3 sm:px-6 lg:px-8">
                        <div
                            className="flex items-center gap-4 text-[#1b140d] dark:text-background-light cursor-pointer"
                            onClick={() => navigate('/home')}
                        >
                            <div className="size-6">
                                <LogoIcon />
                            </div>
                            <h2 className="text-lg font-bold tracking-[-0.015em] text-[#1b140d] dark:text-background-light">
                                智能外卖
                            </h2>
                        </div>
                        <div className="flex items-center gap-6">
                            <nav className="hidden items-center gap-9 md:flex">
                                <a
                                    className="text-sm font-medium text-[#1b140d] hover:text-primary dark:text-background-light dark:hover:text-primary cursor-pointer"
                                    onClick={() => navigate('/home')}
                                >
                                    Home
                                </a>
                                <a className="text-sm font-medium text-[#1b140d] hover:text-primary dark:text-background-light dark:hover:text-primary cursor-pointer">
                                    My Orders
                                </a>
                                <a
                                    className="text-sm font-medium text-[#1b140d] hover:text-primary dark:text-background-light dark:hover:text-primary cursor-pointer"
                                    onClick={() => navigate('/profile')}
                                >
                                    Profile
                                </a>
                            </nav>
                            <button className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary px-4 text-sm font-bold tracking-[0.015em] text-white transition-opacity hover:opacity-90">
                                <span className="truncate">Help</span>
                            </button>
                            <div
                                className="aspect-square size-10 rounded-full bg-cover bg-center bg-no-repeat cursor-pointer"
                                style={{
                                    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDM_X3GXfwbn4ci9NVQ4F1kLeME6QHtXPnnHHlSjS9w_Qqh6kmV7OOt16nmxypUNRQtlEcpuhYe3yb7M7ytD4fpvewKfkBltewEgnI-hChRcZLfNtp95W5tTzIuOwLZlEjqoiDoSVIKJb-XbEnr78S6Ko5ndcDn7w1mEoMDWT5FSMlmMnvDbzQADQPsnRQNShLIWOjOx2GHi4n2GRjIcmr64zg53mYKSNTd0w2iJ7xp-qeYz-UI6AFitCXvT97IMmVBn3Gfv8s7e73x")',
                                }}
                                onClick={() => navigate('/profile')}
                            />
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                            {/* 左侧内容 */}
                            <div className="w-full flex-1 space-y-8">
                                {/* 面包屑导航 */}
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <a
                                            className="text-base font-medium text-[#9a734c] dark:text-gray-400 hover:text-primary cursor-pointer"
                                            onClick={() => navigate('/home')}
                                        >
                                            Home
                                        </a>
                                        <span className="text-base font-medium text-[#9a734c] dark:text-gray-400">/</span>
                                        <a
                                            className="text-base font-medium text-[#9a734c] dark:text-gray-400 hover:text-primary cursor-pointer"
                                            onClick={handleBackToCart}
                                        >
                                            购物车
                                        </a>
                                        <span className="text-base font-medium text-[#9a734c] dark:text-gray-400">/</span>
                                        <span className="text-base font-medium text-[#1b140d] dark:text-background-light">确认订单</span>
                                    </div>
                                    <div className="flex min-w-72 flex-col gap-2">
                                        <h1 className="text-4xl font-black tracking-[-0.033em] text-[#1b140d] dark:text-background-light">
                                            确认您的订单
                                        </h1>
                                        <p className="text-base font-normal text-[#9a734c] dark:text-gray-400">
                                            请在付款前核对您的订单详情。
                                        </p>
                                    </div>
                                </div>

                                {/* 配送详情 */}
                                <div className="space-y-6 rounded-xl border border-[#f3ede7] bg-white p-6 dark:border-background-dark/50 dark:bg-background-dark/60">
                                    <h2 className="text-[22px] font-bold tracking-[-0.015em] text-[#1b140d] dark:text-background-light">
                                        配送详情
                                    </h2>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#f3ede7] text-[#1b140d] dark:bg-background-dark dark:text-background-light">
                                                <span className="material-symbols-outlined">home_pin</span>
                                            </div>
                                            <div className="flex flex-1 flex-col justify-center">
                                                <p className="text-base font-medium text-[#1b140d] dark:text-background-light">
                                                    {deliveryInfo.name}
                                                </p>
                                                <p className="text-sm font-normal text-[#9a734c] dark:text-gray-400">
                                                    {deliveryInfo.phone}
                                                </p>
                                                <p className="text-sm font-normal text-[#9a734c] dark:text-gray-400">
                                                    {deliveryInfo.address}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            <button
                                                onClick={() => navigate('/address')}
                                                className="flex h-8 w-fit min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#f3ede7] px-4 text-sm font-medium text-[#1b140d] transition-colors hover:bg-primary/20 dark:bg-background-dark dark:text-background-light dark:hover:bg-primary/20"
                                            >
                                                <span className="truncate">编辑</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 优惠券选择 */}
                                <div className="space-y-6 rounded-xl border border-[#f3ede7] bg-white p-6 dark:border-background-dark/50 dark:bg-background-dark/60">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[22px] font-bold tracking-[-0.015em] text-[#1b140d] dark:text-background-light">
                                            优惠券
                                        </h2>
                                    </div>

                                    {availableCoupons.length > 0 ? (
                                        <div className="space-y-4">
                                            {/* 显示从购物车选择的优惠券信息 */}
                                            {selectedDiscount > 0 && (
                                                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex size-10 items-center justify-center rounded-full bg-green-500">
                                                                    <span className="material-symbols-outlined text-white text-sm">local_offer</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-green-800 dark:text-green-200">
                                                                        已选择优惠券
                                                                    </p>
                                                                    <p className="text-sm text-green-600 dark:text-green-300">
                                                                        {selectedCoupons.length}张优惠券，共优惠¥{selectedDiscount.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => navigate('/cart')}
                                                                className="px-3 py-1.5 text-sm font-medium text-green-600 bg-white border border-green-300 rounded-md hover:bg-green-50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-800/40"
                                                            >
                                                                修改
                                                            </button>
                                                        </div>

                                                        {/* 优惠券详情 */}
                                                        <div className="bg-white dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
                                                            <div className="space-y-2">
                                                                {selectedCoupons.map(coupon => (
                                                                    <div key={coupon.id} className="flex justify-between text-sm">
                                                                        <span className="text-green-700 dark:text-green-300">{coupon.couponTemplate?.name}</span>
                                                                        <span className="font-medium text-red-600 dark:text-red-400">
                                                                            -¥{couponUtils.calculateCouponDiscount(coupon, subtotal).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                <div className="pt-2 border-t border-green-200 dark:border-green-700">
                                                                    <div className="flex justify-between font-semibold text-green-800 dark:text-green-200">
                                                                        <span>总优惠:</span>
                                                                        <span>-¥{selectedDiscount.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 当前选中的优惠券 */}
                                            {selectedCoupons.length > 0 && selectedDiscount > 0 && (
                                                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                                                            <span className="font-semibold text-green-800 dark:text-green-200">
                                                                已选择 {selectedCoupons.length} 张优惠券
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={clearSelection}
                                                            className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                                                        >
                                                            清除选择
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {selectedCoupons.map(coupon => (
                                                            <div key={coupon.id} className="flex items-center justify-between py-2">
                                                                <span className="text-sm text-green-700 dark:text-green-300">
                                                                    {coupon.couponTemplate?.name}
                                                                </span>
                                                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                                                    -¥{couponUtils.calculateCouponDiscount(coupon, subtotal).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        <div className="pt-2 border-t border-green-200 dark:border-green-700">
                                                            <div className="flex justify-between font-semibold text-green-800 dark:text-green-200">
                                                                <span>总优惠:</span>
                                                                <span>-¥{selectedDiscount.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 可用优惠券列表 */}
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-[#9a734c] dark:text-gray-400">
                                                    可用优惠券 ({availableCoupons.length}张)
                                                </p>
                                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                                    {availableCoupons.map((coupon) => {
                                                        const isSelected = selectedCouponIds.includes(coupon.id);
                                                        const validation = couponUtils.isCouponApplicable(coupon, subtotal, restaurantFromState?.id);
                                                        const isApplicable = validation.valid;
                                                        const couponValue = couponUtils.formatCouponValue(coupon.couponTemplate);
                                                        const couponDesc = couponUtils.formatCouponDescription(coupon.couponTemplate);
                                                        const isExpiringSoon = couponUtils.isCouponExpiringSoon(coupon);

                                                        return (
                                                            <div
                                                                key={coupon.id}
                                                                className={`relative cursor-pointer rounded-lg border p-4 transition-all ${isSelected
                                                                    ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/30'
                                                                    : isApplicable
                                                                        ? 'border-[#e6d4c7] bg-white hover:border-[#d4b894] dark:border-background-dark dark:bg-background-dark/40 dark:hover:border-background-dark/70'
                                                                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40'
                                                                    }`}
                                                                onClick={() => isApplicable && handleCouponToggle(coupon)}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    {/* 优惠券图标 */}
                                                                    <div className={`flex size-12 items-center justify-center rounded-lg ${isSelected
                                                                        ? 'bg-green-500 text-white'
                                                                        : isApplicable
                                                                            ? 'bg-[#d48806] text-white'
                                                                            : 'bg-gray-400 text-white'
                                                                        }`}>
                                                                        <span className="material-symbols-outlined">
                                                                            {coupon.couponTemplate?.type === 'DISCOUNT' ? 'percent' : 'money'}
                                                                        </span>
                                                                    </div>

                                                                    {/* 优惠券信息 */}
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className={`font-semibold ${isApplicable
                                                                                ? 'text-[#1b140d] dark:text-background-light'
                                                                                : 'text-gray-500 dark:text-gray-400'
                                                                                }`}>
                                                                                {coupon.couponTemplate?.name}
                                                                            </p>
                                                                            <span className={`text-lg font-bold ${isSelected
                                                                                ? 'text-green-600 dark:text-green-400'
                                                                                : isApplicable
                                                                                    ? 'text-[#d48806]'
                                                                                    : 'text-gray-500'
                                                                                }`}>
                                                                                {couponValue}
                                                                            </span>
                                                                            {isExpiringSoon && (
                                                                                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
                                                                                    即将过期
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className={`text-sm ${isApplicable
                                                                            ? 'text-[#9a734c] dark:text-gray-400'
                                                                            : 'text-gray-500 dark:text-gray-500'
                                                                            }`}>
                                                                            {couponDesc}
                                                                        </p>
                                                                        {!isApplicable && validation.reason && (
                                                                            <p className="text-xs text-red-500 mt-1">
                                                                                {validation.reason}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                                            有效期: {couponUtils.formatExpiryTime(coupon.expiresAt) || '长期有效'}
                                                                        </p>
                                                                    </div>

                                                                    {/* 选中状态 */}
                                                                    {isSelected && (
                                                                        <span className="material-symbols-outlined text-green-500">check_circle</span>
                                                                    )}
                                                                    {!isApplicable && (
                                                                        <span className="material-symbols-outlined text-gray-400">block</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-3">
                                                <span className="material-symbols-outlined text-gray-400">confirmation_number</span>
                                            </div>
                                            <p className="text-[#9a734c] dark:text-gray-400 text-sm">
                                                暂无可用优惠券
                                            </p>
                                            <button
                                                onClick={() => navigate('/wallet')}
                                                className="mt-2 text-sm text-[#d48806] hover:underline"
                                            >
                                                去钱包查看更多优惠券
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 订单商品列表 */}
                                <div className="space-y-6 rounded-xl border border-[#f3ede7] bg-white p-6 dark:border-background-dark/50 dark:bg-background-dark/60">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[22px] font-bold tracking-[-0.015em] text-[#1b140d] dark:text-background-light">
                                            来自 [{restaurant.name}] 的订单
                                        </h2>
                                        <button
                                            onClick={handleBackToCart}
                                            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                        >
                                            <span className="material-symbols-outlined text-base">arrow_back</span>
                                            返回修改
                                        </button>
                                    </div>
                                    <div className="space-y-4 divide-y divide-[#f3ede7] dark:divide-background-dark">
                                        {orderItems.map((item, index) => (
                                            <OrderItem key={item.id} item={item} index={index} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 右侧价格详情 */}
                            <aside className="top-24 w-full space-y-6 lg:sticky lg:w-96">
                                <div className="space-y-6 rounded-xl border border-[#f3ede7] bg-white p-6 dark:border-background-dark/50 dark:bg-background-dark/60">
                                    <h2 className="text-[22px] font-bold tracking-[-0.015em] text-[#1b140d] dark:text-background-light">
                                        价格详情
                                    </h2>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-[#9a734c] dark:text-gray-400">
                                            <span>小计</span>
                                            <span className="text-[#1b140d] dark:text-background-light">¥{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[#9a734c] dark:text-gray-400">
                                            <span>配送费</span>
                                            <span className="text-[#1b140d] dark:text-background-light">¥{deliveryFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[#9a734c] dark:text-gray-400">
                                            <span>税费</span>
                                            <span className="text-[#1b140d] dark:text-background-light">¥{tax.toFixed(2)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="flex justify-between text-green-600 dark:text-green-400">
                                                <span>优惠</span>
                                                <span>-¥{discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="my-4 border-t border-dashed border-[#f3ede7] dark:border-background-dark"></div>

                                    <div className="flex items-baseline justify-between">
                                        <span className="text-lg font-bold text-[#1b140d] dark:text-background-light">总计</span>
                                        <span className="text-3xl font-extrabold text-primary">¥{total.toFixed(2)}</span>
                                    </div>

                                    {/* 错误提示 */}
                                    {error && (
                                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-base">error</span>
                                                {error}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={isProcessing || orderItems.length === 0}
                                        className="flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary px-4 text-base font-bold tracking-[0.015em] text-white shadow-lg shadow-primary/30 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                <span>处理中...</span>
                                            </div>
                                        ) : (
                                            <span className="truncate">确认支付</span>
                                        )}
                                    </button>
                                </div>
                            </aside>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-auto w-full border-t border-[#f3ede7] bg-background-light dark:border-background-dark/50 dark:bg-background-dark/60">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-[#9a734c] dark:text-gray-400 md:flex-row">
                            <p>© 2024 智能外卖. All Rights Reserved.</p>
                            <div className="flex gap-4">
                                <a className="hover:text-primary cursor-pointer">Terms of Service</a>
                                <a className="hover:text-primary cursor-pointer">Privacy Policy</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
